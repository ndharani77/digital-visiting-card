import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireUser } from "@/lib/auth";
import { getPlatformStatistics } from "@/lib/platform-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Only Super Admins can view platform analytics." }, { status: 403 });
    }
    return NextResponse.json(await getPlatformStatistics(user));
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load analytics:", error);
    return NextResponse.json({ message: "Unable to load analytics." }, { status: 500 });
  }
}
