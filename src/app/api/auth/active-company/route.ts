import { NextResponse } from "next/server";
import { ACTIVE_COMPANY_COOKIE, getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { readJsonPlatform, usesJsonStorage } from "@/lib/json-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Authentication is required." }, { status: 401 });
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Only Super Admins can switch companies." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !("companyId" in body) ||
      (body.companyId !== null && typeof body.companyId !== "string")) {
    return NextResponse.json({ message: "A valid companyId or null is required." }, { status: 400 });
  }

  const companyId = body.companyId as string | null;
  if (companyId) {
    try {
      if (usesJsonStorage()) {
        const state = await readJsonPlatform();
        if (!state.companies.some((company) => company.id === companyId)) {
          return NextResponse.json({ message: "Company not found." }, { status: 404 });
        }
      } else {
        const [company] = await getDatabase()`
          SELECT id FROM companies WHERE id = ${companyId}
        `;
        if (!company) return NextResponse.json({ message: "Company not found." }, { status: 404 });
      }
    } catch (error) {
      console.error("Unable to switch company:", error);
      return NextResponse.json({ message: "Unable to switch companies." }, { status: 500 });
    }
  }

  const response = NextResponse.json({ activeCompanyId: companyId });
  if (companyId) {
    response.cookies.set(ACTIVE_COMPANY_COOKIE, companyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  } else {
    response.cookies.set(ACTIVE_COMPANY_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return response;
}
