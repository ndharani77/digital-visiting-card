import { NextResponse } from "next/server";
import { authFailureResponse } from "@/lib/api-auth";
import { requireCompanyAdmin, requireUser } from "@/lib/auth";
import { readJsonPlatform, updateJsonPlatform } from "@/lib/json-store";
import { normalizeUserPreferences } from "@/lib/user-preferences";

export const runtime = "nodejs";

function notificationCategory(entityType: string) {
  if (entityType === "company" || entityType === "branch") return "company" as const;
  if (entityType === "company-admin" || entityType === "account") return "account" as const;
  return "cards" as const;
}

export async function GET() {
  try {
    const user = await requireUser();
    requireCompanyAdmin(user);
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const companyId = isSuperAdmin ? null : user.companyId;
    if (!isSuperAdmin && !companyId) return NextResponse.json({ message: "Your account is not assigned to a company." }, { status: 403 });

    const state = await readJsonPlatform();
    const preferences = normalizeUserPreferences(
      state.users.find((account) => account.id === user.id)?.preferences
    );
    if (!preferences.notifications.enabled) {
      return NextResponse.json({ unreadCount: 0, items: [] });
    }
    const accountEmails = new Map(state.users.map((account) => [account.id, account.email]));
    const companyNames = new Map(state.companies.map((company) => [company.id, company.name]));
    const branchEntityIds = user.branchId
      ? new Set([
          ...state.employees
            .filter((employee) => employee.companyId === companyId && employee.branchId === user.branchId)
            .map((employee) => `employee:${employee.id}`),
          ...state.cards
            .filter((card) => card.companyId === companyId && card.branchId === user.branchId)
            .map((card) => `card:${card.id}`),
        ])
      : null;
    const items = state.activityLogs
      .filter((log) =>
        (isSuperAdmin || log.companyId === companyId) &&
        (!branchEntityIds || (
          log.entityType === "branch"
            ? log.entityId === user.branchId
            : branchEntityIds.has(`${log.entityType}:${log.entityId}`)
        )) &&
        log.actorUserId !== user.id &&
        (isSuperAdmin || preferences.notifications[notificationCategory(log.entityType)])
      )
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, 50)
      .map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        actorEmail: accountEmails.get(log.actorUserId) ?? "System",
        ...(isSuperAdmin ? { companyName: companyNames.get(log.companyId) ?? "Company" } : {}),
        createdAt: log.createdAt,
      }));
    const lastReadAt = Date.parse(preferences.notifications.lastReadAt);
    const unreadCount = items.filter((item) =>
      Number.isFinite(Date.parse(item.createdAt)) &&
      (!Number.isFinite(lastReadAt) || Date.parse(item.createdAt) > lastReadAt)
    ).length;
    return NextResponse.json({ unreadCount, items });
  } catch (error) {
    const authResponse = authFailureResponse(error);
    if (authResponse) return authResponse;
    console.error("Unable to load notifications:", error);
    return NextResponse.json({ message: "Unable to load notifications." }, { status: 500 });
  }
}

export async function POST() {
  let user;
  try {
    user = await requireUser();
    requireCompanyAdmin(user);
  } catch (error) {
    return authFailureResponse(error) ?? NextResponse.json({ message: "Unable to authorize this request." }, { status: 500 });
  }

  try {
    const timestamp = new Date().toISOString();
    const updated = await updateJsonPlatform((state) => {
      const account = state.users.find((item) => item.id === user.id && item.status === "active");
      if (!account) return false;
      const preferences = normalizeUserPreferences(account.preferences);
      account.preferences = {
        ...preferences,
        notifications: { ...preferences.notifications, lastReadAt: timestamp },
      };
      return true;
    });
    if (!updated) return NextResponse.json({ message: "Account not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unable to mark notifications as read:", error);
    return NextResponse.json({ message: "Unable to mark notifications as read." }, { status: 500 });
  }
}
