import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  agreementReadProcedure,
  agreementWriteProcedure,
} from "~/server/api/trpc";

// Input schemas
const createAgreementSchema = z.object({
  installationId: z.string(),
  agreementType: z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]),
  slaLevel: z.enum(["STANDARD", "PRIORITY", "CRITICAL"]).default("STANDARD"),
  startDate: z.date(),
  endDate: z.date().optional(),
  basePrice: z.number().positive(),
  discountPercent: z.number().min(0).max(100).optional(),
  autoRenew: z.boolean().default(true),
  visitFrequency: z.number().min(1).max(12).default(1),
  preferredVisitDay: z.string().optional(),
  preferredTimeSlot: z.string().optional(),
  notes: z.string().optional(),
  addons: z
    .array(
      z.object({
        addonId: z.string(),
        quantity: z.number().min(1).default(1),
        customPrice: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

const updateAgreementSchema = createAgreementSchema.partial().extend({
  id: z.string(),
});

const filterSchema = z.object({
  status: z
    .enum(["DRAFT", "PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "EXPIRED", "CANCELLED"])
    .or(z.array(z.enum(["DRAFT", "PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "EXPIRED", "CANCELLED"])))
    .optional(),
  agreementType: z
    .enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"])
    .or(z.array(z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"])))
    .optional(),
  customerId: z.string().optional(),
  installationId: z.string().optional(),
  slaLevel: z.enum(["STANDARD", "PRIORITY", "CRITICAL"]).optional(),
  startDateFrom: z.date().optional(),
  startDateTo: z.date().optional(),
  expiringWithinDays: z.number().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const agreementRouter = createTRPCRouter({
  /**
   * Get all agreements with filters
   */
  getAll: agreementReadProcedure
    .input(filterSchema.optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input?.status) {
        where.status = Array.isArray(input.status)
          ? { in: input.status }
          : input.status;
      }

      if (input?.agreementType) {
        where.agreementType = Array.isArray(input.agreementType)
          ? { in: input.agreementType }
          : input.agreementType;
      }

      if (input?.customerId) {
        where.installation = { customerId: input.customerId };
      }

      if (input?.installationId) {
        where.installationId = input.installationId;
      }

      if (input?.slaLevel) {
        where.slaLevel = input.slaLevel;
      }

      if (input?.startDateFrom || input?.startDateTo) {
        where.startDate = {
          ...(input.startDateFrom && { gte: input.startDateFrom }),
          ...(input.startDateTo && { lte: input.startDateTo }),
        };
      }

      if (input?.expiringWithinDays) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + input.expiringWithinDays);
        where.endDate = {
          gte: new Date(),
          lte: expiryDate,
        };
        where.status = "ACTIVE";
      }

      if (input?.search) {
        where.OR = [
          { agreementNumber: { contains: input.search, mode: "insensitive" } },
          { installation: { customer: { name: { contains: input.search, mode: "insensitive" } } } },
          { installation: { address: { contains: input.search, mode: "insensitive" } } },
        ];
      }

      const [agreements, total] = await Promise.all([
        ctx.db.serviceAgreement.findMany({
          where,
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
          orderBy: { createdAt: "desc" },
          include: {
            installation: {
              include: {
                customer: {
                  select: {
                    tripletexId: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            addons: {
              include: { addon: true },
            },
            _count: {
              select: { visits: true, invoices: true },
            },
          },
        }),
        ctx.db.serviceAgreement.count({ where }),
      ]);

      return { agreements, total };
    }),

  /**
   * Get a single agreement by ID
   */
  getById: agreementReadProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const agreement = await ctx.db.serviceAgreement.findUnique({
        where: { id: input.id },
        include: {
          installation: {
            include: {
              customer: true,
            },
          },
          addons: {
            include: { addon: true },
          },
          visits: {
            orderBy: { scheduledDate: "desc" },
            take: 10,
          },
          invoices: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          servicePlan: true,
        },
      });

      if (!agreement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avtale ikke funnet",
        });
      }

      return agreement;
    }),

  /**
   * Create a new agreement
   */
  create: agreementWriteProcedure
    .input(createAgreementSchema)
    .mutation(async ({ ctx, input }) => {
      const { addons, ...agreementData } = input;

      // Generate agreement number
      const lastAgreement = await ctx.db.serviceAgreement.findFirst({
        orderBy: { createdAt: "desc" },
        select: { agreementNumber: true },
      });

      const year = new Date().getFullYear();
      const lastNumber = lastAgreement
        ? parseInt(lastAgreement.agreementNumber.split("-")[1] ?? "0", 10)
        : 0;
      const agreementNumber = `SA-${String(lastNumber + 1).padStart(5, "0")}-${year}`;

      // Calculate price
      const calculatedPrice = calculateAgreementPrice({
        basePrice: agreementData.basePrice,
        discountPercent: agreementData.discountPercent,
        addons: addons,
        addonProducts: await ctx.db.addonProduct.findMany({
          where: { id: { in: addons?.map((a) => a.addonId) ?? [] } },
        }),
      });

      // Create agreement with addons
      const agreement = await ctx.db.serviceAgreement.create({
        data: {
          ...agreementData,
          agreementNumber,
          calculatedPrice,
          status: "DRAFT",
          addons: addons
            ? {
                create: addons.map((addon) => ({
                  addonId: addon.addonId,
                  quantity: addon.quantity,
                  customPrice: addon.customPrice,
                  notes: addon.notes,
                })),
              }
            : undefined,
        },
        include: {
          installation: {
            include: { customer: true },
          },
          addons: {
            include: { addon: true },
          },
        },
      });

      // Create service plan
      await ctx.db.servicePlan.create({
        data: {
          agreementId: agreement.id,
          visitFrequency: agreementData.visitFrequency,
          nextVisitDate: calculateNextVisitDate(agreementData.startDate, agreementData.visitFrequency),
          seasonalAdj: true,
        },
      });

      return agreement;
    }),

  /**
   * Update an agreement
   */
  update: agreementWriteProcedure
    .input(updateAgreementSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, addons, ...updateData } = input;

      const existing = await ctx.db.serviceAgreement.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avtale ikke funnet",
        });
      }

      // Update addons if provided
      if (addons) {
        // Delete existing addons
        await ctx.db.agreementAddon.deleteMany({
          where: { agreementId: id },
        });

        // Create new addons
        await ctx.db.agreementAddon.createMany({
          data: addons.map((addon) => ({
            agreementId: id,
            addonId: addon.addonId,
            quantity: addon.quantity,
            customPrice: addon.customPrice,
            notes: addon.notes,
          })),
        });
      }

      // Recalculate price if relevant fields changed
      let calculatedPrice = existing.calculatedPrice;
      if (updateData.basePrice || updateData.discountPercent || addons) {
        const currentAddons = addons ?? (await ctx.db.agreementAddon.findMany({
          where: { agreementId: id },
          include: { addon: true },
        }));

        calculatedPrice = calculateAgreementPrice({
          basePrice: updateData.basePrice ?? Number(existing.basePrice),
          discountPercent: updateData.discountPercent ?? (existing.discountPercent ? Number(existing.discountPercent) : undefined),
          addons: currentAddons.map((a) => ({
            addonId: "addonId" in a ? a.addonId : a.addon.id,
            quantity: a.quantity,
            customPrice: a.customPrice ? Number(a.customPrice) : undefined,
          })),
          addonProducts: await ctx.db.addonProduct.findMany({
            where: {
              id: {
                in: currentAddons.map((a) => ("addonId" in a ? a.addonId : a.addon.id)),
              },
            },
          }),
        });
      }

      return ctx.db.serviceAgreement.update({
        where: { id },
        data: {
          ...updateData,
          calculatedPrice,
        },
        include: {
          installation: {
            include: { customer: true },
          },
          addons: {
            include: { addon: true },
          },
        },
      });
    }),

  /**
   * Cancel an agreement
   */
  cancel: agreementWriteProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.serviceAgreement.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
      });
    }),

  /**
   * Activate a draft agreement
   */
  activate: agreementWriteProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const agreement = await ctx.db.serviceAgreement.findUnique({
        where: { id: input.id },
      });

      if (!agreement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Avtale ikke funnet",
        });
      }

      if (agreement.status !== "DRAFT" && agreement.status !== "PENDING_APPROVAL") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kan kun aktivere utkast eller ventende avtaler",
        });
      }

      return ctx.db.serviceAgreement.update({
        where: { id: input.id },
        data: {
          status: "ACTIVE",
          signedAt: new Date(),
        },
      });
    }),

  /**
   * Calculate price for an agreement configuration
   */
  calculatePrice: agreementReadProcedure
    .input(
      z.object({
        basePrice: z.number().positive(),
        discountPercent: z.number().min(0).max(100).optional(),
        addons: z
          .array(
            z.object({
              addonId: z.string(),
              quantity: z.number().min(1),
              customPrice: z.number().optional(),
            })
          )
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const addonProducts = input.addons
        ? await ctx.db.addonProduct.findMany({
            where: { id: { in: input.addons.map((a) => a.addonId) } },
          })
        : [];

      return calculatePriceBreakdown({
        basePrice: input.basePrice,
        discountPercent: input.discountPercent,
        addons: input.addons,
        addonProducts,
      });
    }),

  /**
   * Get addon products catalog
   */
  getAddons: agreementReadProcedure
    .input(
      z.object({
        category: z.enum(["MAINTENANCE", "MONITORING", "PRIORITY", "EQUIPMENT"]).optional(),
        isActive: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.addonProduct.findMany({
        where: {
          ...(input?.category && { category: input.category }),
          isActive: input?.isActive ?? true,
        },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      });
    }),

  /**
   * Get agreement statistics
   */
  getStats: agreementReadProcedure.query(async ({ ctx }) => {
    const [total, active, expiringSoon, byType] = await Promise.all([
      ctx.db.serviceAgreement.count(),
      ctx.db.serviceAgreement.count({ where: { status: "ACTIVE" } }),
      ctx.db.serviceAgreement.count({
        where: {
          status: "ACTIVE",
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      ctx.db.serviceAgreement.groupBy({
        by: ["agreementType"],
        _count: true,
        where: { status: "ACTIVE" },
      }),
    ]);

    return {
      total,
      active,
      expiringSoon,
      byType: Object.fromEntries(
        byType.map((t) => [t.agreementType, t._count])
      ),
    };
  }),
});

// Helper functions
function calculateAgreementPrice(params: {
  basePrice: number;
  discountPercent?: number;
  addons?: Array<{ addonId: string; quantity: number; customPrice?: number }>;
  addonProducts: Array<{ id: string; basePrice: unknown; frequency: string }>;
}): number {
  let total = params.basePrice;

  // Add addon costs (only annual addons)
  if (params.addons && params.addonProducts) {
    for (const addon of params.addons) {
      const product = params.addonProducts.find((p) => p.id === addon.addonId);
      if (product && product.frequency === "ANNUAL") {
        const price = addon.customPrice ?? Number(product.basePrice);
        total += price * addon.quantity;
      }
    }
  }

  // Apply discount
  if (params.discountPercent) {
    total = total * (1 - params.discountPercent / 100);
  }

  return Math.round(total * 100) / 100;
}

function calculatePriceBreakdown(params: {
  basePrice: number;
  discountPercent?: number;
  addons?: Array<{ addonId: string; quantity: number; customPrice?: number }>;
  addonProducts: Array<{ id: string; name: string; basePrice: unknown; frequency: string }>;
}) {
  const breakdown: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> = [];

  // Base price
  breakdown.push({
    description: "Serviceavtale grunnpris",
    quantity: 1,
    unitPrice: params.basePrice,
    total: params.basePrice,
  });

  // Addons
  let addonsTotal = 0;
  if (params.addons && params.addonProducts) {
    for (const addon of params.addons) {
      const product = params.addonProducts.find((p) => p.id === addon.addonId);
      if (product) {
        const price = addon.customPrice ?? Number(product.basePrice);
        const total = price * addon.quantity;
        addonsTotal += total;
        breakdown.push({
          description: product.name,
          quantity: addon.quantity,
          unitPrice: price,
          total,
        });
      }
    }
  }

  const subtotal = params.basePrice + addonsTotal;
  const discountAmount = params.discountPercent
    ? subtotal * (params.discountPercent / 100)
    : 0;
  const total = subtotal - discountAmount;
  const vatRate = 0.25;
  const vatAmount = total * vatRate;
  const grandTotal = total + vatAmount;

  return {
    basePrice: params.basePrice,
    addonsTotal,
    subtotal,
    discountAmount,
    total,
    vatAmount,
    grandTotal,
    breakdown,
  };
}

function calculateNextVisitDate(startDate: Date, visitFrequency: number): Date {
  const nextVisit = new Date(startDate);
  const monthsToAdd = Math.floor(12 / visitFrequency);
  nextVisit.setMonth(nextVisit.getMonth() + monthsToAdd);
  return nextVisit;
}
