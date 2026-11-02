import { NextResponse } from "next/server";
import { getCard } from "@/lib/store";
import { createVCard } from "@/lib/vcard";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const card = await getCard(id);
  if (!card) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });

  return new NextResponse(createVCard(card), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${card.fullName.replace(/[^a-z0-9-_]/gi, "_") || "contact"}.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
