import { Suspense } from "react";
import { InstallationList } from "~/components/features/installations";
import { SkeletonTable } from "~/components/ui/skeleton";

export const metadata = {
  title: "Anlegg | Suncare",
  description: "Administrer solcelle- og batteriinstallasjoner",
};

export default function InstallationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Anlegg</h1>
        <p className="text-muted-foreground">
          Administrer solcelle- og batteriinstallasjoner
        </p>
      </div>

      <Suspense fallback={<SkeletonTable rows={5} columns={6} />}>
        <InstallationList />
      </Suspense>
    </div>
  );
}
