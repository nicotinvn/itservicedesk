import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveDbUserFromRequest } from "@/lib/server-auth";

export async function GET(request: Request) {
  const user = await resolveDbUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized: vui lòng đăng nhập" }, { status: 401 });
  }

  const result = await prisma.user.findUnique({
    where: { id: user.id },
    include: { department: true },
  });
  if (!result) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { passwordHash, ...safeUser } = result;
  return NextResponse.json(safeUser);
}

export async function PUT(request: Request) {
  const user = await resolveDbUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized: vui lòng đăng nhập" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fullName, email, phone, specialty, avatar } = body;

    if (!fullName || !email) {
      return NextResponse.json({ error: "Họ tên và email là bắt buộc" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { fullName, email, phone: phone || null, specialty: specialty || null, avatar: avatar || null },
      include: { department: true },
    });

    const { passwordHash, ...safeUser } = updated;
    return NextResponse.json(safeUser);
  } catch (error: any) {
    console.error("Error updating own profile:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 409 });
    }
    return NextResponse.json({ error: "Không thể cập nhật hồ sơ" }, { status: 500 });
  }
}