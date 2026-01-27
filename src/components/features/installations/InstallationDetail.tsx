"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Edit,
  MapPin,
  Phone,
  Mail,
  Building2,
  Zap,
  Battery,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { StatusBadge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import {
  AGREEMENT_TYPE_INFO,
  AGREEMENT_STATUS_INFO,
  type AgreementStatus,
} from "~/types/agreements";
import { formatDate } from "~/types/common";

interface InstallationDetailProps {
  installationId: string;
}

const SYSTEM_TYPE_INFO: Record<
  string,
  { label: string; icon: React.ReactNode; description: string }
> = {
  SOLAR_PANEL: {
    label: "Solcelleanlegg",
    icon: <Zap className="size-5" />,
    description: "Solceller for strømproduksjon",
  },
  BESS: {
    label: "Batterisystem",
    icon: <Battery className="size-5" />,
    description: "Batterilagring (BESS)",
  },
  COMBINED: {
    label: "Kombinert system",
    icon: <Building2 className="size-5" />,
    description: "Solceller med batterilagring",
  },
};

export function InstallationDetail({ installationId }: InstallationDetailProps) {
  const router = useRouter();

  const { data: installation, isLoading } =
    api.installations.getById.useQuery(installationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!installation) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Anlegget ble ikke funnet</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/installations">Tilbake til anlegg</Link>
        </Button>
      </div>
    );
  }

  const customer = installation.customer;
  const systemInfo = SYSTEM_TYPE_INFO[installation.systemType];
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {systemInfo?.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <p className="text-muted-foreground">
                {installation.address}
                {installation.city && `, ${installation.city}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/installations/${installationId}/edit`}>
              <Edit className="size-4" />
              Rediger
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/agreements/new?installationId=${installationId}`}>
              <Plus className="size-4" />
              Ny avtale
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Systeminformasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Systemtype</dt>
                  <dd className="font-medium flex items-center gap-2">
                    {systemInfo?.icon}
                    {systemInfo?.label}
                  </dd>
                  <dd className="text-sm text-muted-foreground">
                    {systemInfo?.description}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Kapasitet</dt>
                  <dd className="font-medium">
                    {String(installation.capacityKw)} kW
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Installasjonsdato
                  </dt>
                  <dd className="font-medium">
                    {formatDate(installation.installDate)}
                  </dd>
                </div>
                {installation.panelCount && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Paneler</dt>
                    <dd className="font-medium">
                      {installation.panelCount} stk
                      {installation.panelType && ` (${installation.panelType})`}
                    </dd>
                  </div>
                )}
                {installation.inverterType && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Inverter</dt>
                    <dd className="font-medium">{installation.inverterType}</dd>
                    {installation.inverterSerial && (
                      <dd className="text-sm text-muted-foreground">
                        S/N: {installation.inverterSerial}
                      </dd>
                    )}
                  </div>
                )}
                {installation.batteryKwh && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Batteri</dt>
                    <dd className="font-medium">
                      {String(installation.batteryKwh)} kWh
                      {installation.batteryType &&
                        ` (${installation.batteryType})`}
                    </dd>
                  </div>
                )}
              </dl>

              {installation.monitoringUrl && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={installation.monitoringUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" />
                      Åpne overvåkning
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kundeinformasjon</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="font-medium">{customer.name}</span>
                </div>
                {customer.orgNumber && (
                  <div className="text-sm text-muted-foreground pl-6">
                    Org.nr: {customer.orgNumber}
                  </div>
                )}
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

              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{installation.address}</p>
                    {installation.postalCode && installation.city && (
                      <p className="text-muted-foreground">
                        {installation.postalCode} {installation.city}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agreements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Serviceavtaler</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/agreements/new?installationId=${installationId}`}>
                  <Plus className="size-4" />
                  Ny avtale
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {installation.agreements && installation.agreements.length > 0 ? (
                <ul className="divide-y divide-border">
                  {installation.agreements.map((agreement) => (
                    <li key={agreement.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        href={`/agreements/${agreement.id}`}
                        className="flex items-center justify-between hover:bg-accent/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {agreement.agreementNumber}
                            </span>
                            <StatusBadge status={statusMap[agreement.status]}>
                              {AGREEMENT_STATUS_INFO[agreement.status].labelNo}
                            </StatusBadge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {AGREEMENT_TYPE_INFO[agreement.agreementType].labelNo}{" "}
                            • {agreement._count?.visits ?? 0} besøk
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(agreement.startDate)}
                          {agreement.endDate &&
                            ` – ${formatDate(agreement.endDate)}`}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <FileText className="size-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm mb-3">
                    Ingen serviceavtaler
                  </p>
                  <Button size="sm" asChild>
                    <Link
                      href={`/agreements/new?installationId=${installationId}`}
                    >
                      <Plus className="size-4" />
                      Opprett avtale
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Oversikt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Aktive avtaler
                </span>
                <span className="font-medium">
                  {
                    installation.agreements?.filter(
                      (a) => a.status === "ACTIVE"
                    ).length
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Totalt besøk
                </span>
                <span className="font-medium">
                  {installation.agreements?.reduce(
                    (sum, a) => sum + (a._count?.visits ?? 0),
                    0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alder</span>
                <span className="font-medium">
                  {Math.floor(
                    (Date.now() - new Date(installation.installDate).getTime()) /
                      (1000 * 60 * 60 * 24 * 365)
                  )}{" "}
                  år
                </span>
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
                <Link href={`/planning?installationId=${installationId}`}>
                  <Calendar className="size-4" />
                  Planlegg servicebesøk
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/visits?installationId=${installationId}`}>
                  <FileText className="size-4" />
                  Se servicehistorikk
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          {installation.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notater</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {installation.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
