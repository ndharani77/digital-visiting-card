import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { canManageCompany, requireCompanyAdmin, requireUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { readJsonPlatform, usesJsonStorage } from "@/lib/json-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    requireCompanyAdmin(user);
    const { id } = await context.params;
    if (!canManageCompany(user, id)) {
      return NextResponse.json({ message: "You cannot view employees for this company." }, { status: 403 });
    }
    if (usesJsonStorage()) {
      const state = await readJsonPlatform();
      const employees = state.employees
        .filter((employee) => employee.companyId === id && employee.status === "active")
        .sort((left, right) => left.fullName.localeCompare(right.fullName))
        .map((employee) => ({
          id: employee.id,
          fullName: employee.fullName,
          email: employee.email,
          status: employee.status,
        }));
      return NextResponse.json(employees);
    }

    const employees = await getDatabase()`
      SELECT id, full_name, email, status
      FROM employees
      WHERE company_id = ${id} AND status = 'active'
      ORDER BY lower(full_name)
    `;
    return NextResponse.json(employees.map((employee) => ({
      id: employee.id,
      fullName: employee.full_name,
      email: employee.email,
      status: employee.status,
    })));
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load company employees:", error);
    return NextResponse.json({ message: "Unable to load company employees." }, { status: 500 });
  }
}
