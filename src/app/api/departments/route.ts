import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = requireRole(request, ["ADMIN", "MANAGER", "TECHNICIAN", "DEPARTMENT_USER"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            tickets: true,
            users: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireRole(request, ["ADMIN", "MANAGER"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { code, name, category, building, floor, room, leaderName, phone, staffCount } = body;

    const department = await prisma.department.create({
      data: {
        code,
        name,
        category: category || "CLINICAL",
        building,
        floor,
        room,
        leaderName,
        phone,
        staffCount: Number(staffCount) || 0,
      },
    });
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = requireRole(request, ["ADMIN", "MANAGER"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, code, name, category, building, floor, room, leaderName, phone, staffCount } = body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        code,
        name,
        category,
        building,
        floor,
        room,
        leaderName,
        phone,
        staffCount: Number(staffCount) || 0,
      },
    });
    return NextResponse.json(department);
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}
