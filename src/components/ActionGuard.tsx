"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import type { PermissionAction } from "@/lib/permissions";

export default function ActionGuard({
  action,
  children,
  fallback = null,
}: {
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission } = useAuth();

  if (!hasPermission(action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
