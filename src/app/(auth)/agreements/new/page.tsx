import { AgreementWizard } from "~/components/features/agreements/AgreementWizard";

export const metadata = {
  title: "Ny avtale | Suncare",
  description: "Opprett ny serviceavtale",
};

export default function NewAgreementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Opprett ny avtale</h1>
        <p className="text-muted-foreground">
          Følg veiviseren for å opprette en ny serviceavtale
        </p>
      </div>

      <AgreementWizard />
    </div>
  );
}
