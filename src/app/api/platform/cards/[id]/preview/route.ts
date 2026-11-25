import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireUser } from "@/lib/auth";
import {
  isCompanyPreviewSettings,
  mergeCardPreviewWithCompanyDefaults,
} from "@/lib/company-content";
import {
  getAllCardsForSuperAdmin,
  getCompanySettings,
} from "@/lib/platform-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Only Super Admins can view platform card previews." }, { status: 403 });
    }
    const { id } = await context.params;
    const card = (await getAllCardsForSuperAdmin(user)).find((item) => item.id === id);
    if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    if (card.preview !== undefined && !isCompanyPreviewSettings(card.preview)) {
      return NextResponse.json({ message: "Saved card preview details are invalid." }, { status: 500 });
    }
    const settings = await getCompanySettings(user, card.companyId);
    return NextResponse.json({
      preview: mergeCardPreviewWithCompanyDefaults(settings.preview, card.preview),
    });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load platform card preview:", error);
    return NextResponse.json({ message: "Unable to load card preview." }, { status: 500 });
  }
}
