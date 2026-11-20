import { NextResponse } from "next/server";
import { ACTIVE_COMPANY_COOKIE, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(ACTIVE_COMPANY_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
