import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { createSessionToken, requireUser, SESSION_COOKIE } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { readJsonPlatform, updateJsonPlatform, usesJsonStorage } from "@/lib/json-store";
import { recordActivity } from "@/lib/platform-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser({ allowPasswordChange: true });
  } catch (error) {
    return authFailureResponse(error) ?? NextResponse.json({ message: "Unable to authenticate this request." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const { currentPassword, newPassword } = body as Record<string, unknown>;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" ||
      newPassword.length < 14 || Buffer.byteLength(newPassword, "utf8") > 72) {
    return NextResponse.json({ message: "Enter your current password and a new password with at least 14 characters and no more than 72 bytes." }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ message: "Choose a new password that differs from the temporary password." }, { status: 400 });
  }

  try {
    if (usesJsonStorage()) {
      const state = await readJsonPlatform();
      const account = state.users.find((item) => item.id === user.id && item.status === "active");
      if (!account || !(await compare(currentPassword, account.passwordHash))) {
        return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
      }
      const passwordHash = await hash(newPassword, 12);
      await updateJsonPlatform((currentState) => {
        const currentAccount = currentState.users.find((item) => item.id === user.id && item.status === "active");
        if (currentAccount) {
          currentAccount.passwordHash = passwordHash;
          currentAccount.mustChangePassword = false;
          if (currentAccount.companyId) {
            recordActivity(currentState, user, currentAccount.companyId, "password-changed", "account", currentAccount.id);
          }
        }
      });

      const updatedUser = { ...user, mustChangePassword: false };
      const response = NextResponse.json({ success: true });
      response.cookies.set(SESSION_COOKIE, await createSessionToken(updatedUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      return response;
    }

    const db = getDatabase();
    const [record] = await db`
      SELECT password_hash FROM users WHERE id = ${user.id} AND status = 'active'
    `;
    if (!record || !(await compare(currentPassword, record.password_hash))) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
    }
    const passwordHash = await hash(newPassword, 12);
    await db`
      UPDATE users
      SET password_hash = ${passwordHash}, must_change_password = false, updated_at = now()
      WHERE id = ${user.id} AND status = 'active'
    `;

    const updatedUser = { ...user, mustChangePassword: false };
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(updatedUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    console.error("Unable to change password:", error);
    return NextResponse.json({ message: "Unable to change your password right now." }, { status: 500 });
  }
}
