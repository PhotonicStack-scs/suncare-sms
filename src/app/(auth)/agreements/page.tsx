import { Suspense } from "react";
import { AgreementList } from "~/components/features/agreements";
import { SkeletonTable } from "~/components/ui/skeleton";

export const metadata = {
  title: "Avtaler | Suncare",
  description: "Administrer serviceavtaler",
};

export default function AgreementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Serviceavtaler</h1>
        <p className="text-muted-foreground">
          Administrer og opprett serviceavtaler for solcelleinstallasjoner
        </p>
      </div>

      <Suspense fallback={<SkeletonTable rows={5} columns={6} />}>
        <AgreementList />
      </Suspense>
    </div>
  );
}
