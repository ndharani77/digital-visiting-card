import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireCompanyAdmin, requireUser } from "@/lib/auth";
import { createDefaultCompanyPreview, isCompanyPreviewSettings } from "@/lib/company-content";
import { createCompanyWithAdmin, listCompanies, type CompanyInput } from "@/lib/platform-store";

export const runtime = "nodejs";

function parseCompanyInput(value: unknown): CompanyInput | string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Invalid request body.";
  const data = value as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  const website = typeof data.website === "string" ? data.website.trim() : "";
  const logoData = typeof data.logoData === "string" ? data.logoData : "";
  const address = typeof data.address === "string" ? data.address.trim() : "";
  const city = typeof data.city === "string" ? data.city.trim() : "";
  const state = typeof data.state === "string" ? data.state.trim() : "";
  const country = typeof data.country === "string" ? data.country.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : "";
  const status = data.status === undefined ? "active" : data.status;
  const preview = data.preview === undefined ? createDefaultCompanyPreview(name) : data.preview;

  if (!name || name.length > 160) return "Company name is required and must be 160 characters or fewer.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid company email.";
  if (phone.length > 32) return "Company phone must be 32 characters or fewer.";
  if (website && !/^https?:\/\/\S+$/i.test(website)) return "Enter a complete website URL starting with http:// or https://.";
  if (logoData.length > 750_000) return "Company logo is too large.";
  if (status !== "active" && status !== "inactive") return "Company status is invalid.";
  if (!isCompanyPreviewSettings(preview)) return "Company preview details are invalid.";

  return {
    name,
    email,
    phone,
    website,
    logoData,
    address,
    city,
    state,
    country,
    description,
    status,
    preview,
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    requireCompanyAdmin(user);
    return NextResponse.json(await listCompanies(user));
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load companies:", error);
    return NextResponse.json({ message: "Unable to load companies." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    return authFailureResponse(error) ?? NextResponse.json({ message: "Unable to authenticate this request." }, { status: 500 });
  }
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Only Super Admins can create companies." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }
  const input = parseCompanyInput(body);
  if (typeof input === "string") return NextResponse.json({ message: input }, { status: 400 });
  const data = body as Record<string, unknown>;
  const adminEmail = typeof data.adminEmail === "string" ? data.adminEmail.trim().toLowerCase() : "";
  const adminPassword = typeof data.adminPassword === "string" ? data.adminPassword : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    return NextResponse.json({ message: "Enter a valid Company Admin email address." }, { status: 400 });
  }
  if (adminPassword.length < 14 || Buffer.byteLength(adminPassword, "utf8") > 72) {
    return NextResponse.json({ message: "Admin password must be at least 14 characters and no more than 72 bytes." }, { status: 400 });
  }
  try {
    const result = await createCompanyWithAdmin(user, input, {
      email: adminEmail,
      passwordHash: await hash(adminPassword, 12),
    });
    if (result.kind === "duplicate-admin") {
      return NextResponse.json({ message: "An account with this Company Admin email already exists." }, { status: 409 });
    }
    return NextResponse.json({ ...result.company, adminEmail }, { status: 201 });
  } catch (error) {
    console.error("Unable to create company:", error);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "An account with this Company Admin email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Unable to create company." }, { status: 500 });
  }
}
