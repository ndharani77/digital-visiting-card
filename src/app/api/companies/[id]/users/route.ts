import { randomBytes, randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { canManageCompany, requireCompanyAdmin, requireUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { readJsonPlatform, updateJsonPlatform, usesJsonStorage } from "@/lib/json-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    if (!canManageCompany(user, id)) {
      return NextResponse.json({ message: "You cannot view users for this company." }, { status: 403 });
    }
    if (usesJsonStorage()) {
      const state = await readJsonPlatform();
      const users = state.users
        .filter((account) => account.companyId === id)
        .sort((left, right) => left.email.localeCompare(right.email))
        .map((account) => ({
          id: account.id,
          email: account.email,
          role: account.role,
          employee_id: account.employeeId,
          status: account.status,
          must_change_password: account.mustChangePassword,
          created_at: account.createdAt,
        }));
      return NextResponse.json(users);
    }

    const rows = await getDatabase()`
      SELECT id, email, role, employee_id, status, must_change_password, created_at
      FROM users
      WHERE company_id = ${id}
      ORDER BY lower(email)
    `;
    return NextResponse.json(rows);
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load company users:", error);
    return NextResponse.json({ message: "Unable to load company users." }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
    requireCompanyAdmin(user);
  } catch (error) {
    return authFailureResponse(error) ?? NextResponse.json({ message: "Unable to authorize this request." }, { status: 500 });
  }
  const { id: companyId } = await context.params;
  if (!canManageCompany(user, companyId)) {
    return NextResponse.json({ message: "You cannot add users to this company." }, { status: 403 });
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
  const role = data.role;
  const employeeId = data.employeeId === null || data.employeeId === undefined
    ? null
    : typeof data.employeeId === "string" ? data.employeeId : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }
  if (role !== "COMPANY_ADMIN" && role !== "EMPLOYEE") {
    return NextResponse.json({ message: "Choose Company Admin or Employee." }, { status: 400 });
  }
  if (user.role !== "SUPER_ADMIN" && role !== "EMPLOYEE") {
    return NextResponse.json({ message: "Company Admins can only create Employee accounts." }, { status: 403 });
  }
  if (role === "EMPLOYEE" && (typeof employeeId !== "string" || !employeeId)) {
    return NextResponse.json({ message: "Select an employee to link this account." }, { status: 400 });
  }
  if (role === "COMPANY_ADMIN" && employeeId) {
    return NextResponse.json({ message: "Company Admin accounts cannot be linked to an employee." }, { status: 400 });
  }
  const accountRole: "COMPANY_ADMIN" | "EMPLOYEE" = role;

  try {
    if (usesJsonStorage()) {
      const temporaryPassword = `${randomBytes(18).toString("base64url")}A1!`;
      const passwordHash = await hash(temporaryPassword, 12);
      const result = await updateJsonPlatform((state) => {
        if (!state.companies.some((company) => company.id === companyId)) {
          return { kind: "company-not-found" as const };
        }
        if (state.users.some((account) =>
          account.email.toLowerCase() === email ||
          (employeeId !== null && account.employeeId === employeeId)
        )) {
          return { kind: "duplicate" as const };
        }
        if (accountRole === "EMPLOYEE" &&
            !state.employees.some((employee) => employee.id === employeeId && employee.companyId === companyId)) {
          return { kind: "employee-not-found" as const };
        }
        const account = {
          id: randomUUID(),
          email,
          passwordHash,
          role: accountRole,
          companyId,
          employeeId,
          status: "active" as const,
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        };
        state.users.push(account);
        return {
          kind: "created" as const,
          user: {
            id: account.id,
            email: account.email,
            role: account.role,
            employee_id: account.employeeId,
            status: account.status,
            must_change_password: account.mustChangePassword,
          },
        };
      });
      if (result.kind === "company-not-found") {
        return NextResponse.json({ message: "Company not found." }, { status: 404 });
      }
      if (result.kind === "employee-not-found") {
        return NextResponse.json({ message: "Employee not found in this company." }, { status: 404 });
      }
      if (result.kind === "duplicate") {
        return NextResponse.json({ message: "An account already exists for this email or employee." }, { status: 409 });
      }
      return NextResponse.json({ user: result.user, temporaryPassword }, { status: 201 });
    }

    const db = getDatabase();
    const [company] = await db`
      SELECT id FROM companies WHERE id = ${companyId}
    `;
    if (!company) return NextResponse.json({ message: "Company not found." }, { status: 404 });
    if (role === "EMPLOYEE") {
      const [employee] = await db`
        SELECT id FROM employees WHERE id = ${employeeId} AND company_id = ${companyId}
      `;
      if (!employee) return NextResponse.json({ message: "Employee not found in this company." }, { status: 404 });
    }
    const temporaryPassword = `${randomBytes(18).toString("base64url")}A1!`;
    const passwordHash = await hash(temporaryPassword, 12);
    const [account] = await db`
      INSERT INTO users (id, email, password_hash, role, company_id, employee_id, must_change_password)
      VALUES (${randomUUID()}, ${email}, ${passwordHash}, ${role}, ${companyId}, ${employeeId}, true)
      RETURNING id, email, role, employee_id, status, must_change_password
    `;
    return NextResponse.json({ user: account, temporaryPassword }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "An account already exists for this email or employee." }, { status: 409 });
    }
    console.error("Unable to create company user:", error);
    return NextResponse.json({ message: "Unable to create company user." }, { status: 500 });
  }
}
