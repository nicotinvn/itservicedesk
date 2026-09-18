import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveDbUserFromRequest } from "@/lib/server-auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const dbUser = await resolveDbUserFromRequest(request);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!newPassword || String(newPassword).trim().length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    // If user has existing passwordHash, require oldPassword
    if (dbUser.passwordHash) {
      if (!oldPassword) {
        return NextResponse.json({ error: "Old password is required" }, { status: 400 });
      }
      const ok = bcrypt.compareSync(String(oldPassword), dbUser.passwordHash);
      if (!ok) {
        return NextResponse.json({ error: "Old password is incorrect" }, { status: 403 });
      }
    }

    const newHash = bcrypt.hashSync(String(newPassword), 10);
    const updated = await prisma.user.update({ where: { id: dbUser.id }, data: { passwordHash: newHash } });

    return NextResponse.json({ success: true, userId: updated.id });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
