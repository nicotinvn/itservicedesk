"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import ActionGuard from "@/components/ActionGuard";
import RoleGuard from "@/components/RoleGuard";

export default function KpiConfigPage() {
  const { showToast } = useToast();

  const [qualityWeight, setQualityWeight] = useState(40);
  const [progressWeight, setProgressWeight] = useState(30);
  const [satisfactionWeight, setSatisfactionWeight] = useState(20);
  const [workloadWeight, setWorkloadWeight] = useState(10);

  const [excellentThreshold, setExcellentThreshold] = useState(90);
  const [goodThreshold, setGoodThreshold] = useState(80);
  const [fairThreshold, setFairThreshold] = useState(70);
  const [averageThreshold, setAverageThreshold] = useState(60);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/kpi-config");
      const data = await res.json();
      if (data) {
        setQualityWeight(data.qualityWeight || 40);
        setProgressWeight(data.progressWeight || 30);
        setSatisfactionWeight(data.satisfactionWeight || 20);
        setWorkloadWeight(data.workloadWeight || 10);
        setExcellentThreshold(data.excellentThreshold || 90);
        setGoodThreshold(data.goodThreshold || 80);
        setFairThreshold(data.fairThreshold || 70);
        setAverageThreshold(data.averageThreshold || 60);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalWeight =
    Number(qualityWeight) +
    Number(progressWeight) +
    Number(satisfactionWeight) +
    Number(workloadWeight);

  const isTotalValid = Math.abs(totalWeight - 100) < 0.01;

  const handleReset = () => {
    setQualityWeight(40);
    setProgressWeight(30);
    setSatisfactionWeight(20);
    setWorkloadWeight(10);
    setExcellentThreshold(90);
    setGoodThreshold(80);
    setFairThreshold(70);
    setAverageThreshold(60);
    showToast("Đã khôi phục", "Trọng số mặc định chuẩn BV-ITIL 40-30-20-10 đã được thiết lập.");
  };

  const handleSave = async () => {
    if (!isTotalValid) {
      showToast(
        "Tổng trọng số không hợp lệ",
        `Tổng các trọng số phải bằng 100% (Hiện tại: ${totalWeight}%)`,
        "error"
      );
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/kpi-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qualityWeight: Number(qualityWeight),
          progressWeight: Number(progressWeight),
          satisfactionWeight: Number(satisfactionWeight),
          workloadWeight: Number(workloadWeight),
          excellentThreshold: Number(excellentThreshold),
          goodThreshold: Number(goodThreshold),
          fairThreshold: Number(fairThreshold),
          averageThreshold: Number(averageThreshold),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      showToast("Thành công", "Đã lưu cấu hình trọng số KPI và thang xếp loại vào hệ thống.");
    } catch (e: any) {
      showToast("Lỗi", e.message || "Không thể lưu cấu hình", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["MANAGER", "ADMIN"]} requiredPermissions={["MANAGE_KPI"]}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-5">
      {/* 1. Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-bold text-xs">
              <span className="material-symbols-outlined text-[15px]">tune</span>
              Quản trị hệ thống & Cấu hình
            </span>
            <span className="text-xs text-on-surface-variant">• BV-ITIL 2.4</span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface mt-1">
            Cấu hình Trọng số KPI & Thang Xếp loại
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Thiết lập công thức tính điểm tự động và chuẩn hóa định mức đánh giá nhân viên CNTT
          </p>
        </div>

        <ActionGuard
          action="MANAGE_KPI"
          fallback={
            <span className="px-3.5 py-2 rounded-xl bg-surface-container text-on-surface-variant text-xs font-bold self-start sm:self-auto">
              Bạn không có quyền điều chỉnh KPI
            </span>
          }
        >
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Khôi phục chuẩn 40-30-20-10</span>
          </button>
        </ActionGuard>
      </div>

      {/* 2. Hero Formula Visualization Card */}
      <div className="bg-gradient-to-br from-primary via-primary-container to-secondary rounded-2xl p-5 sm:p-6 text-on-primary shadow-md relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/10 pointer-events-none"></div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-primary/80 flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">functions</span>
              Công thức tính điểm tổng
            </span>
            <div
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                isTotalValid
                  ? "bg-emerald-500/25 text-emerald-100"
                  : "bg-red-500/40 text-red-100 animate-pulse"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isTotalValid ? "verified" : "error"}
              </span>
              <span>
                Tổng trọng số: {totalWeight}% {isTotalValid ? "(Hợp lệ)" : "(Phải bằng 100%)"}
              </span>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-xl p-4">
            <p className="font-heading font-bold text-base sm:text-lg text-white leading-relaxed">
              Điểm KPI = (
              <span className="text-emerald-300 font-extrabold">{qualityWeight}%</span> × Chất
              lượng) + (
              <span className="text-cyan-300 font-extrabold">{progressWeight}%</span> × Tiến
              độ) + (
              <span className="text-amber-300 font-extrabold">{satisfactionWeight}%</span> ×
              CSAT) + (
              <span className="text-purple-300 font-extrabold">{workloadWeight}%</span> × Tải
              việc)
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-white/80 pt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">sync</span>
              Tự động cập nhật bảng xếp loại theo chu kỳ tháng
            </span>
            <span className="font-bold text-white">Quy chuẩn BV-ITIL</span>
          </div>
        </div>
      </div>

      {/* 3. 4 Interactive Weight Sliders */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/30 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </div>
          <h2 className="font-heading font-bold text-base text-on-surface">
            4 Trọng số Thành phần
          </h2>
        </div>

        {/* Slider 1: Quality */}
        <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <span className="text-sm font-bold text-on-surface">
                1. Chất lượng công việc (Trưởng phòng đánh giá)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={qualityWeight}
                onChange={(e) => setQualityWeight(Number(e.target.value))}
                className="w-16 text-right py-1 px-2 rounded-lg bg-surface-container-lowest font-heading font-bold text-base text-primary border border-surface-container shadow-inner"
              />
              <span className="text-xs font-bold text-on-surface-variant">%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={qualityWeight}
            onChange={(e) => setQualityWeight(Number(e.target.value))}
            className="w-full accent-primary h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Đánh giá chuyên môn, tuân thủ quy trình HIS/PACS & an toàn dữ liệu</span>
            <span className="font-bold text-primary">Trọng số chính</span>
          </div>
        </div>

        {/* Slider 2: Progress */}
        <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-secondary"></span>
              <span className="text-sm font-bold text-on-surface">
                2. Tiến độ hoàn thành (Cam kết thời hạn SLA)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={progressWeight}
                onChange={(e) => setProgressWeight(Number(e.target.value))}
                className="w-16 text-right py-1 px-2 rounded-lg bg-surface-container-lowest font-heading font-bold text-base text-secondary border border-surface-container shadow-inner"
              />
              <span className="text-xs font-bold text-on-surface-variant">%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={progressWeight}
            onChange={(e) => setProgressWeight(Number(e.target.value))}
            className="w-full accent-secondary h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Tỷ lệ hoàn thành trước hạn hoặc đúng khung giờ cam kết</span>
            <span className="font-bold text-secondary">Thời gian SLA</span>
          </div>
        </div>

        {/* Slider 3: CSAT */}
        <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-sm font-bold text-on-surface">
                3. Đánh giá hài lòng khoa phòng (CSAT)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={satisfactionWeight}
                onChange={(e) => setSatisfactionWeight(Number(e.target.value))}
                className="w-16 text-right py-1 px-2 rounded-lg bg-surface-container-lowest font-heading font-bold text-base text-amber-600 border border-surface-container shadow-inner"
              />
              <span className="text-xs font-bold text-on-surface-variant">%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={satisfactionWeight}
            onChange={(e) => setSatisfactionWeight(Number(e.target.value))}
            className="w-full accent-amber-500 h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Điểm do bác sĩ, điều dưỡng các khoa lâm sàng phản hồi trực tiếp</span>
            <span className="font-bold text-amber-600">Khách quan</span>
          </div>
        </div>

        {/* Slider 4: Workload */}
        <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-600"></span>
              <span className="text-sm font-bold text-on-surface">
                4. Khối lượng & Số lượng công việc hoàn thành
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={workloadWeight}
                onChange={(e) => setWorkloadWeight(Number(e.target.value))}
                className="w-16 text-right py-1 px-2 rounded-lg bg-surface-container-lowest font-heading font-bold text-base text-purple-700 border border-surface-container shadow-inner"
              />
              <span className="text-xs font-bold text-on-surface-variant">%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={workloadWeight}
            onChange={(e) => setWorkloadWeight(Number(e.target.value))}
            className="w-full accent-purple-600 h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Số lượng phiếu đã đóng trong tháng so với định mức chung</span>
            <span className="font-bold text-purple-700">Tải công việc</span>
          </div>
        </div>
      </div>

      {/* 4. Thang điểm Quy đổi Xếp loại */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/30 space-y-3">
        <h2 className="font-heading font-bold text-base text-on-surface">
          Thang điểm Quy đổi Xếp loại Hàng tháng
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-xs font-bold text-emerald-800 block">Xuất sắc</span>
            <span className="font-heading font-bold text-lg text-emerald-700">
              ≥ {excellentThreshold}
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Khen thưởng</span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <span className="text-xs font-bold text-blue-800 block">Tốt</span>
            <span className="font-heading font-bold text-lg text-blue-700">
              {goodThreshold} - {excellentThreshold - 1}
            </span>
            <span className="text-[10px] text-blue-600 block mt-0.5">Hoàn thành tốt</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-xs font-bold text-amber-800 block">Khá</span>
            <span className="font-heading font-bold text-lg text-amber-700">
              {fairThreshold} - {goodThreshold - 1}
            </span>
            <span className="text-[10px] text-amber-600 block mt-0.5">Đạt yêu cầu</span>
          </div>

          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
            <span className="text-xs font-bold text-orange-800 block">Trung bình</span>
            <span className="font-heading font-bold text-lg text-orange-700">
              {averageThreshold} - {fairThreshold - 1}
            </span>
            <span className="text-[10px] text-orange-600 block mt-0.5">Cần cố gắng</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center col-span-2 sm:col-span-1">
            <span className="text-xs font-bold text-rose-800 block">Chưa hoàn thành</span>
            <span className="font-heading font-bold text-lg text-rose-700">
              &lt; {averageThreshold}
            </span>
            <span className="text-[10px] text-rose-600 block mt-0.5">Nhắc nhở</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !isTotalValid}
          className="w-full sm:w-auto px-8 h-12 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">save</span>
          <span>{saving ? "Đang lưu cấu hình..." : "Lưu cấu hình KPI hệ thống"}</span>
        </button>
      </div>
    </div>
    </RoleGuard>
  );
}
