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
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");
    const technicianId = searchParams.get("technicianId");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const startDate = startParam ? new Date(startParam) : undefined;
    const endDate = endParam ? new Date(endParam) : undefined;
    if (
      (startDate && Number.isNaN(startDate.getTime())) ||
      (endDate && Number.isNaN(endDate.getTime()))
    ) {
      return NextResponse.json({ error: "Invalid report date range" }, { status: 400 });
    }
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json({ error: "Report start date must be before end date" }, { status: 400 });
    }

    const assignedDateFilter =
      startDate || endDate
        ? {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          }
        : undefined;
    const assignmentFilter = {
      ...(assignedDateFilter ? { assignedDate: assignedDateFilter } : {}),
      ...(technicianId ? { technicianId } : {}),
    };
    const assignedTicketFilter = {
      ...(Object.keys(assignmentFilter).length ? { assignment: assignmentFilter } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(status ? { status } : {}),
    };

    const tickets = await prisma.ticket.findMany({
      where: assignedTicketFilter,
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
      where: { role: "TECHNICIAN", ...(technicianId ? { id: technicianId } : {}) },
      include: {
        assignedTasks: {
          where: {
            ...assignmentFilter,
            ...(departmentId || status
              ? {
                  ticket: {
                    ...(departmentId ? { departmentId } : {}),
                    ...(status ? { status } : {}),
                  },
                }
              : {}),
          },
          include: { ticket: { include: { evaluation: true, csatRating: true, taskReport: true } } },
        },
      },
    });

    const departments = await prisma.department.findMany({
      where: departmentId ? { id: departmentId } : undefined,
      include: {
        tickets: {
          ...(assignedTicketFilter ? { where: assignedTicketFilter } : {}),
        },
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
      const active = tech.assignedTasks.filter((a) =>
        ["APPROVED", "IN_PROGRESS", "PENDING_CONFIRMATION"].includes(a.ticket.status)
      );
      const reportedCompleted = completed.filter((a) => a.ticket.taskReport && a.dueDate);
      const onTime = reportedCompleted.filter(
        (a) => a.ticket.taskReport!.completedAt <= a.dueDate
      );
      const overdue = active.filter((a) => a.dueDate < new Date());
      const evals = tech.assignedTasks
        .map((assignment) => assignment.ticket.evaluation)
        .filter((evaluation): evaluation is NonNullable<typeof evaluation> => !!evaluation);
      const avgScore = evals.length
        ? evals.reduce((sum, e) => sum + e.totalScore, 0) / evals.length
        : null;
      const rankInfo = avgScore === null ? null : getKpiRank(avgScore * 10);

      return {
        STT: idx + 1,
        "Họ và tên KTV": tech.fullName,
        Email: tech.email,
        "Chuyên môn": tech.specialty || "",
        "Việc được giao": tech.assignedTasks.length,
        "Đang xử lý": active.length,
        "Đã hoàn thành": completed.length,
        "Quá hạn": overdue.length,
        "Đúng hạn": reportedCompleted.length
          ? `${Math.round((onTime.length / reportedCompleted.length) * 100)}%`
          : "",
        "Điểm đánh giá TB (10)": avgScore === null ? "" : Number(avgScore.toFixed(1)),
        "Điểm quy đổi (100)": avgScore === null ? "" : Number((avgScore * 10).toFixed(1)),
        "Xếp loại": rankInfo?.rank || "",
      };
    });

    // 3. Detailed work report by assignee
    const taskDetailsData = tickets
      .filter((ticket) => ticket.assignment)
      .map((ticket, idx) => ({
        STT: idx + 1,
        "Mã phiếu": ticket.ticketCode,
        "Tiêu đề yêu cầu": ticket.title,
        "Khoa / Phòng": ticket.department.name,
        "Kỹ thuật viên được giao": ticket.assignment?.technician.fullName || "",
        "Ngày giao": ticket.assignment?.assignedDate
          ? formatDateTime(ticket.assignment.assignedDate)
          : "",
        "Thời hạn xử lý": ticket.assignment?.dueDate
          ? formatDateTime(ticket.assignment.dueDate)
          : "",
        "Trạng thái": STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG]?.label || ticket.status,
        "Báo cáo kết quả": ticket.taskReport?.reportContent || "",
        "Thời gian nộp báo cáo": ticket.taskReport?.completedAt
          ? formatDateTime(ticket.taskReport.completedAt)
          : "",
        "Điểm đánh giá (10)": ticket.evaluation?.totalScore ?? "",
        "Điểm hài lòng CSAT (10)": ticket.csatRating?.score ?? "",
      }));

    // 4. Data for Departments Sheet
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
    XLSX.utils.book_append_sheet(wb, wsKpi, "Tổng hợp theo KTV");

    const wsTaskDetails = XLSX.utils.json_to_sheet(taskDetailsData);
    XLSX.utils.book_append_sheet(wb, wsTaskDetails, "Chi tiết công việc");

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
