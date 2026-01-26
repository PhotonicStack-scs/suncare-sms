import "server-only";

// Re-export auth functions from @energismart/shared
// Note: This file serves as a local adapter for the shared auth package

export type UserRole = "ADMIN" | "SERVICE_MANAGER" | "PLANNER" | "TECHNICIAN" | "FINANCE";

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  permissions: string[];
  employeeId?: string;
}

export interface Session {
  user: SystemUser;
  expires: string;
}

// App-specific permissions
export const APP_PERMISSIONS = {
  // Agreements
  "agreements:read": "View service agreements",
  "agreements:write": "Create and edit agreements",
  "agreements:delete": "Delete agreements",
  "agreements:approve": "Approve agreements",

  // Visits
  "visits:read": "View service visits",
  "visits:write": "Create and schedule visits",
  "visits:complete": "Complete visits and checklists",
  "visits:assign": "Assign technicians to visits",

  // Checklists
  "checklists:read": "View checklists",
  "checklists:write": "Edit checklists",
  "checklists:templates": "Manage checklist templates",

  // Invoices
  "invoices:read": "View invoices",
  "invoices:write": "Create invoices",
  "invoices:approve": "Approve invoices",

  // Reports
  "reports:read": "View reports",
  "reports:generate": "Generate reports",

  // Admin
  "admin:users": "Manage users",
  "admin:settings": "Manage settings",
  "admin:integrations": "Manage integrations",
} as const;

export type Permission = keyof typeof APP_PERMISSIONS;

// Role-permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: Object.keys(APP_PERMISSIONS) as Permission[],
  SERVICE_MANAGER: [
    "agreements:read",
    "agreements:write",
    "agreements:approve",
    "visits:read",
    "visits:write",
    "visits:complete",
    "visits:assign",
    "checklists:read",
    "checklists:write",
    "checklists:templates",
    "invoices:read",
    "reports:read",
    "reports:generate",
  ],
  PLANNER: [
    "agreements:read",
    "visits:read",
    "visits:write",
    "visits:assign",
    "checklists:read",
    "reports:read",
  ],
  TECHNICIAN: [
    "agreements:read",
    "visits:read",
    "visits:complete",
    "checklists:read",
    "checklists:write",
    "reports:read",
  ],
  FINANCE: [
    "agreements:read",
    "visits:read",
    "checklists:read",
    "invoices:read",
    "invoices:write",
    "invoices:approve",
    "reports:read",
    "reports:generate",
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: SystemUser | null, permission: Permission): boolean {
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === "ADMIN") return true;
  
  // Check explicit permissions
  if (user.permissions.includes(permission)) return true;
  
  // Check role-based permissions
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: SystemUser | null, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: SystemUser | null, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

/**
 * Check if user has access to this app
 */
export function hasAppAccess(user: SystemUser | null): boolean {
  if (!user) return false;
  // All defined roles have access to this app
  return Object.keys(ROLE_PERMISSIONS).includes(user.role);
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: SystemUser): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS[user.role] ?? [];
  const explicitPermissions = user.permissions.filter(
    (p): p is Permission => p in APP_PERMISSIONS
  );
  return [...new Set([...rolePermissions, ...explicitPermissions])];
}

// Mock session for development (replace with actual @energismart/shared integration)
let mockSession: Session | null = null;

export async function getSession(): Promise<Session | null> {
  // TODO: Replace with actual @energismart/shared session handling
  // import { getSession as getSharedSession } from '@energismart/shared';
  // return getSharedSession();
  
  if (process.env.NODE_ENV === "development" && mockSession) {
    return mockSession;
  }
  
  return null;
}

export async function getCurrentUser(): Promise<SystemUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

// Development helper to set mock session
export function setMockSession(session: Session | null): void {
  if (process.env.NODE_ENV === "development") {
    mockSession = session;
  }
}

// Create a development user for testing
export const DEV_USER: SystemUser = {
  id: "dev-user-1",
  email: "dev@energismart.no",
  name: "Developer User",
  role: "ADMIN",
  permissions: [],
  employeeId: "emp-1",
};

export const DEV_SESSION: Session = {
  user: DEV_USER,
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

// Initialize mock session in development
if (process.env.NODE_ENV === "development") {
  mockSession = DEV_SESSION;
}
