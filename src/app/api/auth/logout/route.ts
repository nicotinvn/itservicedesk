import { NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_KEY } from "@/lib/auth-preset";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_SESSION_COOKIE_KEY, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}