import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { formatDateTime, getKpiRank, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/types";
import { requirePermission } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = requirePermission(request, "EXPORT_REPORTS");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        department: true,
        assignment: { include: { technician: true } },
        taskReport: true,
        evaluation: true,
        csatRating: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const technicians = await prisma.user.findMany({
      where: { role: "TECHNICIAN" },
      include: {
        assignedTasks: { include: { ticket: { include: { evaluation: true, csatRating: true, taskReport: true } } } },
        evaluations: true,
      },
    });

    const departments = await prisma.department.findMany({
      include: {
        tickets: true,
      },
    });

    // 1. Data for Tickets Sheet
    const ticketsData = tickets.map((t, idx) => ({
      STT: idx + 1,
      "Mã phiếu": t.ticketCode,
      "Tiêu đề yêu cầu": t.title,
      "Khoa / Phòng": t.department.name,
      "Người yêu cầu": t.requesterName || "",
      "Số điện thoại": t.requesterPhone || "",
      "Mức độ ưu tiên": PRIORITY_CONFIG[t.priority as keyof typeof PRIORITY_CONFIG]?.label || t.priority,
      "Trạng thái": STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG]?.label || t.status,
      "Kỹ thuật viên": t.assignment?.technician?.fullName || "Chưa phân công",
      "Thời hạn cam kết": t.assignment?.dueDate ? formatDateTime(t.assignment.dueDate) : "",
      "Điểm đánh giá TP (10)": t.evaluation?.totalScore || "",
      "Điểm hài lòng CSAT (10)": t.csatRating?.score || "",
      "Thời gian tạo": formatDateTime(t.createdAt),
    }));

    // 2. Data for Technicians KPI Sheet
    const kpiData = technicians.map((tech, idx) => {
      const completed = tech.assignedTasks.filter(
        (a) => a.ticket.status === "COMPLETED" || a.ticket.status === "CLOSED"
      );
      const evals = tech.evaluations;
      const avgScore = evals.length
        ? evals.reduce((sum, e) => sum + e.totalScore, 0) / evals.length
        : 9.2;
      const rankInfo = getKpiRank(avgScore * 10);

      return {
        STT: idx + 1,
        "Họ và tên KTV": tech.fullName,
        Email: tech.email,
        "Chuyên môn": tech.specialty || "",
        "Việc được giao": tech.assignedTasks.length,
        "Đã hoàn thành": completed.length,
        "Điểm KPI quy đổi (100)": Number((avgScore * 10).toFixed(1)),
        "Xếp loại KPI": rankInfo.rank,
      };
    });

    // 3. Data for Departments Sheet
    const deptData = departments.map((d, idx) => {
      const completedCount = d.tickets.filter((t) => t.status === "COMPLETED" || t.status === "CLOSED").length;
      return {
        STT: idx + 1,
        "Mã khoa": d.code,
        "Tên khoa / phòng": d.name,
        "Phân loại": d.category === "CLINICAL" ? "Lâm sàng" : d.category === "PARACLINICAL" ? "Cận lâm sàng" : "Hành chính",
        "Tòa nhà / Vị trí": `${d.building || ""} - ${d.floor || ""}`,
        "Tổng số yêu cầu": d.tickets.length,
        "Đã hoàn thành": completedCount,
        "Tỷ lệ hoàn thành": d.tickets.length ? `${Math.round((completedCount / d.tickets.length) * 100)}%` : "100%",
      };
    });

    const wb = XLSX.utils.book_new();

    const wsTickets = XLSX.utils.json_to_sheet(ticketsData);
    XLSX.utils.book_append_sheet(wb, wsTickets, "Danh sách phiếu");

    const wsKpi = XLSX.utils.json_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKpi, "Đánh giá KPI nhân viên");

    const wsDept = XLSX.utils.json_to_sheet(deptData);
    XLSX.utils.book_append_sheet(wb, wsDept, "Thống kê Khoa Phòng");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Bao_cao_ITServiceDesk.xlsx"',
      },
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}
