import { Plug } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export const metadata = {
  title: "Integrasjoner | Suncare",
  description: "Administrer integrasjoner med eksterne systemer",
};

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrasjoner</h1>
        <p className="text-muted-foreground">
          Administrer integrasjoner med eksterne systemer
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Plug className="size-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kommer snart</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Her vil du kunne konfigurere og administrere integrasjoner med
            Tripletex, Google Calendar, og andre eksterne systemer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
