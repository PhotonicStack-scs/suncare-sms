"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
  FileText,
  Puzzle,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import {
  AGREEMENT_TYPE_INFO,
  SLA_LEVEL_INFO,
  type AgreementType,
  type SlaLevel,
} from "~/types/agreements";
import { formatMoney } from "~/types/common";
import { AddonSelector } from "./AddonSelector";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "installation",
    title: "Velg anlegg",
    description: "Velg installasjonen avtalen gjelder for",
    icon: <Building2 className="size-5" />,
  },
  {
    id: "agreement",
    title: "Avtaletype",
    description: "Velg type serviceavtale og SLA-nivå",
    icon: <FileText className="size-5" />,
  },
  {
    id: "addons",
    title: "Tilleggsprodukter",
    description: "Legg til ekstra tjenester",
    icon: <Puzzle className="size-5" />,
  },
  {
    id: "review",
    title: "Gjennomgang",
    description: "Bekreft avtaleopplysninger",
    icon: <ClipboardCheck className="size-5" />,
  },
];

interface SelectedAddon {
  addonId: string;
  quantity: number;
}

interface WizardData {
  installationId: string | null;
  agreementType: AgreementType | null;
  slaLevel: SlaLevel;
  startDate: string;
  autoRenew: boolean;
  addons: SelectedAddon[];
  notes: string;
}

