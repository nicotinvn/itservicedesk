import type { UserRole } from "@/lib/types";
import crypto from "crypto";
import { AUTH_COOKIE_KEY, AUTH_ROLE_COOKIE_KEY, AUTH_SESSION_COOKIE_KEY, findAuthUserByUsername } from "@/lib/auth-preset";
import { hasPermissionForRole, type PermissionAction } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function getSessionSecret() {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || "local-development-secret";
}

type SessionPayload = { id: string; username: string; role: UserRole; exp: number };

function signSessionPayload(payload: SessionPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export function setAuthSession(response: NextResponse, user: { id: string; username: string; role: UserRole }) {
  response.cookies.set(AUTH_SESSION_COOKIE_KEY, signSessionPayload({ ...user, exp: Date.now() + 86400000 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  return response;
}

export function getAuthUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieParts = cookieHeader.split(";").map((part) => part.trim());
  const sessionMatch = cookieParts.find((part) => part.startsWith(`${AUTH_SESSION_COOKIE_KEY}=`));
  if (sessionMatch) {
    const session = verifySessionToken(decodeURIComponent(sessionMatch.slice(`${AUTH_SESSION_COOKIE_KEY}=`.length)));
    if (!session) return null;
    return { id: session.id, username: session.username, fullName: session.username, email: session.username, role: session.role };
  }

  if (process.env.DEMO_MODE === "false") return null;
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
