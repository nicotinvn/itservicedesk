import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, resolveDbUserFromRequest } from "@/lib/server-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "VIEW_TICKETS");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const dbUser = await resolveDbUserFromRequest(request);
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { ticketCode: id }],
      },
      include: {
        department: true,
        creator: true,
        assignment: {
          include: {
            technician: true,
            assignedBy: true,
          },
        },
        taskReport: {
          include: {
            technician: true,
          },
        },
        evaluation: {
          include: {
            technician: true,
          },
        },
        csatRating: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (dbUser?.role === "DEPARTMENT_USER" && dbUser.departmentId && ticket.departmentId !== dbUser.departmentId) {
      return NextResponse.json({ error: "Forbidden: không có quyền xem phiếu của khoa khác" }, { status: 403 });
    }

    return NextResponse.json(ticket, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Error fetching ticket detail:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(
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
    const { status, currentStep, priority, title, description } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (currentStep !== undefined) updateData.currentStep = currentStep;
    if (priority !== undefined) updateData.priority = priority;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const dbUser = await resolveDbUserFromRequest(request);
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      select: { departmentId: true, status: true, assignment: { select: { technicianId: true } } },
    });

    if (dbUser?.role === "DEPARTMENT_USER" && dbUser.departmentId && existingTicket?.departmentId !== dbUser.departmentId) {
      return NextResponse.json({ error: "Forbidden: không có quyền sửa phiếu của khoa khác" }, { status: 403 });
    }

    if (status === "IN_PROGRESS") {
      if (dbUser?.role !== "TECHNICIAN" || existingTicket?.assignment?.technicianId !== dbUser.id) {
        return NextResponse.json({ error: "Chỉ kỹ thuật viên được phân công mới có thể bắt đầu xử lý" }, { status: 403 });
      }
      if (existingTicket.status !== "APPROVED") {
        return NextResponse.json({ error: "Phiếu chưa ở trạng thái sẵn sàng để bắt đầu" }, { status: 409 });
      }
      updateData.currentStep = 4;
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        creator: true,
        assignment: {
          include: {
            technician: true,
          },
        },
        taskReport: true,
        evaluation: true,
        csatRating: true,
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
