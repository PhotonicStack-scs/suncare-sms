"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ClipboardList,
  Building2,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { StatusBadge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { formatDate } from "~/types/common";
import { VisitStatusFlow } from "./VisitStatusFlow";

type VisitStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "BLOCKED";

const STATUS_LABELS: Record<VisitStatus, string> = {
  SCHEDULED: "Planlagt",
  IN_PROGRESS: "Pågår",
  COMPLETED: "Fullført",
  CANCELLED: "Kansellert",
  BLOCKED: "Blokkert",
};

const VISIT_TYPE_LABELS: Record<string, string> = {
  ANNUAL_INSPECTION: "Årlig inspeksjon",
  SEMI_ANNUAL: "Halvårlig service",
  QUARTERLY: "Kvartalsvis service",
  EMERGENCY: "Akutt/Nødsituasjon",
  REPAIR: "Reparasjon",
  INSTALLATION: "Installasjon",
};

interface VisitDetailProps {
  visitId: string;
}

export function VisitDetail({ visitId }: VisitDetailProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: visit, isLoading, refetch } = api.visit.getById.useQuery(visitId);
  
  // Fetch technician from @energismart/shared via dashboard router
  const { data: technician } = api.dashboard.getTechnicianById.useQuery(
    visit?.technicianId ?? "",
    { enabled: !!visit?.technicianId }
  );

  const startMutation = api.visit.start.useMutation({
    onSuccess: () => refetch(),
  });

  const completeMutation = api.visit.complete.useMutation({
    onSuccess: () => refetch(),
  });

  const cancelMutation = api.visit.cancel.useMutation({
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

  if (!visit) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Besøket ble ikke funnet</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/visits">Tilbake til besøk</Link>
        </Button>
      </div>
    );
  }

  const installation = visit.agreement.installation;
  const customer = installation.customer;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "scheduled";
      case "IN_PROGRESS":
        return "inProgress";
      case "COMPLETED":
        return "completed";
      case "CANCELLED":
      case "BLOCKED":
        return "blocked";
      default:
        return "pending";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <StatusBadge status={getStatusBadgeVariant(visit.status)}>
              {STATUS_LABELS[visit.status as VisitStatus] ?? visit.status}
            </StatusBadge>
          </div>
          <p className="text-muted-foreground mt-1">
            {VISIT_TYPE_LABELS[visit.visitType] ?? visit.visitType} •{" "}
            {formatDate(visit.scheduledDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {visit.status === "SCHEDULED" && (
            <Button
              onClick={() => startMutation.mutate(visitId)}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Start besøk
            </Button>
          )}
          {visit.status === "IN_PROGRESS" && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/visits/${visitId}/checklist`}>
                  <ClipboardList className="size-4" />
                  Åpne sjekkliste
                </Link>
              </Button>
              <Button
                onClick={() => completeMutation.mutate({ id: visitId })}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle className="size-4" />
                )}
                Fullfør besøk
              </Button>
            </>
          )}
          {visit.status !== "CANCELLED" && visit.status !== "COMPLETED" && (
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="size-4" />
              Avbryt
            </Button>
          )}
        </div>
      </div>

      {/* Status Flow */}
      <Card>
        <CardContent className="py-6">
          <VisitStatusFlow currentStatus={visit.status as VisitStatus} />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visit Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Besøksdetaljer</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Type</dt>
                  <dd className="font-medium">
                    {VISIT_TYPE_LABELS[visit.visitType] ?? visit.visitType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Planlagt dato
                  </dt>
                  <dd className="font-medium flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    {formatDate(visit.scheduledDate)}
                  </dd>
                </div>
                {visit.actualStartDate && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Startet</dt>
                    <dd className="font-medium">
                      {formatDate(visit.actualStartDate)}
                    </dd>
                  </div>
                )}
                {visit.actualEndDate && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Fullført</dt>
                    <dd className="font-medium">
                      {formatDate(visit.actualEndDate)}
                    </dd>
                  </div>
                )}
                {visit.durationMinutes && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Varighet</dt>
                    <dd className="font-medium flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      {visit.durationMinutes} minutter
                    </dd>
                  </div>
                )}
              </dl>

              {visit.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <dt className="text-sm text-muted-foreground mb-1">Notater</dt>
                  <dd className="text-sm">{visit.notes}</dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kunde og lokasjon</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {/* Customer */}
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
                    <a
                      href={`tel:${customer.phone}`}
                      className="hover:underline"
                    >
                      {customer.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{installation.address}</p>
                    {installation.city && (
                      <p className="text-muted-foreground">
                        {installation.postalCode} {installation.city}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${installation.address}, ${installation.city}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="size-4" />
                    Åpne i kart
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Checklists */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Sjekklister</CardTitle>
              {visit.status === "IN_PROGRESS" && (
                <Button size="sm" asChild>
                  <Link href={`/visits/${visitId}/checklist`}>
                    <ClipboardList className="size-4" />
                    Åpne sjekkliste
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {visit.checklists && visit.checklists.length > 0 ? (
                <ul className="divide-y divide-border">
                  {visit.checklists.map((checklist) => (
                    <li
                      key={checklist.id}
                      className="py-3 first:pt-0 last:pb-0"
                    >
                      <Link
                        href={`/visits/${visitId}/checklist`}
                        className="flex items-center justify-between hover:bg-accent/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {checklist.template?.name ?? "Sjekkliste"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {checklist.items?.length ?? 0} punkter
                          </p>
                        </div>
                        <StatusBadge
                          status={
                            checklist.status === "COMPLETED"
                              ? "completed"
                              : checklist.status === "IN_PROGRESS"
                                ? "inProgress"
                                : "pending"
                          }
                        >
                          {checklist.status === "COMPLETED"
                            ? "Fullført"
                            : checklist.status === "IN_PROGRESS"
                              ? "Pågår"
                              : "Ikke startet"}
                        </StatusBadge>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Ingen sjekklister opprettet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          {visit.photos && visit.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bilder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {visit.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg bg-muted overflow-hidden"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption ?? "Besøksbilde"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Technician */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tekniker</CardTitle>
            </CardHeader>
            <CardContent>
              {technician ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {technician.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-medium">{technician.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {technician.email}
                      </p>
                    </div>
                  </div>
                  {technician.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      <a
                        href={`tel:${technician.phone}`}
                        className="hover:underline"
                      >
                        {technician.phone}
                      </a>
                    </div>
                  )}
                  {technician.certifications && technician.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {technician.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="text-xs bg-muted px-2 py-1 rounded"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Ingen tekniker tildelt
                </p>
              )}
            </CardContent>
          </Card>

          {/* Agreement Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avtale</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/agreements/${visit.agreement.id}`}
                className="block rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
              >
                <p className="font-medium text-sm">
                  {visit.agreement.agreementNumber}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {visit.agreement.agreementType} avtale
                </p>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hurtighandlinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/installations/${installation.id}`}>
                  <Building2 className="size-4" />
                  Se anlegg
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/agreements/${visit.agreement.id}`}>
                  <FileText className="size-4" />
                  Se avtale
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avbryt besøk</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil avbryte dette besøket? Dette kan ikke
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
              onClick={() => cancelMutation.mutate({ id: visitId })}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Bekreft avbryt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
