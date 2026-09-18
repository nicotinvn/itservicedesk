"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth, PRESET_USERS } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import ProfileModal from "@/components/ProfileModal";
import type { PermissionAction } from "@/lib/permissions";

const DESKTOP_NAV_ITEMS: Array<{ label: string; href: string; permission: PermissionAction }> = [
  { label: "Tổng quan", href: "/", permission: "VIEW_DASHBOARD" },
  { label: "Phiếu yêu cầu", href: "/tickets", permission: "VIEW_TICKETS" },
  { label: "Kỹ thuật viên", href: "/technicians", permission: "VIEW_TECHNICIAN_DASHBOARD" },
  { label: "Khoa phòng", href: "/departments", permission: "VIEW_DEPARTMENTS" },
  { label: "Thống kê", href: "/reports", permission: "VIEW_REPORTS" },
  { label: "Cấu hình KPI", href: "/kpi-config", permission: "MANAGE_KPI" },
  { label: "Danh mục", href: "/management", permission: "MANAGE_USERS" },
];

export default function Header() {
  const { currentUser, switchUser, logout, hasPermission } = useAuth();
  const { showToast } = useToast();
  const activeUser = currentUser ?? PRESET_USERS[0];
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotiModal, setShowNotiModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.03)] pt-safe">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shadow-sm shadow-primary/20 flex-shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">local_hospital</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-on-surface text-base sm:text-lg leading-tight tracking-tight">
                  IT ServiceDesk
                </span>
                <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-fixed text-on-primary-fixed">
                  BV-ITIL 2.4
                </span>
              </div>
              <span className="text-xs text-on-surface-variant truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Hệ thống trực tuyến 24/7
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation shortcuts */}
          <nav className="hidden lg:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
            {DESKTOP_NAV_ITEMS.filter((item) => currentUser && hasPermission(item.permission)).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest transition-all"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action: Role Switcher & Notifications */}
          <div className="flex items-center gap-2">
            {/* Quick Role Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant/30 text-left"
                title="Bấm để đổi vai trò thử nghiệm"
              >
                <img
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowRoleMenu(false);
                    setShowProfileModal(true);
                  }}
                  src={activeUser.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY"}
                  alt={activeUser.fullName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0 cursor-pointer"
                />
                <div className="hidden sm:flex flex-col min-w-0 pr-1">
                  <span className="text-xs font-bold text-on-surface truncate leading-tight">
                    {activeUser.fullName}
                  </span>
                  <span className="text-[11px] font-medium text-primary leading-tight">
                    {activeUser.role === "MANAGER"
                      ? "Trưởng phòng CNTT"
                      : activeUser.role === "TECHNICIAN"
                      ? "Kỹ thuật viên"
                      : activeUser.role === "DEPARTMENT_USER"
                      ? activeUser.departmentName || "Khoa / Phòng"
                      : "Quản trị hệ thống"}
                  </span>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">
                  swap_vert
                </span>
              </button>

              {/* Role Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-surface-container text-xs text-on-surface-variant font-medium">
                    Chọn vai trò để trải nghiệm:
                  </div>
                  <div className="p-1 space-y-1">
                    {PRESET_USERS.map((user) => {
                      const isSelected = user.username === activeUser.username;
                      return (
                        <button
                          key={user.username}
                          onClick={() => {
                            switchUser(user.username);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                            isSelected
                              ? "bg-primary-fixed text-on-primary-fixed font-semibold"
                              : "hover:bg-surface-container-low text-on-surface"
                          }`}
                        >
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-black/10"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm truncate">{user.fullName}</span>
                            <span className="text-xs opacity-75 truncate">
                              {user.specialty || user.departmentName}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[18px] text-primary">
                              check
                            </span>
                          )}
                        </button>
                      );
                    })}
                    <div className="px-3 pt-2 border-t">
                      <button
                        onClick={() => {
                          // open change password modal via state
                          setShowRoleMenu(false);
                          // use custom event to open modal
                          const ev = new CustomEvent('openChangePasswordModal');
                          window.dispatchEvent(ev);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs hover:bg-surface-container-low"
                      >
                        <span className="material-symbols-outlined text-[16px]">vpn_key</span>
                        <span>Đổi mật khẩu</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-colors text-xs font-bold"
            >
              Đăng xuất
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotiModal(true)}
              aria-label="Thông báo"
              className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-error text-on-error font-bold text-[10px] rounded-full ring-2 ring-surface-container-lowest animate-bounce">
                2
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Notification Modal */}
      {showNotiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  notifications_active
                </span>
                <h3 className="font-heading font-bold text-on-surface text-base">
                  Thông báo khẩn cấp hệ thống
                </h3>
              </div>
              <button
                onClick={() => setShowNotiModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="p-3 rounded-xl bg-error-container text-on-error-container flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-[24px] flex-shrink-0 mt-0.5">
                  warning
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Cảnh báo SLA khẩn cấp</span>
                    <span className="text-xs opacity-75">10 phút trước</span>
                  </div>
                  <p className="text-xs mt-1">
                    Phiếu #YC2025060001 (Khoa Cấp cứu) sắp chạm mốc 45 phút cam kết SLA!
                  </p>
                  <Link
                    href="/tickets"
                    onClick={() => setShowNotiModal(false)}
                    className="inline-block mt-2 text-xs font-bold underline"
                  >
                    Xem chi tiết phiếu →
                  </Link>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[24px] flex-shrink-0 mt-0.5">
                  assignment_add
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-on-surface">Yêu cầu mới gửi</span>
                    <span className="text-xs text-on-surface-variant">15 phút trước</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    #YC2025060002: Khoa Khám bệnh gửi yêu cầu sửa máy in hóa đơn viện phí.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[24px] flex-shrink-0 mt-0.5">
                  task_alt
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-on-surface">Hoàn thành & CSAT</span>
                    <span className="text-xs text-on-surface-variant">1 giờ trước</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Khoa Nội Tim Mạch đã đánh giá 10 điểm (Rất hài lòng) cho KTV Lê Văn Minh.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low border-t border-surface-container flex justify-end">
              <button
                onClick={() => setShowNotiModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-medium text-xs shadow-sm hover:opacity-95"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
      <ChangePasswordModal />
      <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  );
}
