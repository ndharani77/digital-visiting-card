import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireUser } from "@/lib/auth";
import { validateCardFields } from "@/lib/card-validation";
import {
  deleteCardForUser,
  getCardForUser,
  getCompanySettings,
  setCardActiveForUser,
  updateCardForUser,
} from "@/lib/platform-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const card = await getCardForUser(user, id);
    if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    return NextResponse.json(card);
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load visiting card:", error);
    return NextResponse.json({ message: "Unable to load visiting card." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
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
    const { id } = await context.params;
    const current = await getCardForUser(user, id);
    if (!current) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    const settings = await getCompanySettings(user, current.companyId);
    const data = body as Record<string, unknown>;
    if ("branchId" in data) {
      return NextResponse.json({ message: "Branches are not supported." }, { status: 400 });
    }
    if (data.countryCode === undefined) data.countryCode = "+91";
    data.company = settings.companyName;
    if (!("logoData" in data)) data.logoData = current.logoData ?? settings.logoData;
    data.website = settings.website;
    const errors = validateCardFields(data);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: Object.values(errors)[0], errors }, { status: 400 });
    }

    const optionalText = (field: "address" | "linkedin" | "linkedinName") =>
      typeof data[field] === "string" ? data[field].trim() : "";
    const card = await updateCardForUser(user, id, {
      fullName: String(data.fullName).trim(),
      designation: String(data.designation).trim(),
      countryCode: String(data.countryCode).trim(),
      mobile: String(data.mobile).trim(),
      email: String(data.email).trim(),
      address: optionalText("address"),
      linkedin: optionalText("linkedin"),
      linkedinName: optionalText("linkedinName"),
      logoData: String(data.logoData),
    });
    if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    return NextResponse.json(card);
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A card with this email already exists in this company." }, { status: 409 });
    }
    console.error("Unable to update visiting card:", error);
    return NextResponse.json({ message: "Unable to update visiting card." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !("isActive" in body) || typeof body.isActive !== "boolean") {
    return NextResponse.json({ message: "isActive must be a boolean." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const card = await setCardActiveForUser(user, id, body.isActive);
    if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    return NextResponse.json(card);
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to update visiting card status:", error);
    return NextResponse.json({ message: "Unable to update visiting card status." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const deleted = await deleteCardForUser(user, id);
    if (!deleted) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to delete visiting card:", error);
    return NextResponse.json({ message: "Unable to delete visiting card." }, { status: 500 });
  }
}
