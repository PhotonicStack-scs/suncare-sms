import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const installationsRouter = createTRPCRouter({
  /**
   * Get all installations with filters
   */
  getAll: protectedProcedure
    .input(
      z.object({
        customerId: z.string().optional(),
        systemType: z.enum(["SOLAR_PANEL", "BESS", "COMBINED"]).optional(),
        search: z.string().optional(),
        page: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { customerId, systemType, search, page = 0, limit = 20 } = input ?? {};

      const where = {
        ...(customerId && { customerId }),
        ...(systemType && { systemType }),
        ...(search && {
          OR: [
            { address: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
            {
              customer: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }),
      };

      const [installations, total] = await Promise.all([
        ctx.db.installation.findMany({
          where,
          skip: page * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            customer: true,
            _count: {
              select: { agreements: true },
            },
          },
        }),
        ctx.db.installation.count({ where }),
      ]);

      return {
        items: installations,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: (page + 1) * limit < total,
      };
    }),

  /**
   * Get installation by ID
   */
  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const installation = await ctx.db.installation.findUnique({
      where: { id: input },
      include: {
        customer: true,
        agreements: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { visits: true },
            },
          },
        },
      },
    });

    if (!installation) {
      throw new Error("Installation not found");
    }

    return installation;
  }),

  /**
   * Create a new installation
   */
  create: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        address: z.string(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        systemType: z.enum(["SOLAR_PANEL", "BESS", "COMBINED"]),
        capacityKw: z.number().positive(),
        installDate: z.date(),
        inverterType: z.string().optional(),
        inverterSerial: z.string().optional(),
        panelCount: z.number().int().positive().optional(),
        panelType: z.string().optional(),
        batteryKwh: z.number().positive().optional(),
        batteryType: z.string().optional(),
        monitoringId: z.string().optional(),
        monitoringUrl: z.string().url().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify customer exists
      const customer = await ctx.db.customerCache.findUnique({
        where: { id: input.customerId },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      const installation = await ctx.db.installation.create({
        data: input,
        include: {
          customer: true,
        },
      });

      return installation;
    }),

  /**
   * Update an installation
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
        systemType: z.enum(["SOLAR_PANEL", "BESS", "COMBINED"]).optional(),
        capacityKw: z.number().positive().optional(),
        installDate: z.date().optional(),
        inverterType: z.string().nullable().optional(),
        inverterSerial: z.string().nullable().optional(),
        panelCount: z.number().int().positive().nullable().optional(),
        panelType: z.string().nullable().optional(),
        batteryKwh: z.number().positive().nullable().optional(),
        batteryType: z.string().nullable().optional(),
        monitoringId: z.string().nullable().optional(),
        monitoringUrl: z.string().url().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const installation = await ctx.db.installation.update({
        where: { id },
        data,
        include: {
          customer: true,
        },
      });

      return installation;
    }),

  /**
   * Delete an installation
   */
  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    // Check if installation has any active agreements
    const activeAgreements = await ctx.db.serviceAgreement.count({
      where: {
        installationId: input,
        status: { in: ["ACTIVE", "PENDING_RENEWAL"] },
      },
    });

    if (activeAgreements > 0) {
      throw new Error(
        "Cannot delete installation with active agreements. Cancel or expire agreements first."
      );
    }

    await ctx.db.installation.delete({
      where: { id: input },
    });

    return { success: true };
  }),

  /**
   * Get installations without agreements
   */
  getWithoutAgreement: protectedProcedure
    .input(
      z.object({
        customerId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const installations = await ctx.db.installation.findMany({
        where: {
          ...(input?.customerId && { customerId: input.customerId }),
          agreements: {
            none: {
              status: { in: ["ACTIVE", "PENDING_RENEWAL"] },
            },
          },
        },
        include: {
          customer: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return installations;
    }),

  /**
   * Get installation stats
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byType, withActiveAgreement] = await Promise.all([
      ctx.db.installation.count(),
      ctx.db.installation.groupBy({
        by: ["systemType"],
        _count: true,
      }),
      ctx.db.installation.count({
        where: {
          agreements: {
            some: {
              status: "ACTIVE",
            },
          },
        },
      }),
    ]);

    return {
      total,
      byType: byType.reduce(
        (acc, item) => {
          acc[item.systemType] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      withActiveAgreement,
      withoutAgreement: total - withActiveAgreement,
    };
  }),
});
