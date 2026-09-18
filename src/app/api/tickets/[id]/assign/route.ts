import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, resolveDbUserFromRequest } from "@/lib/server-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "ASSIGN_TICKET");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      technicianId,
      assignedById,
      managerNote,
      slaMinutes = 45,
    } = body;

    if (!technicianId) {
      return NextResponse.json({ error: "Technician is required" }, { status: 400 });
    }

    const authDbUser = await resolveDbUserFromRequest(request);

    // Default assignedById to the actual logged-in manager/admin account from the auth session
    let validAssignedById = assignedById;
    if (!validAssignedById || !(await prisma.user.findUnique({ where: { id: validAssignedById } }))) {
      validAssignedById = authDbUser?.id ?? (await prisma.user.findFirst({ where: { role: "MANAGER" } }))?.id ?? technicianId;
    }

    const dueDate = new Date(Date.now() + slaMinutes * 60 * 1000);

    // Upsert assignment
    const assignment = await prisma.assignment.upsert({
      where: { ticketId: id },
      create: {
        ticketId: id,
        technicianId,
        assignedById: validAssignedById,
        assignedDate: new Date(),
        dueDate,
        managerNote,
      },
      update: {
        technicianId,
        assignedById: validAssignedById,
        dueDate,
        managerNote,
      },
    });

    // Keep approval state explicit while continuing to assignment flow.
    // Step 2: manager approves the ticket, Step 3: assignment happens.
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: "APPROVED",
        currentStep: 3,
      },
      include: {
        assignment: {
          include: {
            technician: true,
          },
        },
        department: true,
      },
    });

    return NextResponse.json({ success: true, ticket: updatedTicket, assignment });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return NextResponse.json({ error: "Failed to assign ticket" }, { status: 500 });
  }
}
