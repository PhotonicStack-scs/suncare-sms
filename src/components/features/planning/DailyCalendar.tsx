"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isToday } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Loader2, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { TechnicianDayCard } from "./TechnicianDayCard";
import { BookVisitDialog } from "./BookVisitDialog";
import { cn } from "~/lib/utils";

interface DailyCalendarProps {
  initialDate?: Date;
}

export function DailyCalendar({ initialDate = new Date() }: DailyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | undefined>();

  const dateString = format(selectedDate, "yyyy-MM-dd");

  // Fetch technicians from @energismart/shared via dashboard router
  const { data: technicians, isLoading: loadingTechnicians } = api.dashboard.getTechnicians.useQuery();

  // Fetch visits for the selected date
  const {
    data: visitsData,
    isLoading: loadingVisits,
    refetch: refetchVisits,
  } = api.visit.getAll.useQuery({
    dateFrom: new Date(`${dateString}T00:00:00`),
    dateTo: new Date(`${dateString}T23:59:59`),
    limit: 100,
  });

  // Fetch visit stats
  const { data: stats } = api.visit.getStats.useQuery();

  // Group visits by technician
  const visitsByTechnician = useMemo(() => {
    if (!visitsData?.items) return {};
    return visitsData.items.reduce(
      (acc, visit) => {
        const techId = visit.technicianId;
        acc[techId] ??= [];
        acc[techId].push({
          id: visit.id,
          scheduledTime: format(new Date(visit.scheduledDate), "HH:mm"),
          address: visit.agreement.installation.address,
          customerName: visit.agreement.installation.customer.name,
          visitType: visit.visitType,
          estimatedDuration: 120, // Default estimate
          status: visit.status,
        });
        return acc;
      },
      {} as Record<string, Array<{
        id: string;
        scheduledTime: string;
        address: string;
        customerName: string;
        visitType: string;
        estimatedDuration: number;
        status: string;
      }>>
    );
  }, [visitsData]);

  // Build technician schedule data using real technicians from @energismart/shared
  const technicianSchedules = useMemo(() => {
    if (!technicians) return [];
    
    return technicians.map((tech) => {
      const techVisits = visitsByTechnician[tech.id] ?? [];
      const totalMinutes = techVisits.reduce((sum, v) => sum + v.estimatedDuration, 0);
      const totalHours = totalMinutes / 60;
      const utilization = Math.round((totalHours / 8) * 100);

      return {
        technician: {
          id: tech.id,
          name: tech.name,
          email: tech.email,
          phone: tech.phone,
          certifications: tech.certifications,
        },
        availability: {
          available: true, // In a full implementation, check via @energismart/shared availability API
          blockedBy: undefined,
          blockingDetails: undefined,
        },
        serviceVisits: techVisits,
        projectAssignment: undefined, // Would come from @energismart/shared
        totalHours,
        utilization: Math.min(utilization, 100),
      };
    });
  }, [technicians, visitsByTechnician]);

  const handleBookVisit = (technicianId?: string) => {
    setSelectedTechnicianId(technicianId);
    setBookDialogOpen(true);
  };

  const goToPrevDay = () => setSelectedDate((d) => addDays(d, -1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Quick week navigation
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const isLoading = loadingTechnicians || loadingVisits;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.today ?? 0}</div>
            <p className="text-sm text-muted-foreground">I dag</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.thisWeek ?? 0}</div>
            <p className="text-sm text-muted-foreground">Denne uken</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.scheduled ?? 0}</div>
            <p className="text-sm text-muted-foreground">Venter</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">
              {stats?.completedThisMonth ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">Fullført denne mnd</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevDay}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-48 text-center">
            {format(selectedDate, "EEEE d. MMMM yyyy", { locale: nb })}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="size-4" />
          </Button>
          {!isToday(selectedDate) && (
            <Button variant="outline" size="sm" onClick={goToToday}>
              <Calendar className="size-4" />
              I dag
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchVisits()}
            disabled={loadingVisits}
          >
            <RefreshCw className={cn("size-4", loadingVisits && "animate-spin")} />
            Oppdater
          </Button>
          <Button onClick={() => handleBookVisit()}>
            Planlegg besøk
          </Button>
        </div>
      </div>

      {/* Week Quick Nav */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weekDays.map((day) => (
          <Button
            key={day.toISOString()}
            variant={format(day, "yyyy-MM-dd") === dateString ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0"
            onClick={() => setSelectedDate(day)}
          >
            <span className="font-medium">
              {format(day, "EEE", { locale: nb })}
            </span>
            <span className="ml-1 text-xs opacity-75">
              {format(day, "d")}
            </span>
          </Button>
        ))}
      </div>

      {/* Technician Schedule Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {technicianSchedules.map((schedule) => (
            <TechnicianDayCard
              key={schedule.technician.id}
              technician={schedule.technician}
              availability={schedule.availability}
              serviceVisits={schedule.serviceVisits}
              projectAssignment={schedule.projectAssignment}
              totalHours={schedule.totalHours}
              utilization={schedule.utilization}
              onBookVisit={() => handleBookVisit(schedule.technician.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && technicianSchedules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Ingen teknikere tilgjengelig
            </p>
          </CardContent>
        </Card>
      )}

      {/* Book Visit Dialog */}
      <BookVisitDialog
        open={bookDialogOpen}
        onOpenChange={setBookDialogOpen}
        selectedDate={dateString}
        selectedTechnicianId={selectedTechnicianId}
        onSuccess={() => refetchVisits()}
      />
    </div>
  );
}
