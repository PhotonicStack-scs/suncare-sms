import { Building2 } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

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

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2 className="size-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kommer snart</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Her vil du kunne se og administrere alle registrerte anlegg,
            inkludert tekniske detaljer og servicehistorikk.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
