import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { findAuthUserByUsername } from "@/lib/auth-preset";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "").trim();

    if (!username || !password) {
      return NextResponse.json({ error: "Thiếu username hoặc password" }, { status: 400 });
    }

    const presetUser = findAuthUserByUsername(username);
    if (presetUser) {
      const validDefaultPassword = password === "123456" || password === presetUser.username;
      if (!validDefaultPassword) {
        return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
      }

      return NextResponse.json({
        id: presetUser.id,
        username: presetUser.username,
        fullName: presetUser.fullName,
        email: presetUser.email,
        phone: presetUser.phone,
        role: presetUser.role,
        departmentId: presetUser.departmentId,
        departmentName: presetUser.departmentName,
        specialty: presetUser.specialty,
        avatar: presetUser.avatar,
      });
    }

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
      include: {
        department: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 401 });
    }

    const hasPasswordHash = !!dbUser.passwordHash;
    const validByDefault = password === "123456" || password === dbUser.username;
    if (!hasPasswordHash && !validByDefault) {
      return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
    }

    if (hasPasswordHash) {
      const ok = bcrypt.compareSync(password, dbUser.passwordHash ?? "");
      if (!ok) {
        return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
      }
    }

    return NextResponse.json({
      id: dbUser.id,
      username: dbUser.username,
      fullName: dbUser.fullName,
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role,
      departmentId: dbUser.departmentId,
      departmentName: dbUser.department?.name ?? null,
      specialty: dbUser.specialty,
      avatar: dbUser.avatar,
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Lỗi đăng nhập" }, { status: 500 });
  }
}
