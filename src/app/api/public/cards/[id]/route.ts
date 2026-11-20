import { NextResponse } from "next/server";
import { getPublicCard } from "@/lib/platform-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const result = await getPublicCard(id);
    if (!result) return NextResponse.json({ message: "Visiting card not found." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Unable to load public visiting card:", error);
    return NextResponse.json({ message: "Unable to load visiting card." }, { status: 500 });
  }
}
