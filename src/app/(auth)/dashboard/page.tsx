"use client";

import { KpiRow, VisitsChart, RecentVisitsTable, AgreementPreview } from "~/components/features/dashboard";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: kpiData, isLoading: kpiLoading } = api.dashboard.getKpis.useQuery();
  const { data: monthlyVisits, isLoading: monthlyLoading } = api.dashboard.getMonthlyVisits.useQuery();
  const { data: recentVisits, isLoading: visitsLoading } = api.dashboard.getRecentVisits.useQuery({ limit: 10 });

  const isLoading = kpiLoading || monthlyLoading || visitsLoading;

  const kpis = kpiData
    ? [
        {
          title: "Planlagte besøk denne måneden",
          value: kpiData.scheduledVisits.value,
          previousValue: kpiData.scheduledVisits.previousValue,
          change: kpiData.scheduledVisits.change,
          changePercent: kpiData.scheduledVisits.changePercent,
          trend: kpiData.scheduledVisits.trend as "up" | "down" | "stable",
        },
        {
          title: "Aktive avtaler",
          value: kpiData.activeAgreements.value,
          previousValue: kpiData.activeAgreements.previousValue,
          change: kpiData.activeAgreements.change,
          changePercent: kpiData.activeAgreements.changePercent,
          trend: kpiData.activeAgreements.trend as "up" | "down" | "stable",
        },
        {
          title: "Fakturaer til godkjenning",
          value: kpiData.pendingInvoices.value,
          previousValue: kpiData.pendingInvoices.previousValue,
          change: kpiData.pendingInvoices.change,
          changePercent: kpiData.pendingInvoices.changePercent,
          trend: kpiData.pendingInvoices.trend as "up" | "down" | "stable",
          format: "number" as const,
        },
      ]
    : [];

  const tableVisits = recentVisits?.map((visit) => ({
    id: visit.id,
    customerName: visit.customerName,
    address: visit.address,
    visitType: visit.visitType,
    scheduledDate: visit.scheduledDate,
    status: visit.status,
    technicianName: visit.technicianName,
  })) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Oversikt over service management</p>
      </div>

      {/* KPI Cards */}
      <KpiRow kpis={kpis} />

      {/* Mid Section - Two columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: AI Recommendations + Agreement Preview */}
        <div className="lg:col-span-1">
          <AgreementPreview />
        </div>

        {/* Right: Chart */}
        <div className="lg:col-span-2">
          <VisitsChart
            data={monthlyVisits ?? []}
            highlightMonth={monthlyVisits ? monthlyVisits.length - 1 : 0}
          />
        </div>
      </div>

      {/* Recent Visits Table */}
      <RecentVisitsTable visits={tableVisits} />
    </div>
  );
}
