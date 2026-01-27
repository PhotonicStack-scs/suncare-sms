import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DailyCalendar } from "~/components/features/planning";

export const metadata = {
  title: "Serviceplanlegging | Suncare",
  description: "Planlegg og administrer servicebesøk",
};

function CalendarSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function PlanningPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Serviceplanlegging</h1>
        <p className="text-muted-foreground">
          Planlegg og koordiner servicebesøk for teknikere
        </p>
      </div>

      <Suspense fallback={<CalendarSkeleton />}>
        <DailyCalendar />
      </Suspense>
    </div>
  );
}
