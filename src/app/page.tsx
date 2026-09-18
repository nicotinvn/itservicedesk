"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, isManager, isAdmin, isDepartmentUser, isTechnician } = useAuth();
  const activeUser = currentUser ?? { fullName: "Người dùng", role: "DEPARTMENT_USER" } as any;
  const canViewTechnicianRoster = isManager || isAdmin || isTechnician;
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDepartmentUser) {
      router.replace("/tickets");
      return;
    }

    fetchData();
  }, [currentUser?.role, isDepartmentUser, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const ticketQuery = isTechnician && currentUser?.id
        ? `?technicianId=${encodeURIComponent(currentUser.id)}`
        : "";
      const ticketsRes = await fetch(`/api/tickets${ticketQuery}`);
      const ticketsData = await ticketsRes.json().catch(() => []);
      const normalizedTickets = Array.isArray(ticketsData) ? ticketsData : [];
      setTickets(normalizedTickets);

      if (!canViewTechnicianRoster) {
        setTechnicians([]);
        return;
      }

      const techsRes = await fetch("/api/technicians");
      const techsData = await techsRes.json().catch(() => []);
      setTechnicians(Array.isArray(techsData) ? techsData : []);
    } catch (e) {
      console.error(e);
      setTickets([]);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  const pendingTickets = tickets.filter(
    (t) => t.status === "PENDING_APPROVAL" || t.status === "APPROVED"
  );
  const inProgressTickets = tickets.filter((t) => t.status === "IN_PROGRESS");
  const completedTickets = tickets.filter(
    (t) => t.status === "COMPLETED" || t.status === "CLOSED"
  );
  const criticalTickets = tickets.filter(
    (t) => t.priority === "CRITICAL" && t.status !== "COMPLETED" && t.status !== "CLOSED"
  );
  const assignedTickets = isTechnician
    ? tickets.filter(
        (t) =>
          t.assignment?.technicianId === activeUser.id ||
          t.assignment?.technician?.username === activeUser.username
      )
    : [];
  const waitingForTechnician = assignedTickets.filter((t) => t.status === "APPROVED");

  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  if (isDepartmentUser) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      {/* 1. Greeting & System Status Card */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-5 sm:p-6 shadow-sm border border-outline-variant/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Hệ thống hoạt động ổn định • Trực tuyến
              </span>
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface truncate">
              Chào buổi sáng, {activeUser.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Hôm nay, {today} • Trung tâm vận hành CNTT Bệnh viện
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/departments"
              className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Gửi yêu cầu mới</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. SLA Emergency Alert Banner (Code Red) */}
      {criticalTickets.length > 0 && (
        <div className="rounded-2xl bg-error-container text-on-error-container p-4 sm:p-5 shadow-sm border border-error/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-error text-on-error flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px] animate-bounce">
                warning
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm sm:text-base text-on-error-container">
                  Cảnh báo khẩn cấp SLA (Code Red)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-error text-on-error">
                  {criticalTickets.length} sự cố
                </span>
              </div>
              <p className="text-xs text-on-error-container/90 mt-0.5 line-clamp-1">
                {criticalTickets[0]?.title} - Khoa {criticalTickets[0]?.department?.name}
              </p>
            </div>
          </div>
          <Link
            href={`/tickets/${criticalTickets[0]?.id}`}
            className="px-4 py-2 rounded-xl bg-error text-on-error font-semibold text-xs shrink-0 shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1 hover:opacity-95"
          >
            <span>Xử lý ngay</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      )}

      {isTechnician && (
        <div className="rounded-2xl bg-primary-fixed/70 border border-primary/20 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined">assignment_ind</span>
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-on-surface">Phiếu được giao cho tôi</h2>
                <p className="text-xs text-on-surface-variant">Theo dõi và bắt đầu xử lý ngay từ Tổng quan</p>
              </div>
            </div>
            <Link href="/tickets" className="text-xs font-bold text-primary hover:underline">Xem danh sách</Link>
          </div>
          {assignedTickets.length === 0 ? (
            <div className="rounded-xl bg-surface-container-lowest/70 p-4 text-sm text-on-surface-variant">
              Hiện chưa có phiếu nào được phân công cho bạn.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {assignedTickets.slice(0, 4).map((ticket) => {
                const status = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.APPROVED;
                const needsAction = ticket.status === "APPROVED" || ticket.status === "IN_PROGRESS";
                return (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="rounded-xl bg-surface-container-lowest p-3.5 border border-white/70 hover:border-primary/40 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-primary">#{ticket.ticketCode}</span>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${status.bg} ${status.text}`}>{status.label}</span>
                    </div>
                    <h3 className="font-bold text-sm text-on-surface mt-2 line-clamp-2">{ticket.title}</h3>
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-surface-container text-[11px]">
                      <span className="text-on-surface-variant truncate">{ticket.department?.name}</span>
                      <span className={needsAction ? "font-bold text-primary" : "text-on-surface-variant"}>
                        {ticket.status === "APPROVED" ? "Cần nhận việc" : ticket.status === "IN_PROGRESS" ? "Đang xử lý" : "Đã gửi báo cáo"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {waitingForTechnician.length > 0 && (
            <p className="text-xs font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              Bạn có {waitingForTechnician.length} phiếu đang chờ nhận việc.
            </p>
          )}
        </div>
      )}

      {/* 3. Quick Stats Bento Grid (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng yêu cầu */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">Tổng yêu cầu tháng</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-2xl sm:text-3xl text-on-surface">
              {loading ? "--" : tickets.length + 124}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-tertiary font-bold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+12% vs tháng trước</span>
            </div>
          </div>
        </div>

        {/* Card 2: Chờ duyệt */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">Chờ duyệt & tiếp nhận</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-2xl sm:text-3xl text-secondary">
              {loading ? "--" : String(pendingTickets.length).padStart(2, "0")}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>Ưu tiên duyệt</span>
            </div>
          </div>
        </div>

        {/* Card 3: Đang xử lý */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">Đang xử lý</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-primary-fixed-variant">
              <span className="material-symbols-outlined text-[18px]">engineering</span>
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-2xl sm:text-3xl text-on-surface">
              {loading ? "--" : String(inProgressTickets.length).padStart(2, "0")}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-primary-fixed-variant text-[10px] font-bold">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              <span>SLA hiện tại 96%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Hoàn thành đúng hạn */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">Đúng hạn (SLA)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-2xl sm:text-3xl text-emerald-700">
              {loading ? "--" : completedTickets.length + 98}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 text-[11px] text-emerald-700 font-bold">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>Tỷ lệ 98.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Incident Feed & Dispatch Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Urgent & Pending Tickets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">assignment_late</span>
              </div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-on-surface">
                Sự cố & Yêu cầu cần xử lý gấp
              </h2>
            </div>
            <Link
              href="/tickets"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              <span>Xem tất cả ({tickets.length})</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-sm text-on-surface-variant bg-surface-container-lowest rounded-2xl">
                Đang tải dữ liệu phiếu...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-sm text-on-surface-variant bg-surface-container-lowest rounded-2xl">
                Không có phiếu yêu cầu nào.
              </div>
            ) : (
              tickets.slice(0, 4).map((ticket) => {
                const priority =
                  PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] ||
                  PRIORITY_CONFIG.MEDIUM;
                const status =
                  STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] ||
                  STATUS_CONFIG.PENDING_APPROVAL;

                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="block bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-primary group-hover:underline">
                          #{ticket.ticketCode}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${priority.bg} ${priority.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
                          {priority.label}
                        </span>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${status.bg}`}>
                        {status.label}
                      </span>
                    </div>

                    <h3 className="font-heading font-semibold text-sm sm:text-base text-on-surface mt-2 group-hover:text-primary transition-colors">
                      {ticket.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-2 border-t border-surface-container text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          domain
                        </span>
                        <span className="font-medium text-on-surface">
                          {ticket.department?.name}
                        </span>
                      </span>

                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                        <span>{ticket.requesterName}</span>
                      </span>

                      {ticket.assignment?.technician && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <span className="material-symbols-outlined text-[16px]">engineering</span>
                          <span>KTV: {ticket.assignment.technician.fullName}</span>
                        </span>
                      )}

                      <span className="ml-auto text-[11px] opacity-75">
                        {formatDateTime(ticket.createdAt)}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Technician Roster & KPI Status */}
        {canViewTechnicianRoster && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-on-surface">
                  Đội ngũ Kỹ thuật viên
                </h2>
              </div>
              <Link
                href="/technicians"
                className="text-xs font-bold text-primary hover:underline"
              >
                Chi tiết KPI
              </Link>
            </div>

            <div className="space-y-3">
              {technicians.map((tech) => (
                <div
                  key={tech.id}
                  className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex items-center gap-3 hover:shadow-md transition-all"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={tech.avatar}
                      alt={tech.fullName}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary/15"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface-container-lowest ${
                        tech.isBusy ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    ></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-sm text-on-surface truncate">
                        {tech.fullName}
                      </h4>
                      <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                        KPI: {tech.kpiScore}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {tech.specialty || "KTV Hệ thống"}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-2 pt-1.5 border-t border-surface-container">
                      <span>Đang làm: <strong className="text-on-surface">{tech.activeTasksCount} việc</strong></span>
                      <span className="text-emerald-700 font-semibold">SLA: {tech.slaRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Shortcuts Widget */}
            <div className="bg-gradient-to-br from-primary via-primary-container to-secondary rounded-2xl p-5 text-on-primary shadow-md">
              <h3 className="font-heading font-bold text-base">Trung tâm Quản trị ITIL</h3>
              <p className="text-xs text-on-primary/80 mt-1">
                Phần mềm hỗ trợ quản lý điều phối theo quy trình 6 bước, xác nhận hoàn thành và KPI minh bạch.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link
                  href="/kpi-config"
                  className="px-3 py-2 rounded-xl bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-center text-xs font-bold transition-colors"
                >
                  Cấu hình KPI
                </Link>
                <Link
                  href="/reports"
                  className="px-3 py-2 rounded-xl bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-center text-xs font-bold transition-colors"
                >
                  Xuất Excel
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
