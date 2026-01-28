"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import {
  AGREEMENT_TYPE_INFO,
  AGREEMENT_STATUS_INFO,
  SLA_LEVEL_INFO,
  type AgreementType,
  type AgreementStatus,
  type SlaLevel,
} from "~/types/agreements";
import { cn } from "~/lib/utils";

interface EditAgreementPageProps {
  params: Promise<{ id: string }>;
}

export default function EditAgreementPage({ params }: EditAgreementPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: agreement, isLoading } = api.agreements.getById.useQuery(id);

  const [formData, setFormData] = useState<{
    agreementType?: AgreementType;
    status?: AgreementStatus;
    slaLevel?: SlaLevel;
    startDate?: string;
    endDate?: string;
    autoRenew?: boolean;
    visitFrequency?: number;
    notes?: string;
  }>({});

  const updateMutation = api.agreements.update.useMutation({
    onSuccess: () => {
      router.push(`/agreements/${id}`);
    },
  });

  // Initialize form data when agreement loads
  if (agreement && Object.keys(formData).length === 0) {
    setFormData({
      agreementType: agreement.agreementType,
      status: agreement.status,
      slaLevel: agreement.slaLevel,
      startDate: agreement.startDate.toISOString().split("T")[0],
      endDate: agreement.endDate?.toISOString().split("T")[0] ?? "",
      autoRenew: agreement.autoRenew,
      visitFrequency: agreement.visitFrequency,
      notes: agreement.notes ?? "",
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id,
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
      notes: formData.notes ?? null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Avtalen ble ikke funnet</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/agreements">Tilbake til avtaler</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/agreements/${id}`}>
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Rediger avtale</h1>
          <p className="text-muted-foreground">
            {agreement.agreementNumber} • {agreement.installation.customer.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Agreement Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avtaletype</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                Object.entries(AGREEMENT_TYPE_INFO) as [
                  AgreementType,
                  (typeof AGREEMENT_TYPE_INFO)[AgreementType]
                ][]
              ).map(([type, info]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, agreementType: type }))
                  }
                  className={cn(
                    "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors hover:bg-accent",
                    formData.agreementType === type
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <span className="font-medium">{info.labelNo}</span>
                  <span className="text-sm text-muted-foreground">
                    {info.description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(
                Object.entries(AGREEMENT_STATUS_INFO) as [
                  AgreementStatus,
                  (typeof AGREEMENT_STATUS_INFO)[AgreementStatus]
                ][]
              ).map(([status, info]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, status }))
                  }
                  className={cn(
                    "rounded-md border-2 px-4 py-2 text-sm transition-colors",
                    formData.status === status
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {info.labelNo}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SLA Level */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SLA-nivå</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                Object.entries(SLA_LEVEL_INFO) as [
                  SlaLevel,
                  (typeof SLA_LEVEL_INFO)[SlaLevel]
                ][]
              ).map(([level, info]) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, slaLevel: level }))
                  }
                  className={cn(
                    "flex flex-col items-start rounded-lg border-2 p-3 text-left transition-colors hover:bg-accent",
                    formData.slaLevel === level
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <span className="font-medium">{info.labelNo}</span>
                  <span className="text-xs text-muted-foreground">
                    {info.responseTime}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dates & Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datoer og innstillinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Startdato</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Sluttdato</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitFrequency">Besøk per år</Label>
                <Input
                  id="visitFrequency"
                  type="number"
                  min={1}
                  max={12}
                  value={formData.visitFrequency ?? 1}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      visitFrequency: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Automatisk fornyelse</Label>
                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, autoRenew: true }))
                    }
                    className={cn(
                      "rounded-md border-2 px-4 py-2 text-sm transition-colors",
                      formData.autoRenew
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    )}
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, autoRenew: false }))
                    }
                    className={cn(
                      "rounded-md border-2 px-4 py-2 text-sm transition-colors",
                      !formData.autoRenew
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    )}
                  >
                    Nei
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notater</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.notes ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-24"
              placeholder="Legg til eventuelle notater..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href={`/agreements/${id}`}>Avbryt</Link>
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Lagre endringer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
