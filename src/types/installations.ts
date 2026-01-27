import type { Decimal } from "@prisma/client/runtime/library";

// System Types
export type SystemType = "SOLAR_PANEL" | "BESS" | "COMBINED";

export const SYSTEM_TYPE_INFO: Record<SystemType, {
  label: string;
  labelNo: string;
  icon: string;
  description: string;
}> = {
  SOLAR_PANEL: {
    label: "Solar Panels",
    labelNo: "Solcellepaneler",
    icon: "sun",
    description: "Solar panel installation",
  },
  BESS: {
    label: "Battery Storage",
    labelNo: "Batterilagring",
    icon: "battery",
    description: "Battery Energy Storage System",
  },
  COMBINED: {
    label: "Combined System",
    labelNo: "Kombinert system",
    icon: "zap",
    description: "Solar panels with battery storage",
  },
};

// Convenience label lookup
export const systemTypeLabels: Record<SystemType, string> = {
  SOLAR_PANEL: SYSTEM_TYPE_INFO.SOLAR_PANEL.label,
  BESS: SYSTEM_TYPE_INFO.BESS.label,
  COMBINED: SYSTEM_TYPE_INFO.COMBINED.label,
};

// Installation interfaces
export interface Installation {
  id: string;
  customerId: string;
  address: string;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  systemType: SystemType;
  capacityKw: Decimal;
  installDate: Date;
  inverterType: string | null;
  inverterSerial: string | null;
  panelCount: number | null;
  panelType: string | null;
  batteryKwh: Decimal | null;
  batteryType: string | null;
  monitoringId: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstallationWithRelations extends Installation {
  customer: {
    id: string;
    tripletexId: number;
    name: string;
    email: string | null;
    phone: string | null;
  };
  agreements: Array<{
    id: string;
    agreementNumber: string;
    agreementType: string;
    status: string;
  }>;
  _count?: {
    agreements: number;
  };
}

// Customer Cache (from Tripletex)
export interface CustomerCache {
  id: string;
  tripletexId: number;
  name: string;
  orgNumber: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  postalAddress: string | null;
  physicalAddress: string | null;
  invoiceEmail: string | null;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerWithInstallations extends CustomerCache {
  installations: Installation[];
  _count?: {
    installations: number;
  };
}

// Create/Update DTOs
export interface CreateInstallationInput {
  customerId: string;
  address: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  systemType: SystemType;
  capacityKw: number;
  installDate: Date;
  inverterType?: string;
  inverterSerial?: string;
  panelCount?: number;
  panelType?: string;
  batteryKwh?: number;
  batteryType?: string;
  monitoringId?: string;
  notes?: string;
}

export interface UpdateInstallationInput {
  address?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  systemType?: SystemType;
  capacityKw?: number;
  installDate?: Date;
  inverterType?: string | null;
  inverterSerial?: string | null;
  panelCount?: number | null;
  panelType?: string | null;
  batteryKwh?: number | null;
  batteryType?: string | null;
  monitoringId?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

// Search/Filter
export interface InstallationFilter {
  customerId?: string;
  systemType?: SystemType;
  city?: string;
  isActive?: boolean;
  search?: string;
}
