import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/server-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "MANAGE_KPI");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      qualityScore = 9,
      progressScore = 10,
      coordinationScore = 9,
      managerComment,
    } = body;

    const assignment = await prisma.assignment.findUnique({
      where: { ticketId: id },
    });

    const ticketBeforeEvaluation = await prisma.ticket.findUnique({
      where: { id },
      select: { status: true, taskReport: { select: { id: true } } },
    });
    if (!ticketBeforeEvaluation?.taskReport) {
      return NextResponse.json({ error: "Kỹ thuật viên chưa nộp báo cáo hoàn thành" }, { status: 409 });
    }
    if (ticketBeforeEvaluation.status !== "PENDING_CONFIRMATION" && ticketBeforeEvaluation.status !== "COMPLETED") {
      return NextResponse.json({ error: "Phiếu chưa ở trạng thái chờ trưởng phòng xác nhận" }, { status: 409 });
    }

    const technicianId = assignment?.technicianId;
    if (!technicianId) {
      return NextResponse.json({ error: "No technician assigned to this ticket" }, { status: 400 });
    }

    // Weight formula: Quality 40%, Progress 30%, Coordination 30%
    const totalScore = Number(
      (qualityScore * 0.4 + progressScore * 0.3 + coordinationScore * 0.3).toFixed(1)
    );

    const evaluation = await prisma.evaluation.upsert({
      where: { ticketId: id },
      create: {
        ticketId: id,
        technicianId,
        qualityScore: Number(qualityScore),
        progressScore: Number(progressScore),
        coordinationScore: Number(coordinationScore),
        totalScore,
        managerComment,
      },
      update: {
        qualityScore: Number(qualityScore),
        progressScore: Number(progressScore),
        coordinationScore: Number(coordinationScore),
        totalScore,
        managerComment,
      },
    });

    // Manager confirmation completes the operational workflow. CSAT is optional.
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status: "COMPLETED",
        currentStep: 6,
      },
      include: {
        evaluation: true,
        assignment: { include: { technician: true } },
      },
    });

    return NextResponse.json({ success: true, ticket, evaluation });
  } catch (error) {
    console.error("Error saving evaluation:", error);
    return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
  }
}
