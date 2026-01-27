import "server-only";

import type { 
  SystemUser, 
  Employee,
  Permission,
  SuncareRole,
} from "@energismart/shared";

import { 
  hasPermission, 
  hasAppAccess,
  getAppRole,
  getAppPermissions,
  getEmployee,
  isEmployeeAvailable
} from "@energismart/shared";

// App identifier for permission checks (matches @energismart/shared)
export const APP_ID = "suncare";

// Permission types for this app (matching @energismart/shared Permission type)
export type AppPermission = 
  | "service:read"
  | "service:write"
  | "service:delete"
  | "service:dispatch"
  | "service:checklists"
  | "service:reports"
  | "service:invoicing"
  | "service:customer_portal"
  | "agreements:read"
  | "agreements:write"
  | "agreements:delete"
  | "installations:read"
  | "installations:write"
  | "employees:read"
  | "employees:write"
  | "settings:read"
  | "settings:write";

// Legacy permission mapping for backwards compatibility with existing procedures
// Maps local permission names to @energismart/shared Permission names
const PERMISSION_MAP: Record<string, Permission> = {
  "visits:read": "service:read",
  "visits:write": "service:write",
  "checklists:read": "service:checklists",
  "checklists:write": "service:checklists",
  "invoices:read": "service:invoicing",
  "invoices:write": "service:invoicing",
  "reports:read": "service:reports",
  "reports:generate": "service:reports",
  "admin:full": "admin:system",
};

// Check if user has access to this app
export function checkAppAccess(user: SystemUser | null): boolean {
  if (!user) return false;
  return hasAppAccess(user, APP_ID);
}

// Check if user has specific permission
export function checkPermission(user: SystemUser | null, permission: string): boolean {
  if (!user) return false;
  
  // Super admins have all permissions
  if (user.globalRole === "super_admin") {
    return true;
  }
  
  // Map legacy permission names to @energismart/shared names
  const mappedPermission = PERMISSION_MAP[permission] ?? permission;
  
  // Check if user has permission via @energismart/shared
  if (hasPermission(user, mappedPermission as Permission)) {
    return true;
  }
  
  // Also check role-based permissions for suncare
  const userPermissions = getAppPermissions(user, APP_ID);
  return userPermissions.includes(mappedPermission as Permission);
}

// Get user's role in this app
export function getUserRole(user: SystemUser | null): SuncareRole | null {
  if (!user) return null;
  
  // Super admins are treated as service_lead
  if (user.globalRole === "super_admin") {
    return "service_lead";
  }
  
  // Get role from app access
  const role = getAppRole(user, APP_ID);
  return role as SuncareRole | null;
}

// Get employee data for a user
export async function getEmployeeForUser(userId: string): Promise<Employee | null> {
  try {
    const employee = await getEmployee(userId);
    return employee;
  } catch {
    return null;
  }
}

// Check if employee is available on a date
export async function checkEmployeeAvailability(
  employeeId: string,
  date: string
): Promise<{ available: boolean; blockedBy?: string }> {
  try {
    const availability = await isEmployeeAvailable(employeeId, date);
    return availability;
  } catch {
    return { available: false, blockedBy: "Error checking availability" };
  }
}

// Session type for our app
export interface AppSession {
  user: SystemUser;
  employee: Employee | null;
  role: SuncareRole | null;
  permissions: Permission[];
}

// Get full session with employee data
export async function getAppSession(user: SystemUser | null): Promise<AppSession | null> {
  if (!user) return null;
  if (!checkAppAccess(user)) return null;
  
  const role = getUserRole(user);
  const permissions = getAppPermissions(user, APP_ID);
  
  let employee: Employee | null = null;
  try {
    employee = await getEmployee(user.id);
  } catch {
    // Employee data not available
  }
  
  return {
    user,
    employee,
    role,
    permissions,
  };
}
