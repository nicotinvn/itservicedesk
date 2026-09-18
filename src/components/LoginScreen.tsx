"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const QUICK_ROLE_OPTIONS = [
  { label: "Kỹ thuật viên", username: "minh.le", icon: "build", color: "bg-[#e9ecff] text-[#101a38]" },
  { label: "Trưởng phòng", username: "nam.nguyen", icon: "monitoring", color: "bg-[#eef2ff] text-[#101a38]" },
  { label: "Khoa / Phòng", username: "ha.tran", icon: "local_hospital", color: "bg-[#f2f4ff] text-[#101a38]" },
  { label: "Quản trị", username: "admin", icon: "admin_panel_settings", color: "bg-[#fff3f0] text-[#8a1e1e]" },
] as const;

const BOTTOM_NAV_ITEMS = [
  { label: "Tổng quan", icon: "grid_view" },
  { label: "Yêu cầu", icon: "assignment" },
  { label: "Kỹ thuật", icon: "build" },
  { label: "Khoa phòng", icon: "domain" },
  { label: "Báo cáo", icon: "bar_chart" },
] as const;

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("nam.nguyen");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const demoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const ok = await login(username.trim(), password);
    if (!ok) {
      setError("Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.");
      return;
    }
  };

  const handleQuickRole = (item: (typeof QUICK_ROLE_OPTIONS)[number]) => {
    setUsername(item.username);
    setPassword("123456");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] antialiased selection:bg-[#dbe1ff]">
      <header className="fixed inset-x-0 top-0 z-30 bg-[#faf8ff]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2d69eb] to-[#5d8bff] shadow-[0_4px_12px_rgba(37,99,235,0.28)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3.5L18.5 6.5V11.5C18.5 15.8 16.1 19.4 12 20.8C7.9 19.4 5.5 15.8 5.5 11.5V6.5L12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9.4 12.1L11 13.7L14.8 9.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-[-0.02em] text-[#131b2e]">IT ServiceDesk</div>
              <div className="text-[11px] leading-none text-[#434655]">Báo Cao Thông Kê</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#3d455d] transition-colors hover:text-[#131b2e]" aria-label="Thông báo">
              <span className="material-symbols-outlined text-[21px]">notifications</span>
              <span className="absolute right-1.5 top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#d33030] px-1 text-[9px] font-bold text-white ring-2 ring-[#faf8ff]">3</span>
            </button>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#dfe6ff] bg-[#eef2ff]">
              <img
                alt="Profile"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMUNs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col justify-center px-4 pb-24 pt-24">
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="relative mb-3 flex h-[78px] w-[78px] items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-[#2d69eb] to-[#3755c3] shadow-[0_18px_35px_rgba(37,99,235,0.22)]">
            <div className="absolute inset-0 bg-white/10" />
            <svg className="relative z-10 h-[44px] w-[44px] text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 12L78 24V48C78 68 66 84 50 88C34 84 22 68 22 48V24L50 12Z" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
              <circle cx="50" cy="34" r="5" fill="currentColor" />
              <circle cx="35" cy="56" r="5" fill="currentColor" />
              <circle cx="65" cy="56" r="5" fill="currentColor" />
              <path d="M50 39V49" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M38 54L46 48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M62 54L54 48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M42 52L48 58L60 44" stroke="#d7f6ff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-sm">
              <span className="relative flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4cd7f6] opacity-70" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[#00788c]" />
              </span>
            </div>
          </div>

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#eaedff] px-2.5 py-1 text-[11px] font-semibold text-[#004ac6]">
            <span className="material-symbols-outlined text-[13px]">verified_user</span>
            <span>v2.5 - Enterprise ITIL Standard</span>
          </div>

          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#131b2e] sm:text-[36px]">IT ServiceDesk &amp; KPI</h1>
          <p className="mt-1 text-center text-sm leading-snug text-[#434655] sm:text-[15px]">
            Hệ thống Quản lý Yêu cầu &amp; Chấm điểm KPI CNTT
            <span className="block">Bệnh viện</span>
          </p>
        </div>

        <div className="w-full rounded-[20px] bg-white p-4 shadow-[0_18px_38px_rgba(15,23,42,0.09)] ring-1 ring-[#e2e8f0] sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username-input" className="flex items-center justify-between text-[12px] font-semibold text-[#131b2e]">
                <span>Tên đăng nhập / Mã NV</span>
                <span className="font-normal text-[#737686]">HIS / Active Directory</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[20px] text-[#737686]">person</span>
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="IT0124"
                  className="h-11 w-full rounded-lg border border-transparent bg-[#f2f3ff] pl-10 pr-10 text-[14px] text-[#131b2e] outline-none transition-all placeholder:text-[#737686] focus:border-[#b4c5ff] focus:bg-white focus:ring-2 focus:ring-[#b4c5ff]/30"
                />
                <button
                  type="button"
                  aria-label="Xóa nội dung"
                  onClick={() => setUsername("")}
                  className="absolute right-3 flex h-7 w-7 items-center justify-center text-[#737686] transition-colors hover:text-[#131b2e]"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password-input" className="text-[12px] font-semibold text-[#131b2e]">
                Mật khẩu hệ thống
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[20px] text-[#737686]">lock</span>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  className="h-11 w-full rounded-lg border border-transparent bg-[#f2f3ff] pl-10 pr-11 text-[14px] text-[#131b2e] outline-none transition-all placeholder:text-[#737686] focus:border-[#b4c5ff] focus:bg-white focus:ring-2 focus:ring-[#b4c5ff]/30"
                />
                <button
                  type="button"
                  aria-label="Hiện/Ẩn mật khẩu"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 flex h-7 w-7 items-center justify-center text-[#737686] transition-colors hover:text-[#131b2e]"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-[#2563eb] focus:ring-0" />
                <span className="text-[12px] font-medium text-[#434655]">Lưu phiên làm việc</span>
              </label>
              <button type="button" className="text-[12px] font-semibold text-[#004ac6] hover:underline">
                Quên mật khẩu?
              </button>
            </div>

            {demoModeEnabled && <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#434655]">Vai trò truy cập nhanh</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#005e6e]">
                  <span className="material-symbols-outlined text-[14px]">touch_app</span>
                  Tự động điền
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {QUICK_ROLE_OPTIONS.map((item) => (
                  <button
                    key={item.username}
                    type="button"
                    onClick={() => handleQuickRole(item)}
                    className="flex items-start gap-2 rounded-lg bg-[#f2f3ff] p-2 text-left transition-all hover:bg-[#eaedff] active:scale-[0.99]"
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${item.color}`}>
                      <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-semibold text-[#131b2e]">{item.label}</div>
                      <div className="truncate text-[10px] text-[#434655]">{item.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>}

            {error ? (
              <div className="rounded-lg border border-[#ffdad6] bg-[#fff5f4] px-3 py-2 text-[12px] font-medium text-[#93000a]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] text-[14px] font-semibold text-white shadow-[0_10px_18px_rgba(37,99,235,0.24)] transition-all hover:bg-[#1d4ed8] active:scale-[0.99]"
            >
              <span>Đăng nhập hệ thống</span>
              <span className="material-symbols-outlined text-[20px]">login</span>
            </button>
          </form>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#eaedff] px-3 py-2 text-[12px] text-[#131b2e] shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="min-w-0 truncate">
            Máy chủ HIS/PACS/EMR: <span className="font-semibold">Bình thường (99.98%)</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-[#004ac6]">
            <span className="material-symbols-outlined text-[15px]">speed</span>
            18ms
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#e2e8f0]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[18px]">crisis_alert</span>
              <span>Hotline Kỹ thuật Khẩn cấp (Code Red)</span>
            </div>
            <span className="rounded bg-[#ffdad6] px-1.5 py-0.5 text-[10px] font-bold text-[#93000a]">24/7 SLA</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-y-1 text-[12px] text-[#434655]">
            <span>Máy nhánh nội bộ: <strong className="text-[#131b2e]">Ext 1088</strong></span>
            <span>Đường dây nóng: <strong className="text-[#131b2e]">024.3825.xxxx</strong></span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 text-[11px] text-[#434655]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-[#005e6e]">shield_locked</span>
            Chuẩn Cấp 3 ATTT BYT
          </span>
          <span className="h-1 w-1 rounded-full bg-[#c3c6d7]" />
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-[#004ac6]">verified</span>
            ISO 27001:2022
          </span>
          <span className="h-1 w-1 rounded-full bg-[#c3c6d7]" />
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-[#3755c3]">encrypted</span>
            AES-256
          </span>
        </div>

        <p className="mt-3 text-center text-[11px] text-[#434655]">© 2025 Trung tâm CNTT - Bệnh viện Đa khoa Trung ương.</p>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e2e8f0] bg-[#faf8ff]/95 pb-[max(env(safe-area-inset-bottom),0px)] shadow-[0_-4px_16px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[520px] items-center justify-between gap-0.5 px-2 py-2">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[#434655] transition-colors hover:bg-[#eef2ff] hover:text-[#131b2e]"
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
