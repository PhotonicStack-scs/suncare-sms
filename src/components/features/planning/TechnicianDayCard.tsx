"use client";

import { Wrench, Clock, AlertCircle, Building2, User } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { StatusBadge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface ServiceVisitInfo {
  id: string;
  scheduledTime?: string;
  address: string;
  customerName: string;
  visitType: string;
  estimatedDuration: number;
  status: string;
}

interface ProjectAssignmentInfo {
  id: string;
  projectName: string;
  hours: number;
}

interface TechnicianDayCardProps {
  technician: {
    id: string;
    name: string;
    email: string;
    certifications?: string[];
  };
  availability: {
    available: boolean;
    blockedBy?: string;
    blockingDetails?: string;
  };
  serviceVisits: ServiceVisitInfo[];
  projectAssignment?: ProjectAssignmentInfo;
  totalHours: number;
  utilization: number;
  onBookVisit: () => void;
}

export function TechnicianDayCard({
  technician,
  availability,
  serviceVisits,
  projectAssignment,
  utilization,
  onBookVisit,
}: TechnicianDayCardProps) {
  const initials = technician.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const getBlockedLabel = (blockedBy?: string) => {
    switch (blockedBy) {
      case "project":
        return "På prosjekt";
      case "service":
        return "Servicebesøk";
      case "absence":
        return "Fravær";
      case "manual":
        return "Blokkert";
      default:
        return "Utilgjengelig";
    }
  };

  const getVisitStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
      case "SCHEDULED":
        return "bg-info/15 text-info";
      case "confirmed":
        return "bg-info/15 text-info";
      case "in_progress":
      case "IN_PROGRESS":
        return "bg-warning/15 text-warning";
      case "completed":
      case "COMPLETED":
        return "bg-success/15 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card
      className={cn(
        "p-4 transition-opacity",
        !availability.available && "opacity-60 bg-muted/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{technician.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{utilization}% kapasitet</span>
              {technician.certifications && technician.certifications.length > 0 && (
                <span className="text-xs">
                  • {technician.certifications.slice(0, 2).join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        {!availability.available && (
          <StatusBadge status="blocked">{getBlockedLabel(availability.blockedBy)}</StatusBadge>
        )}
      </div>

      {/* Content */}
      <div className="mt-4 space-y-2">
        {/* Project from Ressursplanlegger */}
        {projectAssignment && (
          <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-md">
            <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
            <span className="flex-1">
              Prosjekt: {projectAssignment.projectName} ({projectAssignment.hours} timer)
            </span>
            <StatusBadge status="pending">Ressursplanlegger</StatusBadge>
          </div>
        )}

        {/* Service Visits */}
        {serviceVisits.map((visit) => (
          <div
            key={visit.id}
            className={cn(
              "flex items-center gap-2 text-sm p-2.5 rounded-md",
              getVisitStatusColor(visit.status)
            )}
          >
            <Wrench className="size-4" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {visit.scheduledTime && (
                  <span className="font-medium">{visit.scheduledTime}</span>
                )}
                <span className="truncate">{visit.customerName}</span>
              </div>
              <div className="text-xs opacity-75 truncate">
                {visit.address} • {visit.estimatedDuration} min
              </div>
            </div>
          </div>
        ))}

        {/* Blocked message */}
        {!availability.available && availability.blockingDetails && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2.5 rounded-md">
            <AlertCircle className="size-4" />
            <span>{availability.blockingDetails}</span>
          </div>
        )}

        {/* Empty state / Add button */}
        {availability.available && serviceVisits.length === 0 && !projectAssignment && (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Clock className="size-4 mr-2" />
            <span className="text-sm">Ingen planlagte besøk</span>
          </div>
        )}

        {/* Book new visit button */}
        {availability.available && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={onBookVisit}
          >
            <Wrench className="size-4" />
            Legg til servicebesøk
          </Button>
        )}
      </div>
    </Card>
  );
}
