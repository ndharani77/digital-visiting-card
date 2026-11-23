import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireUser } from "@/lib/auth";
import { validateCardFields } from "@/lib/card-validation";
import { getCompanySettings, getCardsForUser, createCardForUser, listBranches, getCompany } from "@/lib/platform-store";
import { DEFAULT_CARD_ACCENT, DEFAULT_CARD_BACKGROUND } from "@/lib/card-defaults";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await getCardsForUser(user));
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to read visiting cards:", error);
    return NextResponse.json({ message: "Unable to read visiting cards." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
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

  try {
    const data = body as Record<string, unknown>;
    if ("companyId" in data) {
      return NextResponse.json({ message: "Company is determined by the active workspace." }, { status: 400 });
    }
    const branchId = typeof data.branchId === "string" && data.branchId.trim() ? data.branchId.trim() : null;
    const activeCompany = await getCompany(user);
    const branch = branchId && activeCompany ? (await listBranches(user, activeCompany.id)).find((item) => item.id === branchId) : null;
    if (data.countryCode === undefined) data.countryCode = "+91";
    const settings = await getCompanySettings(user);
    data.company = branch?.name ?? settings.companyName;
    if (data.address === undefined) data.address = branch?.address || settings.address;
    if (!("logoData" in data)) data.logoData = branch?.logoData || settings.logoData;
    data.website = branch?.website || settings.website;
    const errors = validateCardFields(data);
    if (Object.keys(errors).length > 0) {
      const message = Object.values(errors)[0];
      return NextResponse.json({ message, errors }, { status: 400 });
    }

    const optionalText = (field: "address" | "linkedin" | "linkedinName") =>
      typeof data[field] === "string" ? data[field].trim() : "";
    const card = await createCardForUser(user, {
      fullName: String(data.fullName).trim(),
      designation: String(data.designation).trim(),
      company: branch?.name ?? settings.companyName,
      countryCode: String(data.countryCode).trim(),
      mobile: String(data.mobile).trim(),
      email: String(data.email).trim(),
      address: optionalText("address"),
      website: branch?.website || settings.website,
      linkedin: optionalText("linkedin"),
      linkedinName: optionalText("linkedinName"),
      logoData: String(data.logoData),
      backgroundColor: DEFAULT_CARD_BACKGROUND,
      accentColor: DEFAULT_CARD_ACCENT,
      branchId,
    });
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A card with this email already exists in this company." }, { status: 409 });
    }
    console.error("Unable to create visiting card:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to create visiting card." }, { status: 500 });
  }
}
