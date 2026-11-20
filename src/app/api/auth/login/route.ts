import { NextResponse } from "next/server";
import { ACTIVE_COMPANY_COOKIE, authenticateUser, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return NextResponse.json({ message: "Enter your email and password." }, { status: 400 });
  }

  try {
    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        employeeId: user.employeeId,
        mustChangePassword: user.mustChangePassword,
      },
    });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    response.cookies.set(ACTIVE_COMPANY_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ message: "Unable to sign in right now." }, { status: 500 });
  }
}
