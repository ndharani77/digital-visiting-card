import { NextResponse } from "next/server";
import { getPublicCard } from "@/lib/platform-store";
import { createVCard } from "@/lib/vcard";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await getPublicCard(id);
    if (!result) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    return new NextResponse(createVCard(result.card), {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.card.fullName.replace(/[^a-z0-9-_]/gi, "_") || "contact"}.vcf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Unable to export public card contact:", error);
    return NextResponse.json({ message: "Unable to export card contact." }, { status: 500 });
  }
}
