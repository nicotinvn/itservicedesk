import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, resolveDbUserFromRequest } from "@/lib/server-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "UPDATE_TICKET");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { reportContent, proofImages, technicianId } = body;

    if (!reportContent) {
      return NextResponse.json({ error: "Report content is required" }, { status: 400 });
    }

    const authDbUser = await resolveDbUserFromRequest(request);
    const assignment = await prisma.assignment.findUnique({ where: { ticketId: id } });

    if (
      authDbUser?.role === "TECHNICIAN" &&
      assignment?.technicianId !== authDbUser.id
    ) {
      return NextResponse.json({ error: "Bạn không phải kỹ thuật viên được phân công cho phiếu này" }, { status: 403 });
    }

    if (!assignment) {
      return NextResponse.json({ error: "Phiếu chưa được phân công kỹ thuật viên" }, { status: 409 });
    }

    // Determine technicianId using the real DB user matching the logged-in technician/session
    let validTechId = technicianId;
    if (!validTechId || !(await prisma.user.findUnique({ where: { id: validTechId } }))) {
      validTechId = assignment?.technicianId ?? authDbUser?.id ?? (await prisma.user.findFirst({ where: { role: "TECHNICIAN" } }))?.id ?? "tech";
    }

    const taskReport = await prisma.taskReport.upsert({
      where: { ticketId: id },
      create: {
        ticketId: id,
        technicianId: validTechId,
        reportContent,
        proofImages: proofImages ? (typeof proofImages === "string" ? proofImages : JSON.stringify(proofImages)) : null,
        completedAt: new Date(),
      },
      update: {
        reportContent,
        proofImages: proofImages ? (typeof proofImages === "string" ? proofImages : JSON.stringify(proofImages)) : null,
        completedAt: new Date(),
      },
    });

    // Advance ticket to step 5 (Chờ nghiệm thu)
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status: "PENDING_CONFIRMATION",
        currentStep: 5,
      },
      include: {
        taskReport: true,
        assignment: { include: { technician: true } },
      },
    });

    return NextResponse.json({ success: true, ticket, taskReport });
  } catch (error) {
    console.error("Error submitting task report:", error);
    return NextResponse.json({ error: "Failed to submit task report" }, { status: 500 });
  }
}
