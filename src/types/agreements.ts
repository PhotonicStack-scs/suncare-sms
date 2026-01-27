import type { Decimal } from "@prisma/client/runtime/library";

// Agreement Types
export type AgreementType = "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
export type AgreementStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING_RENEWAL";
export type SlaLevel = "STANDARD" | "PRIORITY" | "CRITICAL";

// Agreement type metadata
export const AGREEMENT_TYPE_INFO: Record<AgreementType, {
  label: string;
  labelNo: string;
  description: string;
  defaultFrequency: number;
  features: string[];
}> = {
  BASIC: {
    label: "Basic",
    labelNo: "Basis",
    description: "Annual inspection",
    defaultFrequency: 1,
    features: ["Visual check", "Cleaning", "Report"],
  },
  STANDARD: {
    label: "Standard",
    labelNo: "Standard",
    description: "Regular maintenance",
    defaultFrequency: 2,
    features: ["Basic features", "Performance analysis", "Minor adjustments"],
  },
  PREMIUM: {
    label: "Premium",
    labelNo: "Premium",
    description: "Complete service program",
    defaultFrequency: 4,
    features: ["Standard features", "Priority response", "Spare parts"],
  },
  ENTERPRISE: {
    label: "Enterprise",
    labelNo: "Enterprise",
    description: "Customized enterprise agreement",
    defaultFrequency: 0, // Custom
    features: ["Fully customized SLA"],
  },
};

export const AGREEMENT_STATUS_INFO: Record<AgreementStatus, {
  label: string;
  labelNo: string;
  color: "default" | "success" | "warning" | "destructive" | "info";
}> = {
  DRAFT: { label: "Draft", labelNo: "Utkast", color: "default" },
  ACTIVE: { label: "Active", labelNo: "Aktiv", color: "success" },
  EXPIRED: { label: "Expired", labelNo: "Utløpt", color: "destructive" },
  CANCELLED: { label: "Cancelled", labelNo: "Kansellert", color: "destructive" },
  PENDING_RENEWAL: { label: "Pending Renewal", labelNo: "Venter på fornyelse", color: "warning" },
};

// Convenience label lookups
export const agreementTypeLabels: Record<AgreementType, string> = {
  BASIC: AGREEMENT_TYPE_INFO.BASIC.label,
  STANDARD: AGREEMENT_TYPE_INFO.STANDARD.label,
  PREMIUM: AGREEMENT_TYPE_INFO.PREMIUM.label,
  ENTERPRISE: AGREEMENT_TYPE_INFO.ENTERPRISE.label,
};

export const agreementStatusLabels: Record<AgreementStatus, string> = {
  DRAFT: AGREEMENT_STATUS_INFO.DRAFT.label,
  ACTIVE: AGREEMENT_STATUS_INFO.ACTIVE.label,
  EXPIRED: AGREEMENT_STATUS_INFO.EXPIRED.label,
  CANCELLED: AGREEMENT_STATUS_INFO.CANCELLED.label,
  PENDING_RENEWAL: AGREEMENT_STATUS_INFO.PENDING_RENEWAL.label,
};

export const SLA_LEVEL_INFO: Record<SlaLevel, {
  label: string;
  labelNo: string;
  responseTime: string;
  description: string;
}> = {
  STANDARD: {
    label: "Standard",
    labelNo: "Standard",
    responseTime: "5 business days",
    description: "Normal response time",
  },
  PRIORITY: {
    label: "Priority",
    labelNo: "Prioritet",
    responseTime: "24 hours",
    description: "Fast response for important issues",
  },
  CRITICAL: {
    label: "Critical",
    labelNo: "Kritisk",
    responseTime: "4 hours",
    description: "Immediate response for critical issues",
  },
};

// Service Agreement interfaces
export interface ServiceAgreement {
  id: string;
  installationId: string;
  agreementNumber: string;
  agreementType: AgreementType;
  status: AgreementStatus;
  startDate: Date;
  endDate: Date | null;
  basePrice: Decimal;
  slaLevel: SlaLevel;
  autoRenew: boolean;
  visitFrequency: number;
  notes: string | null;
  signedAt: Date | null;
  signedBy: string | null;
  tripletexProjectId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceAgreementWithRelations extends ServiceAgreement {
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
  addons: Array<{
    id: string;
    quantity: number;
    customPrice: Decimal | null;
    addon: {
      id: string;
      name: string;
      basePrice: Decimal;
      category: string;
    };
  }>;
  _count?: {
    visits: number;
  };
}

// Create/Update DTOs
export interface CreateAgreementInput {
  installationId: string;
  agreementType: AgreementType;
  startDate: Date;
  endDate?: Date;
  basePrice: number;
  slaLevel: SlaLevel;
  autoRenew?: boolean;
  visitFrequency?: number;
  notes?: string;
  addons?: Array<{
    addonId: string;
    quantity?: number;
    customPrice?: number;
  }>;
}

export interface UpdateAgreementInput {
  agreementType?: AgreementType;
  status?: AgreementStatus;
  startDate?: Date;
  endDate?: Date | null;
  basePrice?: number;
  slaLevel?: SlaLevel;
  autoRenew?: boolean;
  visitFrequency?: number;
  notes?: string | null;
}

// Price calculation
export interface PriceCalculationInput {
  agreementType: AgreementType;
  slaLevel: SlaLevel;
  capacityKw: number;
  systemType: string;
  addons?: Array<{ addonId: string; quantity: number }>;
}

export interface PriceCalculationResult {
  basePrice: number;
  slaMultiplier: number;
  capacityCharge: number;
  addonsTotal: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  breakdown: Array<{
    item: string;
    amount: number;
  }>;
}



