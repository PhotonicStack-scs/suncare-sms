import { History } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export const metadata = {
  title: "Historikk | Suncare",
  description: "Se historikk over servicebesøk og endringer",
};

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historikk</h1>
        <p className="text-muted-foreground">
          Se historikk over servicebesøk og endringer
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <History className="size-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kommer snart</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Her vil du kunne se en komplett historikk over alle servicebesøk,
            avtaleendringer og systemhendelser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
