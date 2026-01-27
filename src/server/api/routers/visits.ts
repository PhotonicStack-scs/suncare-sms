import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  visitsReadProcedure,
  visitsWriteProcedure,
} from "~/server/api/trpc";

export const visitsRouter = createTRPCRouter({
  /**
   * Get visit statistics for dashboard/planning
   */
  getStats: visitsReadProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Start of current week (Monday)
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    // End of current week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Start and end of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [todayCount, thisWeekCount, scheduledCount, completedThisMonthCount] =
      await Promise.all([
        // Today's visits
        ctx.db.serviceVisit.count({
          where: {
            scheduledDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
        // This week's visits
        ctx.db.serviceVisit.count({
          where: {
            scheduledDate: {
              gte: startOfWeek,
              lt: endOfWeek,
            },
          },
        }),
        // Scheduled but not assigned (or just scheduled status)
        ctx.db.serviceVisit.count({
          where: {
            status: "SCHEDULED",
          },
        }),
        // Completed this month
        ctx.db.serviceVisit.count({
          where: {
            status: "COMPLETED",
            actualEndDate: {
              gte: startOfMonth,
              lt: endOfMonth,
            },
          },
        }),
      ]);

    return {
      today: todayCount,
      thisWeek: thisWeekCount,
      scheduled: scheduledCount,
      completedThisMonth: completedThisMonthCount,
    };
  }),

  /**
   * Get all visits with filters
   */
  getAll: visitsReadProcedure
    .input(
      z.object({
        status: z
          .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "BLOCKED"])
          .optional(),
        visitType: z
          .enum([
            "ANNUAL_INSPECTION",
            "SEMI_ANNUAL",
            "QUARTERLY",
            "EMERGENCY",
            "REPAIR",
            "INSTALLATION",
          ])
          .optional(),
        technicianId: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        agreementId: z.string().optional(),
        page: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, visitType, technicianId, dateFrom, dateTo, agreementId, page, limit } =
        input;

      const where = {
        ...(status && { status }),
        ...(visitType && { visitType }),
        ...(technicianId && { technicianId }),
        ...(agreementId && { agreementId }),
        ...(dateFrom || dateTo
          ? {
              scheduledDate: {
                ...(dateFrom && { gte: dateFrom }),
                ...(dateTo && { lte: dateTo }),
              },
            }
          : {}),
      };

      const [visits, total] = await Promise.all([
        ctx.db.serviceVisit.findMany({
          where,
          skip: page * limit,
          take: limit,
          orderBy: { scheduledDate: "asc" },
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
            checklists: {
              include: {
                template: true,
              },
            },
            _count: {
              select: {
                photos: true,
                checklists: true,
              },
            },
          },
        }),
        ctx.db.serviceVisit.count({ where }),
      ]);

      return {
        items: visits,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: (page + 1) * limit < total,
      };
    }),

  /**
   * Get visit by ID
   */
  getById: visitsReadProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const visit = await ctx.db.serviceVisit.findUnique({
      where: { id: input },
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
        checklists: {
          include: {
            template: true,
            items: true,
          },
        },
        photos: true,
        invoices: true,
      },
    });

    if (!visit) {
      throw new Error("Visit not found");
    }

    return visit;
  }),

  /**
   * Get today's visits
   */
  getToday: visitsReadProcedure
    .input(z.object({ technicianId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const visits = await ctx.db.serviceVisit.findMany({
        where: {
          scheduledDate: {
            gte: today,
            lt: tomorrow,
          },
          ...(input?.technicianId && { technicianId: input.technicianId }),
        },
        orderBy: { scheduledDate: "asc" },
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
          _count: {
            select: { checklists: true },
          },
        },
      });

      return visits;
    }),

  /**
   * Get upcoming visits for the week
   */
  getUpcoming: visitsReadProcedure
    .input(
      z.object({
        technicianId: z.string().optional(),
        days: z.number().min(1).max(30).default(7),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + (input?.days ?? 7));

      const visits = await ctx.db.serviceVisit.findMany({
        where: {
          scheduledDate: {
            gte: today,
            lt: endDate,
          },
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          ...(input?.technicianId && { technicianId: input.technicianId }),
        },
        orderBy: { scheduledDate: "asc" },
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

      return visits;
    }),

  /**
   * Create a new visit
   */
  create: visitsWriteProcedure
    .input(
      z.object({
        agreementId: z.string(),
        technicianId: z.string(),
        scheduledDate: z.date(),
        scheduledEndDate: z.date().optional(),
        visitType: z.enum([
          "ANNUAL_INSPECTION",
          "SEMI_ANNUAL",
          "QUARTERLY",
          "EMERGENCY",
          "REPAIR",
          "INSTALLATION",
        ]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify agreement exists
      const agreement = await ctx.db.serviceAgreement.findUnique({
        where: { id: input.agreementId },
        include: {
          installation: true,
        },
      });

      if (!agreement) {
        throw new Error("Agreement not found");
      }

      // Calculate default end time if not provided (2 hours)
      const scheduledEndDate =
        input.scheduledEndDate ?? new Date(input.scheduledDate.getTime() + 2 * 60 * 60 * 1000);

      const visit = await ctx.db.serviceVisit.create({
        data: {
          agreementId: input.agreementId,
          technicianId: input.technicianId,
          scheduledDate: input.scheduledDate,
          scheduledEndDate,
          visitType: input.visitType,
          status: "SCHEDULED",
          notes: input.notes,
        },
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

      return visit;
    }),

  /**
   * Update a visit
   */
  update: visitsWriteProcedure
    .input(
      z.object({
        id: z.string(),
        technicianId: z.string().optional(),
        scheduledDate: z.date().optional(),
        scheduledEndDate: z.date().optional(),
        status: z
          .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "BLOCKED"])
          .optional(),
        visitType: z
          .enum([
            "ANNUAL_INSPECTION",
            "SEMI_ANNUAL",
            "QUARTERLY",
            "EMERGENCY",
            "REPAIR",
            "INSTALLATION",
          ])
          .optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const visit = await ctx.db.serviceVisit.update({
        where: { id },
        data,
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

      return visit;
    }),

  /**
   * Start a visit
   */
  start: visitsWriteProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const visit = await ctx.db.serviceVisit.update({
      where: { id: input },
      data: {
        status: "IN_PROGRESS",
        actualStartDate: new Date(),
      },
    });

    return visit;
  }),

  /**
   * Complete a visit
   */
  complete: visitsWriteProcedure
    .input(
      z.object({
        id: z.string(),
        durationMinutes: z.number().optional(),
        customerSignature: z.string().optional(),
        customerNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Get the visit to calculate duration if not provided
      const existingVisit = await ctx.db.serviceVisit.findUnique({
        where: { id },
      });

      let durationMinutes = data.durationMinutes;
      if (!durationMinutes && existingVisit?.actualStartDate) {
        durationMinutes = Math.round(
          (new Date().getTime() - existingVisit.actualStartDate.getTime()) / (1000 * 60)
        );
      }

      const visit = await ctx.db.serviceVisit.update({
        where: { id },
        data: {
          status: "COMPLETED",
          actualEndDate: new Date(),
          durationMinutes,
          customerSignature: data.customerSignature,
          customerNotes: data.customerNotes,
          signedAt: data.customerSignature ? new Date() : undefined,
        },
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
          checklists: true,
        },
      });

      return visit;
    }),

  /**
   * Cancel a visit
   */
  cancel: visitsWriteProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const visit = await ctx.db.serviceVisit.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: input.reason ? `Cancelled: ${input.reason}` : undefined,
        },
      });

      return visit;
    }),

  /**
   * Add photo to visit
   */
  addPhoto: visitsWriteProcedure
    .input(
      z.object({
        visitId: z.string(),
        url: z.string().url(),
        caption: z.string().optional(),
        category: z.enum(["before", "after", "damage", "general"]).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const photo = await ctx.db.visitPhoto.create({
        data: {
          visitId: input.visitId,
          url: input.url,
          caption: input.caption,
          category: input.category,
          latitude: input.latitude,
          longitude: input.longitude,
        },
      });

      return photo;
    }),

  /**
   * Get calendar data for visits
   */
  getCalendarData: visitsReadProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        technicianId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const visits = await ctx.db.serviceVisit.findMany({
        where: {
          scheduledDate: {
            gte: input.startDate,
            lte: input.endDate,
          },
          ...(input.technicianId && { technicianId: input.technicianId }),
        },
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

      // Transform to calendar event format
      return visits.map((visit) => ({
        id: visit.id,
        title: `${visit.agreement.installation.customer.name} - ${visit.visitType}`,
        start: visit.scheduledDate,
        end: visit.scheduledEndDate ?? new Date(visit.scheduledDate.getTime() + 2 * 60 * 60 * 1000),
        status: visit.status,
        technicianId: visit.technicianId,
        technicianName: "", // Would come from @energismart/shared
        customerName: visit.agreement.installation.customer.name,
        address: visit.agreement.installation.address,
        visitType: visit.visitType,
      }));
    }),
});
