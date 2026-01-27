import { z } from "zod";
import { createTRPCRouter, reportsReadProcedure, protectedProcedure } from "~/server/api/trpc";
import { 
  geminiClient, 
  REPORT_SYSTEM_PROMPT, 
  generateStructuredReportPrompt,
  type ReportGenerationInput,
  type ReportOutput 
} from "~/lib/gemini";

export const reportsRouter = createTRPCRouter({
  /**
   * Generate AI report for a service visit
   */
  generate: protectedProcedure
    .input(z.string()) // visitId
    .mutation(async ({ ctx, input: visitId }) => {
      // Get visit with all related data
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
          checklists: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!visit) {
        throw new Error("Visit not found");
      }

      // Check if Gemini is configured
      if (!geminiClient.isConfigured()) {
        throw new Error("AI service not configured");
      }

      const installation = visit.agreement.installation;
      const customer = installation.customer;

      // Prepare checklist items for AI
      const checklistItems = visit.checklists.flatMap((checklist) =>
        checklist.items.map((item) => ({
          category: item.category,
          description: item.description,
          status: item.status,
          value: item.value ?? undefined,
          notes: item.notes ?? undefined,
          severity: item.severity ?? undefined,
        }))
      );

      // Find production data if available
      const productionItem = visit.checklists
        .flatMap((c) => c.items)
        .find((item) => item.description.toLowerCase().includes("produksjon"));

      const reportInput: ReportGenerationInput = {
        customerName: customer.name,
        installationAddress: installation.address,
        systemType: installation.systemType,
        installDate: installation.installDate.toISOString().split("T")[0]!,
        visitDate: visit.scheduledDate.toISOString().split("T")[0]!,
        visitType: visit.visitType,
        technicianName: "Tekniker", // Would come from @energismart/shared
        checklistItems,
        productionData: productionItem?.numericValue
          ? {
              expected: 100,
              actual: productionItem.numericValue,
              percentage: productionItem.numericValue,
            }
          : undefined,
      };

      // Generate report using AI
      const prompt = generateStructuredReportPrompt(reportInput);
      const reportData = await geminiClient.generateJson<ReportOutput>(prompt, {
        systemPrompt: REPORT_SYSTEM_PROMPT,
        temperature: 0.5,
      });

      // Save report to database
      const report = await ctx.db.serviceReport.upsert({
        where: { visitId },
        create: {
          visitId,
          title: `Servicerapport - ${customer.name}`,
          summary: reportData.summary,
          findings: JSON.stringify(reportData.findings),
          recommendations: JSON.stringify(reportData.recommendations),
          generatedBy: "AI",
        },
        update: {
          summary: reportData.summary,
          findings: JSON.stringify(reportData.findings),
          recommendations: JSON.stringify(reportData.recommendations),
        },
      });

      return {
        report,
        data: reportData,
      };
    }),

  /**
   * Get report by visit ID
   */
  getByVisit: reportsReadProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const report = await ctx.db.serviceReport.findUnique({
      where: { visitId: input },
    });

    if (!report) {
      return null;
    }

    return {
      ...report,
      findings: JSON.parse(report.findings) as ReportOutput["findings"],
      recommendations: JSON.parse(report.recommendations) as ReportOutput["recommendations"],
    };
  }),

  /**
   * Get all reports with pagination
   */
  getAll: reportsReadProcedure
    .input(
      z.object({
        page: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;

      const [reports, total] = await Promise.all([
        ctx.db.serviceReport.findMany({
          skip: page * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.serviceReport.count(),
      ]);

      return {
        items: reports.map((report) => ({
          ...report,
          findings: JSON.parse(report.findings) as ReportOutput["findings"],
          recommendations: JSON.parse(report.recommendations) as ReportOutput["recommendations"],
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: (page + 1) * limit < total,
      };
    }),

  /**
   * Mark report as sent
   */
  markSent: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const report = await ctx.db.serviceReport.update({
      where: { id: input },
      data: {
        sentAt: new Date(),
      },
    });

    return report;
  }),
});
