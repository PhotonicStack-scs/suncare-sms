import type { Checklist } from "./checklists";
import type { ServiceAgreement } from "./agreements";
import type { Installation } from "./installations";

// Enums matching Prisma
export type VisitStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
export type VisitType = "ANNUAL_INSPECTION" | "SEMI_ANNUAL" | "QUARTERLY" | "TROUBLESHOOTING" | "EMERGENCY" | "WARRANTY";

export const visitStatusLabels: Record<VisitStatus, string> = {
  SCHEDULED: "Planlagt",
  IN_PROGRESS: "Pågår",
  COMPLETED: "Fullført",
  CANCELLED: "Kansellert",
  RESCHEDULED: "Omplassert",
};

export const visitTypeLabels: Record<VisitType, string> = {
  ANNUAL_INSPECTION: "Årlig inspeksjon",
  SEMI_ANNUAL: "Halvårlig service",
  QUARTERLY: "Kvartalsvis service",
  TROUBLESHOOTING: "Feilsøking",
  EMERGENCY: "Akutt",
  WARRANTY: "Garanti",
};

export const visitStatusColors: Record<VisitStatus, string> = {
  SCHEDULED: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
  RESCHEDULED: "secondary",
};

// Service Visit types
export interface ServiceVisit {
  id: string;
  agreementId: string;
  technicianId: string;
  visitNumber: number;
  scheduledDate: Date;
  scheduledEnd?: Date | null;
  actualStart?: Date | null;
  actualEnd?: Date | null;
  status: VisitStatus;
  visitType: VisitType;
  durationMin?: number | null;
  travelTimeMin?: number | null;
  notes?: string | null;
  technicianNotes?: string | null;
  customerSign?: string | null;
  customerSignAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceVisitWithRelations extends ServiceVisit {
  agreement: ServiceAgreement & {
    installation: Installation & {
      customer: {
        tripletexId: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        address?: string | null;
      };
    };
  };
  checklists: Checklist[];
}

// Technician type (from @energismart/shared)
export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  certifications?: string[];
  skills?: string[];
  homeLocation?: {
    latitude: number;
    longitude: number;
  };
  isAvailable: boolean;
}

// Form/input types
export interface CreateVisitInput {
  agreementId: string;
  technicianId: string;
  scheduledDate: Date;
  scheduledEnd?: Date;
  visitType: VisitType;
  notes?: string;
}

export interface UpdateVisitInput extends Partial<CreateVisitInput> {
  id: string;
  status?: VisitStatus;
  actualStart?: Date;
  actualEnd?: Date;
  technicianNotes?: string;
  customerSign?: string;
}

export interface RescheduleVisitInput {
  id: string;
  newDate: Date;
  newEnd?: Date;
  reason?: string;
  notifyCustomer?: boolean;
}

// Filter types
export interface VisitFilters {
  status?: VisitStatus | VisitStatus[];
  visitType?: VisitType | VisitType[];
  technicianId?: string;
  agreementId?: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Calendar/planning types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: VisitStatus;
  visitType: VisitType;
  technicianId: string;
  technicianName: string;
  customerName: string;
  address: string;
  agreementId: string;
}

export interface TechnicianSchedule {
  technician: Technician;
  visits: ServiceVisit[];
  availableSlots: Array<{
    start: Date;
    end: Date;
  }>;
  utilizationPercent: number;
}

// Helper functions
export function getVisitDuration(visit: ServiceVisit): number {
  if (visit.durationMin) return visit.durationMin;
  if (visit.actualStart && visit.actualEnd) {
    return Math.round(
      (new Date(visit.actualEnd).getTime() - new Date(visit.actualStart).getTime()) / 60000
    );
  }
  if (visit.scheduledDate && visit.scheduledEnd) {
    return Math.round(
      (new Date(visit.scheduledEnd).getTime() - new Date(visit.scheduledDate).getTime()) / 60000
    );
  }
  return 90; // default 90 minutes
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} t`;
  return `${hours} t ${mins} min`;
}

export function isVisitToday(visit: ServiceVisit): boolean {
  const today = new Date();
  const visitDate = new Date(visit.scheduledDate);
  return (
    visitDate.getFullYear() === today.getFullYear() &&
    visitDate.getMonth() === today.getMonth() &&
    visitDate.getDate() === today.getDate()
  );
}

export function isVisitOverdue(visit: ServiceVisit): boolean {
  if (visit.status === "COMPLETED" || visit.status === "CANCELLED") return false;
  return new Date(visit.scheduledDate) < new Date();
}

export function visitToCalendarEvent(
  visit: ServiceVisitWithRelations,
  technicianName: string
): CalendarEvent {
  const installation = visit.agreement.installation;
  return {
    id: visit.id,
    title: `${installation.customer.name} - ${visitTypeLabels[visit.visitType]}`,
    start: new Date(visit.scheduledDate),
    end: visit.scheduledEnd 
      ? new Date(visit.scheduledEnd) 
      : new Date(new Date(visit.scheduledDate).getTime() + 90 * 60000),
    status: visit.status,
    visitType: visit.visitType,
    technicianId: visit.technicianId,
    technicianName,
    customerName: installation.customer.name,
    address: `${installation.address}, ${installation.city ?? ""}`,
    agreementId: visit.agreementId,
  };
}
