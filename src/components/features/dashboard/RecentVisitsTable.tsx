"use client";

import { useState } from "react";
import { Search, Filter, Download, Upload, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { StatusBadge } from "~/components/ui/badge";
import { UserAvatar } from "~/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import type { VisitStatus, VisitType } from "~/types/visits";
import { VISIT_STATUS_INFO, VISIT_TYPE_INFO } from "~/types/visits";

interface Visit {
  id: string;
  customerName: string;
  address: string;
  visitType: VisitType;
  scheduledDate: Date;
  status: VisitStatus;
  technicianName?: string;
}

interface RecentVisitsTableProps {
  visits: Visit[];
  className?: string;
}

export function RecentVisitsTable({ visits, className }: RecentVisitsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVisits = visits.filter(
    (visit) =>
      visit.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("nb-NO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("nb-NO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">
            Siste servicebesøk
          </CardTitle>
          
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Søk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-48 pl-9"
              />
            </div>
            
            {/* Filter button */}
            <Button variant="outline" size="sm">
              <Filter className="mr-1 size-4" />
              Filter
            </Button>
            
            {/* Import/Export */}
            <div className="hidden gap-1 sm:flex">
              <Button variant="outline" size="sm">
                <Upload className="mr-1 size-4" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1 size-4" />
                Eksport
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Besøk ID</TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Dato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVisits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Ingen besøk funnet
                </TableCell>
              </TableRow>
            ) : (
              filteredVisits.map((visit) => {
                const statusInfo = VISIT_STATUS_INFO[visit.status];
                const typeInfo = VISIT_TYPE_INFO[visit.visitType];
                
                return (
                  <TableRow key={visit.id} className="group">
                    <TableCell className="font-mono text-sm">
                      {visit.id.slice(0, 12)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={visit.customerName} size="sm" />
                        <div>
                          <p className="font-medium">{visit.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {visit.address}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="rounded-md bg-muted px-2 py-1 text-xs">
                        {typeInfo.labelNo}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div>
                        <p className="text-sm">{formatDate(visit.scheduledDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(visit.scheduledDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={statusInfo.color}>
                        {statusInfo.labelNo}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Se detaljer</DropdownMenuItem>
                          <DropdownMenuItem>Rediger</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Kanseller
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Viser {filteredVisits.length} av {visits.length} besøk
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Forrige
            </Button>
            <Button variant="outline" size="sm" disabled>
              Neste
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
