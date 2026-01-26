import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  visitReadProcedure,
  visitWriteProcedure,
} from "~/server/api/trpc";

const createVisitSchema = z.object({
  agreementId: z.string(),
  technicianId: z.string(),
  scheduledDate: z.date(),
  scheduledEnd: z.date().optional(),
  visitType: z.enum([
    "ANNUAL_INSPECTION",
    "SEMI_ANNUAL",
    "QUARTERLY",
    "TROUBLESHOOTING",
    "EMERGENCY",
    "WARRANTY",
  ]),
  notes: z.string().optional(),
});

const updateVisitSchema = createVisitSchema.partial().extend({
  id: z.string(),
  status: z
    .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "RESCHEDULED"])
    .optional(),
  actualStart: z.date().optional(),
  actualEnd: z.date().optional(),
  technicianNotes: z.string().optional(),
  customerSign: z.string().optional(),
});

const filterSchema = z.object({
  status: z
    .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "RESCHEDULED"])
    .or(z.array(z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "RESCHEDULED"])))
    .optional(),
  visitType: z
    .enum(["ANNUAL_INSPECTION", "SEMI_ANNUAL", "QUARTERLY", "TROUBLESHOOTING", "EMERGENCY", "WARRANTY"])
    .or(z.array(z.enum(["ANNUAL_INSPECTION", "SEMI_ANNUAL", "QUARTERLY", "TROUBLESHOOTING", "EMERGENCY", "WARRANTY"])))
    .optional(),
  technicianId: z.string().optional(),
  agreementId: z.string().optional(),
  customerId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const visitRouter = createTRPCRouter({
  /**
   * Get all visits with filters
   */
  getAll: visitReadProcedure
    .input(filterSchema.optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input?.status) {
        where.status = Array.isArray(input.status)
          ? { in: input.status }
          : input.status;
      }

      if (input?.visitType) {
        where.visitType = Array.isArray(input.visitType)
          ? { in: input.visitType }
          : input.visitType;
      }

      if (input?.technicianId) {
        where.technicianId = input.technicianId;
      }

      if (input?.agreementId) {
        where.agreementId = input.agreementId;
      }

      if (input?.customerId) {
        where.agreement = {
          installation: { customerId: input.customerId },
        };
      }

      if (input?.dateFrom || input?.dateTo) {
        where.scheduledDate = {
          ...(input.dateFrom && { gte: input.dateFrom }),
          ...(input.dateTo && { lte: input.dateTo }),
        };
      }

      if (input?.search) {
        where.OR = [
          { agreement: { agreementNumber: { contains: input.search, mode: "insensitive" } } },
          { agreement: { installation: { customer: { name: { contains: input.search, mode: "insensitive" } } } } },
          { agreement: { installation: { address: { contains: input.search, mode: "insensitive" } } } },
        ];
      }

      const [visits, total] = await Promise.all([
        ctx.db.serviceVisit.findMany({
          where,
          take: input?.limit ?? 50,
          skip: input?.offset ?? 0,
          orderBy: { scheduledDate: "asc" },
          include: {
            agreement: {
              include: {
                installation: {
                  include: {
                    customer: {
                      select: {
                        tripletexId: true,
                        name: true,
                        email: true,
                        phone: true,
                        address: true,
                      },
                    },
                  },
                },
              },
            },
            checklists: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        }),
        ctx.db.serviceVisit.count({ where }),
      ]);

      return { visits, total };
    }),

  /**
   * Get a single visit by ID
   */
  getById: visitReadProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const visit = await ctx.db.serviceVisit.findUnique({
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
          checklists: {
            include: {
              items: true,
              template: true,
            },
          },
        },
      });

      if (!visit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Besøk ikke funnet",
        });
      }

      return visit;
    }),

  /**
   * Get visits for a specific date range (calendar view)
   */
  getCalendarEvents: visitReadProcedure
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
          status: { not: "CANCELLED" },
        },
        include: {
          agreement: {
            include: {
              installation: {
                include: {
                  customer: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { scheduledDate: "asc" },
      });

      return visits.map((visit) => ({
        id: visit.id,
        title: `${visit.agreement.installation.customer.name}`,
        start: visit.scheduledDate,
        end: visit.scheduledEnd ?? new Date(visit.scheduledDate.getTime() + 90 * 60000),
        status: visit.status,
        visitType: visit.visitType,
        technicianId: visit.technicianId,
        address: `${visit.agreement.installation.address}, ${visit.agreement.installation.city}`,
        agreementId: visit.agreementId,
      }));
    }),

  /**
   * Get today's visits
   */
  getToday: visitReadProcedure
    .input(z.object({ technicianId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return ctx.db.serviceVisit.findMany({
        where: {
          scheduledDate: {
            gte: today,
            lt: tomorrow,
          },
          ...(input?.technicianId && { technicianId: input.technicianId }),
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
          checklists: {
            select: { id: true, status: true },
          },
        },
        orderBy: { scheduledDate: "asc" },
      });
    }),

  /**
   * Create a new visit
   */
  create: visitWriteProcedure
    .input(createVisitSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the next visit number for this agreement
      const lastVisit = await ctx.db.serviceVisit.findFirst({
        where: { agreementId: input.agreementId },
        orderBy: { visitNumber: "desc" },
      });

      const visitNumber = (lastVisit?.visitNumber ?? 0) + 1;

      return ctx.db.serviceVisit.create({
        data: {
          ...input,
          visitNumber,
          status: "SCHEDULED",
        },
        include: {
          agreement: {
            include: {
              installation: {
                include: { customer: true },
              },
            },
          },
        },
      });
    }),

  /**
   * Update a visit
   */
  update: visitWriteProcedure
    .input(updateVisitSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const visit = await ctx.db.serviceVisit.findUnique({
        where: { id },
      });

      if (!visit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Besøk ikke funnet",
        });
      }

      // If completing, set completedAt
      if (updateData.status === "COMPLETED" && visit.status !== "COMPLETED") {
        updateData.actualEnd = updateData.actualEnd ?? new Date();
      }

      return ctx.db.serviceVisit.update({
        where: { id },
        data: {
          ...updateData,
          ...(updateData.status === "COMPLETED" && { completedAt: new Date() }),
        },
        include: {
          agreement: {
            include: {
              installation: {
                include: { customer: true },
              },
            },
          },
        },
      });
    }),

  /**
   * Start a visit
   */
  start: visitWriteProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.serviceVisit.update({
        where: { id: input.id },
        data: {
          status: "IN_PROGRESS",
          actualStart: new Date(),
        },
      });
    }),

  /**
   * Complete a visit
   */
  complete: visitWriteProcedure
    .input(
      z.object({
        id: z.string(),
        technicianNotes: z.string().optional(),
        customerSign: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const visit = await ctx.db.serviceVisit.findUnique({
        where: { id: input.id },
        include: { checklists: true },
      });

      if (!visit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Besøk ikke funnet",
        });
      }

      // Check if all checklists are completed
      const incompleteChecklists = visit.checklists.filter(
        (c) => c.status !== "COMPLETED"
      );

      if (incompleteChecklists.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Alle sjekklister må fullføres før besøket kan avsluttes",
        });
      }

      // Calculate duration
      const durationMin = visit.actualStart
        ? Math.round((Date.now() - visit.actualStart.getTime()) / 60000)
        : undefined;

      return ctx.db.serviceVisit.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          actualEnd: new Date(),
          completedAt: new Date(),
          durationMin,
          technicianNotes: input.technicianNotes,
          customerSign: input.customerSign,
          customerSignAt: input.customerSign ? new Date() : undefined,
        },
      });
    }),

  /**
   * Reschedule a visit
   */
  reschedule: visitWriteProcedure
    .input(
      z.object({
        id: z.string(),
        newDate: z.date(),
        newEnd: z.date().optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.serviceVisit.update({
        where: { id: input.id },
        data: {
          status: "RESCHEDULED",
          scheduledDate: input.newDate,
          scheduledEnd: input.newEnd,
          notes: input.reason
            ? `Omplassert: ${input.reason}`
            : undefined,
        },
      });
    }),

  /**
   * Cancel a visit
   */
  cancel: visitWriteProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.serviceVisit.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: `Kansellert: ${input.reason}`,
        },
      });
    }),

  /**
   * Get visit statistics
   */
  getStats: visitReadProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayCount, weekCount, scheduledCount, completedThisMonth] = await Promise.all([
      ctx.db.serviceVisit.count({
        where: {
          scheduledDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
          status: { not: "CANCELLED" },
        },
      }),
      ctx.db.serviceVisit.count({
        where: {
          scheduledDate: { gte: weekStart, lt: weekEnd },
          status: { not: "CANCELLED" },
        },
      }),
      ctx.db.serviceVisit.count({
        where: { status: "SCHEDULED" },
      }),
      ctx.db.serviceVisit.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: monthStart },
        },
      }),
    ]);

    return {
      today: todayCount,
      thisWeek: weekCount,
      scheduled: scheduledCount,
      completedThisMonth,
    };
  }),
});
