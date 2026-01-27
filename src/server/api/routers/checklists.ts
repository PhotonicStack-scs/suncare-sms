import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  checklistsReadProcedure,
  checklistsWriteProcedure,
} from "~/server/api/trpc";

export const checklistsRouter = createTRPCRouter({
  /**
   * Get all checklist templates
   */
  getTemplates: checklistsReadProcedure
    .input(
      z.object({
        systemType: z.enum(["SOLAR_PANEL", "BESS", "COMBINED"]).optional(),
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
        isActive: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const templates = await ctx.db.checklistTemplate.findMany({
        where: {
          ...(input?.systemType && { systemType: input.systemType }),
          ...(input?.visitType && { visitType: input.visitType }),
          isActive: input?.isActive ?? true,
        },
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return templates;
    }),

  /**
   * Get template by ID with items
   */
  getTemplateById: checklistsReadProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.checklistTemplate.findUnique({
        where: { id: input },
        include: {
          items: {
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
          },
        },
      });

      if (!template) {
        throw new Error("Template not found");
      }

      return template;
    }),

  /**
   * Get checklist by ID
   */
  getById: checklistsReadProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const checklist = await ctx.db.checklist.findUnique({
      where: { id: input },
      include: {
        template: true,
        items: {
          orderBy: [{ category: "asc" }],
        },
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
      },
    });

    if (!checklist) {
      throw new Error("Checklist not found");
    }

    return checklist;
  }),

  /**
   * Get checklists for a visit
   */
  getByVisit: checklistsReadProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const checklists = await ctx.db.checklist.findMany({
      where: { visitId: input },
      include: {
        template: true,
        items: true,
        _count: {
          select: { items: true },
        },
      },
    });

    return checklists;
  }),

  /**
   * Create a checklist for a visit from template
   */
  createFromTemplate: checklistsWriteProcedure
    .input(
      z.object({
        visitId: z.string(),
        templateId: z.string(),
        technicianId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get template with items
      const template = await ctx.db.checklistTemplate.findUnique({
        where: { id: input.templateId },
        include: {
          items: {
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
          },
        },
      });

      if (!template) {
        throw new Error("Template not found");
      }

      // Create checklist with items from template
      const checklist = await ctx.db.checklist.create({
        data: {
          visitId: input.visitId,
          templateId: input.templateId,
          technicianId: input.technicianId,
          status: "NOT_STARTED",
          items: {
            create: template.items.map((item) => ({
              category: item.category,
              description: item.description,
              inputType: item.inputType,
              status: "PENDING",
            })),
          },
        },
        include: {
          template: true,
          items: true,
        },
      });

      return checklist;
    }),

  /**
   * Start a checklist
   */
  start: checklistsWriteProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const checklist = await ctx.db.checklist.update({
      where: { id: input },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    return checklist;
  }),

  /**
   * Update a checklist item
   */
  updateItem: checklistsWriteProcedure
    .input(
      z.object({
        itemId: z.string(),
        status: z.enum(["PENDING", "PASSED", "FAILED", "NOT_APPLICABLE"]).optional(),
        value: z.string().nullable().optional(),
        numericValue: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
        photoUrl: z.string().nullable().optional(),
        severity: z.enum(["CRITICAL", "SERIOUS", "MODERATE", "MINOR"]).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { itemId, ...data } = input;

      const item = await ctx.db.checklistItem.update({
        where: { id: itemId },
        data: {
          ...data,
          completedAt: data.status && data.status !== "PENDING" ? new Date() : undefined,
        },
      });

      return item;
    }),

  /**
   * Complete a checklist
   */
  complete: checklistsWriteProcedure
    .input(
      z.object({
        id: z.string(),
        items: z.array(
          z.object({
            itemId: z.string(),
            status: z.enum(["PENDING", "PASSED", "FAILED", "NOT_APPLICABLE"]),
            value: z.string().optional(),
            numericValue: z.number().optional(),
            notes: z.string().optional(),
            severity: z.enum(["CRITICAL", "SERIOUS", "MODERATE", "MINOR"]).optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update all items
      await Promise.all(
        input.items.map((item) =>
          ctx.db.checklistItem.update({
            where: { id: item.itemId },
            data: {
              status: item.status,
              value: item.value,
              numericValue: item.numericValue,
              notes: item.notes,
              severity: item.severity,
              completedAt: new Date(),
            },
          })
        )
      );

      // Mark checklist as completed
      const checklist = await ctx.db.checklist.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      return checklist;
    }),

  /**
   * Get checklist items grouped by category
   */
  getItemsByCategory: checklistsReadProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const checklist = await ctx.db.checklist.findUnique({
        where: { id: input },
        include: {
          items: {
            orderBy: { category: "asc" },
          },
        },
      });

      if (!checklist) {
        throw new Error("Checklist not found");
      }

      // Group items by category
      const grouped = checklist.items.reduce(
        (acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item);
          return acc;
        },
        {} as Record<string, typeof checklist.items>
      );

      // Transform to array with stats
      return Object.entries(grouped).map(([category, items]) => ({
        category,
        items,
        completedCount: items.filter((i) => i.status !== "PENDING").length,
        totalCount: items.length,
      }));
    }),

  /**
   * Get checklist summary for a visit (findings count by severity)
   */
  getVisitSummary: checklistsReadProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const checklists = await ctx.db.checklist.findMany({
      where: { visitId: input },
      include: {
        items: true,
      },
    });

    // Count findings by severity
    const findings = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };

    for (const checklist of checklists) {
      for (const item of checklist.items) {
        if (item.status === "FAILED" && item.severity) {
          const key = item.severity.toLowerCase() as keyof typeof findings;
          findings[key]++;
        }
      }
    }

    return {
      totalChecklists: checklists.length,
      completedChecklists: checklists.filter((c) => c.status === "COMPLETED").length,
      findings,
      hasIssues: findings.critical > 0 || findings.serious > 0,
    };
  }),
});
