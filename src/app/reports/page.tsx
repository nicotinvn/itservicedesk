"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast";
import ActionGuard from "@/components/ActionGuard";
import RoleGuard from "@/components/RoleGuard";
import { CATEGORY_CONFIG, formatDateTime, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/types";

type ReportTicket = {
  id: string;
  ticketCode: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  department?: { id: string; name: string };
  assignment?: {
    assignedDate: string;
    dueDate: string;
    technician?: { id: string; fullName: string };
  } | null;
  taskReport?: { reportContent: string; completedAt: string } | null;
  evaluation?: { totalScore: number } | null;
  csatRating?: { score: number } | null;
};

type Technician = {
  id: string;
  fullName: string;
  email: string;
  specialty?: string | null;
  avatar?: string | null;
};

function getPeriodStart(range: string, now: Date) {
  if (range === "quarter") {
    return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  }
  if (range === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function toDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function formatReportDate(value: string) {
  const date = getLocalDate(value);
  return date
    ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
    : "—";
}

function getLocalDate(value: string, endOfDay = false) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, ...(endOfDay ? [23, 59, 59, 999] : [0, 0, 0, 0]));
}

function isCompleted(ticket: ReportTicket) {
  return ticket.status === "COMPLETED" || ticket.status === "CLOSED";
}

function isActive(ticket: ReportTicket) {
  return ["APPROVED", "IN_PROGRESS", "PENDING_CONFIRMATION"].includes(ticket.status);
}

export default function ReportsPage() {
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [tickets, setTickets] = useState<ReportTicket[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("ALL");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [techRes, ticketRes] = await Promise.all([
          fetch("/api/technicians"),
          fetch("/api/tickets"),
        ]);
        if (!techRes.ok || !ticketRes.ok) {
          throw new Error("Không thể tải dữ liệu báo cáo");
        }
        const [techs, tix] = await Promise.all([
          techRes.json(),
          ticketRes.json(),
        ]);
        setTechnicians(Array.isArray(techs) ? techs : []);
        setTickets(Array.isArray(tix) ? tix : []);
      } catch (error) {
        console.error("Error loading reports:", error);
        showToast("Lỗi", "Không thể tải dữ liệu báo cáo", "error");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const periodStart = getLocalDate(startDate);
  const periodEnd = getLocalDate(endDate, true);
  const invalidDateRange = !periodStart || !periodEnd || periodStart > periodEnd;
  const assignedTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        if (!ticket.assignment?.technician || !ticket.assignment.assignedDate) return false;
        const assignedAt = new Date(ticket.assignment.assignedDate);
        return (
          !invalidDateRange &&
          assignedAt >= periodStart! &&
          assignedAt <= periodEnd! &&
          (selectedTechnicianId === "ALL" ||
            ticket.assignment.technician.id === selectedTechnicianId) &&
          (selectedDepartmentId === "ALL" ||
            ticket.department?.id === selectedDepartmentId) &&
          (selectedStatus === "ALL" || ticket.status === selectedStatus)
        );
      }),
    [
      endDate,
      invalidDateRange,
      periodEnd?.getTime(),
      periodStart?.getTime(),
      selectedDepartmentId,
      selectedStatus,
      selectedTechnicianId,
      startDate,
      tickets,
    ]
  );

  const technicianSummaries = useMemo(
    () =>
      technicians
        .filter((technician) =>
          selectedTechnicianId === "ALL" || technician.id === selectedTechnicianId
        )
        .map((technician) => {
        const assigned = assignedTickets.filter(
          (ticket) => ticket.assignment?.technician?.id === technician.id
        );
        const completed = assigned.filter(isCompleted);
        const active = assigned.filter(isActive);
        const reported = completed.filter((ticket) => ticket.taskReport && ticket.assignment?.dueDate);
        const onTime = reported.filter(
          (ticket) =>
            new Date(ticket.taskReport!.completedAt) <= new Date(ticket.assignment!.dueDate)
        );
        const evaluations = assigned
          .map((ticket) => ticket.evaluation?.totalScore)
          .filter((score): score is number => typeof score === "number");

        return {
          technician,
          assigned,
          completed,
          active,
          overdue: active.filter(
            (ticket) => new Date(ticket.assignment!.dueDate) < new Date()
          ).length,
          onTimeRate: reported.length ? Math.round((onTime.length / reported.length) * 100) : null,
          averageEvaluation: evaluations.length
            ? evaluations.reduce((sum, score) => sum + score, 0) / evaluations.length
            : null,
        };
        }),
    [assignedTickets, selectedTechnicianId, technicians]
  );

  const selectedTickets = assignedTickets;

  const completedTickets = assignedTickets.filter(isCompleted);
  const activeTickets = assignedTickets.filter(isActive);
  const reportedCompleted = completedTickets.filter(
    (ticket) => ticket.taskReport && ticket.assignment?.dueDate
  );
  const onTimeCompleted = reportedCompleted.filter(
    (ticket) => new Date(ticket.taskReport!.completedAt) <= new Date(ticket.assignment!.dueDate)
  );
  const onTimeRate = reportedCompleted.length
    ? Math.round((onTimeCompleted.length / reportedCompleted.length) * 100)
    : null;
  const ratedTickets = completedTickets.filter((ticket) => ticket.csatRating);
  const averageCsat = ratedTickets.length
    ? ratedTickets.reduce((sum, ticket) => sum + (ticket.csatRating?.score || 0), 0) /
      ratedTickets.length
    : null;

  const departmentStats = useMemo(() => {
    const counts = new Map<string, number>();
    assignedTickets.forEach((ticket) => {
      const name = ticket.department?.name || "Chưa xác định";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [assignedTickets]);

  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>();
    assignedTickets.forEach((ticket) => {
      counts.set(ticket.category, (counts.get(ticket.category) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({
        name: CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.label || category,
        count,
      }));
  }, [assignedTickets]);

  const departments = useMemo(() => {
    const values = new Map<string, string>();
    tickets.forEach((ticket) => {
      if (ticket.department?.id) values.set(ticket.department.id, ticket.department.name);
    });
    return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi"));
  }, [tickets]);

  const applyPresetRange = (range: "month" | "quarter" | "year") => {
    const start = getPeriodStart(range, new Date());
    setStartDate(toDateInputValue(start));
    setEndDate(toDateInputValue(new Date()));
  };

  const getFilterParams = () => {
    if (invalidDateRange) {
      throw new Error("Khoảng ngày không hợp lệ");
    }
    const params = new URLSearchParams({
      startDate: periodStart!.toISOString(),
      endDate: periodEnd!.toISOString(),
    });
    if (selectedTechnicianId !== "ALL") params.set("technicianId", selectedTechnicianId);
    if (selectedDepartmentId !== "ALL") params.set("departmentId", selectedDepartmentId);
    if (selectedStatus !== "ALL") params.set("status", selectedStatus);
    return params;
  };

  const handleExportExcel = async () => {
    if (invalidDateRange) {
      showToast("Khoảng thời gian không hợp lệ", "Vui lòng kiểm tra ngày bắt đầu và ngày kết thúc.", "error");
      return;
    }

    try {
      setExporting(true);
      showToast("Đang chuẩn bị tệp", "Đang kết xuất dữ liệu thống kê và KPI ra Excel...");
      const params = getFilterParams();
      const res = await fetch(`/api/reports/export?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bao_cao_ITServiceDesk_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Thành công", "Đã tải xuống tệp Excel báo cáo.");
    } catch (error) {
      console.error("Error exporting report:", error);
      showToast("Lỗi", "Không thể xuất file Excel", "error");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    if (invalidDateRange) {
      showToast("Khoảng thời gian không hợp lệ", "Vui lòng kiểm tra ngày bắt đầu và ngày kết thúc.", "error");
      return;
    }
    window.print();
  };

  const filterSummary = [
    `Thời gian: ${formatReportDate(startDate)} – ${formatReportDate(endDate)}`,
    `Kỹ thuật viên: ${selectedTechnicianId === "ALL"
      ? "Tất cả"
      : technicians.find((technician) => technician.id === selectedTechnicianId)?.fullName || "—"}`,
    `Khoa / Phòng: ${selectedDepartmentId === "ALL"
      ? "Tất cả"
      : departments.find(([id]) => id === selectedDepartmentId)?.[1] || "—"}`,
    `Trạng thái: ${selectedStatus === "ALL"
      ? "Tất cả"
      : STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]?.label || selectedStatus}`,
  ];

  const formatScore = (score: number | null) => (score === null ? "—" : score.toFixed(1));

  return (
    <RoleGuard allowedRoles={["MANAGER", "ADMIN"]} requiredPermissions={["VIEW_REPORTS"]}>
      <div className="report-page max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        <div className="report-print">
          <header className="report-print-header">
            <div className="report-print-brand">TRUNG TÂM VẬN HÀNH CNTT BỆNH VIỆN</div>
            <h1>BÁO CÁO CÔNG VIỆC & THỐNG KÊ</h1>
            <p>Báo cáo phân công, tiến độ xử lý và kết quả công việc kỹ thuật</p>
            <div className="report-print-meta">
              <span><strong>Kỳ báo cáo:</strong> {formatReportDate(startDate)} – {formatReportDate(endDate)}</span>
              <span><strong>Ngày lập:</strong> {formatDateTime(new Date())}</span>
              <span><strong>Số công việc:</strong> {assignedTickets.length}</span>
            </div>
            <div className="report-print-filters">
              <strong>Tiêu chí lọc:</strong> {filterSummary.join(" | ")}
            </div>
          </header>

          <section className="report-print-metrics">
            <div><span>Tổng công việc</span><strong>{assignedTickets.length}</strong></div>
            <div><span>Đang xử lý</span><strong>{activeTickets.length}</strong></div>
            <div><span>Hoàn thành / đóng</span><strong>{completedTickets.length}</strong></div>
            <div><span>Đúng hạn</span><strong>{onTimeRate === null ? "—" : `${onTimeRate}%`}</strong></div>
            <div><span>CSAT trung bình</span><strong>{averageCsat === null ? "—" : `${averageCsat.toFixed(1)}/10`}</strong></div>
          </section>

          <section className="report-print-section">
            <h2>TỔNG HỢP THEO NGƯỜI ĐƯỢC GIAO</h2>
            <table>
              <thead>
                <tr>
                  <th>STT</th><th>Kỹ thuật viên</th><th>Tổng việc</th><th>Đang xử lý</th>
                  <th>Hoàn thành</th><th>Quá hạn</th><th>Đúng hạn</th><th>Đánh giá TB</th>
                </tr>
              </thead>
              <tbody>
                {technicianSummaries.map((summary, index) => (
                  <tr key={summary.technician.id}>
                    <td>{index + 1}</td>
                    <td>{summary.technician.fullName}</td>
                    <td>{summary.assigned.length}</td>
                    <td>{summary.active.length}</td>
                    <td>{summary.completed.length}</td>
                    <td>{summary.overdue}</td>
                    <td>{summary.onTimeRate === null ? "—" : `${summary.onTimeRate}%`}</td>
                    <td>{formatScore(summary.averageEvaluation)}</td>
                  </tr>
                ))}
                {!technicianSummaries.length && (
                  <tr><td colSpan={8}>Không có dữ liệu theo tiêu chí đã chọn.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="report-print-section">
            <h2>CHI TIẾT CÔNG VIỆC ĐƯỢC GIAO</h2>
            <table>
              <thead>
                <tr>
                  <th>STT</th><th>Mã phiếu / Nội dung</th><th>Người được giao</th>
                  <th>Khoa / Phòng</th><th>Trạng thái</th><th>Ngày giao / Hạn xử lý</th>
                  <th>Kết quả xử lý</th><th>Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {selectedTickets.map((ticket, index) => (
                  <tr key={ticket.id}>
                    <td>{index + 1}</td>
                    <td><strong>{ticket.ticketCode}</strong><br />{ticket.title}</td>
                    <td>{ticket.assignment?.technician?.fullName || "—"}</td>
                    <td>{ticket.department?.name || "—"}</td>
                    <td>{STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.label || ticket.status}</td>
                    <td>
                      {formatDateTime(ticket.assignment?.assignedDate)}
                      <br />Hạn: {formatDateTime(ticket.assignment?.dueDate)}
                    </td>
                    <td>{ticket.taskReport?.reportContent || "Chưa có báo cáo kết quả"}</td>
                    <td>{ticket.evaluation ? `${ticket.evaluation.totalScore.toFixed(1)}/10` : "—"}</td>
                  </tr>
                ))}
                {!selectedTickets.length && (
                  <tr><td colSpan={8}>Không có dữ liệu theo tiêu chí đã chọn.</td></tr>
                )}
              </tbody>
            </table>
          </section>
          <footer className="report-print-footer">
            Báo cáo được trích xuất từ hệ thống IT ServiceDesk • Trang <span className="report-page-number" />
          </footer>
        </div>

        <div className="no-print space-y-5">
        <section className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">query_stats</span>
                </div>
                <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
                  Báo cáo công việc & thống kê
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Theo dõi tổng hợp và xem chi tiết công việc đã giao cho từng kỹ thuật viên
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl overflow-x-auto no-scrollbar shadow-inner self-start sm:self-auto">
              {[
                { id: "month", label: "Tháng này" },
                { id: "quarter", label: "Quý này" },
                { id: "year", label: "Năm nay" },
              ].map((range) => (
                <button
                  key={range.id}
                          onClick={() => applyPresetRange(range.id as "month" | "quarter" | "year")}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-surface-container-lowest text-on-surface-variant hover:text-primary"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-surface-container flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-on-surface-variant font-medium">
              {loading ? "Đang tải dữ liệu..." : `Có ${assignedTickets.length} công việc được giao trong kỳ`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>In báo cáo</span>
              </button>
              <ActionGuard
                action="EXPORT_REPORTS"
                fallback={
                  <span className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant text-xs font-bold shadow-sm">
                    Không có quyền xuất Excel
                  </span>
                }
              >
                <button
                  onClick={handleExportExcel}
                  disabled={exporting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">table_view</span>
                  <span>{exporting ? "Đang xuất..." : "Xuất Excel"}</span>
                </button>
              </ActionGuard>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-4">
          <div>
            <h2 className="font-heading font-bold text-base text-on-surface">Tiêu chí lọc báo cáo</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Các tiêu chí được áp dụng đồng thời cho số liệu, bảng chi tiết, bản in và Excel.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="space-y-1 text-xs font-semibold text-on-surface-variant">
              Từ ngày
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full min-h-10 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-on-surface-variant">
              Đến ngày
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                max={toDateInputValue(new Date())}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full min-h-10 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-on-surface-variant">
              Kỹ thuật viên
              <select
                value={selectedTechnicianId}
                onChange={(event) => setSelectedTechnicianId(event.target.value)}
                className="w-full min-h-10 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface"
              >
                <option value="ALL">Tất cả kỹ thuật viên</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>{technician.fullName}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-on-surface-variant">
              Khoa / Phòng
              <select
                value={selectedDepartmentId}
                onChange={(event) => setSelectedDepartmentId(event.target.value)}
                className="w-full min-h-10 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface"
              >
                <option value="ALL">Tất cả khoa / phòng</option>
                {departments.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-on-surface-variant">
              Trạng thái công việc
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="w-full min-h-10 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface"
              >
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <option key={status} value={status}>{config.label}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                onClick={() => {
                  applyPresetRange("month");
                  setSelectedTechnicianId("ALL");
                  setSelectedDepartmentId("ALL");
                  setSelectedStatus("ALL");
                }}
                className="min-h-10 rounded-xl border border-outline-variant px-4 text-sm font-bold text-on-surface hover:bg-surface-container-low"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
          {invalidDateRange && (
            <p className="text-sm font-medium text-error">Vui lòng chọn khoảng ngày hợp lệ.</p>
          )}
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: "Được giao", value: assignedTickets.length, icon: "assignment", color: "text-primary" },
            { label: "Đang xử lý", value: activeTickets.length, icon: "pending_actions", color: "text-amber-600" },
            { label: "Hoàn thành / đóng", value: completedTickets.length, icon: "task_alt", color: "text-emerald-700" },
            { label: "Tỷ lệ đúng hạn", value: onTimeRate === null ? "—" : `${onTimeRate}%`, icon: "event_available", color: "text-emerald-700" },
            { label: "CSAT trung bình", value: averageCsat === null ? "—" : `${averageCsat.toFixed(1)}/10`, icon: "sentiment_satisfied", color: "text-amber-600" },
          ].map((metric) => (
            <div key={metric.label} className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30">
              <span className="text-xs font-medium text-on-surface-variant">{metric.label}</span>
              <div className={`mt-2 flex items-center gap-2 font-heading font-extrabold text-2xl ${metric.color}`}>
                <span className="material-symbols-outlined text-[20px]">{metric.icon}</span>
                {metric.value}
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Công việc theo Khoa / Phòng", rows: departmentStats },
            { title: "Công việc theo nhóm sự cố", rows: categoryStats },
          ].map((chart) => (
            <div key={chart.title} className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-3">
              <h2 className="font-heading font-bold text-sm sm:text-base text-on-surface">{chart.title}</h2>
              {chart.rows.length ? (
                <div className="space-y-2.5">
                  {chart.rows.map((row) => {
                    const percentage = assignedTickets.length
                      ? Math.round((row.count / assignedTickets.length) * 100)
                      : 0;
                    return (
                      <div key={row.name} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-on-surface truncate">{row.name}</span>
                          <span className="font-bold text-on-surface-variant whitespace-nowrap">
                            {row.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">Chưa có dữ liệu trong kỳ.</p>
              )}
            </div>
          ))}
        </section>

        <section className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-on-surface">
                Báo cáo tổng hợp công việc theo người được giao
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Hạn đúng hạn được tính trên công việc đã có báo cáo kết quả và thời hạn giao.
              </p>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">{startDate} – {endDate}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-container text-outline uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Người được giao</th>
                  <th className="py-3 px-3 text-center">Tổng việc</th>
                  <th className="py-3 px-3 text-center">Đang xử lý</th>
                  <th className="py-3 px-3 text-center">Hoàn thành</th>
                  <th className="py-3 px-3 text-center">Quá hạn</th>
                  <th className="py-3 px-3 text-center">Đúng hạn</th>
                  <th className="py-3 px-3 text-center">Đánh giá TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {technicianSummaries.map((summary) => (
                  <tr
                    key={summary.technician.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTechnicianId === summary.technician.id
                        ? "bg-primary-fixed/40"
                        : "hover:bg-surface-container-low"
                    }`}
                    onClick={() => setSelectedTechnicianId(summary.technician.id)}
                  >
                    <td className="py-3 px-3">
                      <span className="font-bold text-on-surface block">{summary.technician.fullName}</span>
                      <span className="text-[11px] text-on-surface-variant">
                        {summary.technician.specialty || summary.technician.email}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{summary.assigned.length}</td>
                    <td className="py-3 px-3 text-center font-bold text-amber-700">{summary.active.length}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700">{summary.completed.length}</td>
                    <td className="py-3 px-3 text-center font-bold text-error">{summary.overdue}</td>
                    <td className="py-3 px-3 text-center font-bold">
                      {summary.onTimeRate === null ? "—" : `${summary.onTimeRate}%`}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      {formatScore(summary.averageEvaluation)}
                    </td>
                  </tr>
                ))}
                {!technicianSummaries.length && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-on-surface-variant">
                      Chưa có kỹ thuật viên hoặc công việc được giao trong kỳ.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-on-surface">
                Báo cáo chi tiết công việc
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Xem phiếu, tình trạng xử lý, hạn giao, báo cáo kết quả và điểm đánh giá.
              </p>
            </div>
            <span className="text-xs text-on-surface-variant">
              {selectedTickets.length} công việc theo tiêu chí đã chọn
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead>
                <tr className="border-b border-surface-container text-outline uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Mã phiếu / Tiêu đề</th>
                  <th className="py-3 px-3">Người được giao</th>
                  <th className="py-3 px-3">Khoa / Phòng</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Ngày giao / Hạn xử lý</th>
                  <th className="py-3 px-3">Báo cáo kết quả</th>
                  <th className="py-3 px-3 text-center">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {selectedTickets.map((ticket) => {
                  const status = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG];
                  const priority = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG];
                  return (
                    <tr key={ticket.id} className="align-top hover:bg-surface-container-low">
                      <td className="py-3 px-3 max-w-[250px]">
                        <span className="font-bold text-primary">{ticket.ticketCode}</span>
                        <p className="mt-1 font-medium text-on-surface">{ticket.title}</p>
                        <span className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${priority?.bg || "bg-surface-container"} ${priority?.text || "text-on-surface"}`}>
                          {priority?.label || ticket.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-on-surface">
                        {ticket.assignment?.technician?.fullName || "—"}
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant">{ticket.department?.name || "—"}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex rounded-full px-2 py-1 font-bold ${status?.bg || "bg-surface-container"} ${status?.text || "text-on-surface"}`}>
                          {status?.label || ticket.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant whitespace-nowrap">
                        <div>Giao: {formatDateTime(ticket.assignment?.assignedDate)}</div>
                        <div>Hạn: {formatDateTime(ticket.assignment?.dueDate)}</div>
                      </td>
                      <td className="py-3 px-3 max-w-[300px] whitespace-pre-wrap text-on-surface-variant">
                        {ticket.taskReport?.reportContent || "Chưa có báo cáo kết quả"}
                        {ticket.taskReport?.completedAt && (
                          <div className="mt-1 text-[10px]">Nộp lúc {formatDateTime(ticket.taskReport.completedAt)}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {ticket.evaluation ? `${ticket.evaluation.totalScore.toFixed(1)}/10` : "—"}
                      </td>
                    </tr>
                  );
                })}
                {!selectedTickets.length && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                      {loading ? "Đang tải dữ liệu..." : "Không có công việc được giao trong kỳ đã chọn."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        </div>
      </div>
    </RoleGuard>
  );
}
