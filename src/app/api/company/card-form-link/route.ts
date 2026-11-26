import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireCompanyAdmin, requireUser } from "@/lib/auth";
import { getOrCreatePublicCardFormIdentifier } from "@/lib/platform-store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireUser();
    requireCompanyAdmin(user);
    const identifier = await getOrCreatePublicCardFormIdentifier(user);
    return NextResponse.json({ identifier });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to create public card form link:", error);
    return NextResponse.json({ message: "Unable to create public card form link." }, { status: 500 });
  }
}
