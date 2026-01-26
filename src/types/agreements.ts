import type { Installation } from "./installations";
import type { Money } from "./common";

// Enums matching Prisma
export type AgreementType = "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
export type AgreementStatus = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED";
export type SlaLevel = "STANDARD" | "PRIORITY" | "CRITICAL";

export const agreementTypeLabels: Record<AgreementType, string> = {
  BASIC: "Basis",
  STANDARD: "Standard",
  PREMIUM: "Premium",
  ENTERPRISE: "Enterprise",
};

export const agreementTypeDescriptions: Record<AgreementType, string> = {
  BASIC: "Årlig inspeksjon med visuell sjekk og rapport",
  STANDARD: "Halvårlig vedlikehold med ytelsesanalyse",
  PREMIUM: "Kvartalsvis service med prioritert respons",
  ENTERPRISE: "Tilpasset avtale med full SLA",
};

export const agreementStatusLabels: Record<AgreementStatus, string> = {
  DRAFT: "Utkast",
  PENDING_APPROVAL: "Venter godkjenning",
  ACTIVE: "Aktiv",
  SUSPENDED: "Suspendert",
  EXPIRED: "Utløpt",
  CANCELLED: "Kansellert",
};

export const slaLevelLabels: Record<SlaLevel, string> = {
  STANDARD: "Standard (5 dager)",
  PRIORITY: "Prioritert (48 timer)",
  CRITICAL: "Kritisk (24 timer)",
};

// Service Agreement types
export interface ServiceAgreement {
  id: string;
  installationId: string;
  agreementNumber: string;
  agreementType: AgreementType;
  status: AgreementStatus;
  slaLevel: SlaLevel;
  startDate: Date;
  endDate?: Date | null;
  basePrice: number;
  calculatedPrice?: number | null;
  discountPercent?: number | null;
  autoRenew: boolean;
  visitFrequency: number;
  preferredVisitDay?: string | null;
  preferredTimeSlot?: string | null;
  notes?: string | null;
  signedAt?: Date | null;
  signedBy?: string | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceAgreementWithRelations extends ServiceAgreement {
  installation: Installation & {
    customer: {
      tripletexId: string;
      name: string;
      email?: string | null;
      phone?: string | null;
    };
  };
  addons: AgreementAddon[];
  _count?: {
    visits: number;
    invoices: number;
  };
}

// Addon types
export type AddonCategory = "MAINTENANCE" | "MONITORING" | "PRIORITY" | "EQUIPMENT";
export type AddonFrequency = "ONE_TIME" | "PER_VISIT" | "MONTHLY" | "ANNUAL";

export const addonCategoryLabels: Record<AddonCategory, string> = {
  MAINTENANCE: "Vedlikehold",
  MONITORING: "Overvåking",
  PRIORITY: "Prioritet",
  EQUIPMENT: "Utstyr",
};

export const addonFrequencyLabels: Record<AddonFrequency, string> = {
  ONE_TIME: "Engangskjøp",
  PER_VISIT: "Per besøk",
  MONTHLY: "Månedlig",
  ANNUAL: "Årlig",
};

export interface AddonProduct {
  id: string;
  name: string;
  description?: string | null;
  category: AddonCategory;
  frequency: AddonFrequency;
  basePrice: number;
  unit?: string | null;
  tripletexProductId?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AgreementAddon {
  id: string;
  agreementId: string;
  addonId: string;
  quantity: number;
  customPrice?: number | null;
  notes?: string | null;
  addon: AddonProduct;
}

// Form/input types
export interface CreateAgreementInput {
  installationId: string;
  agreementType: AgreementType;
  slaLevel?: SlaLevel;
  startDate: Date;
  endDate?: Date;
  basePrice: number;
  discountPercent?: number;
  autoRenew?: boolean;
  visitFrequency?: number;
  preferredVisitDay?: string;
  preferredTimeSlot?: string;
  notes?: string;
  addons?: Array<{
    addonId: string;
    quantity: number;
    customPrice?: number;
    notes?: string;
  }>;
}

export interface UpdateAgreementInput extends Partial<CreateAgreementInput> {
  id: string;
}

// Filter types
export interface AgreementFilters {
  status?: AgreementStatus | AgreementStatus[];
  agreementType?: AgreementType | AgreementType[];
  customerId?: string;
  installationId?: string;
  slaLevel?: SlaLevel;
  startDateFrom?: Date;
  startDateTo?: Date;
  expiringWithinDays?: number;
  search?: string;
}

// Price calculation types
export interface PriceCalculation {
  basePrice: number;
  addonsTotal: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  vatAmount: number;
  grandTotal: number;
  breakdown: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

// Helper functions
export function getVisitFrequencyLabel(frequency: number): string {
  switch (frequency) {
    case 1:
      return "Årlig (1x/år)";
    case 2:
      return "Halvårlig (2x/år)";
    case 4:
      return "Kvartalsvis (4x/år)";
    default:
      return `${frequency}x/år`;
  }
}

export function isAgreementExpiring(agreement: ServiceAgreement, withinDays = 30): boolean {
  if (!agreement.endDate) return false;
  const daysUntilExpiry = Math.ceil(
    (new Date(agreement.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry > 0 && daysUntilExpiry <= withinDays;
}

export function getAgreementStatusColor(status: AgreementStatus): string {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "DRAFT":
    case "PENDING_APPROVAL":
      return "info";
    case "SUSPENDED":
    case "EXPIRED":
      return "warning";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
}
