import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

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

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ClipboardList className="size-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kommer snart</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Her vil du kunne administrere arbeidsordre, se detaljer om
            servicebesøk, og følge opp pågående arbeid.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
