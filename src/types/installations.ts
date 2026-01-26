import type { GeoLocation, Address } from "./common";

// Enums matching Prisma
export type SystemType = "SOLAR" | "BESS" | "HYBRID";

export const systemTypeLabels: Record<SystemType, string> = {
  SOLAR: "Solcelleanlg",
  BESS: "Batterilagring (BESS)",
  HYBRID: "Hybrid (Sol + Batteri)",
};

// Installation types
export interface Installation {
  id: string;
  customerId: string;
  name?: string | null;
  address: string;
  postalCode?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  systemType: SystemType;
  capacityKw: number;
  installDate: Date;
  inverterType?: string | null;
  inverterCount?: number | null;
  panelType?: string | null;
  panelCount?: number | null;
  batteryType?: string | null;
  batteryKwh?: number | null;
  monitoringId?: string | null;
  monitoringType?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstallationWithCustomer extends Installation {
  customer: {
    tripletexId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
}

export interface InstallationWithAgreements extends Installation {
  agreements: Array<{
    id: string;
    agreementNumber: string;
    agreementType: string;
    status: string;
    startDate: Date;
    endDate?: Date | null;
  }>;
}

// Form/input types
export interface CreateInstallationInput {
  customerId: string;
  name?: string;
  address: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  systemType: SystemType;
  capacityKw: number;
  installDate: Date;
  inverterType?: string;
  inverterCount?: number;
  panelType?: string;
  panelCount?: number;
  batteryType?: string;
  batteryKwh?: number;
  monitoringId?: string;
  monitoringType?: string;
  notes?: string;
}

export interface UpdateInstallationInput extends Partial<CreateInstallationInput> {
  id: string;
}

// Filter types
export interface InstallationFilters {
  customerId?: string;
  systemType?: SystemType;
  city?: string;
  isActive?: boolean;
  search?: string;
}

// Helper functions
export function getInstallationDisplayName(installation: Installation): string {
  if (installation.name) return installation.name;
  return `${installation.address}, ${installation.city ?? ""}`.trim().replace(/,$/, "");
}

export function formatCapacity(kw: number): string {
  if (kw >= 1000) {
    return `${(kw / 1000).toFixed(1)} MW`;
  }
  return `${kw.toFixed(1)} kW`;
}

export function formatBatteryCapacity(kwh: number | null | undefined): string {
  if (kwh === null || kwh === undefined) return "-";
  if (kwh >= 1000) {
    return `${(kwh / 1000).toFixed(1)} MWh`;
  }
  return `${kwh.toFixed(1)} kWh`;
}
