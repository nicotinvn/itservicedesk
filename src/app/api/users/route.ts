import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/server-auth";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const auth = requireRole(request, ["ADMIN", "MANAGER"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(users.map(({ passwordHash, ...user }) => user));
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireRole(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { username, fullName, email, phone, role, departmentId, specialty, password } = body;

    const normalizedUsername = String(username || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedUsername || !normalizedEmail) {
      return NextResponse.json({ error: "Username và email là bắt buộc" }, { status: 400 });
    }

    const duplicateUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: normalizedUsername },
          { email: normalizedEmail },
        ],
      },
      select: { username: true, email: true },
    });
    if (duplicateUser) {
      const duplicateField = duplicateUser.username === normalizedUsername ? "Tên đăng nhập" : "Email";
      return NextResponse.json({ error: `${duplicateField} đã tồn tại` }, { status: 409 });
    }

    if (!password || String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const passwordHash = bcrypt.hashSync(String(password), 10);

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        fullName,
        email: normalizedEmail,
        phone,
        role: role || "DEPARTMENT_USER",
        departmentId,
        specialty,
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM133Vt-gxwZ9S4687hyK5kpyl7INMKz7ondjzHGx4RC0DAnldQgLOGLJe844sR4qNsiTw_90Fz-lsmkCJImjm5WxY9ROr1s8jpLS4i-N3x_qBQ_ebngGCDlo1J6kNeukvLTrDff_TgFwHhnWtQmcLjxEkb8P9OiZNmAvHgpq1UgDbaudCfwUqT_Ei2u6mg2S2AMs3Bk788fSp6AqlkYRWJ_yNIVXGnzErbAryaGdnCOMVg6eKyY",
        passwordHash,
      },
      include: {
        department: true,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "Username hoặc email đã tồn tại" }, { status: 409 });
    }
    return NextResponse.json({ error: "Không thể tạo tài khoản. Kiểm tra lại khoa/phòng và dữ liệu bắt buộc." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = requireRole(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, username, fullName, email, phone, role, departmentId, specialty, active, password } = body;

    if (password && String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalizedUsername = String(username || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const duplicateUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: normalizedUsername }, { email: normalizedEmail }],
        NOT: { id },
      },
      select: { username: true, email: true },
    });
    if (duplicateUser) {
      const duplicateField = duplicateUser.username === normalizedUsername ? "Tên đăng nhập" : "Email";
      return NextResponse.json({ error: `${duplicateField} đã tồn tại` }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        username: normalizedUsername,
        fullName,
        email: normalizedEmail,
        phone,
        role,
        departmentId,
        specialty,
        active: active !== undefined ? active : true,
        ...(password ? { passwordHash: bcrypt.hashSync(String(password), 10) } : {}),
      },
      include: {
        department: true,
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = requireRole(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Không thể xóa người dùng đã phát sinh phiếu hoặc công việc liên quan" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
