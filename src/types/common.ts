// Common types used across the application

export interface Address {
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface DateRange {
  start: Date;
  end?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface SortParams<T extends string = string> {
  field: T;
  direction: "asc" | "desc";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Status types for UI
export type StatusType = "scheduled" | "inProgress" | "completed" | "blocked" | "pending";

// Money/currency helpers
export interface Money {
  amount: number;
  currency: string;
}

export function formatMoney(money: Money, locale = "nb-NO"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
  }).format(money.amount);
}

export function formatNumber(value: number, locale = "nb-NO"): string {
  return new Intl.NumberFormat(locale).format(value);
}

// Date formatting helpers
export function formatDate(date: Date | string, locale = "nb-NO"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale = "nb-NO"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTime(date: Date | string, locale = "nb-NO"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
