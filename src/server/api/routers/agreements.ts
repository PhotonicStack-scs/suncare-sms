import { z } from "zod";
import { 
  createTRPCRouter, 
  protectedProcedure,
  agreementsReadProcedure,
  agreementsWriteProcedure 
} from "~/server/api/trpc";

// Generate unique agreement number
function generateAgreementNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SA-${year}-${random}`;
}

// Base prices for agreement types (NOK)
const BASE_PRICES: Record<string, number> = {
  BASIC: 2500,
  STANDARD: 4500,
  PREMIUM: 8500,
  ENTERPRISE: 15000,
};

// SLA multipliers
const SLA_MULTIPLIERS: Record<string, number> = {
  STANDARD: 1.0,
  PRIORITY: 1.25,
  CRITICAL: 1.5,
};

export const agreementsRouter = createTRPCRouter({
  /**
   * Get all agreements with filters
   */
  getAll: agreementsReadProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED", "PENDING_RENEWAL"]).optional(),
        agreementType: z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]).optional(),
        customerId: z.string().optional(),
        installationId: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, agreementType, customerId, installationId, search, page, limit } = input;

      const where = {
        ...(status && { status }),
        ...(agreementType && { agreementType }),
        ...(installationId && { installationId }),
        ...(customerId && {
          installation: {
            customerId,
          },
        }),
        ...(search && {
          OR: [
            { agreementNumber: { contains: search, mode: "insensitive" as const } },
            {
              installation: {
                customer: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
            },
          ],
        }),
      };

      const [agreements, total] = await Promise.all([
        ctx.db.serviceAgreement.findMany({
          where,
          skip: page * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            installation: {
              include: {
                customer: true,
              },
            },
            addons: {
              include: {
                addon: true,
              },
            },
            _count: {
              select: { visits: true },
            },
          },
        }),
        ctx.db.serviceAgreement.count({ where }),
      ]);

      return {
        items: agreements,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: (page + 1) * limit < total,
      };
    }),

  /**
   * Get a single agreement by ID
   */
  getById: agreementsReadProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const agreement = await ctx.db.serviceAgreement.findUnique({
      where: { id: input },
      include: {
        installation: {
          include: {
            customer: true,
          },
        },
        addons: {
          include: {
            addon: true,
          },
        },
        visits: {
          orderBy: { scheduledDate: "desc" },
          take: 10,
        },
        servicePlan: true,
      },
    });

    if (!agreement) {
      throw new Error("Agreement not found");
    }

    return agreement;
  }),

  /**
   * Calculate price for an agreement
   */
  calculatePrice: protectedProcedure
    .input(
      z.object({
        agreementType: z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]),
        slaLevel: z.enum(["STANDARD", "PRIORITY", "CRITICAL"]),
        capacityKw: z.number().positive(),
        systemType: z.enum(["SOLAR_PANEL", "BESS", "COMBINED"]),
        addons: z.array(
          z.object({
            addonId: z.string(),
            quantity: z.number().positive().default(1),
          })
        ).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { agreementType, slaLevel, capacityKw, systemType, addons } = input;

      // Base price
      const basePrice = BASE_PRICES[agreementType] ?? 2500;
      
      // SLA multiplier
      const slaMultiplier = SLA_MULTIPLIERS[slaLevel] ?? 1.0;
      
      // Capacity charge (per kW)
      const capacityRate = systemType === "COMBINED" ? 75 : 50;
      const capacityCharge = capacityKw * capacityRate;
      
      // Add-ons
      let addonsTotal = 0;
      const addonBreakdown: Array<{ item: string; amount: number }> = [];
      
      if (addons && addons.length > 0) {
        const addonProducts = await ctx.db.addonProduct.findMany({
          where: {
            id: { in: addons.map((a) => a.addonId) },
          },
        });

        for (const addonInput of addons) {
          const product = addonProducts.find((p) => p.id === addonInput.addonId);
          if (product) {
            const amount = Number(product.basePrice) * addonInput.quantity;
            addonsTotal += amount;
            addonBreakdown.push({
              item: `${product.name} x${addonInput.quantity}`,
              amount,
            });
          }
        }
      }

      // Calculate totals
      const subtotal = (basePrice + capacityCharge) * slaMultiplier + addonsTotal;
      const vatRate = 0.25;
      const vatAmount = subtotal * vatRate;
      const total = subtotal + vatAmount;

      return {
        basePrice,
        slaMultiplier,
        capacityCharge,
        addonsTotal,
        subtotal,
        vatAmount,
        total,
        breakdown: [
          { item: `Grunnpris (${agreementType})`, amount: basePrice },
          { item: `Kapasitetstillegg (${capacityKw} kW)`, amount: capacityCharge },
          ...(slaMultiplier !== 1 ? [{ item: `SLA-nivå (${slaLevel})`, amount: (basePrice + capacityCharge) * (slaMultiplier - 1) }] : []),
          ...addonBreakdown,
        ],
      };
    }),

  /**
   * Create a new agreement
   */
  create: agreementsWriteProcedure
    .input(
      z.object({
        installationId: z.string(),
        agreementType: z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]),
        startDate: z.date(),
        endDate: z.date().optional(),
        basePrice: z.number().positive(),
        slaLevel: z.enum(["STANDARD", "PRIORITY", "CRITICAL"]).default("STANDARD"),
        autoRenew: z.boolean().default(true),
        visitFrequency: z.number().min(1).max(12).default(1),
        notes: z.string().optional(),
        addons: z.array(
          z.object({
            addonId: z.string(),
            quantity: z.number().positive().default(1),
            customPrice: z.number().optional(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { addons, ...agreementData } = input;

      // Verify installation exists
      const installation = await ctx.db.installation.findUnique({
        where: { id: input.installationId },
      });

      if (!installation) {
        throw new Error("Installation not found");
      }

      // Create agreement with addons
      const agreement = await ctx.db.serviceAgreement.create({
        data: {
          ...agreementData,
          agreementNumber: generateAgreementNumber(),
          status: "DRAFT",
          addons: addons ? {
            create: addons.map((addon) => ({
              addonId: addon.addonId,
              quantity: addon.quantity,
              customPrice: addon.customPrice,
            })),
          } : undefined,
          servicePlan: {
            create: {
              visitFrequency: input.visitFrequency,
              seasonalAdjust: true,
            },
          },
        },
        include: {
          installation: {
            include: {
              customer: true,
            },
          },
          addons: {
            include: {
              addon: true,
            },
          },
          servicePlan: true,
        },
      });

      return agreement;
    }),

  /**
   * Update an agreement
   */
  update: agreementsWriteProcedure
    .input(
      z.object({
        id: z.string(),
        agreementType: z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]).optional(),
        status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED", "PENDING_RENEWAL"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().nullable().optional(),
        basePrice: z.number().positive().optional(),
        slaLevel: z.enum(["STANDARD", "PRIORITY", "CRITICAL"]).optional(),
        autoRenew: z.boolean().optional(),
        visitFrequency: z.number().min(1).max(12).optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const agreement = await ctx.db.serviceAgreement.update({
        where: { id },
        data,
        include: {
          installation: {
            include: {
              customer: true,
            },
          },
          addons: {
            include: {
              addon: true,
            },
          },
        },
      });

      return agreement;
    }),

  /**
   * Activate an agreement
   */
  activate: agreementsWriteProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const agreement = await ctx.db.serviceAgreement.update({
        where: { id: input },
        data: {
          status: "ACTIVE",
          signedAt: new Date(),
        },
      });

      return agreement;
    }),

  /**
   * Cancel an agreement
   */
  cancel: agreementsWriteProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const agreement = await ctx.db.serviceAgreement.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: input.reason
            ? `Cancelled: ${input.reason}`
            : undefined,
        },
      });

      return agreement;
    }),

  /**
   * Add addon to agreement
   */
  addAddon: agreementsWriteProcedure
    .input(
      z.object({
        agreementId: z.string(),
        addonId: z.string(),
        quantity: z.number().positive().default(1),
        customPrice: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const addon = await ctx.db.agreementAddon.create({
        data: {
          agreementId: input.agreementId,
          addonId: input.addonId,
          quantity: input.quantity,
          customPrice: input.customPrice,
        },
        include: {
          addon: true,
        },
      });

      return addon;
    }),

  /**
   * Remove addon from agreement
   */
  removeAddon: agreementsWriteProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.agreementAddon.delete({
        where: { id: input },
      });

      return { success: true };
    }),

  /**
   * Get add-on products catalog
   */
  getAddonProducts: protectedProcedure
    .input(
      z.object({
        category: z.enum(["MAINTENANCE", "MONITORING", "PRIORITY", "EQUIPMENT"]).optional(),
        isActive: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.addonProduct.findMany({
        where: {
          ...(input?.category && { category: input.category }),
          isActive: input?.isActive ?? true,
        },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      });

      return products;
    }),

  /**
   * Get agreements expiring soon
   */
  getExpiring: agreementsReadProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.days);

      const agreements = await ctx.db.serviceAgreement.findMany({
        where: {
          status: "ACTIVE",
          endDate: {
            lte: futureDate,
            gte: new Date(),
          },
        },
        include: {
          installation: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { endDate: "asc" },
      });

      return agreements;
    }),
});
