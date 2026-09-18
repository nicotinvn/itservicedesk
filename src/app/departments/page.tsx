"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PRESET_USERS, useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import ActionGuard from "@/components/ActionGuard";
import RoleGuard from "@/components/RoleGuard";
import {
  CATEGORY_CONFIG,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TicketCategory,
  TicketPriority,
  formatDateTime,
} from "@/lib/types";

export default function DepartmentPortalPage() {
  const { currentUser } = useAuth();
  const activeUser = currentUser ?? PRESET_USERS[0];
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"create" | "csat">("create");
  const [departments, setDepartments] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "COMPUTER" as TicketCategory,
    priority: "HIGH" as TicketPriority,
    departmentId: "",
    requesterName: activeUser.fullName,
    requesterPhone: activeUser.phone || "0912.345.678",
    roomLocation: "Khu khám lâm sàng - Buồng 102",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [deptRes, ticketRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/tickets"),
      ]);
      const deptData = await deptRes.json();
      const ticketData = await ticketRes.json();
      setDepartments(deptData || []);
      setTickets(ticketData || []);

      if (deptData?.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: deptData[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setAttachedImages((prev) => [...prev, ...nextImages].slice(0, 5));
      event.target.value = "";
    } catch (error) {
      console.error(error);
      showToast("Lỗi ảnh", error instanceof Error ? error.message : "Không thể tải ảnh lên. Vui lòng thử lại.", "error");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Thiếu thông tin", "Vui lòng nhập tóm tắt sự cố", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: attachedImages,
        }),
      });

      if (!res.ok) throw new Error("Create failed");
      const created = await res.json();
      showToast("Đã gửi yêu cầu", `Phiếu #${created.ticketCode} đã chuyển đến Trưởng phòng CNTT.`);
      setFormData((prev) => ({
        ...prev,
        title: "",
        description: "",
      }));
      setAttachedImages([]);
      setActiveTab("csat");
      fetchInitialData();
    } catch (e) {
      console.error(e);
      showToast("Lỗi", "Không thể gửi yêu cầu", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Completed tickets needing CSAT
  const pendingCsatTickets = tickets.filter(
    (t) => (t.status === "COMPLETED" || t.status === "CLOSED") && !t.csatRating
  );

  return (
    <RoleGuard
      allowedRoles={["DEPARTMENT_USER", "MANAGER", "ADMIN"]}
      requiredPermissions={["VIEW_DEPARTMENTS"]}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* 1. Friendly Ambient Greeting Banner */}
      <div className="relative overflow-hidden bg-surface-container-low rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/30">
        <div className="absolute -right-4 -bottom-6 w-32 h-32 bg-primary-fixed/40 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Cổng tiếp nhận 24/7
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface tracking-tight">
              Cổng Hỗ trợ Công nghệ Thông tin Bệnh viện
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1 text-primary font-semibold">
                <span className="material-symbols-outlined text-[16px]">apartment</span>
                {currentUser?.departmentName || activeUser.departmentName || "Khoa / Phòng"}
              </span>
              <span>•</span>
              <span>Cam kết thời gian phản hồi SLA tức thì</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest flex items-center justify-center shadow-sm text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">support_agent</span>
          </div>
        </div>
      </div>

      {/* 2. Segmented Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-surface-container rounded-2xl shadow-inner">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "create"
              ? "bg-surface-container-lowest text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Tạo yêu cầu mới</span>
        </button>

        <button
          onClick={() => setActiveTab("csat")}
          className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "csat"
              ? "bg-surface-container-lowest text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">rate_review</span>
          <span>Lịch sử & Đánh giá</span>
          {pendingCsatTickets.length > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-error text-on-error font-bold text-[10px] rounded-full">
              {pendingCsatTickets.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT 1: Ticket Creation Form */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateSubmit} className="space-y-4 animate-in fade-in duration-150">
          {/* Category Selector Cards */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-heading font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  category
                </span>
                Chọn loại thiết bị / Sự cố *
              </label>
              <span className="text-xs text-primary font-bold">Bắt buộc</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(CATEGORY_CONFIG) as TicketCategory[]).map((catKey) => {
                const cat = CATEGORY_CONFIG[catKey];
                const isSelected = formData.category === catKey;
                return (
                  <button
                    type="button"
                    key={catKey}
                    onClick={() => setFormData({ ...formData, category: catKey })}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                      isSelected
                        ? "bg-primary-fixed/40 border-primary text-primary font-bold shadow-sm ring-2 ring-primary/20 scale-101"
                        : "bg-surface-container-low border-transparent hover:bg-surface-container text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {cat.icon}
                    </span>
                    <div>
                      <div className="text-xs font-bold leading-tight">{cat.label}</div>
                      <div className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                        {cat.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Incident Details Form */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface">
                Tóm tắt sự cố / Vấn đề cần hỗ trợ *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Máy in mã vạch Zebra không nhận lệnh in từ phần mềm HIS..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface">
                Mô tả hiện trạng sự cố chi tiết
              </label>
              <textarea
                rows={3}
                placeholder="Mô tả cụ thể triệu chứng lỗi, đèn báo trên thiết bị, số lượng bệnh nhân đang bị ảnh hưởng..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary resize-none"
              />
            </div>

            <div className="space-y-2 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">photo_camera</span>
                  Ảnh minh chứng sự cố (nếu có)
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-on-primary shadow-sm hover:bg-primary/90">
                  <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                  Chụp / Tải ảnh
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={handleImagePick}
                  />
                </label>
              </div>

              {attachedImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {attachedImages.map((image, idx) => (
                    <div key={`${image}-${idx}`} className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                      <img src={image} alt={`Ảnh sự cố ${idx + 1}`} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setAttachedImages((prev) => prev.filter((_, i) => i !== idx))}
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
                  Có thể chụp ảnh trực tiếp từ điện thoại hoặc đính kèm hình ảnh hiện trạng lỗi để hỗ trợ kỹ thuật viên xử lý.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">
                  Mức độ khẩn cấp (SLA) *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as TicketPriority,
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm font-semibold"
                >
                  <option value="CRITICAL">Khẩn cấp (Code Red - Can thiệp trong 45p)</option>
                  <option value="HIGH">Ưu tiên cao (Trong 2 giờ)</option>
                  <option value="MEDIUM">Bình thường (Trong 4 giờ)</option>
                  <option value="LOW">Thấp (Trong ngày làm việc)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">
                  Khoa / Phòng yêu cầu *
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentId: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Cán bộ liên hệ</label>
                <input
                  type="text"
                  value={formData.requesterName}
                  onChange={(e) =>
                    setFormData({ ...formData, requesterName: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">SĐT liên hệ gấp</label>
                <input
                  type="text"
                  value={formData.requesterPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, requesterPhone: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">Vị trí phòng khám</label>
                <input
                  type="text"
                  value={formData.roomLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, roomLocation: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm"
                />
              </div>
            </div>

            <ActionGuard
              action="CREATE_TICKET"
              fallback={
                <div className="w-full h-12 rounded-xl bg-surface-container text-on-surface-variant font-bold text-sm flex items-center justify-center mt-4">
                  Bạn không có quyền tạo yêu cầu mới
                </div>
              }
            >
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-98 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <span className="material-symbols-outlined text-[22px]">send</span>
                <span>{submitting ? "Đang gửi đi..." : "Gửi yêu cầu đến Đội CNTT ngay"}</span>
              </button>
            </ActionGuard>
          </div>
        </form>
      )}

      {/* TAB CONTENT 2: History & CSAT Rating */}
      {activeTab === "csat" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {pendingCsatTickets.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 text-[24px]">
                pending_actions
              </span>
              <div className="flex-1 text-xs">
                <span className="font-bold block text-sm">
                  Bạn có {pendingCsatTickets.length} công việc đã xử lý xong chờ đánh giá hài lòng
                </span>
                Vui lòng bấm vào phiếu để gửi đánh giá CSAT giúp nâng cao chất lượng phục vụ.
              </div>
            </div>
          )}

          <div className="space-y-3">
            {tickets.map((t) => {
              const priority =
                PRIORITY_CONFIG[t.priority as TicketPriority] || PRIORITY_CONFIG.MEDIUM;
              const status =
                STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG] ||
                STATUS_CONFIG.PENDING_APPROVAL;

              return (
                <div
                  key={t.id}
                  className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-primary">
                        #{t.ticketCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${priority.bg} ${priority.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
                        {priority.label}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${status.bg}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-sm sm:text-base text-on-surface">
                      {t.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                      <span>{t.department?.name}</span>
                      <span>•</span>
                      <span>Gửi: {formatDateTime(t.createdAt)}</span>
                      {t.assignment?.technician && (
                        <>
                          <span>•</span>
                          <span className="text-primary font-bold">
                            KTV: {t.assignment.technician.fullName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {t.csatRating ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span>Đã CSAT: {t.csatRating.score}/10</span>
                      </div>
                    ) : (t.status === "COMPLETED" || t.status === "CLOSED") ? (
                      <Link
                        href={`/tickets/${t.id}`}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">rate_review</span>
                        <span>Đánh giá CSAT</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/tickets/${t.id}`}
                        className="px-3.5 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors"
                      >
                        Xem tiến độ
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
