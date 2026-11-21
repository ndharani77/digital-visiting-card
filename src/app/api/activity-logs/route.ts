import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireCompanyAdmin, requireUser } from "@/lib/auth";
import { getActivityLogsForUser } from "@/lib/platform-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    requireCompanyAdmin(user);
    return NextResponse.json(await getActivityLogsForUser(user));
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load activity logs:", error);
    return NextResponse.json({ message: "Unable to load activity logs." }, { status: 500 });
  }
}
