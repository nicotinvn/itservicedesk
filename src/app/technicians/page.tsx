"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getKpiRank } from "@/lib/types";
import { useToast } from "@/components/Toast";
import RoleGuard from "@/components/RoleGuard";

// ─── SLA Countdown Ring ───────────────────────────────────────────────────────
function SlaRing({
  remainingMin,
  totalMin,
}: {
  remainingMin: number;
  totalMin: number;
}) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, remainingMin / totalMin));
  const offset = circ * (1 - pct);
  const color =
    pct > 0.25 ? "text-amber-500" : "text-error";

  return (
    <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
        <circle
          className="text-surface-container-highest"
          cx="24"
          cy="24"
          fill="none"
          r={r}
          stroke="currentColor"
          strokeWidth="4"
        />
        <circle
          className={color}
          cx="24"
          cy="24"
          fill="none"
          r={r}
          stroke="currentColor"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <span
        className={`material-symbols-outlined absolute text-[20px] ${color} animate-pulse`}
      >
        hourglass_bottom
      </span>
    </div>
  );
}

// ─── Active Ticket Card ───────────────────────────────────────────────────────
function ActiveTicketCard({ ticket }: { ticket: any }) {
  const { showToast } = useToast();
  const [workStatus, setWorkStatus] = useState<"started" | "inspecting" | null>(
    ticket.status === "IN_PROGRESS" ? "started" : null
  );
  const [currentStatus, setCurrentStatus] = useState(ticket.status);
  const [submitted, setSubmitted] = useState(Boolean(ticket.taskReport));
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [proofImages, setProofImages] = useState<string[]>(() => {
    if (!ticket.taskReport?.proofImages) return [];
    try {
      const parsed = typeof ticket.taskReport.proofImages === "string"
        ? JSON.parse(ticket.taskReport.proofImages)
        : ticket.taskReport.proofImages;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [remainingMin, setRemainingMin] = useState(28);

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMin((m) => Math.max(0, m - 1));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const handleStartWork = async () => {
    try {
      setStarting(true);
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Không thể bắt đầu xử lý");
      setCurrentStatus("IN_PROGRESS");
      setWorkStatus("started");
      showToast("Đã nhận việc", "Phiếu đã chuyển sang trạng thái đang xử lý.", "success");
    } catch (error) {
      showToast("Không thể bắt đầu", error instanceof Error ? error.message : "Vui lòng thử lại", "error");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (currentStatus !== "IN_PROGRESS" || submitted) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportContent: "Đã hoàn tất kiểm tra và xử lý sự cố. Thiết bị hoạt động ổn định sau khi kiểm tra.",
          proofImages,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Không thể nộp báo cáo");
      setCurrentStatus("PENDING_CONFIRMATION");
      setSubmitted(true);
      showToast("Thành công!", "Đã gửi báo cáo và chuyển Trưởng phòng xác nhận.", "success");
    } catch (error) {
      showToast("Không thể nộp báo cáo", error instanceof Error ? error.message : "Vui lòng thử lại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProofImagePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      const formData = new FormData();
      Array.from(files)
        .slice(0, Math.max(0, 5 - proofImages.length))
        .forEach((file) => formData.append("files", file));
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Không thể tải ảnh");
      setProofImages((previous) => [...previous, ...(Array.isArray(data.urls) ? data.urls : [])].slice(0, 5));
      showToast("Đã thêm ảnh", "Ảnh sẽ được gửi cùng báo cáo hoàn thành.", "success");
    } catch (error) {
      showToast("Lỗi ảnh", error instanceof Error ? error.message : "Không thể tải ảnh", "error");
    } finally {
      event.target.value = "";
    }
  };

  const priorityLabel = ticket?.priority === "URGENT" ? "Khẩn cấp" : ticket?.priority === "HIGH" ? "Cao" : "Bình thường";
  const isUrgent = ticket?.priority === "URGENT";

  return (
    <>
      {/* ── Active Ticket ── */}
      <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-4 flex flex-col gap-3 relative overflow-hidden">
        {/* Badge bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {isUrgent && (
              <span className="px-2 py-0.5 rounded-md bg-error-container text-on-error-container text-[11px] font-bold flex items-center gap-1 animate-pulse">
                <span className="material-symbols-outlined text-[14px]">
                  local_fire_department
                </span>
                {priorityLabel}
              </span>
            )}
            {!isUrgent && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Đang xử lý
              </span>
            )}
            <span className="text-[12px] font-bold text-primary">
              #{ticket?.ticketCode}
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded-md">
            Bước {ticket?.currentStep || 5}/6
          </span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[16px] font-bold text-on-surface leading-snug">
            {ticket?.title}
          </h3>
          <div className="flex items-center gap-1 text-on-surface-variant text-[13px]">
            <span className="material-symbols-outlined text-[16px] text-error">
              emergency
            </span>
            <span className="font-semibold text-on-surface">
              {ticket?.department?.name}
            </span>
            {ticket?.location && (
              <span>• {ticket.location}</span>
            )}
          </div>
        </div>

        {/* SLA Countdown */}
        <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <SlaRing remainingMin={remainingMin} totalMin={60} />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-on-surface-variant">
                Thời hạn SLA {isUrgent ? "khẩn cấp" : ""}
              </span>
              <span
                className={`text-[16px] font-bold tracking-tight ${
                  remainingMin <= 15 ? "text-error" : "text-amber-600"
                }`}
              >
                Còn {remainingMin} phút
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-on-surface-variant">
              Hạn chót: {ticket?.slaDeadline ? new Date(ticket.slaDeadline).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "10:45"}
            </span>
            <span className="text-[10px] font-semibold text-tertiary bg-tertiary-fixed/30 px-1.5 py-0.5 rounded">
              Trong khung cam kết
            </span>
          </div>
        </div>

        {/* Quick status buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleStartWork}
            disabled={starting || currentStatus !== "APPROVED"}
            className={`h-10 px-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              currentStatus === "IN_PROGRESS"
                ? "bg-primary text-on-primary shadow-sm cursor-default"
                : currentStatus !== "APPROVED"
                ? "bg-surface-container text-on-surface-variant cursor-not-allowed"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              play_circle
            </span>
            <span>{starting ? "Đang cập nhật..." : currentStatus === "IN_PROGRESS" ? "Đang xử lý" : "Bắt đầu xử lý"}</span>
          </button>
          <button
            onClick={() => setWorkStatus("inspecting")}
            disabled={currentStatus !== "IN_PROGRESS"}
            className={`h-10 px-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              workStatus === "inspecting"
                ? "bg-secondary-fixed text-on-secondary-fixed shadow-sm"
                : currentStatus !== "IN_PROGRESS"
                ? "bg-surface-container text-on-surface-variant cursor-not-allowed"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              build_circle
            </span>
            <span>Đang kiểm tra TB</span>
          </button>
        </div>
      </section>

      {/* ── Report Form (Step 5) ── */}
      <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">
              assignment_turned_in
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-primary font-bold uppercase tracking-wider">
              Bước 5 / 6 Quy trình xử lý
            </span>
            <h3 className="text-[16px] font-bold text-on-surface truncate">
              Nghiệm thu & Báo cáo kết quả
            </h3>
          </div>
        </div>

        {/* Action notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-on-surface flex items-center justify-between">
            <span>Chi tiết phương án & kết quả xử lý</span>
            <span className="text-tertiary text-[11px] font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">
                check_circle
              </span>
              Đạt chuẩn HIS
            </span>
          </label>
          <div className="w-full bg-surface-container-low rounded-xl p-3 text-on-surface text-[14px] shadow-inner flex flex-col gap-1">
            <p className="leading-relaxed">
              Đã bấm lại đầu mạng Cat6 cho máy trạm tiếp đón số 1, cấu hình
              lại IP tĩnh máy in mã vạch Zebra ZD230. Đã in thử phiếu khám
              thành công.
            </p>
            <span className="text-[11px] text-on-surface-variant italic text-right mt-1">
              Cập nhật lúc 10:17 - Hiện trường Khoa CC
            </span>
          </div>
        </div>

        {/* Time metric */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-on-surface">
            Thời gian thực hiện thực tế
          </label>
          <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-tertiary">
                timer
              </span>
              <span className="text-[16px] font-bold text-on-surface">
                25 phút
              </span>
            </div>
            <span className="px-2 py-1 rounded-md bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                trending_up
              </span>
              Tiết kiệm 20 phút so với SLA
            </span>
          </div>
        </div>

        {/* Proof images */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-semibold text-on-surface">
              Minh chứng hoàn thành (2 ảnh)
            </label>
            <div className="flex items-center gap-1.5">
              <label className="text-[12px] text-primary font-medium flex items-center gap-1 cursor-pointer hover:underline">
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                Chụp ảnh
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleProofImagePick} disabled={submitted} />
              </label>
              <label className="text-[12px] text-primary font-medium flex items-center gap-1 cursor-pointer hover:underline">
                <span className="material-symbols-outlined text-[14px]">upload_file</span>
                Tải ảnh
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleProofImagePick} disabled={submitted} />
              </label>
            </div>
          </div>
          {proofImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {proofImages.map((image, index) => (
                <div key={`${image}-${index}`} className="flex flex-col gap-1">
                  <div className="relative rounded-xl overflow-hidden shadow-sm aspect-video bg-surface-container">
                    <img src={image} alt={`Ảnh minh chứng ${index + 1}`} className="w-full h-full object-cover" />
                    {!submitted && (
                      <button type="button" onClick={() => setProofImages((previous) => previous.filter((_, itemIndex) => itemIndex !== index))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs">×</button>
                    )}
                  </div>
                  <span className="text-[11px] text-on-surface-variant truncate">Ảnh bổ sung {index + 1}</span>
                </div>
              ))}
            </div>
          )}
          {proofImages.length === 0 && <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="relative rounded-xl overflow-hidden shadow-sm aspect-video bg-surface-container">
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[36px]">
                    image
                  </span>
                </div>
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-on-surface/70 backdrop-blur-sm text-white text-[10px] font-medium">
                  Ảnh máy in
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant truncate">
                Máy in hoạt động tốt
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="relative rounded-xl overflow-hidden shadow-sm aspect-video bg-surface-container">
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[36px]">
                    description
                  </span>
                </div>
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-on-surface/70 backdrop-blur-sm text-white text-[10px] font-medium">
                  Biên bản
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant truncate">
                Ký xác nhận ĐD Trưởng
              </span>
            </div>
          </div>}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || submitted || currentStatus !== "IN_PROGRESS"}
          className={`w-full h-12 mt-1 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
            submitted
              ? "bg-tertiary text-on-tertiary cursor-default"
              : currentStatus !== "IN_PROGRESS"
              ? "bg-surface-container text-on-surface-variant cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-on-primary"
          }`}
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px]">
                sync
              </span>
              <span>Đang đồng bộ hồ sơ...</span>
            </>
          ) : submitted ? (
            <>
              <span className="material-symbols-outlined text-[22px]">
                check_circle
              </span>
              <span>Đã gửi báo cáo - chờ Trưởng phòng xác nhận</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">
                send_time_extension
              </span>
              <span>{currentStatus === "APPROVED" ? "Cần bắt đầu xử lý trước" : "Gửi báo cáo & Chuyển TP duyệt"}</span>
            </>
          )}
        </button>
      </section>
    </>
  );
}

