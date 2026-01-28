"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MoreHorizontal, Eye, Edit, X } from "lucide-react";
import { Input } from "~/components/ui/input";
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
import {
  agreementTypeLabels,
  agreementStatusLabels,
  type AgreementStatus,
} from "~/types/agreements";
import { formatMoney, formatDate } from "~/types/common";
import { cn } from "~/lib/utils";

interface AgreementListProps {
  className?: string;
}

export function AgreementList({ className }: AgreementListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgreementStatus[]>([]);

  const { data, isLoading } = api.agreements.getAll.useQuery({
    search: search || undefined,
    status: statusFilter.length === 1 ? statusFilter[0] : undefined,
    limit: 50,
  });

  const agreements = data?.items ?? [];

  const statusMap: Record<AgreementStatus, "scheduled" | "in-progress" | "completed" | "blocked" | "cancelled"> = {
    DRAFT: "scheduled",
    PENDING_RENEWAL: "in-progress",
    ACTIVE: "completed",
    EXPIRED: "blocked",
    CANCELLED: "cancelled",
  };

  const toggleStatusFilter = (status: AgreementStatus) => {
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
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Søk i avtaler..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status filters */}
          <div className="hidden items-center gap-1 md:flex">
            {(["ACTIVE", "DRAFT", "EXPIRED"] as AgreementStatus[]).map((status) => (
              <Button
                key={status}
                variant={statusFilter.includes(status) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleStatusFilter(status)}
              >
                {agreementStatusLabels[status]}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={() => router.push("/agreements/new")}>
          <Plus className="size-4" />
          Ny avtale
        </Button>
      </div>

      {/* Active filters */}
      {statusFilter.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtre:</span>
          {statusFilter.map((status) => (
            <Button
              key={status}
              variant="secondary"
              size="xs"
              onClick={() => toggleStatusFilter(status)}
            >
              {agreementStatusLabels[status]}
              <X className="size-3 ml-1" />
            </Button>
          ))}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setStatusFilter([])}
          >
            Fjern alle
          </Button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : agreements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">Ingen avtaler funnet</p>
          <Button onClick={() => router.push("/agreements/new")}>
            <Plus className="size-4" />
            Opprett første avtale
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avtalenr.</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Anlegg</TableHead>
                <TableHead>Startdato</TableHead>
                <TableHead className="text-right">Pris</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreements.map((agreement) => (
                <TableRow
                  key={agreement.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/agreements/${agreement.id}`)}
                >
                  <TableCell className="font-mono text-sm">
                    {agreement.agreementNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {agreement.installation.customer.name}
                  </TableCell>
                  <TableCell>
                    {agreementTypeLabels[agreement.agreementType]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {agreement.installation.address}
                  </TableCell>
                  <TableCell>{formatDate(agreement.startDate)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney({
                      amount: Number(agreement.basePrice),
                      currency: "NOK",
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={statusMap[agreement.status]}>
                      {agreementStatusLabels[agreement.status]}
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
                          onSelect={() => router.push(`/agreements/${agreement.id}`)}
                        >
                          <Eye className="size-4 mr-2" />
                          Vis detaljer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => router.push(`/agreements/${agreement.id}/edit`)}
                        >
                          <Edit className="size-4 mr-2" />
                          Rediger
                        </DropdownMenuItem>
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
            Viser {agreements.length} av {data.total} avtaler
          </span>
        </div>
      )}
    </div>
  );
}
