import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { canManageCompany, requireCompanyAdmin, requireUser } from "@/lib/auth";
import { readJsonPlatform, updateJsonPlatform } from "@/lib/json-store";
import { recordActivity } from "@/lib/platform-store";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    requireCompanyAdmin(user);
    const companyId = new URL(request.url).searchParams.get("companyId");
    const { id: branchId } = await context.params;
    if (!companyId || !canManageCompany(user, companyId)) {
      return NextResponse.json({ message: "You cannot manage this branch." }, { status: 403 });
    }
    const state = await readJsonPlatform();
    const branch = state.branches.find((item) => item.id === branchId && item.companyId === companyId);
    if (!branch) return NextResponse.json({ message: "Branch not found." }, { status: 404 });
    const account = state.users.find((item) =>
      item.role === "COMPANY_ADMIN" && item.companyId === companyId && item.branchId === branchId
    );
    return NextResponse.json({
      account: account ? { email: account.email, status: account.status } : null,
    });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load Branch Admin account:", error);
    return NextResponse.json({ message: "Unable to load Branch Admin account." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  let user;
  try {
    user = await requireUser();
    requireCompanyAdmin(user);
  } catch (error) {
    return authFailureResponse(error) ?? NextResponse.json({ message: "Unable to authorize this request." }, { status: 500 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const companyId = typeof data.companyId === "string" ? data.companyId : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : undefined;
  const password = typeof data.password === "string" ? data.password : undefined;
  const status = data.status;
  if (!companyId || !canManageCompany(user, companyId)) {
    return NextResponse.json({ message: "You cannot manage this branch." }, { status: 403 });
  }
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Enter a valid Branch Admin email address." }, { status: 400 });
  }
  if (password && (password.length < 14 || Buffer.byteLength(password, "utf8") > 72)) {
    return NextResponse.json({ message: "Password must be at least 14 characters and no more than 72 bytes." }, { status: 400 });
  }
  if (status !== undefined && status !== "active" && status !== "inactive") {
    return NextResponse.json({ message: "Branch Admin status is invalid." }, { status: 400 });
  }
  if (email === undefined && !password && status === undefined) {
    return NextResponse.json({ message: "Provide an email, password, or status change." }, { status: 400 });
  }

  try {
    const passwordHash = password ? await hash(password, 12) : undefined;
    const { id: branchId } = await context.params;
    const result = await updateJsonPlatform((state) => {
      const branch = state.branches.find((item) => item.id === branchId && item.companyId === companyId);
      if (!branch) return { kind: "not-found" as const };
      const account = state.users.find((item) =>
        item.role === "COMPANY_ADMIN" && item.companyId === companyId && item.branchId === branchId
      );
      if (!account) return { kind: "account-not-found" as const };
      if (email && state.users.some((item) => item.id !== account.id && item.email.toLowerCase() === email)) {
        return { kind: "duplicate" as const };
      }
      if (email !== undefined) account.email = email;
      if (passwordHash) account.passwordHash = passwordHash;
      if (status === "active" || status === "inactive") account.status = status;
      recordActivity(state, user, companyId, "updated", "branch-admin", account.id);
      return { kind: "updated" as const, email: account.email, status: account.status };
    });
    if (result.kind === "not-found") return NextResponse.json({ message: "Branch not found." }, { status: 404 });
    if (result.kind === "account-not-found") return NextResponse.json({ message: "No Branch Admin account exists for this branch." }, { status: 404 });
    if (result.kind === "duplicate") return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    return NextResponse.json({ account: { email: result.email, status: result.status } });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to update Branch Admin account:", error);
    return NextResponse.json({ message: "Unable to update Branch Admin account." }, { status: 500 });
  }
}