export function AgreementWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    installationId: null,
    agreementType: null,
    slaLevel: "STANDARD",
    startDate: new Date().toISOString().split("T")[0]!,
    autoRenew: true,
    addons: [],
    notes: "",
  });

  // Fetch installations for selection
  const { data: installationsData, isLoading: loadingInstallations } =
    api.installations?.getAll?.useQuery?.({ limit: 100 }) ?? { data: undefined, isLoading: true };

  // Fetch addon products
  const { data: addonProducts } = api.agreements.getAddonProducts.useQuery();

  // Get the selected installation
  const selectedInstallation = useMemo(() => {
    if (!wizardData.installationId || !installationsData?.items) return null;
    return installationsData.items.find((i) => i.id === wizardData.installationId);
  }, [wizardData.installationId, installationsData?.items]);

  // Calculate price when we have all needed data
  const { data: priceCalculation, isLoading: calculatingPrice } =
    api.agreements.calculatePrice.useQuery(
      {
        agreementType: wizardData.agreementType!,
        slaLevel: wizardData.slaLevel,
        capacityKw: Number(selectedInstallation?.capacityKw ?? 0),
        systemType: (selectedInstallation?.systemType ?? "SOLAR_PANEL") as
          | "SOLAR_PANEL"
          | "BESS"
          | "COMBINED",
        addons: wizardData.addons,
      },
      {
        enabled:
          !!wizardData.agreementType &&
          !!selectedInstallation &&
          currentStep >= 2,
      }
    );

  // Create agreement mutation
  const createAgreement = api.agreements.create.useMutation({
    onSuccess: (agreement) => {
      router.push(`/agreements/${agreement.id}`);
    },
  });

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0:
        return !!wizardData.installationId;
      case 1:
        return !!wizardData.agreementType;
      case 2:
        return true; // Addons are optional
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, wizardData]);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    if (!wizardData.installationId || !wizardData.agreementType || !priceCalculation)
      return;

    await createAgreement.mutateAsync({
      installationId: wizardData.installationId,
      agreementType: wizardData.agreementType,
      startDate: new Date(wizardData.startDate),
      basePrice: priceCalculation.total,
      slaLevel: wizardData.slaLevel,
      autoRenew: wizardData.autoRenew,
      visitFrequency: AGREEMENT_TYPE_INFO[wizardData.agreementType].defaultFrequency,
      notes: wizardData.notes || undefined,
      addons: wizardData.addons.length > 0 ? wizardData.addons : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, index) => (
            <li key={step.id} className="relative flex-1">
              <div className="flex items-center">
                <div
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                    index < currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-muted text-muted-foreground"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="size-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2",
                      index < currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
              <div className="mt-2 hidden sm:block">
                <span
                  className={cn(
                    "text-sm font-medium",
                    index <= currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{WIZARD_STEPS[currentStep]?.title}</CardTitle>
          <CardDescription>
            {WIZARD_STEPS[currentStep]?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Select Installation */}
          {currentStep === 0 && (
            <InstallationStep
              installations={installationsData?.items ?? []}
              isLoading={loadingInstallations}
              selectedId={wizardData.installationId}
              onSelect={(id) => updateData({ installationId: id })}
            />
          )}

          {/* Step 2: Agreement Type */}
          {currentStep === 1 && (
            <AgreementTypeStep
              selectedType={wizardData.agreementType}
              slaLevel={wizardData.slaLevel}
              startDate={wizardData.startDate}
              autoRenew={wizardData.autoRenew}
              onUpdate={updateData}
            />
          )}

          {/* Step 3: Add-ons */}
          {currentStep === 2 && (
            <AddonSelector
              products={addonProducts ?? []}
              selectedAddons={wizardData.addons}
              onChange={(addons) => updateData({ addons })}
            />
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <ReviewStep
              wizardData={wizardData}
              installation={selectedInstallation}
              priceCalculation={priceCalculation}
              calculatingPrice={calculatingPrice}
              onNotesChange={(notes) => updateData({ notes })}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="size-4" />
          Tilbake
        </Button>

        {currentStep < WIZARD_STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed}>
            Neste
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createAgreement.isPending || !priceCalculation}
          >
            {createAgreement.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Oppretter...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Opprett avtale
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Step Components

interface InstallationStepProps {
  installations: Array<{
    id: string;
    address: string;
    city: string | null;
    systemType: string;
    capacityKw: unknown;
    customer: {
      name: string;
    };
  }>;
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function InstallationStep({
  installations,
  isLoading,
  selectedId,
  onSelect,
}: InstallationStepProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (installations.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="size-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Ingen installasjoner funnet. Opprett en installasjon først.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {installations.map((installation) => (
        <button
          key={installation.id}
          type="button"
          onClick={() => onSelect(installation.id)}
          className={cn(
            "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors hover:bg-accent",
            selectedId === installation.id
              ? "border-primary bg-primary/5"
              : "border-border"
          )}
        >
          <span className="font-medium">{installation.customer.name}</span>
          <span className="text-sm text-muted-foreground">
            {installation.address}, {installation.city}
          </span>
          <span className="mt-2 text-xs text-muted-foreground">
            {installation.systemType} • {String(installation.capacityKw)} kW
          </span>
        </button>
      ))}
    </div>
  );
}

interface AgreementTypeStepProps {
  selectedType: AgreementType | null;
  slaLevel: SlaLevel;
  startDate: string;
  autoRenew: boolean;
  onUpdate: (updates: Partial<WizardData>) => void;
}

function AgreementTypeStep({
  selectedType,
  slaLevel,
  startDate,
  autoRenew,
  onUpdate,
}: AgreementTypeStepProps) {
  const agreementTypes = Object.entries(AGREEMENT_TYPE_INFO) as [
    AgreementType,
    (typeof AGREEMENT_TYPE_INFO)[AgreementType]
  ][];

  return (
    <div className="space-y-6">
      {/* Agreement Type Selection */}
      <div className="space-y-3">
        <Label>Avtaletype</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          {agreementTypes.map(([type, info]) => (
            <button
              key={type}
              type="button"
              onClick={() => onUpdate({ agreementType: type })}
              className={cn(
                "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors hover:bg-accent",
                selectedType === type
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <span className="font-medium">{info.labelNo}</span>
              <span className="text-sm text-muted-foreground">
                {info.description}
              </span>
              <ul className="mt-2 text-xs text-muted-foreground">
                {info.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {/* SLA Level Selection */}
      <div className="space-y-3">
        <Label>SLA-nivå</Label>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.entries(SLA_LEVEL_INFO) as [SlaLevel, (typeof SLA_LEVEL_INFO)[SlaLevel]][]).map(
            ([level, info]) => (
              <button
                key={level}
                type="button"
                onClick={() => onUpdate({ slaLevel: level })}
                className={cn(
                  "flex flex-col items-start rounded-lg border-2 p-3 text-left transition-colors hover:bg-accent",
                  slaLevel === level
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <span className="font-medium">{info.labelNo}</span>
                <span className="text-xs text-muted-foreground">
                  {info.responseTime}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Start Date & Auto Renew */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Startdato</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => onUpdate({ startDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Automatisk fornyelse</Label>
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onUpdate({ autoRenew: true })}
              className={cn(
                "rounded-md border-2 px-4 py-2 text-sm transition-colors",
                autoRenew
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              )}
            >
              Ja
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ autoRenew: false })}
              className={cn(
                "rounded-md border-2 px-4 py-2 text-sm transition-colors",
                !autoRenew
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              )}
            >
              Nei
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReviewStepProps {
  wizardData: WizardData;
  installation: InstallationStepProps["installations"][0] | null | undefined;
  priceCalculation: {
    basePrice: number;
    slaMultiplier: number;
    capacityCharge: number;
    addonsTotal: number;
    subtotal: number;
    vatAmount: number;
    total: number;
    breakdown: Array<{ item: string; amount: number }>;
  } | undefined;
  calculatingPrice: boolean;
  onNotesChange: (notes: string) => void;
}

function ReviewStep({
  wizardData,
  installation,
  priceCalculation,
  calculatingPrice,
  onNotesChange,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">
            Anlegg
          </h4>
          <p className="font-medium">{installation?.customer.name}</p>
          <p className="text-sm text-muted-foreground">
            {installation?.address}, {installation?.city}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {installation?.systemType} • {String(installation?.capacityKw)} kW
          </p>
        </div>

        <div className="rounded-lg border border-border p-4">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">
            Avtale
          </h4>
          <p className="font-medium">
            {wizardData.agreementType &&
              AGREEMENT_TYPE_INFO[wizardData.agreementType].labelNo}
          </p>
          <p className="text-sm text-muted-foreground">
            SLA: {SLA_LEVEL_INFO[wizardData.slaLevel].labelNo}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Fra {wizardData.startDate} •{" "}
            {wizardData.autoRenew ? "Automatisk fornyelse" : "Ingen automatisk fornyelse"}
          </p>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="rounded-lg border border-border p-4">
        <h4 className="font-medium text-sm text-muted-foreground mb-4">
          Prisberegning
        </h4>
        {calculatingPrice ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : priceCalculation ? (
          <div className="space-y-2">
            {priceCalculation.breakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{item.item}</span>
                <span>
                  {formatMoney({ amount: item.amount, currency: "NOK" })}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {formatMoney({
                    amount: priceCalculation.subtotal,
                    currency: "NOK",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">MVA (25%)</span>
                <span>
                  {formatMoney({
                    amount: priceCalculation.vatAmount,
                    currency: "NOK",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold mt-2">
                <span>Total (årlig)</span>
                <span className="text-primary">
                  {formatMoney({
                    amount: priceCalculation.total,
                    currency: "NOK",
                  })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Velg avtaletype for å se prisberegning
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notater (valgfritt)</Label>
        <textarea
          id="notes"
          value={wizardData.notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-24"
          placeholder="Legg til eventuelle notater om avtalen..."
        />
      </div>
    </div>
  );
}
