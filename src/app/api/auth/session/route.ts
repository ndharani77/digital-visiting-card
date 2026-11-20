import { NextResponse } from "next/server";
import { getActiveCompanyId, getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Authentication is required." }, { status: 401 });
    return NextResponse.json({
      user,
      activeCompanyId: await getActiveCompanyId(user),
    });
  } catch (error) {
    console.error("Unable to load session:", error);
    return NextResponse.json({ message: "Unable to load the current session." }, { status: 500 });
  }
}
