import { NextResponse } from "next/server";
import { addCard, getCards } from "@/lib/store";
import { validateCardFields } from "@/lib/card-validation";
import {
  DEFAULT_CARD_ACCENT,
  DEFAULT_CARD_BACKGROUND,
  DEFAULT_COMPANY,
  DEFAULT_COMPANY_LOGO,
  DEFAULT_WEBSITE,
} from "@/lib/card-defaults";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getCards());
  } catch {
    return NextResponse.json({ message: "Unable to read visiting cards." }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
      const message = Object.values(errors)[0];
      return NextResponse.json({ message, errors }, { status: 400 });
    }

    const optionalText = (field: "address" | "website" | "linkedin") =>
      typeof data[field] === "string" ? data[field].trim() : "";
    const card = await addCard({
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
    return NextResponse.json(card, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to create visiting card." }, { status: 500 });
  }
}
