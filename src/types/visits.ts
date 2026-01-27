import type { Decimal } from "@prisma/client/runtime/library";

// Visit Types
export type VisitStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "BLOCKED";
export type VisitType = "ANNUAL_INSPECTION" | "SEMI_ANNUAL" | "QUARTERLY" | "EMERGENCY" | "REPAIR" | "INSTALLATION";

export const VISIT_STATUS_INFO: Record<VisitStatus, {
  label: string;
  labelNo: string;
  color: "scheduled" | "in-progress" | "completed" | "cancelled" | "blocked";
}> = {
  SCHEDULED: { label: "Scheduled", labelNo: "Planlagt", color: "scheduled" },
  IN_PROGRESS: { label: "In Progress", labelNo: "Pågår", color: "in-progress" },
  COMPLETED: { label: "Completed", labelNo: "Fullført", color: "completed" },
  CANCELLED: { label: "Cancelled", labelNo: "Kansellert", color: "cancelled" },
  BLOCKED: { label: "Blocked", labelNo: "Blokkert", color: "blocked" },
};

export const VISIT_TYPE_INFO: Record<VisitType, {
  label: string;
  labelNo: string;
  description: string;
  typicalDuration: number; // minutes
}> = {
  ANNUAL_INSPECTION: {
    label: "Annual Inspection",
    labelNo: "Årlig inspeksjon",
    description: "Full annual service inspection",
    typicalDuration: 120,
  },
  SEMI_ANNUAL: {
    label: "Semi-Annual",
    labelNo: "Halvårlig",
    description: "Bi-annual maintenance visit",
    typicalDuration: 90,
  },
  QUARTERLY: {
    label: "Quarterly",
    labelNo: "Kvartalsvis",
    description: "Quarterly premium service",
    typicalDuration: 60,
  },
  EMERGENCY: {
    label: "Emergency",
    labelNo: "Nødservice",
    description: "Emergency repair visit",
    typicalDuration: 180,
  },
  REPAIR: {
    label: "Repair",
    labelNo: "Reparasjon",
    description: "Scheduled repair work",
    typicalDuration: 150,
  },
  INSTALLATION: {
    label: "Installation",
    labelNo: "Installasjon",
    description: "New system installation",
    typicalDuration: 480,
  },
};

// Service Visit interfaces
export interface ServiceVisit {
  id: string;
  agreementId: string;
  technicianId: string;
  scheduledDate: Date;
  scheduledEndDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  status: VisitStatus;
  visitType: VisitType;
  durationMinutes: number | null;
  notes: string | null;
  customerNotes: string | null;
  customerSignature: string | null;
  signedAt: Date | null;
  travelTimeMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceVisitWithRelations extends ServiceVisit {
  agreement: {
    id: string;
    agreementNumber: string;
    agreementType: string;
    installation: {
      id: string;
      address: string;
      city: string | null;
      systemType: string;
      capacityKw: Decimal;
      customer: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
      };
    };
  };
  checklists: Array<{
    id: string;
    status: string;
    template: {
      name: string;
    };
  }>;
  photos: Array<{
    id: string;
    url: string;
    caption: string | null;
    category: string | null;
  }>;
  _count?: {
    checklists: number;
    photos: number;
  };
}

// Technician info (from @energismart/shared)
export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  certifications: string[];
  skills: string[];
  homeLocation: {
    latitude: number;
    longitude: number;
  } | null;
  calendarId: string | null;
}

// Create/Update DTOs
export interface CreateVisitInput {
  agreementId: string;
  technicianId: string;
  scheduledDate: Date;
  scheduledEndDate?: Date;
  visitType: VisitType;
  notes?: string;
}

export interface UpdateVisitInput {
  technicianId?: string;
  scheduledDate?: Date;
  scheduledEndDate?: Date;
  status?: VisitStatus;
  visitType?: VisitType;
  notes?: string;
}

export interface StartVisitInput {
  visitId: string;
  actualStartDate?: Date;
}

export interface CompleteVisitInput {
  visitId: string;
  actualEndDate?: Date;
  durationMinutes?: number;
  customerSignature?: string;
  customerNotes?: string;
}

// Filter/Search
export interface VisitFilter {
  technicianId?: string;
  status?: VisitStatus | VisitStatus[];
  visitType?: VisitType | VisitType[];
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  installationId?: string;
}

// Calendar view
export interface CalendarVisit {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: VisitStatus;
  technicianId: string;
  technicianName: string;
  customerName: string;
  address: string;
  visitType: VisitType;
}
