import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireCompanyAdmin, requireUser } from "@/lib/auth";
import { getCompanySettings, saveCompanySettings } from "@/lib/platform-store";
import { validateCardField } from "@/lib/card-validation";
import { isCompanyPreviewSettings } from "@/lib/company-content";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await getCompanySettings(user));
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load company settings:", error);
    return NextResponse.json({ message: "Unable to load company settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let user;
  try {
    user = await requireUser();
    requireCompanyAdmin(user);
  } catch (error) {
    return authFailureResponse(error) ?? NextResponse.json({ message: "Unable to authorize this request." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const data = body as Record<string, unknown>;
    const current = await getCompanySettings(user);
    const companyName = typeof data.companyName === "string" ? data.companyName.trim() : data.companyName === undefined ? current.companyName : data.companyName;
    const website = typeof data.website === "string" ? data.website.trim() : data.website === undefined ? current.website : data.website;
    const logoData = typeof data.logoData === "string" ? data.logoData.trim() : data.logoData === undefined ? current.logoData : data.logoData;
    const preview = data.preview === undefined ? current.preview : data.preview;
    const errors = {
      companyName: typeof companyName === "string" ? validateCardField("company", companyName) : "Company name is required.",
      website: typeof website === "string" ? validateCardField("website", website) : "Website is required.",
      logoData: typeof logoData === "string" ? validateCardField("logoData", logoData) : "Choose a company logo.",
      preview: isCompanyPreviewSettings(preview) ? undefined : "Preview details are invalid.",
    };
    const invalidFields = Object.fromEntries(
      Object.entries(errors).filter(([, error]) => error !== undefined)
    );
    if (Object.keys(invalidFields).length > 0) {
      return NextResponse.json({ message: Object.values(invalidFields)[0], errors: invalidFields }, { status: 400 });
    }
    if (typeof companyName !== "string" || typeof website !== "string" ||
        typeof logoData !== "string" || !isCompanyPreviewSettings(preview)) {
      return NextResponse.json({ message: "Invalid company settings." }, { status: 400 });
    }
    return NextResponse.json(await saveCompanySettings(user, {
      companyName,
      website,
      logoData,
      preview,
    }));
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to save company settings:", error);
    return NextResponse.json({ message: "Unable to save company settings." }, { status: 500 });
  }
}
