import { Suspense } from "react";
import { VisitList } from "~/components/features/visits";
import { SkeletonTable } from "~/components/ui/skeleton";

export const metadata = {
  title: "Arbeidsordre | Suncare",
  description: "Administrer arbeidsordre og servicebesøk",
};

export default function VisitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Arbeidsordre</h1>
        <p className="text-muted-foreground">
          Administrer arbeidsordre og servicebesøk
        </p>
      </div>

      <Suspense fallback={<SkeletonTable rows={5} columns={7} />}>
        <VisitList />
      </Suspense>
    </div>
  );
}
