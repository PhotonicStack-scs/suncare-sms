import { KpiRow, VisitsChart, RecentVisitsTable, AgreementPreview } from "~/components/features/dashboard";
import { SAMPLE_KPIS, SAMPLE_MONTHLY_VISITS, SAMPLE_VISITS } from "~/data/sample-data";

export const metadata = {
  title: "Dashboard | Suncare",
  description: "Oversikt over service management",
};

export default function DashboardPage() {
  const kpis = [
    {
      title: "Planlagte besøk denne måneden",
      ...SAMPLE_KPIS.scheduledVisits,
    },
    {
      title: "Aktive avtaler",
      ...SAMPLE_KPIS.activeAgreements,
    },
    {
      title: "Fakturaer til godkjenning",
      ...SAMPLE_KPIS.pendingInvoices,
      format: "number" as const,
    },
  ];

  // Transform sample visits for the table
  const tableVisits = SAMPLE_VISITS.map((visit) => ({
    id: visit.id,
    customerName: visit.customerName,
    address: visit.address,
    visitType: visit.visitType,
    scheduledDate: visit.scheduledDate,
    status: visit.status,
  }));

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
            data={SAMPLE_MONTHLY_VISITS}
            highlightMonth={8} // September (current)
          />
        </div>
      </div>

      {/* Recent Visits Table */}
      <RecentVisitsTable visits={tableVisits} />
    </div>
  );
}
