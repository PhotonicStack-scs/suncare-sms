import { Receipt } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export const metadata = {
  title: "Faktura | Suncare",
  description: "Administrer fakturaer og fakturering",
};

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Faktura</h1>
        <p className="text-muted-foreground">
          Administrer fakturaer og fakturering via Tripletex
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Receipt className="size-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kommer snart</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Her vil du kunne se fakturaer, opprette nye fakturaer basert på
            fullførte servicebesøk, og synkronisere med Tripletex.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
