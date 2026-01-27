// Re-export all types from a single entry point
export * from "./agreements";
export * from "./installations";
export * from "./checklists";
export * from "./visits";
export * from "./tripletex";

// Common utility types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Date range for filtering
export interface DateRange {
  from: Date;
  to: Date;
}

// KPI types
export interface KpiValue {
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend?: "up" | "down" | "stable";
}

export interface DashboardKpis {
  scheduledVisits: KpiValue;
  activeAgreements: KpiValue;
  pendingInvoices: KpiValue;
  technicianUtilization: KpiValue;
}
