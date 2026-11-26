import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireCompanyAdmin, requireUser } from "@/lib/auth";
import { applyCompanyPreviewToCards } from "@/lib/platform-store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireUser();
    requireCompanyAdmin(user);
    const updatedCount = await applyCompanyPreviewToCards(user);
    return NextResponse.json({ updatedCount });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to apply company preview to cards:", error);
    return NextResponse.json({ message: "Unable to apply company preview to cards." }, { status: 500 });
  }
}
