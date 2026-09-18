"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PRESET_USERS, useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import RoleGuard from "@/components/RoleGuard";
import {
  formatDateTime,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  CATEGORY_CONFIG,
  TicketPriority,
  TicketCategory,
} from "@/lib/types";

export default function TicketsListPage() {
  const { currentUser } = useAuth();
  const activeUser = currentUser ?? PRESET_USERS[0];
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedDept, setSelectedDept] = useState(
    activeUser?.role === "DEPARTMENT_USER" ? activeUser.departmentId || "ALL" : "ALL"
  );

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "COMPUTER" as TicketCategory,
    priority: "HIGH" as TicketPriority,
    departmentId: "",
    requesterName: activeUser.fullName,
    requesterPhone: activeUser.phone || "0912.345.678",
    roomLocation: "Tầng 1 - Khu Cổng tiếp đón",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchDepartments();
  }, [selectedStatus, selectedPriority, selectedDept]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (selectedPriority !== "ALL") params.set("priority", selectedPriority);
      if (selectedDept !== "ALL") params.set("departmentId", selectedDept);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setTickets([]);
        showToast("Lỗi", data?.error || "Không thể tải danh sách phiếu", "error");
        return;
      }

      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setTickets([]);
      showToast("Lỗi", "Không thể tải danh sách phiếu", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json().catch(() => []);
      const normalized = Array.isArray(data) ? data : [];
      setDepartments(normalized);
      if (normalized.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: normalized[0].id }));
      }
    } catch (e) {
      console.error(e);
      setDepartments([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
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
      showToast(
        "Lỗi ảnh",
        error instanceof Error ? error.message : "Không thể tải ảnh lên. Vui lòng thử lại.",
        "error"
      );
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Thiếu thông tin", "Vui lòng nhập tiêu đề sự cố", "error");
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

      if (!res.ok) throw new Error("Failed to create ticket");

      const created = await res.json();
      showToast("Thành công", `Đã tạo phiếu #${created.ticketCode}`);
      setShowCreateModal(false);
      setAttachedImages([]);
      setFormData({
        title: "",
        description: "",
        category: "COMPUTER",
        priority: "HIGH",
        departmentId: departments[0]?.id || "",
        requesterName: activeUser.fullName,
        requesterPhone: activeUser.phone || "0912.345.678",
        roomLocation: "Tầng 1 - Khu Cổng tiếp đón",
      });
      fetchTickets();
    } catch (e) {
      console.error(e);
      showToast("Lỗi", "Không thể tạo phiếu yêu cầu", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard
      allowedRoles={["ADMIN", "MANAGER", "TECHNICIAN", "DEPARTMENT_USER"]}
      requiredPermissions={["VIEW_TICKETS"]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">assignment</span>
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
              Phiếu yêu cầu & Quy trình SLA
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Theo dõi, tiếp nhận và điều phối công việc kỹ thuật toàn bệnh viện
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Tạo phiếu mới</span>
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã phiếu (#YC...), tiêu đề, khoa phòng, người gửi..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low text-on-surface text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  fetchTickets();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 h-11 rounded-xl bg-surface-container-high hover:bg-surface-container font-semibold text-xs sm:text-sm text-on-surface transition-colors flex items-center gap-1"
          >
            <span>Tìm kiếm</span>
          </button>
        </form>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs font-bold text-on-surface-variant mr-1 flex-shrink-0">
            Trạng thái:
          </span>
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "PENDING_APPROVAL", label: "Chờ tiếp nhận" },
            { id: "IN_PROGRESS", label: "Đang xử lý" },
            { id: "PENDING_CONFIRMATION", label: "Chờ nghiệm thu" },
            { id: "COMPLETED", label: "Đã hoàn thành" },
          ].map((st) => {
            const isSelected = selectedStatus === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Priority Filter & Department Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-surface-container text-xs">
          <span className="font-bold text-on-surface-variant">Độ ưu tiên:</span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((pr) => {
            const isSelected = selectedPriority === pr;
            const prLabel =
              pr === "ALL"
                ? "Tất cả"
                : PRIORITY_CONFIG[pr as TicketPriority]?.label || pr;
            return (
              <button
                key={pr}
                onClick={() => setSelectedPriority(pr)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isSelected
                    ? "bg-secondary text-on-secondary font-bold"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {prLabel}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            <span className="font-bold text-on-surface-variant">Khoa phòng:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-surface-container-low text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none border-0"
            >
              <option value="ALL">Tất cả khoa phòng</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Tickets List Grid */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-sm text-on-surface-variant bg-surface-container-lowest rounded-2xl">
            Đang tải dữ liệu phiếu yêu cầu...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-2xl space-y-3">
            <span className="material-symbols-outlined text-4xl text-outline">
              assignment_turned_in
            </span>
            <h3 className="font-bold text-base text-on-surface">
              Không tìm thấy phiếu yêu cầu nào
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Không có phiếu nào phù hợp với bộ lọc hiện tại. Hãy thử chọn điều kiện lọc khác hoặc tạo yêu cầu mới.
            </p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const priority =
              PRIORITY_CONFIG[ticket.priority as TicketPriority] ||
              PRIORITY_CONFIG.MEDIUM;
            const status =
              STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] ||
              STATUS_CONFIG.PENDING_APPROVAL;

            return (
              <div
                key={ticket.id}
                className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 hover:border-primary/40 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-bold text-sm text-primary">
                      #{ticket.ticketCode}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${priority.bg} ${priority.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}></span>
                      {priority.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${status.bg}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {status.icon}
                      </span>
                      {status.label}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      Bước {ticket.currentStep}/6
                    </span>
                  </div>

                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="block font-heading font-bold text-base text-on-surface hover:text-primary transition-colors"
                  >
                    {ticket.title}
                  </Link>

                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {ticket.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant pt-1">
                    <span className="flex items-center gap-1 font-medium text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        domain
                      </span>
                      {ticket.department?.name}
                    </span>

                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      {ticket.requesterName} ({ticket.requesterPhone})
                    </span>

                    {ticket.assignment?.technician && (
                      <span className="flex items-center gap-1 text-secondary font-bold">
                        <span className="material-symbols-outlined text-[16px]">
                          engineering
                        </span>
                        KTV: {ticket.assignment.technician.fullName}
                      </span>
                    )}

                    <span className="text-[11px] opacity-75 ml-auto">
                      {formatDateTime(ticket.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container flex-shrink-0">
                  {ticket.evaluation && (
                    <div className="text-right">
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                        Điểm KPI
                      </span>
                      <span className="font-heading font-extrabold text-base text-primary">
                        {ticket.evaluation.totalScore}/10
                      </span>
                    </div>
                  )}

                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="px-4 py-2 rounded-xl bg-primary-fixed hover:bg-primary text-on-primary-fixed hover:text-on-primary font-bold text-xs transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span>Chi tiết quy trình</span>
                    <span className="material-symbols-outlined text-[16px]">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Modal Tạo Phiếu Yêu Cầu Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">post_add</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-on-surface">
                    Gửi yêu cầu hỗ trợ CNTT mới
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Hệ thống sẽ tự động sinh mã phiếu và điều phối đến Trưởng phòng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTicket} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Category Grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                  <span>Loại thiết bị / Sự cố *</span>
                  <span className="text-[11px] text-primary">Quy chuẩn BV</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    Object.keys(CATEGORY_CONFIG) as TicketCategory[]
                  ).slice(0, 6).map((catKey) => {
                    const cat = CATEGORY_CONFIG[catKey];
                    const isSelected = formData.category === catKey;
                    return (
                      <button
                        type="button"
                        key={catKey}
                        onClick={() => setFormData({ ...formData, category: catKey })}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? "bg-primary-fixed/40 border-primary text-primary font-bold shadow-sm"
                            : "bg-surface-container-low border-transparent hover:bg-surface-container text-on-surface"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {cat.icon}
                        </span>
                        <span className="text-xs leading-tight line-clamp-1">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">
                  Tiêu đề sự cố / yêu cầu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lỗi máy in mã vạch không nhận lệnh in..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">
                  Mô tả chi tiết hiện trạng sự cố
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả cụ thể hiện tượng, máy báo lỗi gì, ảnh hưởng ra sao..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary resize-none"
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

              {/* 2 Cols: Priority & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">
                    Mức độ ưu tiên *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as TicketPriority,
                      })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="CRITICAL">Khẩn cấp (Code Red - 45 phút)</option>
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
                    className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Requester & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">Người gửi</label>
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
                  <label className="text-xs font-bold text-on-surface">Số điện thoại</label>
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
                  <label className="text-xs font-bold text-on-surface">Vị trí phòng</label>
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

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>{submitting ? "Đang gửi..." : "Gửi yêu cầu ngay"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
