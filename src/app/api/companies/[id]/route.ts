import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { canAccessActiveCompany, canManageCompany, requireCompanyAdmin, requireUser } from "@/lib/auth";
import { isCompanyPreviewSettings } from "@/lib/company-content";
import { getCompany, updateCompany, type CompanyInput } from "@/lib/platform-store";

export const runtime = "nodejs";

function parseCompanyUpdate(value: unknown): Partial<CompanyInput> | string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Invalid request body.";
  const data = value as Record<string, unknown>;
  const result: Partial<CompanyInput> = {};
  const textFields = ["name", "email", "phone", "website", "address", "city", "state", "country", "description"] as const;
  for (const field of textFields) {
    if (data[field] === undefined) continue;
    if (typeof data[field] !== "string") return `${field} must be text.`;
    result[field] = data[field].trim();
  }
  if (result.name !== undefined && (!result.name || result.name.length > 160)) {
    return "Company name is required and must be 160 characters or fewer.";
  }
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) return "Enter a valid company email.";
  if (result.phone && result.phone.length > 32) return "Company phone must be 32 characters or fewer.";
  if (result.website && !/^https?:\/\/\S+$/i.test(result.website)) return "Enter a complete website URL starting with http:// or https://.";
  if (data.logoData !== undefined) {
    if (typeof data.logoData !== "string" || data.logoData.length > 750_000) return "Company logo is invalid or too large.";
    result.logoData = data.logoData;
  }
  if (data.preview !== undefined) {
    if (!isCompanyPreviewSettings(data.preview)) return "Company preview details are invalid.";
    result.preview = data.preview;
  }
  if (data.status !== undefined) {
    if (data.status !== "active" && data.status !== "inactive") return "Company status is invalid.";
    result.status = data.status;
  }
  if (data.branchEnabled !== undefined) {
    if (typeof data.branchEnabled !== "boolean") return "Choose Yes or No for branch management.";
    result.branchEnabled = data.branchEnabled;
  }
  return result;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const company = await getCompany(user, id);
    if (!company) return NextResponse.json({ message: "Company not found." }, { status: 404 });
    return NextResponse.json(company);
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load company:", error);
    return NextResponse.json({ message: "Unable to load company." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
    requireCompanyAdmin(user);
  } catch (error) {
    return authFailureResponse(error) ?? NextResponse.json({ message: "Unable to authorize this request." }, { status: 500 });
  }
  const { id } = await context.params;
  if (!canManageCompany(user, id) || !(await canAccessActiveCompany(user, id))) {
    return NextResponse.json({ message: "You cannot manage this company." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }
  const input = parseCompanyUpdate(body);
  if (typeof input === "string") return NextResponse.json({ message: input }, { status: 400 });
  if (user.role !== "SUPER_ADMIN" && input.status !== undefined) {
    return NextResponse.json({ message: "Only Super Admins can change company status." }, { status: 403 });
  }
  if (user.role !== "SUPER_ADMIN" && input.branchEnabled !== undefined) {
    return NextResponse.json({ message: "Only Super Admins can change branch management." }, { status: 403 });
  }

  try {
    const company = await updateCompany(user, id, input);
    if (!company) return NextResponse.json({ message: "Company not found." }, { status: 404 });
    return NextResponse.json(company);
  } catch (error) {
    console.error("Unable to update company:", error);
    return NextResponse.json({ message: "Unable to update company." }, { status: 500 });
  }
}