// ─── Queue Card ───────────────────────────────────────────────────────────────
function QueueCard({ ticket }: { ticket: any }) {
  const priorityMap: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    URGENT: { label: "Khẩn cấp", bg: "bg-error-container", color: "text-on-error-container", dot: "bg-error" },
    HIGH: { label: "Ưu tiên Cao", bg: "bg-secondary-fixed", color: "text-on-secondary-fixed", dot: "bg-secondary" },
    MEDIUM: { label: "Trung bình", bg: "bg-amber-100", color: "text-amber-800", dot: "bg-amber-500" },
    LOW: { label: "Bình thường", bg: "bg-surface-container-high", color: "text-on-surface-variant", dot: "bg-outline" },
  };
  const p = priorityMap[ticket.priority] || priorityMap.LOW;

  return (
    <Link href={`/tickets/${ticket.id}`}>
      <article className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-1.5 transition-colors hover:bg-surface-container-low active:bg-surface-container-low cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-primary">
              #{ticket.ticketCode}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface text-[11px] font-semibold">
              {ticket.category || "Phần cứng PC"}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md ${p.bg} ${p.color} text-[11px] font-bold flex items-center gap-1`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
            {p.label}
          </span>
        </div>
        <h5 className="text-[15px] font-semibold text-on-surface leading-snug">
          {ticket.title}
        </h5>
        <div className="flex items-center justify-between text-on-surface-variant text-[13px] pt-0.5">
          <div className="flex items-center gap-1 truncate">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              domain
            </span>
            <span className="truncate">{ticket.department?.name}</span>
          </div>
          {ticket.slaDeadline && (
            <span className="text-[11px] text-tertiary flex items-center gap-0.5 flex-shrink-0">
              <span className="material-symbols-outlined text-[14px]">
                schedule
              </span>
              {new Date(ticket.slaDeadline).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}

// ─── Admin / Manager List View ────────────────────────────────────────────────
function TechnicianListView({
  technicians,
  loading,
}: {
  technicians: any[];
  loading: boolean;
}) {
  return (
    <>
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">
                engineering
              </span>
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
              Đội ngũ Kỹ thuật viên & KPI Cá nhân
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Theo dõi khối lượng công việc, tỷ lệ hoàn thành SLA và xếp loại KPI tự động
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/kpi-config"
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Cấu hình KPI</span>
          </Link>
          <Link
            href="/reports"
            className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            <span>Xuất Excel</span>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-sm text-on-surface-variant bg-surface-container-lowest rounded-2xl">
            Đang tải dữ liệu kỹ thuật viên...
          </div>
        ) : (
          technicians.map((tech) => {
            const rank = getKpiRank(tech.kpiScore);
            return (
              <div
                key={tech.id}
                className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={tech.avatar}
                        alt={tech.fullName}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface-container-lowest ${
                          tech.isBusy ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-base text-on-surface truncate">
                          {tech.fullName}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rank.bg} ${rank.color}`}
                        >
                          {rank.rank}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
                        {tech.specialty}
                      </p>
                      <span className="inline-block mt-1 text-[11px] font-semibold text-primary">
                        {tech.status}
                      </span>
                    </div>
                  </div>

                  {/* Stat Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-container-low text-center">
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">
                        KPI
                      </span>
                      <span className="font-heading font-bold text-base text-primary">
                        {tech.kpiScore}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">
                        Đang làm
                      </span>
                      <span className="font-heading font-bold text-base text-secondary">
                        {tech.activeTasksCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant block">
                        SLA
                      </span>
                      <span className="font-heading font-bold text-base text-emerald-700">
                        {tech.slaRate}%
                      </span>
                    </div>
                  </div>

                  {tech.activeTasks?.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-on-surface-variant block">
                        Việc đang xử lý:
                      </span>
                      {tech.activeTasks.slice(0, 2).map((t: any) => (
                        <Link
                          key={t.id}
                          href={`/tickets/${t.id}`}
                          className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container block text-xs transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary group-hover:underline">
                              #{t.ticketCode}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                              {t.status}
                            </span>
                          </div>
                          <p className="text-on-surface truncate mt-0.5">
                            {t.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">
                      call
                    </span>
                    {tech.phone || "0988.112.233"}
                  </span>
                  <Link
                    href={`/tickets?technicianId=${tech.id}`}
                    className="text-primary font-bold hover:underline"
                  >
                    Xem lịch sử việc →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TechniciansPage() {
  const { currentUser, isTechnician } = useAuth();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechnicians();
    if (isTechnician) fetchMyTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTechnician, currentUser?.id, currentUser?.username]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/technicians");
      const data = await res.json();
      setTechnicians(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      const technicianKey = currentUser?.username || currentUser?.id;
      const query = technicianKey
        ? `&technicianId=${encodeURIComponent(technicianKey)}`
        : "";
      const res = await fetch(`/api/tickets?statuses=APPROVED,IN_PROGRESS,PENDING_CONFIRMATION&limit=10${query}`);
      const data = await res.json();
      setMyTickets(data?.tickets || data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Technician personal view ──
  if (isTechnician) {
    const me = technicians.find((t) => t.id === currentUser?.id) || technicians[0];
    const rank = me ? getKpiRank(me.kpiScore) : null;
    const activeTicket = myTickets.find(
      (t) =>
        t.status === "APPROVED" ||
        t.status === "IN_PROGRESS" ||
        t.status === "PENDING_CONFIRMATION"
    ) || myTickets[0];
    const queueTickets = myTickets.slice(activeTicket ? 1 : 0, activeTicket ? 3 : 2);

    return (
      <RoleGuard
        allowedRoles={["TECHNICIAN", "MANAGER", "ADMIN"]}
        requiredPermissions={["VIEW_TECHNICIAN_DASHBOARD"]}
      >
        <div className="flex flex-col w-full px-4 py-3 gap-4 max-w-lg mx-auto">
          {/* ── Profile Banner ── */}
          <section className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={me?.avatar || "/placeholder-avatar.png"}
                  alt={me?.fullName || currentUser?.fullName}
                  className="w-16 h-16 rounded-xl object-cover shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-tertiary" />
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[16px] font-bold text-on-surface truncate">
                    {me?.fullName || currentUser?.fullName || "Kỹ thuật viên"}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary text-[11px] font-semibold flex-shrink-0">
                    KTV Chính
                  </span>
                </div>
                <p className="text-[13px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">
                    medical_services
                  </span>
                  {me?.specialty || "Đội Cơ động & Mạng Bệnh viện"}
                </p>

                {/* Metrics chips */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg">
                    <span
                      className="material-symbols-outlined text-[15px] text-tertiary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      stars
                    </span>
                    <span className="text-[11px] text-on-surface">
                      KPI:{" "}
                      <strong className="text-primary font-bold">
                        {me?.kpiScore ?? 94.5}
                      </strong>
                    </span>
                    {rank && (
                      <span className={`text-[10px] font-medium ${rank.color}`}>
                        ({rank.rank})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg">
                    <span className="material-symbols-outlined text-[15px] text-secondary">
                      task_alt
                    </span>
                    <span className="text-[11px] text-on-surface">
                      Tháng:{" "}
                      <strong className="font-bold">
                        {me?.completedTasksCount ?? 32} phiếu
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Active ticket + report form ── */}
          {activeTicket ? (
            <ActiveTicketCard ticket={activeTicket} />
          ) : (
            <section className="w-full bg-surface-container-lowest rounded-xl p-6 shadow-sm text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
                check_circle
              </span>
              <p className="mt-2 text-sm text-on-surface-variant">
                Không có phiếu đang xử lý
              </p>
              <Link
                href="/tickets"
                className="mt-3 inline-block text-sm text-primary font-bold hover:underline"
              >
                Xem tất cả phiếu →
              </Link>
            </section>
          )}

          {/* ── Queue ── */}
          {(queueTickets.length > 0 || !activeTicket) && (
            <section className="w-full flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px] text-secondary">
                    queue
                  </span>
                  <h4 className="text-[16px] font-bold text-on-surface">
                    Phiếu chờ tiếp theo
                  </h4>
                </div>
                <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  Ca trực: {queueTickets.length} việc
                </span>
              </div>

              {queueTickets.length > 0 ? (
                queueTickets.map((t) => <QueueCard key={t.id} ticket={t} />)
              ) : (
                <div className="text-center py-6 text-sm text-on-surface-variant bg-surface-container-lowest rounded-xl">
                  Không có phiếu chờ trong ca này
                </div>
              )}
            </section>
          )}
        </div>
      </RoleGuard>
    );
  }

  // ── Admin / Manager view ──
  return (
    <RoleGuard
      allowedRoles={["TECHNICIAN", "MANAGER", "ADMIN"]}
      requiredPermissions={["VIEW_TECHNICIAN_DASHBOARD"]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <TechnicianListView technicians={technicians} loading={loading} />
      </div>
    </RoleGuard>
  );
}
