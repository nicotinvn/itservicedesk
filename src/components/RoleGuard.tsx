"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { PermissionAction } from "@/lib/permissions";
import { ROLE_LABELS, UserRole } from "@/lib/types";

export default function RoleGuard({
  allowedRoles,
  requiredPermissions = [],
  children,
}: {
  allowedRoles?: UserRole[];
  requiredPermissions?: PermissionAction[];
  children: React.ReactNode;
}) {
  const { currentUser, logout, hasPermission } = useAuth();

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-container p-6">
        <div className="w-full max-w-md rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[30px]">lock</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Vui lòng đăng nhập</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Hệ thống cần xác thực vai trò trước khi mở chức năng này.
          </p>
          <button
            onClick={logout}
            className="mt-5 h-11 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary"
          >
            Quay lại màn hình đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const hasRoleAccess = allowedRoles ? allowedRoles.includes(currentUser.role) : true;
  const hasActionAccess =
    requiredPermissions.length === 0 || requiredPermissions.some((action) => hasPermission(action));
  const hasAccess = hasRoleAccess && hasActionAccess;

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-container p-6">
        <div className="w-full max-w-lg rounded-2xl border border-error/20 bg-surface-container-lowest p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-container text-error">
            <span className="material-symbols-outlined text-[32px]">block</span>
          </div>
          <h2 className="text-2xl font-black text-on-surface">Không có quyền truy cập</h2>
          <p className="mt-3 text-sm text-on-surface-variant">
            Tài khoản hiện tại là <span className="font-bold text-on-surface">{ROLE_LABELS[currentUser.role]}</span>.
            Chức năng này bắt buộc phải có quyền:
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(allowedRoles ?? []).map((role) => (
              <span
                key={role}
                className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed"
              >
                {ROLE_LABELS[role]}
              </span>
            ))}
            {requiredPermissions.map((permission) => (
              <span
                key={permission}
                className="rounded-full border border-outline-variant bg-surface-container px-3 py-1 text-[10px] font-bold text-on-surface-variant uppercase"
              >
                {permission}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary flex items-center justify-center"
            >
              Về tổng quan
            </Link>
            <button
              onClick={logout}
              className="h-11 rounded-xl border border-outline-variant bg-surface-container px-4 text-sm font-bold text-on-surface"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
