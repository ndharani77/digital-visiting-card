import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireUser } from "@/lib/auth";
import { isCompanyPreviewSettings } from "@/lib/company-content";
import {
  getCardForUser,
  getCompanySettings,
  setCardPreviewForUser,
} from "@/lib/platform-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const card = await getCardForUser(user, id);
    if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    const settings = await getCompanySettings(user, card.companyId);
    if (card.preview !== undefined && !isCompanyPreviewSettings(card.preview)) {
      return NextResponse.json({ message: "Saved card preview details are invalid." }, { status: 500 });
    }
    return NextResponse.json({
      preview: card.preview ?? settings.preview,
      isCustom: card.preview !== undefined,
    });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load card preview details:", error);
    return NextResponse.json({ message: "Unable to load card preview details." }, { status: 500 });
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
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !("preview" in body) || !isCompanyPreviewSettings(body.preview)) {
    return NextResponse.json({ message: "Preview details are invalid." }, { status: 400 });
  }
  try {
    const { id } = await context.params;
    const card = await setCardPreviewForUser(user, id, body.preview);
    if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    return NextResponse.json({ preview: card.preview, isCustom: true });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to save card preview details:", error);
    return NextResponse.json({ message: "Unable to save card preview details." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const card = await setCardPreviewForUser(user, id, undefined);
    if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    const settings = await getCompanySettings(user, card.companyId);
    return NextResponse.json({ preview: settings.preview, isCustom: false });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to restore company preview defaults:", error);
    return NextResponse.json({ message: "Unable to restore company preview defaults." }, { status: 500 });
  }
}
