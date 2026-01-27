import { Zap } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export const metadata = {
  title: "Automatisering | Suncare",
  description: "Konfigurer automatiserte arbeidsflyter",
};

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Automatisering</h1>
        <p className="text-muted-foreground">
          Konfigurer automatiserte arbeidsflyter og varslinger
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Zap className="size-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kommer snart</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Her vil du kunne sette opp automatiske påminnelser, planlegging av
            servicebesøk, og andre automatiserte arbeidsflyter.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
