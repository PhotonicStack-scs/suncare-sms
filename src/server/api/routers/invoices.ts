import { z } from "zod";
import { createTRPCRouter, protectedProcedure, invoicesWriteProcedure } from "~/server/api/trpc";
import { tripletexInvoices } from "~/lib/tripletex";

export const invoicesRouter = createTRPCRouter({
  /**
   * Get all invoices from local database
   */
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
        visitId: z.string().optional(),
        page: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, visitId, page, limit } = input;

      const where = {
        ...(status && { status }),
        ...(visitId && { visitId }),
      };

      const [invoices, total] = await Promise.all([
        ctx.db.invoice.findMany({
          where,
          skip: page * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            visit: {
              include: {
                agreement: {
                  include: {
                    installation: {
                      include: {
                        customer: true,
                      },
                    },
                  },
                },
              },
            },
            lineItems: true,
          },
        }),
        ctx.db.invoice.count({ where }),
      ]);

      return {
        items: invoices,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: (page + 1) * limit < total,
      };
    }),

  /**
   * Get invoice by ID
   */
  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const invoice = await ctx.db.invoice.findUnique({
      where: { id: input },
      include: {
        visit: {
          include: {
            agreement: {
              include: {
                installation: {
                  include: {
                    customer: true,
                  },
                },
              },
            },
          },
        },
        lineItems: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return invoice;
  }),

  /**
   * Create invoice for a service visit
   */
  createForVisit: invoicesWriteProcedure
    .input(
      z.object({
        visitId: z.string(),
        lines: z.array(
          z.object({
            description: z.string(),
            quantity: z.number().positive(),
            unitPrice: z.number().positive(),
            vatRate: z.number().min(0).max(100).default(25),
            tripletexProductId: z.number().optional(),
          })
        ),
        dueInDays: z.number().min(1).default(14),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { visitId, lines, dueInDays, notes } = input;

      // Get visit with customer info
      const visit = await ctx.db.serviceVisit.findUnique({
        where: { id: visitId },
        include: {
          agreement: {
            include: {
              installation: {
                include: {
                  customer: true,
                },
              },
            },
          },
        },
      });

      if (!visit) {
        throw new Error("Visit not found");
      }

      const customer = visit.agreement.installation.customer;
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueInDays);

      // Calculate totals
      const lineItems = lines.map((line) => {
        const totalPrice = line.quantity * line.unitPrice;
        const vatAmount = totalPrice * (line.vatRate / 100);
        return {
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice,
          vatRate: line.vatRate,
          tripletexProductId: line.tripletexProductId,
        };
      });

      const amount = lineItems.reduce((sum, line) => sum + line.totalPrice, 0);
      const vatAmount = lineItems.reduce(
        (sum, line) => sum + line.totalPrice * (line.vatRate / 100),
        0
      );
      const totalAmount = amount + vatAmount;

      // Create invoice in Tripletex
      let tripletexId: number | null = null;
      try {
        const tripletexInvoice = await tripletexInvoices.createForVisit({
          customerId: customer.tripletexId,
          invoiceDate,
          dueInDays,
          lines: lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            productId: line.tripletexProductId,
          })),
          comment: notes,
        });
        tripletexId = tripletexInvoice.id;
      } catch (error) {
        console.error("Failed to create Tripletex invoice:", error);
        // Continue without Tripletex ID - can retry later
      }

      // Create local invoice
      const invoice = await ctx.db.invoice.create({
        data: {
          visitId,
          tripletexId,
          amount,
          vatAmount,
          totalAmount,
          status: tripletexId ? "SENT" : "DRAFT",
          dueDate,
          sentAt: tripletexId ? new Date() : null,
          notes,
          lineItems: {
            create: lineItems.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              vatRate: item.vatRate,
              tripletexProductId: item.tripletexProductId,
            })),
          },
        },
        include: {
          lineItems: true,
        },
      });

      return invoice;
    }),

  /**
   * Mark invoice as paid
   */
  markPaid: invoicesWriteProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.update({
        where: { id: input },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      return invoice;
    }),

  /**
   * Cancel invoice
   */
  cancel: invoicesWriteProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.update({
        where: { id: input },
        data: {
          status: "CANCELLED",
        },
      });

      return invoice;
    }),

  /**
   * Retry sending invoice to Tripletex
   */
  retrySend: invoicesWriteProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input },
        include: {
          visit: {
            include: {
              agreement: {
                include: {
                  installation: {
                    include: {
                      customer: true,
                    },
                  },
                },
              },
            },
          },
          lineItems: true,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (invoice.tripletexId) {
        throw new Error("Invoice already sent to Tripletex");
      }

      const customer = invoice.visit?.agreement.installation.customer;
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Create in Tripletex
      const tripletexInvoice = await tripletexInvoices.createForVisit({
        customerId: customer.tripletexId,
        invoiceDate: invoice.createdAt,
        dueInDays: invoice.dueDate
          ? Math.ceil(
              (invoice.dueDate.getTime() - invoice.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 14,
        lines: invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          productId: item.tripletexProductId ?? undefined,
        })),
        comment: invoice.notes ?? undefined,
      });

      // Update local invoice
      const updated = await ctx.db.invoice.update({
        where: { id: input },
        data: {
          tripletexId: tripletexInvoice.id,
          status: "SENT",
          sentAt: new Date(),
        },
      });

      return updated;
    }),
});
