import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, resolveDbUserFromRequest } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = requirePermission(request, "VIEW_TICKETS");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusValues = searchParams.getAll("status");
    const statusParam = searchParams.get("status");
    const statusesCsv = searchParams.get("statuses") || "";
    const priority = searchParams.get("priority");
    const departmentId = searchParams.get("departmentId");
    const technicianId = searchParams.get("technicianId");
    const dbUser = await resolveDbUserFromRequest(request);

    const where: any = {};

    const requestedStatuses = [...statusValues, ...statusesCsv.split(",").filter(Boolean)];
    const validStatuses = requestedStatuses.filter((value) => value && value !== "ALL");

    if (dbUser?.role === "DEPARTMENT_USER" && dbUser.departmentId) {
      where.departmentId = dbUser.departmentId;
    } else if (departmentId && departmentId !== "ALL") {
      where.departmentId = departmentId;
    }

    if (validStatuses.length > 0) {
      where.status = { in: validStatuses };
    }

    if (statusParam && statusParam !== "ALL" && validStatuses.length === 0) {
      where.status = statusParam;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (technicianId && technicianId !== "ALL") {
      const technician = await prisma.user.findFirst({
        where: { OR: [{ id: technicianId }, { username: technicianId }] },
        select: { id: true },
      });
      where.assignment = { technicianId: technician?.id ?? technicianId };
    }

    if (search) {
      where.OR = [
        { ticketCode: { contains: search } },
        { title: { contains: search } },
        { description: { contains: search } },
        { requesterName: { contains: search } },
        { department: { name: { contains: search } } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
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

    const statusOrder: Record<string, number> = {
      PENDING_APPROVAL: 0,
      APPROVED: 1,
      IN_PROGRESS: 2,
      PENDING_CONFIRMATION: 3,
      COMPLETED: 4,
      CLOSED: 5,
      REJECTED: 6,
    };

    const orderedTickets = [...tickets].sort((a, b) => {
      const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(orderedTickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "CREATE_TICKET");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      category = "OTHER",
      priority = "MEDIUM",
      departmentId,
      creatorId,
      requesterName,
      requesterPhone,
      roomLocation,
      images,
    } = body;

    // Generate unique code: YC + YYYYMM + 4-digit sequence
    const now = new Date();
    const prefix = `YC${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = await prisma.ticket.count();
    const ticketCode = `${prefix}${String(count + 1).padStart(4, "0")}`;

    const authDbUser = await resolveDbUserFromRequest(request);

    // Find a valid creator using the logged-in user from the demo auth session
    let validCreatorId = creatorId;
    if (!validCreatorId || !(await prisma.user.findUnique({ where: { id: validCreatorId } }))) {
      validCreatorId = authDbUser?.id ?? (await prisma.user.findFirst())?.id ?? "admin";
    }

    // Department-scoped access: a khoa/phòng user can only create requests in their own unit
    let validDeptId = departmentId;
    if (authDbUser?.role === "DEPARTMENT_USER") {
      validDeptId = authDbUser.departmentId || validDeptId;
    }

    if (!validDeptId) {
      const defaultDept = await prisma.department.findFirst();
      validDeptId = defaultDept?.id || "dept";
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        title,
        description,
        category,
        priority,
        status: "PENDING_APPROVAL",
        currentStep: 1,
        departmentId: validDeptId,
        creatorId: validCreatorId,
        requesterName: requesterName || "Bác sĩ / Điều dưỡng",
        requesterPhone: requesterPhone || "0912.345.678",
        roomLocation: roomLocation || "Khu khám lâm sàng",
        images: images ? (typeof images === "string" ? images : JSON.stringify(images)) : null,
      },
      include: {
        department: true,
        creator: true,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
