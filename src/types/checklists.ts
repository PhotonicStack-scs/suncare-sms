// Checklist Types
export type ChecklistStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type ChecklistItemStatus = "PENDING" | "PASSED" | "FAILED" | "NOT_APPLICABLE";
export type ItemSeverity = "CRITICAL" | "SERIOUS" | "MODERATE" | "MINOR";
export type InputType = 
  | "YES_NO"
  | "YES_NO_NA"
  | "NUMERIC"
  | "TEXT"
  | "MULTIPLE_CHOICE"
  | "IMAGE"
  | "SIGNATURE"
  | "GPS"
  | "TEMPERATURE"
  | "ELECTRICAL_MEASUREMENT";

export const CHECKLIST_STATUS_INFO: Record<ChecklistStatus, {
  label: string;
  labelNo: string;
  color: "default" | "warning" | "success";
}> = {
  NOT_STARTED: { label: "Not Started", labelNo: "Ikke startet", color: "default" },
  IN_PROGRESS: { label: "In Progress", labelNo: "Pågår", color: "warning" },
  COMPLETED: { label: "Completed", labelNo: "Fullført", color: "success" },
};

export const ITEM_SEVERITY_INFO: Record<ItemSeverity, {
  label: string;
  labelNo: string;
  color: "destructive" | "warning" | "info" | "success";
  action: string;
}> = {
  CRITICAL: {
    label: "Critical",
    labelNo: "Kritisk",
    color: "destructive",
    action: "Immediate follow-up required",
  },
  SERIOUS: {
    label: "Serious",
    labelNo: "Alvorlig",
    color: "warning",
    action: "Schedule repair within 30 days",
  },
  MODERATE: {
    label: "Moderate",
    labelNo: "Moderat",
    color: "info",
    action: "Include in next service",
  },
  MINOR: {
    label: "Minor",
    labelNo: "Mindre",
    color: "success",
    action: "Information only",
  },
};

export const INPUT_TYPE_INFO: Record<InputType, {
  label: string;
  component: string;
}> = {
  YES_NO: { label: "Yes/No", component: "toggle" },
  YES_NO_NA: { label: "Yes/No/N/A", component: "radio" },
  NUMERIC: { label: "Numeric", component: "number" },
  TEXT: { label: "Text", component: "textarea" },
  MULTIPLE_CHOICE: { label: "Multiple Choice", component: "select" },
  IMAGE: { label: "Image", component: "camera" },
  SIGNATURE: { label: "Signature", component: "signature" },
  GPS: { label: "GPS Coordinates", component: "gps" },
  TEMPERATURE: { label: "Temperature", component: "number" },
  ELECTRICAL_MEASUREMENT: { label: "Electrical Measurement", component: "number" },
};

// Checklist Template interfaces
export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  systemType: string;
  visitType: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  category: string;
  description: string;
  inputType: InputType;
  isMandatory: boolean;
  photoRequired: boolean;
  minValue: number | null;
  maxValue: number | null;
  options: string | null; // JSON array for multiple choice
  helpText: string | null;
  sortOrder: number;
  conditionalOn: string | null;
  conditionalValue: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistTemplateWithItems extends ChecklistTemplate {
  items: ChecklistTemplateItem[];
}

// Active Checklist interfaces
export interface Checklist {
  id: string;
  visitId: string;
  templateId: string;
  technicianId: string;
  status: ChecklistStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  aiSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  category: string;
  description: string;
  inputType: InputType;
  status: ChecklistItemStatus;
  value: string | null;
  numericValue: number | null;
  notes: string | null;
  photoUrl: string | null;
  severity: ItemSeverity | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[];
  template: ChecklistTemplate;
}

// Grouped items by category for UI
export interface ChecklistCategoryGroup {
  category: string;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
}

// Update DTOs
export interface UpdateChecklistItemInput {
  status?: ChecklistItemStatus;
  value?: string | null;
  numericValue?: number | null;
  notes?: string | null;
  photoUrl?: string | null;
  severity?: ItemSeverity | null;
}

export interface CompleteChecklistInput {
  checklistId: string;
  items: Array<{
    itemId: string;
    status: ChecklistItemStatus;
    value?: string;
    numericValue?: number;
    notes?: string;
    severity?: ItemSeverity;
  }>;
}
