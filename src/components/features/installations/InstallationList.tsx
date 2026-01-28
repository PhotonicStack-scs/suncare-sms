"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MoreHorizontal, Eye, Edit, Building2, Zap, Battery } from "lucide-react";
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
import { formatDate } from "~/types/common";
import { cn } from "~/lib/utils";

const SYSTEM_TYPE_LABELS: Record<string, string> = {
  SOLAR_PANEL: "Solcelle",
  BESS: "Batteri",
  COMBINED: "Kombinert",
};

const SYSTEM_TYPE_ICONS: Record<string, React.ReactNode> = {
  SOLAR_PANEL: <Zap className="size-4" />,
  BESS: <Battery className="size-4" />,
  COMBINED: <Building2 className="size-4" />,
};

interface InstallationListProps {
  className?: string;
}

export function InstallationList({ className }: InstallationListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [systemTypeFilter, setSystemTypeFilter] = useState<string | null>(null);

  const { data, isLoading } = api.installations.getAll.useQuery({
    search: search || undefined,
    systemType: systemTypeFilter as "SOLAR_PANEL" | "BESS" | "COMBINED" | undefined,
    limit: 50,
  });

  const installations = data?.items ?? [];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Søk i anlegg..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* System Type filters */}
          <div className="hidden items-center gap-1 md:flex">
            <Button
              variant={systemTypeFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSystemTypeFilter(null)}
            >
              Alle
            </Button>
            {Object.entries(SYSTEM_TYPE_LABELS).map(([type, label]) => (
              <Button
                key={type}
                variant={systemTypeFilter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSystemTypeFilter(type)}
              >
                {SYSTEM_TYPE_ICONS[type]}
                {label}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={() => router.push("/installations/new")}>
          <Plus className="size-4" />
          Nytt anlegg
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : installations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Ingen anlegg funnet</p>
          <Button onClick={() => router.push("/installations/new")}>
            <Plus className="size-4" />
            Opprett første anlegg
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
                <TableHead>Kapasitet</TableHead>
                <TableHead>Installert</TableHead>
                <TableHead>Avtaler</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installations.map((installation) => (
                <TableRow
                  key={installation.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/installations/${installation.id}`)}
                >
                  <TableCell className="font-medium">
                    {installation.customer.name}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span>{installation.address}</span>
                      {installation.city && (
                        <span className="text-muted-foreground">
                          , {installation.city}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {SYSTEM_TYPE_ICONS[installation.systemType]}
                      <span>{SYSTEM_TYPE_LABELS[installation.systemType]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {String(installation.capacityKw)} kW
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(installation.installDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      variant={
                        installation._count.agreements > 0 ? "completed" : "scheduled"
                      }
                    >
                      {installation._count.agreements > 0
                        ? `${installation._count.agreements} avtale${installation._count.agreements > 1 ? "r" : ""}`
                        : "Ingen avtale"}
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
                          onSelect={() =>
                            router.push(`/installations/${installation.id}`)
                          }
                        >
                          <Eye className="size-4 mr-2" />
                          Vis detaljer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            router.push(`/installations/${installation.id}/edit`)
                          }
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
            Viser {installations.length} av {data.total} anlegg
          </span>
        </div>
      )}
    </div>
  );
}
