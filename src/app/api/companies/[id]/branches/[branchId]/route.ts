import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { canManageCompany, requireCompanyAdmin, requireUser } from "@/lib/auth";
import { updateBranch, type BranchInput } from "@/lib/platform-store";

export const runtime = "nodejs";

function parseBranchUpdate(value: unknown): (Partial<BranchInput> & { status?: "active" | "inactive" }) | string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Invalid branch details.";
  const data = value as Record<string, unknown>;
  const result: Partial<BranchInput> & { status?: "active" | "inactive" } = {};
  const limits = { name: 160, code: 100, address: 1000, city: 120, state: 120, country: 120 } as const;
  for (const field of Object.keys(limits) as Array<keyof typeof limits>) {
    if (data[field] === undefined) continue;
    if (typeof data[field] !== "string") return `${field} must be text.`;
    const text = data[field].trim();
    if (text.length > limits[field] || (field === "name" && !text)) return `Enter a valid ${field}.`;
    result[field] = text;
  }
  if (data.status !== undefined) {
    if (data.status !== "active" && data.status !== "inactive") return "Branch status is invalid.";
    result.status = data.status;
  }
  if (Object.keys(result).length === 0) return "Choose at least one branch detail to update.";
  return result;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; branchId: string }> }) {
  let user;
  try {
    user = await requireUser();
    requireCompanyAdmin(user);
  } catch (error) {
    return authFailureResponse(error) ?? NextResponse.json({ message: "Unable to authorize this request." }, { status: 500 });
  }
  const { id: companyId, branchId } = await context.params;
  if (!canManageCompany(user, companyId)) {
    return NextResponse.json({ message: "You cannot update branches for this company." }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }
  const input = parseBranchUpdate(body);
  if (typeof input === "string") return NextResponse.json({ message: input }, { status: 400 });
  try {
    const branch = await updateBranch(user, companyId, branchId, input);
    if (!branch) return NextResponse.json({ message: "Branch not found." }, { status: 404 });
    return NextResponse.json(branch);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A branch with this name already exists in this company." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "A branch with this name already exists in this company.") {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Unable to update company branch:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to update company branch." }, { status: 500 });
  }
}
