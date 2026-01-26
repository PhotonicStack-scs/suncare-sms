// Enums matching Prisma
export type ChecklistStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type ChecklistItemStatus = "PENDING" | "OK" | "NOT_OK" | "NOT_APPLICABLE";
export type FindingSeverity = "CRITICAL" | "SERIOUS" | "MODERATE" | "MINOR" | "INFO";
export type ChecklistInputType = "YES_NO" | "NUMERIC" | "TEXT" | "CHOICE" | "IMAGE" | "SIGNATURE" | "GPS" | "TEMPERATURE";

export const checklistStatusLabels: Record<ChecklistStatus, string> = {
  PENDING: "Ikke startet",
  IN_PROGRESS: "Pågår",
  COMPLETED: "Fullført",
};

export const checklistItemStatusLabels: Record<ChecklistItemStatus, string> = {
  PENDING: "Venter",
  OK: "OK",
  NOT_OK: "Avvik",
  NOT_APPLICABLE: "Ikke aktuelt",
};

export const findingSeverityLabels: Record<FindingSeverity, string> = {
  CRITICAL: "Kritisk",
  SERIOUS: "Alvorlig",
  MODERATE: "Moderat",
  MINOR: "Mindre",
  INFO: "Informasjon",
};

export const findingSeverityColors: Record<FindingSeverity, string> = {
  CRITICAL: "destructive",
  SERIOUS: "warning",
  MODERATE: "warning",
  MINOR: "info",
  INFO: "secondary",
};

// Checklist Template types
export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  category: string;
  sortOrder: number;
  code: string;
  description: string;
  inputType: ChecklistInputType;
  options?: string[] | null;
  minValue?: number | null;
  maxValue?: number | null;
  unit?: string | null;
  isMandatory: boolean;
  photoRequired: boolean;
  helpText?: string | null;
  defaultSeverity?: FindingSeverity | null;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string | null;
  systemType: string;
  visitType: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  items?: ChecklistTemplateItem[];
}

// Checklist types
export interface ChecklistItem {
  id: string;
  checklistId: string;
  templateItemId?: string | null;
  category: string;
  code: string;
  description: string;
  inputType: ChecklistInputType;
  status: ChecklistItemStatus;
  value?: string | null;
  numericValue?: number | null;
  notes?: string | null;
  severity?: FindingSeverity | null;
  photoUrls?: string[] | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Checklist {
  id: string;
  visitId: string;
  templateId: string;
  technicianId: string;
  status: ChecklistStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  aiSummary?: string | null;
  aiGenerated?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: ChecklistItem[];
  template?: ChecklistTemplate;
}

// Form/input types
export interface UpdateChecklistItemInput {
  id: string;
  status: ChecklistItemStatus;
  value?: string;
  numericValue?: number;
  notes?: string;
  severity?: FindingSeverity;
  photoUrls?: string[];
  gpsLatitude?: number;
  gpsLongitude?: number;
}

export interface CompleteChecklistInput {
  checklistId: string;
  items: UpdateChecklistItemInput[];
  notes?: string;
}

// Checklist category grouping
export interface ChecklistCategory {
  name: string;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  hasIssues: boolean;
}

// Helper functions
export function groupChecklistItems(items: ChecklistItem[]): ChecklistCategory[] {
  const categories = new Map<string, ChecklistItem[]>();
  
  for (const item of items) {
    const existing = categories.get(item.category) ?? [];
    existing.push(item);
    categories.set(item.category, existing);
  }
  
  return Array.from(categories.entries()).map(([name, categoryItems]) => ({
    name,
    items: categoryItems.sort((a, b) => a.code.localeCompare(b.code)),
    completedCount: categoryItems.filter(i => i.status !== "PENDING").length,
    totalCount: categoryItems.length,
    hasIssues: categoryItems.some(i => i.status === "NOT_OK"),
  }));
}

export function getChecklistProgress(checklist: Checklist): number {
  if (!checklist.items || checklist.items.length === 0) return 0;
  const completed = checklist.items.filter(i => i.status !== "PENDING").length;
  return Math.round((completed / checklist.items.length) * 100);
}

export function countFindings(items: ChecklistItem[]): Record<FindingSeverity, number> {
  const counts: Record<FindingSeverity, number> = {
    CRITICAL: 0,
    SERIOUS: 0,
    MODERATE: 0,
    MINOR: 0,
    INFO: 0,
  };
  
  for (const item of items) {
    if (item.status === "NOT_OK" && item.severity) {
      counts[item.severity]++;
    }
  }
  
  return counts;
}
