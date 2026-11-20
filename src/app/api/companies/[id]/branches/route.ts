import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { canManageCompany, requireCompanyAdmin, requireUser } from "@/lib/auth";
import { createBranch, listBranches, type BranchInput } from "@/lib/platform-store";

export const runtime = "nodejs";

function parseBranch(value: unknown): BranchInput | string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Invalid branch details.";
  const data = value as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name || name.length > 160) return "Branch name is required and must be 160 characters or fewer.";
  const fields = ["code", "address", "city", "state", "country"] as const;
  const result: BranchInput = {
    name,
    code: "",
    address: "",
    city: "",
    state: "",
    country: "",
  };
  for (const field of fields) {
    if (data[field] === undefined) continue;
    if (typeof data[field] !== "string") return `${field} must be text.`;
    if (data[field].length > (field === "code" ? 100 : field === "city" || field === "state" || field === "country" ? 120 : 1000)) {
      return `${field} is too long.`;
    }
    result[field] = data[field].trim();
  }
  return result;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    requireCompanyAdmin(user);
    const { id } = await context.params;
    if (!canManageCompany(user, id)) {
      return NextResponse.json({ message: "You cannot manage branches for this company." }, { status: 403 });
    }
    return NextResponse.json(await listBranches(user, id));
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load company branches:", error);
    return NextResponse.json({ message: "Unable to load company branches." }, { status: 500 });
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
    return NextResponse.json({ message: "You cannot create branches for this company." }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }
  const input = parseBranch(body);
  if (typeof input === "string") return NextResponse.json({ message: input }, { status: 400 });
  try {
    return NextResponse.json(await createBranch(user, companyId, input), { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A branch with this name already exists in this company." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "A branch with this name already exists in this company.") {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Unable to create company branch:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to create company branch." }, { status: 500 });
  }
}
