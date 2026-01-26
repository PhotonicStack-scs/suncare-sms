import { z } from "zod";
import { createTRPCRouter, invoiceReadProcedure, invoiceWriteProcedure } from "~/server/api/trpc";
import {
  createInvoice,
  sendInvoice,
  syncInvoiceStatus,
  createVisitInvoice,
  getCustomerInvoices,
} from "~/lib/tripletex";

export const invoiceRouter = createTRPCRouter({
  /**
   * Get all invoices with filters
   */
  getAll: invoiceReadProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "PENDING", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
        customerId: z.string().optional(),
        agreementId: z.string().optional(),
        fromDate: z.date().optional(),
        toDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input?.status) where.status = input.status;
      if (input?.customerId) where.customerId = input.customerId;
      if (input?.agreementId) where.agreementId = input.agreementId;
      if (input?.fromDate || input?.toDate) {
        where.createdAt = {
          ...(input.fromDate && { gte: input.fromDate }),
          ...(input.toDate && { lte: input.toDate }),
        };
      }

      const [invoices, total] = await Promise.all([
        ctx.db.invoice.findMany({
          where,
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
          orderBy: { createdAt: "desc" },
          include: {
            agreement: {
              select: {
                id: true,
                agreementNumber: true,
                installation: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    customer: {
                      select: {
                        tripletexId: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        ctx.db.invoice.count({ where }),
      ]);

      return { invoices, total };
    }),

  /**
   * Get a single invoice by ID
   */
  getById: invoiceReadProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.invoice.findUnique({
        where: { id: input.id },
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
    }),

  /**
   * Create a new invoice
   */
  create: invoiceWriteProcedure
    .input(
      z.object({
        customerId: z.string(),
        agreementId: z.string().optional(),
        invoiceDate: z.date(),
        dueDate: z.date(),
        lines: z.array(
          z.object({
            description: z.string(),
            quantity: z.number().positive(),
            unitPrice: z.number(),
            productId: z.string().optional(),
            vatTypeId: z.number().optional(),
          })
        ),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createInvoice(input);
    }),

  /**
   * Create invoice from a completed visit
   */
  createFromVisit: invoiceWriteProcedure
    .input(z.object({ visitId: z.string() }))
    .mutation(async ({ input }) => {
      return createVisitInvoice(input.visitId);
    }),

  /**
   * Send an invoice
   */
  send: invoiceWriteProcedure
    .input(
      z.object({
        tripletexId: z.number(),
        sendType: z.enum(["EMAIL", "EHF"]).default("EMAIL"),
      })
    )
    .mutation(async ({ input }) => {
      return sendInvoice(input.tripletexId, input.sendType);
    }),

  /**
   * Sync invoice status from Tripletex
   */
  syncStatus: invoiceReadProcedure
    .input(z.object({ tripletexId: z.number() }))
    .mutation(async ({ input }) => {
      await syncInvoiceStatus(input.tripletexId);
      return { success: true };
    }),

  /**
   * Get customer invoices from Tripletex
   */
  getCustomerInvoices: invoiceReadProcedure
    .input(
      z.object({
        customerId: z.string(),
        fromDate: z.date().optional(),
        toDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return getCustomerInvoices(input.customerId, {
        fromDate: input.fromDate,
        toDate: input.toDate,
        limit: input.limit,
      });
    }),

  /**
   * Get invoice statistics/summary
   */
  getStats: invoiceReadProcedure.query(async ({ ctx }) => {
    const [pending, sent, overdue, paidThisMonth] = await Promise.all([
      ctx.db.invoice.aggregate({
        where: { status: "PENDING" },
        _sum: { totalAmount: true },
        _count: true,
      }),
      ctx.db.invoice.aggregate({
        where: { status: "SENT" },
        _sum: { totalAmount: true },
        _count: true,
      }),
      ctx.db.invoice.aggregate({
        where: { status: "OVERDUE" },
        _sum: { totalAmount: true },
        _count: true,
      }),
      ctx.db.invoice.aggregate({
        where: {
          status: "PAID",
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    return {
      pending: {
        count: pending._count,
        total: Number(pending._sum.totalAmount ?? 0),
      },
      sent: {
        count: sent._count,
        total: Number(sent._sum.totalAmount ?? 0),
      },
      overdue: {
        count: overdue._count,
        total: Number(overdue._sum.totalAmount ?? 0),
      },
      paidThisMonth: {
        count: paidThisMonth._count,
        total: Number(paidThisMonth._sum.totalAmount ?? 0),
      },
    };
  }),
});
