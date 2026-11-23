import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireCompanyAdmin, requireUser } from "@/lib/auth";
import { deleteBranch, updateBranch, type BranchInput } from "@/lib/platform-store";

export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
    requireCompanyAdmin(user);
  } catch (error) {
    return authFailureResponse(error) ?? NextResponse.json({ message: "Unable to authenticate this request." }, { status: 500 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const companyId = typeof data.companyId === "string" ? data.companyId : "";
  if (!companyId) return NextResponse.json({ message: "Company is required." }, { status: 400 });
  const adminEmail = typeof data.adminEmail === "string" ? data.adminEmail.trim().toLowerCase() : undefined;
  const adminPassword = typeof data.adminPassword === "string" ? data.adminPassword : "";
  const adminStatus = data.adminStatus;
  if (adminEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    return NextResponse.json({ message: "Enter a valid Branch Admin email address." }, { status: 400 });
  }
  if (adminPassword && (adminPassword.length < 14 || Buffer.byteLength(adminPassword, "utf8") > 72)) {
    return NextResponse.json({ message: "Branch Admin password must be at least 14 characters and no more than 72 bytes." }, { status: 400 });
  }
  if (adminStatus !== undefined && adminStatus !== "active" && adminStatus !== "inactive") {
    return NextResponse.json({ message: "Branch Admin status is invalid." }, { status: 400 });
  }
  const input: Record<string, unknown> = {};
  for (const field of ["name", "code", "email", "phone", "website", "logoData", "address", "city", "state", "country", "description"] as const) {
    if (typeof data[field] === "string") input[field] = data[field].trim();
  }
  if (data.status === "active" || data.status === "inactive") input.status = data.status;
  if (data.preview !== undefined) input.preview = data.preview;
  try {
    const branch = await updateBranch(
      user,
      companyId,
      id,
      input as Partial<BranchInput> & { status?: "active" | "inactive" },
      adminEmail !== undefined || adminPassword || adminStatus !== undefined
        ? {
            email: adminEmail,
            passwordHash: adminPassword ? await hash(adminPassword, 12) : undefined,
            status: adminStatus === "active" || adminStatus === "inactive" ? adminStatus : undefined,
          }
        : undefined
    );
    if (!branch) return NextResponse.json({ message: "Branch not found." }, { status: 404 });
    return NextResponse.json(branch);
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof Error && error.message.includes("Branch Admin email already exists")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to update branch." }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
    requireCompanyAdmin(user);
  } catch (error) {
    return authFailureResponse(error) ?? NextResponse.json({ message: "Unable to authenticate this request." }, { status: 500 });
  }
  const { id } = await context.params;
  const companyId = new URL(request.url).searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ message: "Company is required." }, { status: 400 });
  try {
    const deleted = await deleteBranch(user, companyId, id);
    if (!deleted) return NextResponse.json({ message: "Branch not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to delete branch." }, { status: 400 });
  }
}
