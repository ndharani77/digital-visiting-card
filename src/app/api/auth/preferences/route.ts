import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireUser } from "@/lib/auth";
import { readJsonPlatform, updateJsonPlatform } from "@/lib/json-store";
import {
  DEFAULT_USER_PREFERENCES,
  isAppLocale,
  isDisplayDensity,
  normalizeUserPreferences,
  type NotificationPreferences,
} from "@/lib/user-preferences";

export const runtime = "nodejs";

function isNotificationPreferences(value: unknown): value is Pick<NotificationPreferences, "enabled" | "cards" | "company" | "account"> {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "enabled" in value && typeof value.enabled === "boolean" &&
    "cards" in value && typeof value.cards === "boolean" &&
    "company" in value && typeof value.company === "boolean" &&
    "account" in value && typeof value.account === "boolean"
  );
}

export async function GET() {
  try {
    const user = await requireUser();
    if (user.id === "local-development-super-admin") {
      return NextResponse.json(DEFAULT_USER_PREFERENCES);
    }
    const state = await readJsonPlatform();
    const account = state.users.find((item) => item.id === user.id && item.status === "active");
    if (!account) return NextResponse.json({ message: "Account not found." }, { status: 404 });
    return NextResponse.json(normalizeUserPreferences(account.preferences));
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load account preferences:", error);
    return NextResponse.json({ message: "Unable to load account preferences." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let user;
  try {
    user = await requireUser();
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
  const data = body as Record<string, unknown>;
  const locale = data.locale;
  const displayDensity = data.displayDensity;
  const notificationPreferences = data.notifications;
  if (!isAppLocale(locale) || !isDisplayDensity(displayDensity) ||
      !isNotificationPreferences(notificationPreferences)) {
    return NextResponse.json({ message: "Choose a supported language, display density, and notification preferences." }, { status: 400 });
  }

  try {
    const preferences = await updateJsonPlatform((state) => {
      const account = state.users.find((item) => item.id === user.id && item.status === "active");
      if (!account) return null;
      const current = normalizeUserPreferences(account.preferences);
      account.preferences = {
        locale,
        displayDensity,
        notifications: { ...notificationPreferences, lastReadAt: current.notifications.lastReadAt },
      };
      return account.preferences;
    });
    if (!preferences) return NextResponse.json({ message: "Account not found." }, { status: 404 });
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Unable to save account preferences:", error);
    return NextResponse.json({ message: "Unable to save account preferences." }, { status: 500 });
  }
}
