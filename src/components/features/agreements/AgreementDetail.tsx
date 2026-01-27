"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Edit,
  FileText,
  MapPin,
  Phone,
  Mail,
  Building2,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Play,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { StatusBadge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import {
  AGREEMENT_TYPE_INFO,
  AGREEMENT_STATUS_INFO,
  SLA_LEVEL_INFO,
  type AgreementStatus,
  type ServiceAgreementWithRelations,
} from "~/types/agreements";
import { formatMoney, formatDate } from "~/types/common";
import { cn } from "~/lib/utils";

interface AgreementDetailProps {
  agreementId: string;
}

export function AgreementDetail({ agreementId }: AgreementDetailProps) {
  const router = useRouter();
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    data: agreement,
    isLoading,
    refetch,
  } = api.agreements.getById.useQuery(agreementId);

  const activateMutation = api.agreements.activate.useMutation({
    onSuccess: () => {
      refetch();
      setShowActivateDialog(false);
    },
  });

  const cancelMutation = api.agreements.cancel.useMutation({
    onSuccess: () => {
      refetch();
      setShowCancelDialog(false);
    },
  });

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
        <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Avtalen ble ikke funnet</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/agreements">Tilbake til avtaler</Link>
        </Button>
      </div>
    );
  }

  const statusMap: Record<
    AgreementStatus,
    "scheduled" | "inProgress" | "completed" | "blocked" | "pending"
  > = {
    DRAFT: "pending",
    PENDING_RENEWAL: "pending",
    ACTIVE: "completed",
    EXPIRED: "blocked",
    CANCELLED: "blocked",
  };

  const installation = agreement.installation;
  const customer = installation.customer;
  const typeInfo = AGREEMENT_TYPE_INFO[agreement.agreementType];
  const statusInfo = AGREEMENT_STATUS_INFO[agreement.status];
  const slaInfo = SLA_LEVEL_INFO[agreement.slaLevel];

  const totalAddonsPrice =
    agreement.addons?.reduce((sum, addon) => {
      const price = addon.customPrice ?? addon.addon.basePrice;
      return sum + Number(price) * addon.quantity;
    }, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{agreement.agreementNumber}</h1>
            <StatusBadge status={statusMap[agreement.status]}>
              {statusInfo.labelNo}
            </StatusBadge>
          </div>
          <p className="text-muted-foreground mt-1">
            {typeInfo.labelNo} avtale • {customer.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/agreements/${agreementId}/edit`}>
              <Edit className="size-4" />
              Rediger
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {agreement.status === "DRAFT" && (
                <DropdownMenuItem onSelect={() => setShowActivateDialog(true)}>
                  <Play className="size-4 mr-2" />
                  Aktiver avtale
                </DropdownMenuItem>
              )}
              {agreement.status === "ACTIVE" && (
                <DropdownMenuItem>
                  <RefreshCw className="size-4 mr-2" />
                  Forny avtale
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {agreement.status !== "CANCELLED" && (
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => setShowCancelDialog(true)}
                >
                  <XCircle className="size-4 mr-2" />
                  Kanseller avtale
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Installation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kunde og anlegg</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {/* Customer Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="font-medium">{customer.name}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4" />
                    <a
                      href={`mailto:${customer.email}`}
                      className="hover:underline"
                    >
                      {customer.email}
                    </a>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />
                    <a href={`tel:${customer.phone}`} className="hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Installation Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>
                    {installation.address}
                    {installation.city && `, ${installation.city}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="size-4" />
                  <span>
                    {installation.systemType} • {String(installation.capacityKw)}{" "}
                    kW
                  </span>
                </div>
                <Button variant="link" className="h-auto p-0 text-sm" asChild>
                  <Link href={`/installations/${installation.id}`}>
                    Se anleggsdetaljer →
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agreement Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avtaledetaljer</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Avtaletype</dt>
                  <dd className="font-medium">{typeInfo.labelNo}</dd>
                  <dd className="text-sm text-muted-foreground">
                    {typeInfo.description}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">SLA-nivå</dt>
                  <dd className="font-medium">{slaInfo.labelNo}</dd>
                  <dd className="text-sm text-muted-foreground">
                    Responstid: {slaInfo.responseTime}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Periode</dt>
                  <dd className="font-medium">
                    {formatDate(agreement.startDate)}
                    {agreement.endDate && ` – ${formatDate(agreement.endDate)}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Besøksfrekvens
                  </dt>
                  <dd className="font-medium">
                    {agreement.visitFrequency}x per år
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Automatisk fornyelse
                  </dt>
                  <dd className="font-medium">
                    {agreement.autoRenew ? "Ja" : "Nei"}
                  </dd>
                </div>
                {agreement.signedAt && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Signert</dt>
                    <dd className="font-medium">
                      {formatDate(agreement.signedAt)}
                    </dd>
                  </div>
                )}
              </dl>

              {agreement.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <dt className="text-sm text-muted-foreground mb-1">Notater</dt>
                  <dd className="text-sm">{agreement.notes}</dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add-ons */}
          {agreement.addons && agreement.addons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tilleggsprodukter</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {agreement.addons.map((addon) => (
                    <li
                      key={addon.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <span className="font-medium">{addon.addon.name}</span>
                        {addon.quantity > 1 && (
                          <span className="text-muted-foreground">
                            {" "}
                            × {addon.quantity}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {formatMoney({
                          amount:
                            Number(addon.customPrice ?? addon.addon.basePrice) *
                            addon.quantity,
                          currency: "NOK",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Service History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Servicehistorikk</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/visits?agreementId=${agreementId}`}>
                  Se alle besøk
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {agreement.visits && agreement.visits.length > 0 ? (
                <ul className="divide-y divide-border">
                  {agreement.visits.slice(0, 5).map((visit) => (
                    <li key={visit.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        href={`/visits/${visit.id}`}
                        className="flex items-center justify-between hover:bg-accent/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "size-8 rounded-full flex items-center justify-center",
                              visit.status === "COMPLETED"
                                ? "bg-success/15 text-success"
                                : visit.status === "SCHEDULED"
                                  ? "bg-info/15 text-info"
                                  : "bg-muted"
                            )}
                          >
                            {visit.status === "COMPLETED" ? (
                              <CheckCircle2 className="size-4" />
                            ) : (
                              <Clock className="size-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {visit.visitType}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(visit.scheduledDate)}
                            </p>
                          </div>
                        </div>
                        <StatusBadge
                          status={
                            visit.status === "COMPLETED"
                              ? "completed"
                              : visit.status === "SCHEDULED"
                                ? "scheduled"
                                : "pending"
                          }
                        >
                          {visit.status}
                        </StatusBadge>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Ingen servicebesøk registrert
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Price & Quick Actions */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pris</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Grunnpris</span>
                <span>
                  {formatMoney({
                    amount: Number(agreement.basePrice) - totalAddonsPrice,
                    currency: "NOK",
                  })}
                </span>
              </div>
              {totalAddonsPrice > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tillegg</span>
                  <span>
                    {formatMoney({
                      amount: totalAddonsPrice,
                      currency: "NOK",
                    })}
                  </span>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total (årlig)</span>
                  <span className="text-lg text-primary">
                    {formatMoney({
                      amount: Number(agreement.basePrice),
                      currency: "NOK",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hurtighandlinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/planning?agreementId=${agreementId}`}>
                  <Calendar className="size-4" />
                  Planlegg servicebesøk
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/invoices?agreementId=${agreementId}`}>
                  <FileText className="size-4" />
                  Se fakturaer
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activate Dialog */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktiver avtale</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil aktivere denne avtalen? Avtalen vil bli
              gjeldende fra startdatoen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActivateDialog(false)}
            >
              Avbryt
            </Button>
            <Button
              onClick={() => activateMutation.mutate(agreementId)}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Aktiver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kanseller avtale</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil kansellere denne avtalen? Dette kan ikke
              angres.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate({ id: agreementId })}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Kanseller avtale"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
