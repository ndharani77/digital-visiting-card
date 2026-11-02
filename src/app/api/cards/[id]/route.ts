import { NextResponse } from "next/server";
import { deleteCard, getCard, updateCard } from "@/lib/store";
import { validateCardFields } from "@/lib/card-validation";
import {
  DEFAULT_CARD_ACCENT,
  DEFAULT_CARD_BACKGROUND,
  DEFAULT_COMPANY,
  DEFAULT_COMPANY_LOGO,
  DEFAULT_WEBSITE,
} from "@/lib/card-defaults";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const card = await getCard(id);
    if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    return NextResponse.json(card);
  } catch {
    return NextResponse.json({ message: "Unable to load visiting card." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  try {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    if (data.countryCode === undefined) data.countryCode = "+91";
    data.company = DEFAULT_COMPANY;
    data.logoData = DEFAULT_COMPANY_LOGO;
    data.website = DEFAULT_WEBSITE;
    const errors = validateCardFields(data);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: Object.values(errors)[0], errors }, { status: 400 });
    }

    const { id } = await context.params;
    const optionalText = (field: "address" | "website" | "linkedin") =>
      typeof data[field] === "string" ? data[field].trim() : "";
    const card = await updateCard(id, {
      fullName: String(data.fullName).trim(),
      designation: String(data.designation).trim(),
      company: DEFAULT_COMPANY,
      countryCode: String(data.countryCode).trim(),
      mobile: String(data.mobile).trim(),
      email: String(data.email).trim(),
      address: optionalText("address"),
      website: DEFAULT_WEBSITE,
      linkedin: optionalText("linkedin"),
      logoData: DEFAULT_COMPANY_LOGO,
      backgroundColor: typeof data.backgroundColor === "string" && data.backgroundColor.trim() ? data.backgroundColor.trim() : DEFAULT_CARD_BACKGROUND,
      accentColor: typeof data.accentColor === "string" && data.accentColor.trim() ? data.accentColor.trim() : DEFAULT_CARD_ACCENT,
    });

    if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    return NextResponse.json(card);
  } catch {
    return NextResponse.json({ message: "Unable to update visiting card." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const deleted = await deleteCard(id);
    if (!deleted) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Unable to delete visiting card." }, { status: 500 });
  }
}
