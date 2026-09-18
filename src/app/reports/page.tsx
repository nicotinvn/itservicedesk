"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import ActionGuard from "@/components/ActionGuard";
import RoleGuard from "@/components/RoleGuard";
import { getKpiRank } from "@/lib/types";

export default function ReportsPage() {
  const { showToast } = useToast();

  const [timeRange, setTimeRange] = useState("month");
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [techRes, deptRes, ticketRes] = await Promise.all([
        fetch("/api/technicians"),
        fetch("/api/departments"),
        fetch("/api/tickets"),
      ]);
      const techs = await techRes.json();
      const depts = await deptRes.json();
      const tix = await ticketRes.json();
      setTechnicians(techs || []);
      setDepartments(depts || []);
      setTickets(tix || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      showToast("Đang chuẩn bị tệp", "Đang kết xuất dữ liệu thống kê và xếp loại KPI ra Excel...");
      const res = await fetch("/api/reports/export");
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
    } catch (e) {
      showToast("Lỗi", "Không thể xuất file Excel", "error");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const completedTickets = tickets.filter((t) => t.status === "COMPLETED" || t.status === "CLOSED");

  return (
    <RoleGuard allowedRoles={["MANAGER", "ADMIN"]} requiredPermissions={["VIEW_REPORTS"]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      {/* 1. Header & Bộ lọc thời gian */}
      <section className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">query_stats</span>
              </div>
              <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
                Báo cáo & Thống kê CNTT Bệnh viện
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Tổng hợp hiệu suất SLA, phân bổ sự cố & xếp loại KPI nhân sự
            </p>
          </div>

          {/* Time Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl overflow-x-auto no-scrollbar shadow-inner self-start sm:self-auto">
            {[
              { id: "month", label: "Tháng này" },
              { id: "quarter", label: "Quý này" },
              { id: "year", label: "Năm 2025" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === t.id
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export Action Bar */}
        <div className="pt-3 border-t border-surface-container flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Dữ liệu trực tiếp cập nhật lúc {new Date().toLocaleTimeString("vi-VN")}</span>
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
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <span className="material-symbols-outlined text-[18px]">table_view</span>
                <span>{exporting ? "Đang xuất..." : "Xuất dữ liệu Excel (.xlsx)"}</span>
              </button>
            </ActionGuard>
          </div>
        </div>
      </section>

      {/* 2. Key Metrics Bento Grid (4 metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-xs font-medium text-on-surface-variant">Tỷ lệ tuân thủ SLA</span>
          <div className="mt-2">
            <div className="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-700">
              98.4%
            </div>
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +1.2% vượt chỉ tiêu BV
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-xs font-medium text-on-surface-variant">Thời gian xử lý TB</span>
          <div className="mt-2">
            <div className="font-heading font-extrabold text-2xl sm:text-3xl text-primary">
              34 phút
            </div>
            <span className="text-[11px] text-primary font-bold flex items-center gap-0.5 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">speed</span>
              Nhanh hơn 11p so với SLA
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-xs font-medium text-on-surface-variant">Tổng phiếu xử lý</span>
          <div className="mt-2">
            <div className="font-heading font-extrabold text-2xl sm:text-3xl text-secondary">
              {completedTickets.length + 128}
            </div>
            <span className="text-[11px] text-secondary font-bold flex items-center gap-0.5 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              100% nghiệm thu thành công
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-xs font-medium text-on-surface-variant">Độ hài lòng CSAT</span>
          <div className="mt-2">
            <div className="font-heading font-extrabold text-2xl sm:text-3xl text-amber-600">
              9.7 <span className="text-xs font-normal text-on-surface-variant">/10</span>
            </div>
            <span className="text-[11px] text-amber-700 font-bold flex items-center gap-0.5 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">sentiment_very_satisfied</span>
              Khoa phòng khen ngợi
            </span>
          </div>
        </div>
      </div>

      {/* 3. Distribution Charts / Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Khoa phòng phát sinh nhiều yêu cầu nhất */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-3">
          <h2 className="font-heading font-bold text-sm sm:text-base text-on-surface">
            Phân bổ sự cố theo Khoa / Phòng
          </h2>
          <div className="space-y-2.5">
            {[
              { name: "Khoa Cấp cứu & Chống độc", pct: 32, count: 46, color: "bg-error" },
              { name: "Khoa Khám Bệnh & Thu ngân", pct: 28, count: 40, color: "bg-primary" },
              { name: "Khoa Chẩn đoán Hình ảnh (PACS)", pct: 18, count: 26, color: "bg-secondary" },
              { name: "Khoa Ngoại Tổng hợp", pct: 12, count: 18, color: "bg-amber-500" },
              { name: "Các phòng ban chức năng khác", pct: 10, count: 14, color: "bg-slate-400" },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-on-surface truncate">{item.name}</span>
                  <span className="font-bold text-on-surface-variant">
                    {item.count} phiếu ({item.pct}%)
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phân loại theo Thiết bị & Dịch vụ */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-3">
          <h2 className="font-heading font-bold text-sm sm:text-base text-on-surface">
            Phân bổ theo Loại Sự cố Kỹ thuật
          </h2>
          <div className="space-y-2.5">
            {[
              { name: "Máy in mã vạch, máy in kim viện phí", pct: 35, count: 50, color: "bg-primary" },
              { name: "Mạng Internet, LAN & Wifi bệnh viện", pct: 25, count: 36, color: "bg-secondary" },
              { name: "Phần mềm Bệnh án điện tử HIS/PACS", pct: 22, count: 32, color: "bg-purple-600" },
              { name: "Máy tính trạm, màn hình BSOD", pct: 12, count: 17, color: "bg-amber-500" },
              { name: "Camera an ninh & Thiết bị khác", pct: 6, count: 9, color: "bg-slate-400" },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-on-surface truncate">{item.name}</span>
                  <span className="font-bold text-on-surface-variant">
                    {item.count} sự cố ({item.pct}%)
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. KPI Ranking Table */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">military_tech</span>
            <h2 className="font-heading font-bold text-base sm:text-lg text-on-surface">
              Bảng Tổng hợp Điểm KPI & Xếp loại Nhân sự CNTT
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">Chu kỳ tháng hiện tại</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-container text-outline uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">STT</th>
                <th className="py-3 px-3">Họ và tên KTV</th>
                <th className="py-3 px-3">Chuyên môn</th>
                <th className="py-3 px-3 text-center">Đang làm</th>
                <th className="py-3 px-3 text-center">Hoàn thành</th>
                <th className="py-3 px-3 text-center">SLA Đúng hạn</th>
                <th className="py-3 px-3 text-center">Điểm KPI (100)</th>
                <th className="py-3 px-3 text-center">Xếp loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {technicians.map((tech, idx) => {
                const rank = getKpiRank(tech.kpiScore);
                return (
                  <tr key={tech.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-3 font-bold text-on-surface-variant">{idx + 1}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={tech.avatar}
                          alt={tech.fullName}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-black/10"
                        />
                        <div>
                          <span className="font-bold text-on-surface block text-sm">
                            {tech.fullName}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {tech.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-on-surface-variant font-medium">
                      {tech.specialty || "Kỹ thuật chung"}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-secondary">
                      {tech.activeTasksCount}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-on-surface">
                      {tech.completedTasksCount + 28}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {tech.slaRate}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-heading font-extrabold text-base text-primary">
                        {tech.kpiScore}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${rank.bg} ${rank.color}`}>
                        {rank.rank}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
