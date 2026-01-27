import { HelpCircle } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export const metadata = {
  title: "Hjelp | Suncare",
  description: "Hjelp og dokumentasjon",
};

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hjelp</h1>
        <p className="text-muted-foreground">
          Hjelp, dokumentasjon og support
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <HelpCircle className="size-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kommer snart</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Her vil du finne brukerveiledninger, ofte stilte spørsmål, og
            kontaktinformasjon for support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
