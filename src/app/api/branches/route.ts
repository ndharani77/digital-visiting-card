import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireCompanyAdmin, requireUser } from "@/lib/auth";
import { createDefaultCompanyPreview, isCompanyPreviewSettings } from "@/lib/company-content";
import { createBranch, listBranches, type BranchInput } from "@/lib/platform-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    requireCompanyAdmin(user);
    const companyId = new URL(request.url).searchParams.get("companyId");
    if (!companyId) return NextResponse.json({ message: "Company is required." }, { status: 400 });
    return NextResponse.json(await listBranches(user, companyId));
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load branches." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
    requireCompanyAdmin(user);
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
  const data = body as Record<string, unknown>;
  const companyId = typeof data.companyId === "string" ? data.companyId : "";
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!companyId || !name) return NextResponse.json({ message: "Company and branch name are required." }, { status: 400 });
  const adminEmail = typeof data.adminEmail === "string" ? data.adminEmail.trim().toLowerCase() : "";
  const adminPassword = typeof data.adminPassword === "string" ? data.adminPassword : "";
  const adminStatus = data.adminStatus === "inactive" ? "inactive" : "active";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    return NextResponse.json({ message: "Enter a valid Branch Admin email address." }, { status: 400 });
  }
  if (adminPassword.length < 14 || Buffer.byteLength(adminPassword, "utf8") > 72) {
    return NextResponse.json({ message: "Branch Admin password must be at least 14 characters and no more than 72 bytes." }, { status: 400 });
  }
  const preview = data.preview === undefined ? createDefaultCompanyPreview(name) : data.preview;
  if (!isCompanyPreviewSettings(preview)) return NextResponse.json({ message: "Branch preview details are invalid." }, { status: 400 });
  const input: BranchInput = {
    name,
    code: typeof data.code === "string" ? data.code.trim() : "",
    email: typeof data.email === "string" ? data.email.trim() : "",
    phone: typeof data.phone === "string" ? data.phone.trim() : "",
    website: typeof data.website === "string" ? data.website.trim() : "",
    logoData: typeof data.logoData === "string" ? data.logoData : "",
    address: typeof data.address === "string" ? data.address.trim() : "",
    city: typeof data.city === "string" ? data.city.trim() : "",
    state: typeof data.state === "string" ? data.state.trim() : "",
    country: typeof data.country === "string" ? data.country.trim() : "",
    description: typeof data.description === "string" ? data.description.trim() : "",
    status: data.status === "inactive" ? "inactive" : "active",
    preview,
  };
  try {
    const branch = await createBranch(user, companyId, input, {
      email: adminEmail,
      passwordHash: await hash(adminPassword, 12),
      status: adminStatus,
    });
    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof Error && error.message.includes("Branch Admin email already exists")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to create branch." }, { status: 400 });
  }
}
