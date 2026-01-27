import { Settings } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export const metadata = {
  title: "Innstillinger | Suncare",
  description: "Administrer systeminnstillinger",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Innstillinger</h1>
        <p className="text-muted-foreground">
          Administrer systeminnstillinger og preferanser
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Settings className="size-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kommer snart</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Her vil du kunne konfigurere systeminnstillinger, sjekklister,
            produktkatalogen og andre preferanser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
