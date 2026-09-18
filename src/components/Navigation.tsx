"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { PermissionAction } from "@/lib/permissions";

export default function Navigation() {
  const pathname = usePathname();
  const { currentUser, hasPermission } = useAuth();

  const navItems = [
    { label: "Tổng quan", href: "/", icon: "dashboard", permission: "VIEW_DASHBOARD" },
    { label: "Phiếu yêu cầu", href: "/tickets", icon: "assignment", permission: "VIEW_TICKETS" },
    { label: "Kỹ thuật viên", href: "/technicians", icon: "engineering", permission: "VIEW_TECHNICIAN_DASHBOARD" },
    { label: "Khoa phòng", href: "/departments", icon: "domain", permission: "VIEW_DEPARTMENTS" },
    { label: "Thống kê", href: "/reports", icon: "query_stats", permission: "VIEW_REPORTS" },
  ] as Array<{
    label: string;
    href: string;
    icon: string;
    permission: PermissionAction;
  }>;

  const visibleNavItems = navItems.filter((item) => currentUser && hasPermission(item.permission));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container shadow-[0_-2px_12px_rgba(0,0,0,0.05)] lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all min-h-[44px] ${
                isActive
                  ? "text-primary-container font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <div
                className={`w-9 h-7 flex items-center justify-center rounded-full transition-all ${
                  isActive ? "bg-primary-fixed text-primary" : ""
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {item.icon}
                </span>
              </div>
              <span className="text-[11px] leading-tight truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
