import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireUser } from "@/lib/auth";
import { getCardForUser } from "@/lib/platform-store";
import { createVCard } from "@/lib/vcard";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const card = await getCardForUser(user, id);
    if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    if (!card.isActive) return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    return new NextResponse(createVCard(card), {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${card.fullName.replace(/[^a-z0-9-_]/gi, "_") || "contact"}.vcf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to export visiting card contact:", error);
    return NextResponse.json({ message: "Unable to export visiting card contact." }, { status: 500 });
  }
}
