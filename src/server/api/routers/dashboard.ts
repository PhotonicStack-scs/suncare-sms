import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getEmployeesWhoCanWorkAs, getEmployee } from "@energismart/shared";

export const dashboardRouter = createTRPCRouter({
  /**
   * Get KPIs for dashboard
   * Returns: active agreements count, scheduled visits this month, pending invoices
   */
  getKpis: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Previous month for comparison
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      activeAgreements,
      prevActiveAgreements,
      scheduledVisitsThisMonth,
      prevScheduledVisits,
      pendingInvoices,
      prevPendingInvoices,
    ] = await Promise.all([
      // Active agreements count
      ctx.db.serviceAgreement.count({
        where: { status: "ACTIVE" },
      }),
      // Previous month active agreements (approximation - those created before end of prev month)
      ctx.db.serviceAgreement.count({
        where: {
          status: "ACTIVE",
          createdAt: { lte: endOfPrevMonth },
        },
      }),
      // Scheduled visits this month
      ctx.db.serviceVisit.count({
        where: {
          scheduledDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
        },
      }),
      // Previous month scheduled visits
      ctx.db.serviceVisit.count({
        where: {
          scheduledDate: {
            gte: startOfPrevMonth,
            lte: endOfPrevMonth,
          },
          status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
        },
      }),
      // Pending invoices (DRAFT status)
      ctx.db.invoice.count({
        where: { status: "DRAFT" },
      }),
      // Previous pending invoices (approximation)
      ctx.db.invoice.count({
        where: {
          status: "DRAFT",
          createdAt: { lte: endOfPrevMonth },
        },
      }),
    ]);

    const calculateChange = (current: number, previous: number) => {
      const change = current - previous;
      const changePercent = previous > 0 ? ((change / previous) * 100) : (current > 0 ? 100 : 0);
      const trend = change > 0 ? "up" : change < 0 ? "down" : "stable";
      return { change, changePercent: Math.round(changePercent * 10) / 10, trend };
    };

    return {
      scheduledVisits: {
        value: scheduledVisitsThisMonth,
        previousValue: prevScheduledVisits,
        ...calculateChange(scheduledVisitsThisMonth, prevScheduledVisits),
      },
      activeAgreements: {
        value: activeAgreements,
        previousValue: prevActiveAgreements,
        ...calculateChange(activeAgreements, prevActiveAgreements),
      },
      pendingInvoices: {
        value: pendingInvoices,
        previousValue: prevPendingInvoices,
        ...calculateChange(pendingInvoices, prevPendingInvoices),
      },
    };
  }),

  /**
   * Get monthly visits data for chart
   * Returns visits grouped by month for the current year
   */
  getMonthlyVisits: protectedProcedure
    .input(
      z.object({
        year: z.number().optional(),
        months: z.number().min(1).max(12).default(9),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const year = input?.year ?? new Date().getFullYear();
      const monthsToShow = input?.months ?? 9;
      const currentMonth = new Date().getMonth();
      
      // Calculate start month (go back monthsToShow months from current)
      const startMonth = Math.max(0, currentMonth - monthsToShow + 1);
      
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
      
      const monthlyData = await Promise.all(
        Array.from({ length: monthsToShow }, (_, i) => {
          const monthIndex = startMonth + i;
          const startDate = new Date(year, monthIndex, 1);
          const endDate = new Date(year, monthIndex + 1, 0);
          
          return ctx.db.serviceVisit.count({
            where: {
              status: "COMPLETED",
              actualEndDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          }).then(count => ({
            month: monthNames[monthIndex] ?? `M${monthIndex + 1}`,
            visits: count,
            // Target could be based on agreements/frequency, simplified for now
            target: Math.max(10, Math.round(count * 1.1)),
          }));
        })
      );

      return monthlyData;
    }),

  /**
   * Get recent visits for the dashboard table
   */
  getRecentVisits: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;

      const visits = await ctx.db.serviceVisit.findMany({
        take: limit,
        orderBy: { scheduledDate: "desc" },
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

      // Get technician names from @energismart/shared
      const technicianIds = [...new Set(visits.map(v => v.technicianId))];
      const technicianMap = new Map<string, string>();
      
      await Promise.all(
        technicianIds.map(async (id) => {
          const employee = await getEmployee(id);
          if (employee) {
            technicianMap.set(id, employee.name);
          }
        })
      );

      return visits.map((visit) => ({
        id: visit.id,
        customerName: visit.agreement.installation.customer.name,
        address: `${visit.agreement.installation.address}${visit.agreement.installation.city ? `, ${visit.agreement.installation.city}` : ""}`,
        visitType: visit.visitType,
        scheduledDate: visit.scheduledDate,
        status: visit.status,
        technicianName: technicianMap.get(visit.technicianId) ?? "Ukjent tekniker",
      }));
    }),

  /**
   * Get available technicians from @energismart/shared
   */
  getTechnicians: protectedProcedure.query(async () => {
    const technicians = await getEmployeesWhoCanWorkAs("technician");
    return technicians.map((tech) => ({
      id: tech.id,
      name: tech.name,
      email: tech.email,
      phone: tech.phone,
      certifications: tech.certifications?.map(c => c.name) ?? [],
    }));
  }),

  /**
   * Get a single technician by ID
   */
  getTechnicianById: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const employee = await getEmployee(input);
      if (!employee) {
        return null;
      }
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        certifications: employee.certifications?.map(c => c.name) ?? [],
      };
    }),
});
