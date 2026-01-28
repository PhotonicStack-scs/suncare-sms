"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Play,
  CheckCircle,
  Clock,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { StatusBadge } from "~/components/ui/badge";
import { SkeletonTable } from "~/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";
import { formatDate } from "~/types/common";
import { cn } from "~/lib/utils";

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
  QUARTERLY: "Kvartalsvis",
  EMERGENCY: "Akutt",
  REPAIR: "Reparasjon",
  INSTALLATION: "Installasjon",
};

interface VisitListProps {
  className?: string;
  agreementId?: string;
  installationId?: string;
}

export function VisitList({ className, agreementId }: VisitListProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<VisitStatus[]>([]);

  const { data, isLoading } = api.visit.getAll.useQuery({
    status: statusFilter.length === 1 ? statusFilter[0] : undefined,
    agreementId,
    limit: 50,
  });

  // Fetch technicians from @energismart/shared via dashboard router
  const { data: technicians } = api.dashboard.getTechnicians.useQuery();

  const startVisit = api.visit.start.useMutation({
    onSuccess: () => {
      // Refetch handled by React Query
    },
  });

  const completeVisit = api.visit.complete.useMutation({
    onSuccess: () => {
      // Refetch handled by React Query
    },
  });

  const visits = data?.items ?? [];

  // Create a map for quick technician lookup
  const technicianMap = useMemo(() => {
    const map = new Map<string, string>();
    if (technicians) {
      for (const tech of technicians) {
        map.set(tech.id, tech.name);
      }
    }
    return map;
  }, [technicians]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "scheduled";
      case "IN_PROGRESS":
        return "in-progress";
      case "COMPLETED":
        return "completed";
      case "CANCELLED":
        return "cancelled";
      case "BLOCKED":
        return "blocked";
      default:
        return "scheduled";
    }
  };

  const getTechnicianName = (technicianId: string) => {
    return technicianMap.get(technicianId) ?? "Ukjent tekniker";
  };

  const toggleStatusFilter = (status: VisitStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Status filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(["SCHEDULED", "IN_PROGRESS", "COMPLETED"] as VisitStatus[]).map(
              (status) => (
                <Button
                  key={status}
                  variant={statusFilter.includes(status) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleStatusFilter(status)}
                >
                  {STATUS_LABELS[status]}
                </Button>
              )
            )}
          </div>
        </div>

        <Button onClick={() => router.push("/planning")}>
          <Calendar className="size-4" />
          Planlegg besøk
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={7} />
      ) : visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Ingen besøk funnet</p>
          <Button onClick={() => router.push("/planning")}>
            <Calendar className="size-4" />
            Planlegg første besøk
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kunde</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tekniker</TableHead>
                <TableHead>Dato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((visit) => (
                <TableRow
                  key={visit.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/visits/${visit.id}`)}
                >
                  <TableCell className="font-medium">
                    {visit.agreement.installation.customer.name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {visit.agreement.installation.address}
                      {visit.agreement.installation.city && (
                        <span className="text-muted-foreground">
                          , {visit.agreement.installation.city}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {VISIT_TYPE_LABELS[visit.visitType] ?? visit.visitType}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="text-sm">
                        {getTechnicianName(visit.technicianId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(visit.scheduledDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={getStatusBadgeVariant(visit.status)}>
                      {STATUS_LABELS[visit.status as VisitStatus] ?? visit.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => router.push(`/visits/${visit.id}`)}
                        >
                          <Eye className="size-4 mr-2" />
                          Vis detaljer
                        </DropdownMenuItem>
                        {visit.status === "SCHEDULED" && (
                          <DropdownMenuItem
                            onSelect={() => startVisit.mutate(visit.id)}
                          >
                            <Play className="size-4 mr-2" />
                            Start besøk
                          </DropdownMenuItem>
                        )}
                        {visit.status === "IN_PROGRESS" && (
                          <DropdownMenuItem
                            onSelect={() =>
                              completeVisit.mutate({ id: visit.id })
                            }
                          >
                            <CheckCircle className="size-4 mr-2" />
                            Fullfør besøk
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination info */}
      {data && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Viser {visits.length} av {data.total} besøk
          </span>
        </div>
      )}
    </div>
  );
}
