import type { UserRole } from "@/lib/types";
import { AUTH_COOKIE_KEY, AUTH_ROLE_COOKIE_KEY, findAuthUserByUsername } from "@/lib/auth-preset";
import { hasPermissionForRole, type PermissionAction } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export function getAuthUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieParts = cookieHeader.split(";").map((part) => part.trim());
  const matched = cookieParts.find((part) => part.startsWith(`${AUTH_COOKIE_KEY}=`));

  if (!matched) return null;

  const rawValue = matched.slice(`${AUTH_COOKIE_KEY}=`.length);
  const username = decodeURIComponent(rawValue);
  const presetUser = findAuthUserByUsername(username);
  if (presetUser) return presetUser;

  const roleMatch = cookieParts.find((part) => part.startsWith(`${AUTH_ROLE_COOKIE_KEY}=`));
  const role = roleMatch
    ? decodeURIComponent(roleMatch.slice(`${AUTH_ROLE_COOKIE_KEY}=`.length))
    : null;
  if (!role) return null;

  return {
    id: username,
    username,
    fullName: username,
    email: username,
    role: role as UserRole,
  };
}

export function getAuthUsernameFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieParts = cookieHeader.split(";").map((part) => part.trim());
  const matched = cookieParts.find((part) => part.startsWith(`${AUTH_COOKIE_KEY}=`));

  if (!matched) return null;
  return decodeURIComponent(matched.slice(`${AUTH_COOKIE_KEY}=`.length));
}

export async function resolveDbUserFromRequest(request: Request) {
  const authUser = getAuthUserFromRequest(request);
  const username = authUser?.username ?? getAuthUsernameFromRequest(request);
  if (!username) return null;

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, ...(authUser?.email ? [{ email: authUser.email }] : [])],
    },
  });

  return dbUser;
}

export function requireRole(request: Request, allowedRoles: UserRole[]) {
  const user = getAuthUserFromRequest(request);

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized: vui lòng đăng nhập" } as const;
  }

  if (!allowedRoles.includes(user.role)) {
    return { ok: false, status: 403, error: "Forbidden: không đủ quyền truy cập" } as const;
  }

  return { ok: true, user } as const;
}

export function requirePermission(request: Request, action: PermissionAction) {
  const user = getAuthUserFromRequest(request);

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized: vui lòng đăng nhập" } as const;
  }

  if (!hasPermissionForRole(user.role, action)) {
    return {
      ok: false,
      status: 403,
      error: `Forbidden: bạn không có quyền thực hiện hành động "${action}"`,
    } as const;
  }

  return { ok: true, user } as const;
}
