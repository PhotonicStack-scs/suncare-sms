"use client";

import { Calendar, MapPin, FileText, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { StatusBadge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  agreementTypeLabels,
  getAgreementStatusColor,
  type ServiceAgreementWithRelations,
} from "~/types/agreements";
import { formatMoney, formatDate } from "~/types/common";
import { systemTypeLabels } from "~/types/installations";

interface AgreementCardProps {
  agreement: ServiceAgreementWithRelations;
  onClick?: () => void;
  className?: string;
}

export function AgreementCard({
  agreement,
  onClick,
  className,
}: AgreementCardProps) {
  const installation = agreement.installation;
  const customer = installation.customer;

  const statusMap: Record<string, "scheduled" | "inProgress" | "completed" | "blocked" | "pending"> = {
    DRAFT: "pending",
    PENDING_APPROVAL: "pending",
    ACTIVE: "completed",
    SUSPENDED: "blocked",
    EXPIRED: "blocked",
    CANCELLED: "blocked",
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {customer.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {agreement.agreementNumber}
            </p>
          </div>
          <StatusBadge status={statusMap[agreement.status] ?? "pending"}>
            {agreement.status === "ACTIVE" ? "Aktiv" : 
             agreement.status === "DRAFT" ? "Utkast" :
             agreement.status === "PENDING_APPROVAL" ? "Venter" :
             agreement.status === "CANCELLED" ? "Kansellert" :
             agreement.status === "EXPIRED" ? "Utløpt" : "Suspendert"}
          </StatusBadge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Agreement type */}
        <div className="flex items-center gap-2 text-sm">
          <FileText className="size-4 text-muted-foreground" />
          <span className="font-medium">
            {agreementTypeLabels[agreement.agreementType]}
          </span>
          <span className="text-muted-foreground">
            • {agreement.visitFrequency}x/år
          </span>
        </div>

        {/* Installation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="size-4" />
          <span>
            {systemTypeLabels[installation.systemType as keyof typeof systemTypeLabels]} 
            {" "}• {Number(installation.capacityKw).toFixed(1)} kW
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          <span>{installation.address}, {installation.city}</span>
        </div>

        {/* Dates and price */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>
              {formatDate(agreement.startDate)}
              {agreement.endDate && ` - ${formatDate(agreement.endDate)}`}
            </span>
          </div>
          <span className="text-sm font-semibold">
            {formatMoney({
              amount: Number(agreement.calculatedPrice ?? agreement.basePrice),
              currency: "NOK",
            })}
            <span className="font-normal text-muted-foreground">/år</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact preview card for dashboard
interface AgreementPreviewCardProps {
  agreement: ServiceAgreementWithRelations;
  className?: string;
}

export function AgreementPreviewCard({
  agreement,
  className,
}: AgreementPreviewCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-4",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-primary uppercase tracking-wide">
          Featured Agreement
        </span>
        <span className="text-xs text-muted-foreground">
          {agreement.agreementNumber}
        </span>
      </div>

      <h3 className="font-semibold text-lg mb-1">
        {agreement.installation.customer.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {agreementTypeLabels[agreement.agreementType]} •{" "}
        {agreement.visitFrequency} besøk/år
      </p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">
            {formatMoney({
              amount: Number(agreement.calculatedPrice ?? agreement.basePrice),
              currency: "NOK",
            })}
          </p>
          <p className="text-xs text-muted-foreground">Årlig verdi</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {agreement.endDate
              ? formatDate(agreement.endDate)
              : "Løpende"}
          </p>
          <p className="text-xs text-muted-foreground">Utløpsdato</p>
        </div>
      </div>
    </div>
  );
}
