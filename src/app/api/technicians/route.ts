import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = requireRole(request, ["ADMIN", "MANAGER", "TECHNICIAN"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const technicians = await prisma.user.findMany({
      where: {
        role: "TECHNICIAN",
      },
      include: {
        assignedTasks: {
          include: {
            ticket: {
              include: {
                department: true,
                evaluation: true,
                csatRating: true,
                taskReport: true,
              },
            },
          },
        },
        evaluations: true,
      },
    });

    const kpiConfig = await prisma.kpiConfig.findFirst({ where: { isDefault: true } });
    const qw = (kpiConfig?.qualityWeight || 40) / 100;
    const pw = (kpiConfig?.progressWeight || 30) / 100;
    const cw = (kpiConfig?.satisfactionWeight || 20) / 100;
    const ww = (kpiConfig?.workloadWeight || 10) / 100;

    const result = technicians.map((tech) => {
      const activeTasks = tech.assignedTasks.filter(
        (a) =>
          a.ticket.status === "APPROVED" ||
          a.ticket.status === "IN_PROGRESS" ||
          a.ticket.status === "PENDING_CONFIRMATION"
      );
      const completedTasks = tech.assignedTasks.filter(
        (a) => a.ticket.status === "COMPLETED" || a.ticket.status === "CLOSED"
      );

      // Average scores
      const evals = tech.evaluations;
      const avgQuality = evals.length
        ? evals.reduce((sum, e) => sum + e.qualityScore, 0) / evals.length
        : 9.0;
      const avgProgress = evals.length
        ? evals.reduce((sum, e) => sum + e.progressScore, 0) / evals.length
        : 9.5;

      // CSAT average
      const ratedTasks = completedTasks.filter((t) => t.ticket.csatRating);
      const avgCsat = ratedTasks.length
        ? ratedTasks.reduce((sum, t) => sum + (t.ticket.csatRating?.score || 10), 0) / ratedTasks.length
        : 10.0;

      // Workload normalized to 10 points (e.g. 5+ tasks = 10 points)
      const workloadScore = Math.min(10, (completedTasks.length + 1) * 2);

      // Composite KPI score out of 100
      const compositeScore = Number(
        ((avgQuality * qw + avgProgress * pw + avgCsat * cw + workloadScore * ww) * 10).toFixed(1)
      );

      // SLA on-time rate
      const onTimeCount = completedTasks.filter((t) => {
        if (!t.ticket.taskReport) return true;
        return t.ticket.taskReport.completedAt <= t.dueDate;
      }).length;
      const slaRate = completedTasks.length
        ? Math.round((onTimeCount / completedTasks.length) * 100)
        : 96;

      return {
        id: tech.id,
        username: tech.username,
        fullName: tech.fullName,
        email: tech.email,
        phone: tech.phone,
        specialty: tech.specialty,
        avatar: tech.avatar,
        activeTasksCount: activeTasks.length,
        completedTasksCount: completedTasks.length,
        activeTasks: activeTasks.map((a) => a.ticket),
        kpiScore: compositeScore || 92.5,
        slaRate,
        isBusy: activeTasks.length >= 3,
        status: activeTasks.length >= 3 ? "Bận xử lý" : activeTasks.length > 0 ? "Đang có việc" : "Sẵn sàng nhận việc",
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return NextResponse.json({ error: "Failed to fetch technicians" }, { status: 500 });
  }
}
