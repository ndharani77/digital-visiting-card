import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { AuthorizationError, canAccessActiveCompany, getActiveCompanyId, requireUser } from "@/lib/auth";
import { readJsonPlatform, updateJsonPlatform } from "@/lib/json-store";
import { recordActivity } from "@/lib/platform-store";

export const runtime = "nodejs";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") {
    throw new AuthorizationError("Only Super Admins can manage Company Admins.");
  }
  return user;
}

export async function GET() {
  try {
    const user = await requireSuperAdmin();
    const [state, activeCompanyId] = await Promise.all([
      readJsonPlatform(),
      getActiveCompanyId(user),
    ]);
    const companyNames = new Map(state.companies.map((company) => [company.id, company.name]));
    const admins = state.users
      .filter((account) =>
        account.role === "COMPANY_ADMIN" &&
        (!activeCompanyId || account.companyId === activeCompanyId)
      )
      .sort((left, right) => left.email.localeCompare(right.email))
      .map((account) => ({
        id: account.id,
        email: account.email,
        companyId: account.companyId,
        companyName: account.companyId ? companyNames.get(account.companyId) ?? "" : "",
        status: account.status,
        mustChangePassword: account.mustChangePassword,
        createdAt: account.createdAt,
      }));
    return NextResponse.json(admins);
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load Company Admins:", error);
    return NextResponse.json({ message: "Unable to load Company Admins." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireSuperAdmin();
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ message: "Unable to authorize this request." }, { status: 500 });
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
  const data = body as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const companyId = typeof data.companyId === "string" ? data.companyId : "";
  const password = typeof data.password === "string" ? data.password : "";
  if (!isValidEmail(email)) return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  if (!companyId) return NextResponse.json({ message: "Select a company." }, { status: 400 });
  if (password.length < 14 || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json({ message: "Password must be at least 14 characters and no more than 72 bytes." }, { status: 400 });
  }
  if (!(await canAccessActiveCompany(user, companyId))) {
    return NextResponse.json({ message: "The company is outside the active workspace." }, { status: 403 });
  }

  try {
    const passwordHash = await hash(password, 12);
    const result = await updateJsonPlatform((state) => {
      const company = state.companies.find((item) => item.id === companyId);
      if (!company) return "company-not-found" as const;
      if (company.status !== "active") return "company-inactive" as const;
      if (state.users.some((account) => account.email.toLowerCase() === email)) return "duplicate" as const;
      const account = {
        id: randomUUID(),
        email,
        passwordHash,
        role: "COMPANY_ADMIN" as const,
        companyId,
        employeeId: null,
        status: "active" as const,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
      };
      state.users.push(account);
      recordActivity(state, user, companyId, "created", "company-admin", account.id);
      return "created" as const;
    });
    if (result === "company-not-found") return NextResponse.json({ message: "Company not found." }, { status: 404 });
    if (result === "company-inactive") return NextResponse.json({ message: "Activate the company before creating an administrator." }, { status: 409 });
    if (result === "duplicate") return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    return NextResponse.json({ email, companyId }, { status: 201 });
  } catch (error) {
    console.error("Unable to create Company Admin:", error);
    return NextResponse.json({ message: "Unable to create Company Admin." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let user;
  try {
    user = await requireSuperAdmin();
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ message: "Unable to authorize this request." }, { status: 500 });
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
  const data = body as Record<string, unknown>;
  const userId = typeof data.userId === "string" ? data.userId : "";
  const status = data.status;
  if ("email" in data && typeof data.email !== "string") {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }
  if ("companyId" in data && typeof data.companyId !== "string") {
    return NextResponse.json({ message: "Select a valid company." }, { status: 400 });
  }
  if ("password" in data && typeof data.password !== "string") {
    return NextResponse.json({ message: "Enter a valid password." }, { status: 400 });
  }
  const hasChanges = status === "active" || status === "inactive" ||
    typeof data.email === "string" ||
    typeof data.companyId === "string" ||
    (typeof data.password === "string" && data.password.length > 0);
  if (!userId || (status !== undefined && status !== "active" && status !== "inactive") || !hasChanges) {
    return NextResponse.json({ message: "Choose an account and at least one valid change." }, { status: 400 });
  }

  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : undefined;
  const companyId = typeof data.companyId === "string" ? data.companyId : undefined;
  const password = typeof data.password === "string" ? data.password : undefined;
  if (email !== undefined && !isValidEmail(email)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }
  if (companyId !== undefined && !companyId) {
    return NextResponse.json({ message: "Select a valid company." }, { status: 400 });
  }
  if (password && (password.length < 14 || Buffer.byteLength(password, "utf8") > 72)) {
    return NextResponse.json({ message: "Password must be at least 14 characters and no more than 72 bytes." }, { status: 400 });
  }
  if (companyId && !(await canAccessActiveCompany(user, companyId))) {
    return NextResponse.json({ message: "The company is outside the active workspace." }, { status: 403 });
  }
  const activeCompanyId = await getActiveCompanyId(user);
  try {
    const passwordHash = password ? await hash(password, 12) : undefined;
    const result = await updateJsonPlatform(async (state) => {
      const account = state.users.find((item) => item.id === userId && item.role === "COMPANY_ADMIN");
      if (!account || !account.companyId) return { kind: "not-found" as const };
      if (activeCompanyId && activeCompanyId !== account.companyId) return { kind: "forbidden" as const };
      const nextCompanyId = companyId ?? account.companyId;
      const nextStatus = status ?? account.status;
      const company = state.companies.find((item) => item.id === nextCompanyId);
      if (!company) return { kind: "company-not-found" as const };
      if (company.status !== "active" && nextCompanyId !== account.companyId) {
        return { kind: "company-inactive" as const };
      }
      if (email && state.users.some((item) => item.id !== userId && item.email.toLowerCase() === email)) {
        return { kind: "duplicate" as const };
      }
      if (account.status === "active" && (nextStatus !== "active" || nextCompanyId !== account.companyId) &&
          state.users.filter((item) =>
        item.role === "COMPANY_ADMIN" && item.companyId === account.companyId && item.status === "active"
      ).length <= 1) return { kind: "last-admin" as const };
      const originalCompanyId = account.companyId;
      const originalStatus = account.status;
      if (email !== undefined) account.email = email;
      account.companyId = nextCompanyId;
      account.status = nextStatus;
      if (passwordHash) {
        account.passwordHash = passwordHash;
        account.mustChangePassword = false;
      }
      const action = status !== undefined && status !== originalStatus
        ? status === "active" ? "activated" : "deactivated"
        : "updated";
      recordActivity(state, user, originalCompanyId, action, "company-admin", account.id);
      return {
        kind: "updated" as const,
        id: account.id,
        email: account.email,
        companyId: account.companyId,
        status: account.status,
      };
    });
    if (result.kind === "not-found") return NextResponse.json({ message: "Company Admin not found." }, { status: 404 });
    if (result.kind === "forbidden") return NextResponse.json({ message: "The Company Admin is outside the active workspace." }, { status: 403 });
    if (result.kind === "company-not-found") return NextResponse.json({ message: "Company not found." }, { status: 404 });
    if (result.kind === "company-inactive") return NextResponse.json({ message: "Activate the company before assigning an administrator to it." }, { status: 409 });
    if (result.kind === "duplicate") return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    if (result.kind === "last-admin") return NextResponse.json({ message: "Add another active Company Admin before removing this one from the company." }, { status: 409 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Unable to update Company Admin:", error);
    return NextResponse.json({ message: "Unable to update Company Admin." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let user;
  try {
    user = await requireSuperAdmin();
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ message: "Unable to authorize this request." }, { status: 500 });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ message: "Choose an administrator to delete." }, { status: 400 });

  const activeCompanyId = await getActiveCompanyId(user);
  try {
    const result = await updateJsonPlatform((state) => {
      const accountIndex = state.users.findIndex((item) => item.id === userId && item.role === "COMPANY_ADMIN");
      if (accountIndex === -1) return { kind: "not-found" as const };
      const account = state.users[accountIndex];
      if (!account.companyId) return { kind: "not-found" as const };
      if (activeCompanyId && activeCompanyId !== account.companyId) return { kind: "forbidden" as const };
      if (account.status === "active" && state.users.filter((item) =>
        item.role === "COMPANY_ADMIN" && item.companyId === account.companyId && item.status === "active"
      ).length <= 1) return { kind: "last-admin" as const };
      recordActivity(state, user, account.companyId, "deleted", "company-admin", account.id);
      state.users.splice(accountIndex, 1);
      return { kind: "deleted" as const, id: account.id };
    });
    if (result.kind === "not-found") return NextResponse.json({ message: "Company Admin not found." }, { status: 404 });
    if (result.kind === "forbidden") return NextResponse.json({ message: "The Company Admin is outside the active workspace." }, { status: 403 });
    if (result.kind === "last-admin") return NextResponse.json({ message: "Add another active Company Admin before deleting this account." }, { status: 409 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Unable to delete Company Admin:", error);
    return NextResponse.json({ message: "Unable to delete Company Admin." }, { status: 500 });
  }
}
