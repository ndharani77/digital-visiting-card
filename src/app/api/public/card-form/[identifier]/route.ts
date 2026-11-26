import { NextResponse } from "next/server";
import { validateCardFields } from "@/lib/card-validation";
import { DEFAULT_CARD_ACCENT, DEFAULT_CARD_BACKGROUND } from "@/lib/card-defaults";
import {
  createCardFromPublicForm,
  getPublicCardFormSettings,
} from "@/lib/platform-store";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ identifier: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { identifier } = await context.params;
    const settings = await getPublicCardFormSettings(identifier);
    if (!settings) {
      return NextResponse.json({ message: "This card form link is invalid or has expired." }, { status: 404 });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Unable to load public card form:", error);
    return NextResponse.json({ message: "Unable to load this card form." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
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
    const { identifier } = await context.params;
    const settings = await getPublicCardFormSettings(identifier);
    if (!settings) {
      return NextResponse.json({ message: "This card form link is invalid or has expired." }, { status: 404 });
    }
    const data = body as Record<string, unknown>;
    if ("companyId" in data || "branchId" in data) {
      return NextResponse.json({ message: "Company and branch are determined by this form link." }, { status: 400 });
    }
    const locationId = typeof data.locationId === "string" ? data.locationId : "";
    if (!settings.locations.some((location) => location.id === locationId)) {
      return NextResponse.json({ message: "Select a valid location." }, { status: 400 });
    }
    if (typeof data.address !== "string" || !data.address.trim()) {
      return NextResponse.json({ message: "Office address is required." }, { status: 400 });
    }
    const input = {
      fullName: data.fullName,
      designation: data.designation,
      company: settings.companyName,
      countryCode: data.countryCode,
      mobile: data.mobile,
      email: data.email,
      address: data.address ?? "",
      website: settings.website,
      linkedin: data.linkedin ?? "",
      linkedinName: "",
      logoData: settings.logoData,
      backgroundColor: DEFAULT_CARD_BACKGROUND,
      accentColor: DEFAULT_CARD_ACCENT,
    };
    const errors = validateCardFields(input);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: Object.values(errors)[0], errors }, { status: 400 });
    }

    const card = await createCardFromPublicForm(identifier, {
      fullName: String(input.fullName).trim(),
      designation: String(input.designation).trim(),
      company: settings.companyName,
      countryCode: String(input.countryCode).trim(),
      mobile: String(input.mobile).trim(),
      email: String(input.email).trim(),
      address: String(input.address).trim(),
      website: settings.website,
      linkedin: String(input.linkedin).trim(),
      linkedinName: String(input.linkedinName).trim(),
      logoData: String(input.logoData),
      backgroundColor: DEFAULT_CARD_BACKGROUND,
      accentColor: DEFAULT_CARD_ACCENT,
    });
    if (!card) {
      return NextResponse.json({ message: "This card form link is invalid or has expired." }, { status: 404 });
    }
    return NextResponse.json({ id: card.id }, { status: 201 });
  } catch (error) {
    if (
      (typeof error === "object" && error !== null && "code" in error && error.code === "23505") ||
      (error instanceof Error && error.message === "An employee already exists with this email address in the selected company.")
    ) {
      return NextResponse.json({ message: "A card with this email already exists in this company." }, { status: 409 });
    }
    console.error("Unable to create card from public form:", error);
    return NextResponse.json({ message: "Unable to create card." }, { status: 500 });
  }
}