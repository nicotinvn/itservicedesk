import type { UserRole } from "@/lib/types";

export type PermissionAction =
  | "VIEW_DASHBOARD"
  | "VIEW_TICKETS"
  | "CREATE_TICKET"
  | "UPDATE_TICKET"
  | "ASSIGN_TICKET"
  | "VIEW_REPORTS"
  | "EXPORT_REPORTS"
  | "MANAGE_KPI"
  | "VIEW_DEPARTMENTS"
  | "MANAGE_USERS"
  | "VIEW_TECHNICIAN_DASHBOARD";

export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  ADMIN: [
    "VIEW_DASHBOARD",
    "VIEW_TICKETS",
    "CREATE_TICKET",
    "UPDATE_TICKET",
    "ASSIGN_TICKET",
    "VIEW_REPORTS",
    "EXPORT_REPORTS",
    "MANAGE_KPI",
    "VIEW_DEPARTMENTS",
    "MANAGE_USERS",
    "VIEW_TECHNICIAN_DASHBOARD",
  ],
  MANAGER: [
    "VIEW_DASHBOARD",
    "VIEW_TICKETS",
    "CREATE_TICKET",
    "UPDATE_TICKET",
    "ASSIGN_TICKET",
    "VIEW_REPORTS",
    "EXPORT_REPORTS",
    "MANAGE_KPI",
    "VIEW_TECHNICIAN_DASHBOARD",
  ],
  TECHNICIAN: [
    "VIEW_DASHBOARD",
    "VIEW_TICKETS",
    "UPDATE_TICKET",
    "VIEW_TECHNICIAN_DASHBOARD",
  ],
  DEPARTMENT_USER: [
    "VIEW_TICKETS",
    "CREATE_TICKET",
    "UPDATE_TICKET",
    "VIEW_DEPARTMENTS",
  ],
};

export const ROUTE_PERMISSIONS: Record<string, PermissionAction[]> = {
  "/": ["VIEW_DASHBOARD"],
  "/tickets": ["VIEW_TICKETS"],
  "/technicians": ["VIEW_TECHNICIAN_DASHBOARD"],
  "/departments": ["VIEW_DEPARTMENTS"],
  "/reports": ["VIEW_REPORTS"],
  "/kpi-config": ["MANAGE_KPI"],
  "/management": ["MANAGE_USERS"],
};

export function hasPermissionForRole(role: UserRole | null | undefined, action: PermissionAction) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(action);
}

export function canAccessRoute(route: string, role: UserRole | null | undefined) {
  if (!role) return false;

  const matchingEntry = Object.entries(ROUTE_PERMISSIONS).find(([path]) => {
    if (path === "/") return route === "/";
    return route === path || route.startsWith(`${path}/`);
  });

  const requiredActions = matchingEntry?.[1] ?? ["VIEW_DASHBOARD"];
  return requiredActions.some((action) => hasPermissionForRole(role, action));
}
