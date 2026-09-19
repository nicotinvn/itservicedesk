"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import ActionGuard from "@/components/ActionGuard";
import {
  formatDateTime,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TicketPriority,
} from "@/lib/types";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, isManager, isTechnician, isDepartmentUser } = useAuth();
  const activeUser = currentUser ?? { id: "guest", fullName: "Khách", role: "DEPARTMENT_USER" } as any;
  const { showToast } = useToast();

  const [ticket, setTicket] = useState<any>(null);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispatch form states
  const [selectedTechId, setSelectedTechId] = useState("");
  const [dispatchNote, setDispatchNote] = useState(
    "Ưu tiên thay switch mạng dự phòng hoặc đấu nối line trực tiếp cho máy tiếp đón số 1"
  );
  const [slaMinutes, setSlaMinutes] = useState(45);
  const [dispatching, setDispatching] = useState(false);

  // Technician Report form states
  const [reportContent, setReportContent] = useState(
    "Đã bấm lại đầu mạng Cat6, cấu hình IP tĩnh cho máy in mã vạch và test in 5 nhãn tem thành công."
  );
  const [reporting, setReporting] = useState(false);
  const [proofImages, setProofImages] = useState<string[]>([]);

  // Step 6 Evaluation Sliders
  const [qualityScore, setQualityScore] = useState(9);
  const [progressScore, setProgressScore] = useState(10);
  const [coordinationScore, setCoordinationScore] = useState(9);
  const [managerComment, setManagerComment] = useState(
    "Xử lý nhanh, tác phong chuyên nghiệp, không làm gián đoạn bệnh nhân tiếp đón cấp cứu."
  );
  const [evaluating, setEvaluating] = useState(false);

  // Step 7 CSAT state
  const [csatScore, setCsatScore] = useState(10);
  const [csatFeedback, setCsatFeedback] = useState(
    "Kỹ thuật viên hỗ trợ nhiệt tình, giải quyết sự cố rất nhanh chóng."
  );
  const [ratingCsat, setRatingCsat] = useState(false);

  // Lightbox modal for photos
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const parseJsonList = (value: string | string[] | null | undefined) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  };

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchTechnicians();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${id}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data || typeof data !== "object" || !("id" in data)) {
        const message = data?.error || "Không tìm thấy thông tin phiếu yêu cầu";
        setTicket(null);
        showToast("Lỗi", message, "error");
        return;
      }

      setTicket(data);
      const existingProofImages = parseJsonList(data?.taskReport?.proofImages);
      setProofImages(existingProofImages);

      if (data.assignment?.technicianId) {
        setSelectedTechId(data.assignment.technicianId);
      }
      if (data.evaluation) {
        setQualityScore(data.evaluation.qualityScore);
        setProgressScore(data.evaluation.progressScore);
        setCoordinationScore(data.evaluation.coordinationScore);
        if (data.evaluation.managerComment) {
          setManagerComment(data.evaluation.managerComment);
        }
      }
      if (data.csatRating) {
        setCsatScore(data.csatRating.score);
        if (data.csatRating.feedbackNote) {
          setCsatFeedback(data.csatRating.feedbackNote);
        }
      }
    } catch (e) {
      console.error(e);
      setTicket(null);
      showToast("Lỗi", "Không tìm thấy thông tin phiếu yêu cầu", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch("/api/technicians");
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setTechnicians([]);
        return;
      }

      const normalized = Array.isArray(data) ? data : [];
      setTechnicians(normalized);
      if (normalized.length > 0 && !selectedTechId) {
        setSelectedTechId(normalized[0].id);
      }
    } catch (e) {
      console.error(e);
      setTechnicians([]);
    }
  };

  const handleCopyCode = () => {
    if (ticket) {
      navigator.clipboard?.writeText(`#${ticket.ticketCode}`);
      showToast("Đã sao chép mã phiếu", `#${ticket.ticketCode} đã được lưu vào bộ nhớ tạm.`);
    }
  };

  const handleProofImagePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const formData = new FormData();
      Array.from(files)
        .slice(0, 5)
        .forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Upload failed");
      }

      const data = await res.json();
      const nextImages = Array.isArray(data.urls) ? data.urls : [];
      setProofImages((prev) => [...prev, ...nextImages].slice(0, 5));
      event.target.value = "";
    } catch (error) {
      console.error(error);
      showToast("Lỗi ảnh", error instanceof Error ? error.message : "Không thể tải ảnh minh chứng. Vui lòng thử lại.", "error");
    }
  };

  // Dispatch action (Trưởng phòng phê duyệt & giao việc)
  const handleDispatch = async () => {
    if (!selectedTechId) {
      showToast("Chưa chọn KTV", "Vui lòng chỉ định kỹ thuật viên phụ trách", "error");
      return;
    }

    try {
      setDispatching(true);
      const res = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicianId: selectedTechId,
          managerNote: dispatchNote,
          slaMinutes: Number(slaMinutes),
        }),
      });

      if (!res.ok) throw new Error("Dispatch failed");
      const result = await res.json();
      setTicket(result.ticket);
      showToast(
        "Đã phê duyệt & Giao việc",
        "Kỹ thuật viên đã nhận lệnh và bắt đầu triển khai xử lý."
      );
      fetchTicket();
    } catch (e) {
      console.error(e);
      showToast("Lỗi", "Không thể giao việc cho KTV", "error");
    } finally {
      setDispatching(false);
    }
  };

  // Reject action
  const handleReject = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
        }),
      });
      if (res.ok) {
        showToast("Từ chối yêu cầu", "Phiếu đã chuyển về trạng thái trả lại đơn vị.", "error");
        fetchTicket();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartWork = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Không thể bắt đầu xử lý");
      showToast("Đã nhận việc", "Phiếu đã chuyển sang trạng thái đang xử lý.", "success");
      fetchTicket();
    } catch (e) {
      showToast("Không thể bắt đầu", e instanceof Error ? e.message : "Vui lòng thử lại", "error");
    }
  };

  // Technician Report Submission
  const handleReportSubmit = async () => {
    if (!reportContent.trim()) {
      showToast("Thiếu thông tin", "Vui lòng nhập nội dung báo cáo xử lý", "error");
      return;
    }

    try {
      setReporting(true);
      const res = await fetch(`/api/tickets/${ticket.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportContent,
          proofImages,
        }),
      });

      if (!res.ok) throw new Error("Report failed");
      showToast(
        "Báo cáo thành công",
        "Đã nộp báo cáo hoàn thành công việc, chuyển sang Trưởng phòng nghiệm thu."
      );
      fetchTicket();
    } catch (e) {
      console.error(e);
      showToast("Lỗi", "Không thể nộp báo cáo", "error");
    } finally {
      setReporting(false);
    }
  };

  // Manager Evaluation Submission
  const handleEvaluationSubmit = async () => {
    try {
      setEvaluating(true);
      const res = await fetch(`/api/tickets/${ticket.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qualityScore: Number(qualityScore),
          progressScore: Number(progressScore),
          coordinationScore: Number(coordinationScore),
          managerComment,
        }),
      });

      if (!res.ok) throw new Error("Evaluation failed");
      const result = await res.json();
      if (result.ticket) {
        setTicket(result.ticket);
      }
      showToast(
        "Đã lưu đánh giá KPI",
        "Điểm chuyên môn của KTV đã được ghi nhận vào bảng KPI tháng."
      );
      fetchTicket();
    } catch (e) {
      console.error(e);
      showToast("Lỗi", "Không thể lưu đánh giá", "error");
    } finally {
      setEvaluating(false);
    }
  };

  // Department CSAT Submission
  const handleCsatSubmit = async () => {
    try {
      setRatingCsat(true);
      const res = await fetch(`/api/tickets/${ticket.id}/csat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: Number(csatScore),
          feedbackNote: csatFeedback,
        }),
      });

      if (!res.ok) throw new Error("CSAT failed");
      showToast(
        "Cảm ơn đánh giá!",
        "Phản hồi hài lòng của khoa phòng đã được ghi nhận vào hồ sơ KPI."
      );
      fetchTicket();
    } catch (e) {
      console.error(e);
      showToast("Lỗi", "Không thể gửi đánh giá CSAT", "error");
    } finally {
      setRatingCsat(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-on-surface-variant">
        Đang tải thông tin chi tiết phiếu yêu cầu...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <h2 className="font-bold text-xl text-on-surface">Không tìm thấy phiếu yêu cầu</h2>
        <Link href="/tickets" className="inline-block px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const priority =
    PRIORITY_CONFIG[ticket.priority as TicketPriority] || PRIORITY_CONFIG.MEDIUM;
  const status =
    STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.PENDING_APPROVAL;

  const images = parseJsonList(ticket.images);
  const selectedTech = technicians.find((t) => t.id === selectedTechId);
  const isAssigned = Boolean(ticket.assignment);
  const hasInvalidAssignment = ticket.assignment?.technician?.role !== "TECHNICIAN";
  const isWaitingForAcceptance = ticket.currentStep <= 3 && !ticket.taskReport;
  const canRepairInvalidAssignment = hasInvalidAssignment && isWaitingForAcceptance;
  const canReassign = !isAssigned || ticket.status === "APPROVED" || isWaitingForAcceptance || canRepairInvalidAssignment;
  const isAssignedToCurrentUser = ticket.assignment?.technicianId === activeUser.id;
  const canStartWork = isTechnician && isAssignedToCurrentUser && ticket.status === "APPROVED";
  const canSubmitReport = isTechnician && isAssignedToCurrentUser && ticket.status === "IN_PROGRESS" && !ticket.taskReport;
  const canEvaluate = isManager && ticket.status === "PENDING_CONFIRMATION" && Boolean(ticket.taskReport);
  const canSubmitCsat = (isDepartmentUser || !isManager) && (ticket.status === "COMPLETED" || ticket.status === "CLOSED") && !ticket.csatRating;

  // Live calculation of 3 criteria
  const calculatedTotalKpi = (
    qualityScore * 0.4 +
    progressScore * 0.3 +
    coordinationScore * 0.3
  ).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Back breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link href="/tickets" className="hover:text-primary flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Danh sách phiếu</span>
        </Link>
        <span>/</span>
        <span className="font-bold text-on-surface">#{ticket.ticketCode}</span>
      </div>

      {/* 1. Header Chi tiết Sự cố */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm border border-outline-variant/30 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
              #{ticket.ticketCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="text-on-surface-variant hover:text-primary transition-colors p-1"
              title="Sao chép mã"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
            </button>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wide ${priority.bg} ${priority.text} ${
              ticket.priority === "CRITICAL" ? "animate-pulse" : ""
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${priority.dot}`}></span>
            <span>{priority.label}</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold">
          <span className="material-symbols-outlined text-[16px] text-primary">
            {status.icon}
          </span>
          <span>Trạng thái: {status.label}</span>
        </div>

        {/* Thông tin yêu cầu */}
        <div className="pt-1 space-y-2">
          <h1 className="font-heading font-bold text-lg sm:text-xl text-on-surface leading-snug">
            {ticket.title}
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {ticket.description}
          </p>

          <div className="bg-surface-container-low rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0 mt-0.5">
                local_hospital
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-on-surface">
                  {ticket.department?.name}
                </span>
                <span className="text-on-surface-variant mt-0.5">
                  {ticket.roomLocation || "Khu điều trị & buồng bệnh"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-on-surface-variant border-t border-surface-container">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span className="font-medium text-on-surface">{ticket.requesterName}</span>
              </div>
              <a
                href={`tel:${ticket.requesterPhone}`}
                className="flex items-center gap-1 text-primary font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>{ticket.requesterPhone}</span>
              </a>
              <div className="flex items-center gap-1 ml-auto">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>Gửi lúc: {formatDateTime(ticket.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ảnh sự cố đính kèm */}
        {images.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-surface-container">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-tertiary">
                  attach_file
                </span>
                Ảnh thực tế sự cố tại quầy ({images.length} tệp)
              </span>
              <span className="text-[11px] text-primary font-medium">Bấm vào ảnh để phóng to</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {images.map((imgUrl: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className="relative rounded-xl overflow-hidden group bg-surface-container shadow-sm aspect-video cursor-pointer"
                >
                  <img
                    src={imgUrl}
                    alt={`Ảnh sự cố ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[11px] font-semibold text-white truncate">
                      Ảnh minh chứng {idx + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Quy trình 6 bước SLA (Timeline Horizontal Scroll) */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-sm sm:text-base text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]">
              linear_scale
            </span>
            Quy trình xử lý SLA (6 bước chuẩn)
          </h2>
          <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary-fixed">
            Bước {ticket.currentStep}/6
          </span>
        </div>

        {/* Stepper Scrollbar */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 pt-1">
          <div className="flex items-start min-w-[650px] relative">
            {[
              { step: 1, label: "1. Gửi yêu cầu", sub: "Khởi tạo" },
              { step: 2, label: "2. TP Tiếp nhận", sub: "Duyệt phiếu" },
              { step: 3, label: "3. Phân công", sub: "KTV nhận" },
              { step: 4, label: "4. Thực hiện", sub: "Xử lý lỗi" },
              { step: 5, label: "5. Báo cáo", sub: "Minh chứng" },
              { step: 6, label: "6. TP Xác nhận", sub: "Hoàn tất & KPI" },
            ].map((s, idx) => {
              const isDone = ticket.currentStep > s.step;
              const isCurrent = ticket.currentStep === s.step;

              return (
                <div key={s.step} className="flex-1 flex flex-col items-center text-center relative z-10">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm font-bold text-xs transition-all ${
                      isDone
                        ? "bg-primary text-on-primary"
                        : isCurrent
                        ? "bg-primary-container text-on-primary ring-4 ring-primary-fixed animate-pulse"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {isDone ? (
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    ) : (
                      s.step
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold mt-1.5 leading-tight ${
                      isCurrent
                        ? "text-primary"
                        : isDone
                        ? "text-on-surface"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="text-[10px] text-outline mt-0.5">{s.sub}</span>

                  {idx < 5 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${
                        ticket.currentStep > s.step ? "bg-primary" : "bg-surface-container-highest"
                      }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Khung Điều phối Phân công (Dispatching Form) */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm border border-outline-variant/30 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">engineering</span>
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-on-surface">
              Điều phối & Giao việc Kỹ thuật viên (Bước 2 & 3)
            </h2>
            <p className="text-xs text-on-surface-variant">
              Trưởng phòng phê duyệt và lập kế hoạch ứng cứu sự cố
            </p>
          </div>
        </div>

        {/* Technician Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface flex items-center justify-between">
            <span>Chỉ định Kỹ thuật viên phụ trách *</span>
            <span className="text-xs text-primary flex items-center gap-0.5 font-bold">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              Gợi ý tối ưu
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full h-11 px-3 pr-10 rounded-xl bg-surface-container-low text-on-surface text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.activeTasksCount} việc đang làm, SLA {t.slaRate}% - {t.specialty})
                </option>
              ))}
            </select>
          </div>

          {/* Live badge KTV đã chọn */}
          {selectedTech && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low mt-2">
              <img
                src={selectedTech.avatar}
                alt={selectedTech.fullName}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-primary/20 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface truncate">
                    {selectedTech.fullName} (KPI: {selectedTech.kpiScore})
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    SLA {selectedTech.slaRate}%
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant truncate mt-0.5">
                  {selectedTech.specialty}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SLA Countdown Timer Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface">Thời hạn cam kết SLA</label>
          <div className="p-3 rounded-xl bg-error-container/40 border border-error/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-error text-[24px]">timer</span>
              <div>
                <div className="text-xs font-bold text-error">
                  Cam kết {slaMinutes} phút (Quy chuẩn Code Red)
                </div>
                <div className="text-xs text-on-surface-variant">
                  {ticket.assignment?.dueDate
                    ? `Hạn chót: ${formatDateTime(ticket.assignment.dueDate)}`
                    : "Hạn chót sẽ kích hoạt ngay khi giao việc"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={slaMinutes}
                onChange={(e) => setSlaMinutes(Number(e.target.value))}
                className="h-8 px-2 rounded-lg bg-surface-container-lowest text-xs font-bold text-error border-0 shadow-sm"
              >
                <option value={30}>30 phút</option>
                <option value={45}>45 phút</option>
                <option value={60}>60 phút</option>
                <option value={120}>2 giờ</option>
                <option value={240}>4 giờ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Manager Directive Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface">
            Chỉ đạo chuyên môn từ Trưởng phòng CNTT
          </label>
          <textarea
            rows={2}
            value={dispatchNote}
            onChange={(e) => setDispatchNote(e.target.value)}
            placeholder="Nhập hướng dẫn xử lý kỹ thuật cho nhân viên..."
            className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Action Buttons for Dispatch */}
        {isAssigned && isWaitingForAcceptance && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
            <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
            <span>Đã giao cho <strong>{ticket.assignment.technician?.fullName}</strong>. Có thể phân lại cho nhân viên khác trước khi nhận việc.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <ActionGuard
            action="ASSIGN_TICKET"
            fallback={
              <div className="h-12 rounded-xl bg-surface-container text-on-surface-variant font-bold text-sm flex items-center justify-center sm:col-span-2">
                Chỉ trưởng phòng hoặc quản trị mới được phê duyệt và giao việc
              </div>
            }
          >
            <button
              onClick={handleDispatch}
              disabled={dispatching || !canReassign}
              className={`h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                !canReassign
                  ? "bg-emerald-100 text-emerald-800 cursor-not-allowed shadow-none"
                  : "bg-primary text-on-primary hover:bg-primary/90 active:scale-98 shadow-primary/20"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{!canReassign ? "task_alt" : isAssigned ? "swap_horiz" : "check_circle"}</span>
              <span>{dispatching ? "Đang xử lý..." : !canReassign ? "Đã phân công" : isAssigned ? "Phân công lại" : "Phê duyệt & Giao việc ngay"}</span>
            </button>
          </ActionGuard>

          <ActionGuard
            action="ASSIGN_TICKET"
            fallback={null}
          >
            <button
              onClick={handleReject}
              disabled={isAssigned || ticket.status !== "PENDING_APPROVAL"}
              className="h-12 rounded-xl bg-surface-container text-error font-bold text-sm flex items-center justify-center gap-2 hover:bg-error-container transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">cancel</span>
              <span>Từ chối yêu cầu (Không hợp lệ)</span>
            </button>
          </ActionGuard>
        </div>
      </div>

      {/* 4. Khung Báo cáo Hoàn thành Kỹ thuật viên (Bước 4 & 5) */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm border border-outline-variant/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <span className="material-symbols-outlined text-[22px]">fact_check</span>
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-on-surface">
                Báo cáo Hoàn thành của KTV (Bước 4 & 5)
              </h2>
              <p className="text-xs text-on-surface-variant">
                Nhân viên cập nhật kết quả xử lý và gửi biên bản nghiệm thu
              </p>
            </div>
          </div>
          {ticket.taskReport && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              Đã nộp báo cáo lúc {formatDateTime(ticket.taskReport.completedAt)}
            </span>
          )}
        </div>

        {ticket.taskReport && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>
              {ticket.status === "COMPLETED"
                ? "Trưởng phòng đã xác nhận hoàn thành và cập nhật KPI."
                : "KTV đã gửi báo cáo hoàn thành. Trưởng phòng có thể xác nhận và cập nhật KPI."}
            </span>
          </div>
        )}

        {ticket.status === "APPROVED" && ticket.assignment && (
          <ActionGuard
            action="UPDATE_TICKET"
            fallback={null}
          >
            <button
              onClick={handleStartWork}
              disabled={!canStartWork}
              className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                canStartWork
                  ? "bg-primary text-on-primary hover:bg-primary/90 shadow-sm"
                  : "bg-surface-container text-on-surface-variant cursor-not-allowed"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">play_circle</span>
              <span>{canStartWork ? "Nhận việc & Bắt đầu xử lý" : `Đã giao cho ${ticket.assignment.technician?.fullName || "KTV"}`}</span>
            </button>
          </ActionGuard>
        )}

        {ticket.status === "IN_PROGRESS" && ticket.assignment && (
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
            <span className="material-symbols-outlined text-[18px]">engineering</span>
            <span><strong>{ticket.assignment.technician?.fullName}</strong> đang xử lý phiếu này.</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface">
            Nội dung kết quả xử lý & Minh chứng kỹ thuật
          </label>
          <textarea
            rows={3}
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            disabled={Boolean(ticket.taskReport)}
            placeholder="Ghi rõ các linh kiện đã thay thế, cấu hình mạng, kết quả kiểm tra..."
            className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="space-y-2 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">photo_library</span>
              Ảnh minh chứng xử lý
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-[11px] font-bold text-on-secondary shadow-sm hover:bg-secondary/90">
              <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
              Chụp / Tải ảnh
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={handleProofImagePick}
                disabled={Boolean(ticket.taskReport)}
              />
            </label>
          </div>

          {proofImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {proofImages.map((image, idx) => (
                <div key={`${image}-${idx}`} className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                  <img src={image} alt={`Ảnh minh chứng ${idx + 1}`} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setProofImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[10px] font-bold text-white"
                    aria-label="Xóa ảnh"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-on-surface-variant">
              Đính kèm ảnh sau khi xử lý lỗi như thiết bị trước/sau, cáp, màn hình, hoặc biên bản thực tế nếu cần chứng minh.
            </p>
          )}
        </div>

        <ActionGuard
          action="UPDATE_TICKET"
          fallback={
            <div className="w-full h-11 rounded-xl bg-surface-container text-on-surface-variant font-bold text-sm flex items-center justify-center">
              Bạn không có quyền nộp báo cáo xử lý
            </div>
          }
        >
          <button
            onClick={handleReportSubmit}
            disabled={reporting || !canSubmitReport}
            className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
              canSubmitReport
                ? "bg-secondary text-on-secondary hover:bg-secondary/90"
                : "bg-emerald-100 text-emerald-800 cursor-not-allowed"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{ticket.taskReport ? "verified" : "task_alt"}</span>
            <span>
              {reporting
                ? "Đang nộp..."
                : ticket.status === "COMPLETED"
                ? "Đã xác nhận hoàn thành"
                : ticket.taskReport
                ? "Đã nộp báo cáo - chờ trưởng phòng xác nhận"
                : canSubmitReport
                ? "Xác nhận hoàn thành & Nộp báo cáo"
                : "Chờ KTV được giao nộp báo cáo"}
            </span>
          </button>
        </ActionGuard>
      </div>

      {/* 5. Khung Đánh giá 3 Tiêu chí Chuyên môn & KPI (Trưởng phòng CNTT - Bước 6) */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm border border-outline-variant/30 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800">
              <span className="material-symbols-outlined text-[22px]">hotel_class</span>
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-on-surface">
                Trưởng phòng xác nhận hoàn thành & KPI (Bước 6)
              </h2>
              <p className="text-xs text-on-surface-variant">
                Quy chuẩn 3 tiêu chí chấm điểm chuyên môn cho nhân viên
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-on-surface-variant font-medium">Tổng điểm KPI</span>
            <span className="font-heading font-extrabold text-2xl text-primary">
              {calculatedTotalKpi}
              <span className="text-xs font-normal text-on-surface-variant">/10</span>
            </span>
          </div>
        </div>

        {/* Tiêu chí 1: Chất lượng (40%) */}
        <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">1. Chất lượng công việc</span>
              <span className="text-xs font-bold text-tertiary bg-tertiary-fixed px-2 py-0.5 rounded-md">
                Trọng số 40%
              </span>
            </div>
            <span className="font-heading font-extrabold text-base text-primary">
              {qualityScore}/10
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Khắc phục triệt để, bấm lại đầu hạt mạng Cat6, cấu hình IP tĩnh máy in mã vạch chuẩn xác.
          </p>
          <div className="space-y-1 pt-1">
            <input
              type="range"
              min="1"
              max="10"
              value={qualityScore}
              onChange={(e) => setQualityScore(Number(e.target.value))}
              className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[11px] text-on-surface-variant font-medium">
              <span>Yếu (1)</span>
              <span>Đạt (5)</span>
              <span>Xuất sắc (10)</span>
            </div>
          </div>
        </div>

        {/* Tiêu chí 2: Tiến độ (30%) */}
        <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">2. Tiến độ hoàn thành</span>
              <span className="text-xs font-bold text-secondary bg-secondary-fixed px-2 py-0.5 rounded-md">
                Trọng số 30%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shadow-sm">
                Trước hạn 15p
              </span>
              <span className="font-heading font-extrabold text-base text-primary">
                {progressScore}/10
              </span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant">
            Thời gian can thiệp chỉ mất 30 phút so với hạn ngạch 45 phút cam kết SLA.
          </p>
          <div className="space-y-1 pt-1">
            <input
              type="range"
              min="1"
              max="10"
              value={progressScore}
              onChange={(e) => setProgressScore(Number(e.target.value))}
              className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[11px] text-on-surface-variant font-medium">
              <span>Trễ hạn</span>
              <span>Đúng giờ (8)</span>
              <span>Trước hạn (10)</span>
            </div>
          </div>
        </div>

        {/* Tiêu chí 3: Tinh thần phối hợp (30%) */}
        <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">3. Tinh thần phối hợp</span>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                Trọng số 30%
              </span>
            </div>
            <span className="font-heading font-extrabold text-base text-primary">
              {coordinationScore}/10
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Giải thích chu đáo cho điều dưỡng trưởng, thái độ nhẹ nhàng trong lúc phòng khám đông bệnh nhân.
          </p>
          <div className="space-y-1 pt-1">
            <input
              type="range"
              min="1"
              max="10"
              value={coordinationScore}
              onChange={(e) => setCoordinationScore(Number(e.target.value))}
              className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[11px] text-on-surface-variant font-medium">
              <span>Kém (1)</span>
              <span>Hòa nhã (7)</span>
              <span>Mẫu mực (10)</span>
            </div>
          </div>
        </div>

        {/* Manager comment */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface">
            Nhận xét chuyên môn & Lưu ý chất lượng
          </label>
          <input
            type="text"
            value={managerComment}
            onChange={(e) => setManagerComment(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <ActionGuard
          action="MANAGE_KPI"
          fallback={
            <div className="w-full h-11 rounded-xl bg-surface-container text-on-surface-variant font-bold text-sm flex items-center justify-center">
              Chỉ trưởng phòng được chấm nghiệm thu KPI
            </div>
          }
        >
          <button
            onClick={handleEvaluationSubmit}
            disabled={evaluating || !canEvaluate}
            className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              canEvaluate ? "bg-primary text-on-primary hover:bg-primary/90 shadow-primary/20" : "bg-emerald-100 text-emerald-800 cursor-not-allowed shadow-none"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>{evaluating ? "Đang lưu..." : ticket.evaluation ? "Đã xác nhận hoàn thành & cập nhật KPI" : "Xác nhận hoàn thành & cập nhật KPI"}</span>
          </button>
        </ActionGuard>
      </div>

      {/* 6. CSAT tùy chọn sau khi trưởng phòng xác nhận hoàn thành */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm border border-outline-variant/30 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <span className="material-symbols-outlined text-[22px]">rate_review</span>
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-on-surface">
              Đánh giá Hài lòng của Khoa phòng (CSAT - tùy chọn)
            </h2>
            <p className="text-xs text-on-surface-variant">
              Phản hồi tùy chọn sau khi phiếu đã được trưởng phòng xác nhận hoàn thành, không ảnh hưởng trạng thái phiếu
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { score: 10, label: "Rất hài lòng", icon: "sentiment_very_satisfied", color: "text-emerald-700 border-emerald-500 bg-emerald-50" },
            { score: 8, label: "Hài lòng", icon: "sentiment_satisfied", color: "text-blue-700 border-blue-500 bg-blue-50" },
            { score: 6, label: "Bình thường", icon: "sentiment_neutral", color: "text-amber-700 border-amber-500 bg-amber-50" },
            { score: 4, label: "Chưa hài lòng", icon: "sentiment_dissatisfied", color: "text-rose-700 border-rose-500 bg-rose-50" },
          ].map((item) => {
            const isSelected = csatScore === item.score;
            return (
              <button
                type="button"
                key={item.score}
                onClick={() => setCsatScore(item.score)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                  isSelected
                    ? `${item.color} shadow-sm font-bold scale-102`
                    : "bg-surface-container-low border-transparent hover:bg-surface-container text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                <span className="text-xs leading-tight">{item.label}</span>
                <span className="text-[11px] opacity-75 font-semibold">({item.score} điểm)</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface">Ý kiến phản hồi bổ sung</label>
          <input
            type="text"
            value={csatFeedback}
            onChange={(e) => setCsatFeedback(e.target.value)}
            placeholder="Nhận xét thái độ phục vụ, tốc độ hỗ trợ của kỹ thuật viên..."
            className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <ActionGuard
          action="UPDATE_TICKET"
          fallback={
            <div className="w-full h-11 rounded-xl bg-surface-container text-on-surface-variant font-bold text-sm flex items-center justify-center">
              Chỉ khoa phòng được chấm CSAT cho dịch vụ
            </div>
          }
        >
          <button
            onClick={handleCsatSubmit}
            disabled={ratingCsat || !canSubmitCsat}
            className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              canSubmitCsat ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20" : "bg-surface-container text-on-surface-variant cursor-not-allowed shadow-none"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">recommend</span>
            <span>{ratingCsat ? "Đang gửi..." : ticket.csatRating ? "Đã gửi đánh giá CSAT" : "Gửi đánh giá mức độ hài lòng (CSAT) - tùy chọn"}</span>
          </button>
        </ActionGuard>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img src={selectedImage} alt="Phóng to ảnh" className="w-full h-full object-contain" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
