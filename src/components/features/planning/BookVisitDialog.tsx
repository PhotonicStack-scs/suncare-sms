"use client";

import { useState } from "react";
import { Loader2, Calendar, Clock, MapPin, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

interface BookVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  selectedTechnicianId?: string;
  onSuccess?: () => void;
}

const VISIT_TYPES = [
  { value: "ANNUAL_INSPECTION", label: "Årlig inspeksjon", duration: 120 },
  { value: "SEMI_ANNUAL", label: "Halvårlig service", duration: 90 },
  { value: "QUARTERLY", label: "Kvartalsvis service", duration: 60 },
  { value: "EMERGENCY", label: "Akutt/Nødsituasjon", duration: 120 },
  { value: "REPAIR", label: "Reparasjon", duration: 120 },
] as const;

export function BookVisitDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedTechnicianId,
  onSuccess,
}: BookVisitDialogProps) {
  const [formData, setFormData] = useState({
    agreementId: "",
    technicianId: selectedTechnicianId ?? "",
    scheduledDate: selectedDate,
    scheduledTime: "09:00",
    visitType: "ANNUAL_INSPECTION" as (typeof VISIT_TYPES)[number]["value"],
    notes: "",
  });

  // Fetch agreements for selection
  const { data: agreementsData, isLoading: loadingAgreements } =
    api.agreements.getAll.useQuery({ status: "ACTIVE", limit: 100 });

  const createVisit = api.visit.create.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedType = VISIT_TYPES.find((t) => t.value === formData.visitType);
    const scheduledDateTime = new Date(
      `${formData.scheduledDate}T${formData.scheduledTime}:00`
    );

    createVisit.mutate({
      agreementId: formData.agreementId,
      technicianId: formData.technicianId,
      scheduledDate: scheduledDateTime,
      visitType: formData.visitType,
      notes: formData.notes || undefined,
    });
  };

  const selectedType = VISIT_TYPES.find((t) => t.value === formData.visitType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Planlegg servicebesøk</DialogTitle>
          <DialogDescription>
            Opprett et nytt servicebesøk for {selectedDate}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Agreement Selection */}
          <div className="space-y-2">
            <Label htmlFor="agreement">Serviceavtale</Label>
            {loadingAgreements ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <select
                id="agreement"
                value={formData.agreementId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, agreementId: e.target.value }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Velg avtale...</option>
                {agreementsData?.items.map((agreement) => (
                  <option key={agreement.id} value={agreement.id}>
                    {agreement.installation.customer.name} -{" "}
                    {agreement.agreementNumber}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">
                <Calendar className="size-4 inline mr-1" />
                Dato
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduledDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">
                <Clock className="size-4 inline mr-1" />
                Tidspunkt
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduledTime: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          {/* Visit Type */}
          <div className="space-y-2">
            <Label>Type besøk</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {VISIT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, visitType: type.value }))
                  }
                  className={cn(
                    "flex flex-col items-start rounded-lg border-2 p-3 text-left transition-colors hover:bg-accent",
                    formData.visitType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ~{type.duration} min
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Duration */}
          {selectedType && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span>
                  Estimert varighet: <strong>{selectedType.duration} minutter</strong>
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notater (valgfritt)</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-20"
              placeholder="Eventuelle instruksjoner eller notater..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={!formData.agreementId || createVisit.isPending}
            >
              {createVisit.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Oppretter...
                </>
              ) : (
                "Opprett besøk"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
