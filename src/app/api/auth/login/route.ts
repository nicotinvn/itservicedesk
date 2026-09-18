import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { findAuthUserByUsername } from "@/lib/auth-preset";
import { setAuthSession } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "").trim();

    if (!username || !password) {
      return NextResponse.json({ error: "Thiếu username hoặc password" }, { status: 400 });
    }

    const presetUser = process.env.DEMO_MODE === "false" ? null : findAuthUserByUsername(username);
    if (presetUser) {
      const validDefaultPassword = process.env.DEMO_MODE !== "false" && (password === "123456" || password === presetUser.username);
      if (!validDefaultPassword) {
        return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
      }

      return setAuthSession(NextResponse.json({
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
      }), { id: presetUser.id, username: presetUser.username, role: presetUser.role });
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
      const bootstrapUser = findAuthUserByUsername(username);
      if (bootstrapUser && password === "123456") {
        const department = await prisma.department.upsert({
          where: { code: bootstrapUser.role === "DEPARTMENT_USER" ? "BOOTSTRAP-DEPT" : "BOOTSTRAP-IT" },
          update: {},
          create: {
            code: bootstrapUser.role === "DEPARTMENT_USER" ? "BOOTSTRAP-DEPT" : "BOOTSTRAP-IT",
            name: bootstrapUser.role === "DEPARTMENT_USER" ? "Khoa Demo" : "Phòng CNTT Demo",
            category: bootstrapUser.role === "DEPARTMENT_USER" ? "CLINICAL" : "ADMINISTRATIVE",
            staffCount: 0,
          },
        });
        const passwordHash = await bcrypt.hash(password, 12);
        const createdUser = await prisma.user.create({
          data: {
            id: bootstrapUser.id,
            username: bootstrapUser.username,
            fullName: bootstrapUser.fullName,
            email: bootstrapUser.email,
            phone: bootstrapUser.phone,
            passwordHash,
            role: bootstrapUser.role,
            departmentId: department.id,
            specialty: bootstrapUser.specialty,
            active: true,
          },
          include: { department: true },
        });

        return setAuthSession(NextResponse.json({
          id: createdUser.id,
          username: createdUser.username,
          fullName: createdUser.fullName,
          email: createdUser.email,
          phone: createdUser.phone,
          role: createdUser.role,
          departmentId: createdUser.departmentId,
          departmentName: createdUser.department?.name ?? null,
          specialty: createdUser.specialty,
          avatar: createdUser.avatar,
        }), { id: createdUser.id, username: createdUser.username, role: createdUser.role as any });
      }

      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 401 });
    }

    const bootstrapUser = findAuthUserByUsername(username);
    const shouldInitializePassword = bootstrapUser && password === "123456" && !dbUser.passwordHash;
    if (shouldInitializePassword) {
      const passwordHash = await bcrypt.hash(password, 12);
      const initializedUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { passwordHash, active: true },
        include: { department: true },
      });
      dbUser.passwordHash = initializedUser.passwordHash;
    }

    const hasPasswordHash = !!dbUser.passwordHash;
    const validByDefault = process.env.DEMO_MODE !== "false" && (password === "123456" || password === dbUser.username);
    if (!hasPasswordHash && !validByDefault) {
      return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
    }

    if (hasPasswordHash) {
      const ok = bcrypt.compareSync(password, dbUser.passwordHash ?? "");
      if (!ok) {
        return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
      }
    }

    return setAuthSession(NextResponse.json({
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
    }), { id: dbUser.id, username: dbUser.username, role: dbUser.role as any });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Lỗi đăng nhập" }, { status: 500 });
  }
}
