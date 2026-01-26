import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  createPermissionProcedure,
} from "~/server/api/trpc";

const checklistReadProcedure = createPermissionProcedure("checklists:read");
const checklistWriteProcedure = createPermissionProcedure("checklists:write");
const checklistTemplateProcedure = createPermissionProcedure("checklists:templates");

const updateItemSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "OK", "NOT_OK", "NOT_APPLICABLE"]),
  value: z.string().optional(),
  numericValue: z.number().optional(),
  notes: z.string().optional(),
  severity: z.enum(["CRITICAL", "SERIOUS", "MODERATE", "MINOR", "INFO"]).optional(),
  photoUrls: z.array(z.string()).optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
});

export const checklistRouter = createTRPCRouter({
  /**
   * Get all checklist templates
   */
  getTemplates: checklistReadProcedure
    .input(
      z.object({
        systemType: z.enum(["SOLAR", "BESS", "HYBRID"]).optional(),
        visitType: z
          .enum(["ANNUAL_INSPECTION", "SEMI_ANNUAL", "QUARTERLY", "TROUBLESHOOTING", "EMERGENCY", "WARRANTY"])
          .optional(),
        isActive: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.checklistTemplate.findMany({
        where: {
          ...(input?.systemType && { systemType: input.systemType }),
          ...(input?.visitType && { visitType: input.visitType }),
          isActive: input?.isActive ?? true,
        },
        include: {
          items: {
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
          },
        },
        orderBy: { name: "asc" },
      });
    }),

  /**
   * Get a single checklist template
   */
  getTemplate: checklistReadProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.checklistTemplate.findUnique({
        where: { id: input.id },
        include: {
          items: {
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
          },
        },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sjekklistemal ikke funnet",
        });
      }

      return template;
    }),

  /**
   * Get a checklist by ID
   */
  getById: checklistReadProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const checklist = await ctx.db.checklist.findUnique({
        where: { id: input.id },
        include: {
          items: {
            orderBy: [{ category: "asc" }, { code: "asc" }],
          },
          template: true,
          visit: {
            include: {
              agreement: {
                include: {
                  installation: {
                    include: { customer: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!checklist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sjekkliste ikke funnet",
        });
      }

      return checklist;
    }),

  /**
   * Get checklists for a visit
   */
  getByVisit: checklistReadProcedure
    .input(z.object({ visitId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.checklist.findMany({
        where: { visitId: input.visitId },
        include: {
          items: {
            orderBy: [{ category: "asc" }, { code: "asc" }],
          },
          template: true,
        },
      });
    }),

  /**
   * Create a checklist from template for a visit
   */
  createFromTemplate: checklistWriteProcedure
    .input(
      z.object({
        visitId: z.string(),
        templateId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get template with items
      const template = await ctx.db.checklistTemplate.findUnique({
        where: { id: input.templateId },
        include: { items: true },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sjekklistemal ikke funnet",
        });
      }

      // Create checklist with items
      return ctx.db.checklist.create({
        data: {
          visitId: input.visitId,
          templateId: input.templateId,
          technicianId: ctx.user.employeeId ?? ctx.user.id,
          status: "PENDING",
          items: {
            create: template.items.map((item) => ({
              templateItemId: item.id,
              category: item.category,
              code: item.code,
              description: item.description,
              inputType: item.inputType,
              status: "PENDING",
            })),
          },
        },
        include: {
          items: true,
          template: true,
        },
      });
    }),

  /**
   * Start a checklist
   */
  start: checklistWriteProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.checklist.update({
        where: { id: input.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });
    }),

  /**
   * Update a checklist item
   */
  updateItem: checklistWriteProcedure
    .input(updateItemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      return ctx.db.checklistItem.update({
        where: { id },
        data: {
          ...updateData,
          completedAt: updateData.status !== "PENDING" ? new Date() : null,
        },
      });
    }),

  /**
   * Update multiple checklist items at once
   */
  updateItems: checklistWriteProcedure
    .input(
      z.object({
        checklistId: z.string(),
        items: z.array(updateItemSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates = input.items.map((item) =>
        ctx.db.checklistItem.update({
          where: { id: item.id },
          data: {
            status: item.status,
            value: item.value,
            numericValue: item.numericValue,
            notes: item.notes,
            severity: item.severity,
            photoUrls: item.photoUrls,
            gpsLatitude: item.gpsLatitude,
            gpsLongitude: item.gpsLongitude,
            completedAt: item.status !== "PENDING" ? new Date() : null,
          },
        })
      );

      await ctx.db.$transaction(updates);

      return ctx.db.checklist.findUnique({
        where: { id: input.checklistId },
        include: { items: true },
      });
    }),

  /**
   * Complete a checklist
   */
  complete: checklistWriteProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check all mandatory items are completed
      const checklist = await ctx.db.checklist.findUnique({
        where: { id: input.id },
        include: {
          items: true,
          template: {
            include: { items: true },
          },
        },
      });

      if (!checklist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sjekkliste ikke funnet",
        });
      }

      // Find incomplete mandatory items
      const mandatoryTemplateItems = checklist.template.items
        .filter((t) => t.isMandatory)
        .map((t) => t.id);

      const incompleteItems = checklist.items.filter(
        (item) =>
          item.templateItemId &&
          mandatoryTemplateItems.includes(item.templateItemId) &&
          item.status === "PENDING"
      );

      if (incompleteItems.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${incompleteItems.length} obligatoriske punkter må fullføres`,
        });
      }

      return ctx.db.checklist.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          notes: input.notes,
        },
      });
    }),

  /**
   * Add ad-hoc item to checklist
   */
  addItem: checklistWriteProcedure
    .input(
      z.object({
        checklistId: z.string(),
        category: z.string(),
        code: z.string(),
        description: z.string(),
        inputType: z.string().default("YES_NO"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.checklistItem.create({
        data: {
          checklistId: input.checklistId,
          category: input.category,
          code: input.code,
          description: input.description,
          inputType: input.inputType,
          status: "PENDING",
        },
      });
    }),

  /**
   * Get checklist summary/statistics
   */
  getSummary: checklistReadProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const checklist = await ctx.db.checklist.findUnique({
        where: { id: input.id },
        include: { items: true },
      });

      if (!checklist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sjekkliste ikke funnet",
        });
      }

      const items = checklist.items;
      const total = items.length;
      const completed = items.filter((i) => i.status !== "PENDING").length;
      const ok = items.filter((i) => i.status === "OK").length;
      const notOk = items.filter((i) => i.status === "NOT_OK").length;
      const notApplicable = items.filter((i) => i.status === "NOT_APPLICABLE").length;

      const findingsBySeverity = {
        CRITICAL: items.filter((i) => i.severity === "CRITICAL").length,
        SERIOUS: items.filter((i) => i.severity === "SERIOUS").length,
        MODERATE: items.filter((i) => i.severity === "MODERATE").length,
        MINOR: items.filter((i) => i.severity === "MINOR").length,
        INFO: items.filter((i) => i.severity === "INFO").length,
      };

      // Group by category
      const categories = [...new Set(items.map((i) => i.category))];
      const byCategory = categories.map((cat) => {
        const categoryItems = items.filter((i) => i.category === cat);
        return {
          name: cat,
          total: categoryItems.length,
          completed: categoryItems.filter((i) => i.status !== "PENDING").length,
          hasIssues: categoryItems.some((i) => i.status === "NOT_OK"),
        };
      });

      return {
        total,
        completed,
        pending: total - completed,
        ok,
        notOk,
        notApplicable,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        findingsBySeverity,
        byCategory,
      };
    }),
});
