"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, LoaderCircle } from "lucide-react";
import { translate, type MessageKey } from "@/lib/messages";
import type { AppLocale } from "@/lib/user-preferences";

type NotificationItem = {
  id: string;
  action: string;
  entityType: string;
  actorEmail: string;
  companyName?: string;
  createdAt: string;
};

function isNotificationsResponse(value: unknown): value is { unreadCount: number; items: NotificationItem[] } {
  return Boolean(
    value &&
    typeof value === "object" &&
    "unreadCount" in value && typeof value.unreadCount === "number" &&
    "items" in value && Array.isArray(value.items) &&
    value.items.every((item) =>
      item && typeof item === "object" &&
      "id" in item && typeof item.id === "string" &&
      "action" in item && typeof item.action === "string" &&
      "entityType" in item && typeof item.entityType === "string" &&
      "actorEmail" in item && typeof item.actorEmail === "string" &&
      (!("companyName" in item) || typeof item.companyName === "string") &&
      "createdAt" in item && typeof item.createdAt === "string"
    )
  );
}

function notificationMessage(item: NotificationItem, locale: AppLocale) {
  const actionKeys: Record<string, MessageKey> = {
    created: "notification.created",
    updated: "notification.updated",
    "updated-preview": "notification.updated-preview",
    activated: "notification.activated",
    deactivated: "notification.deactivated",
    deleted: "notification.deleted",
  };
  const entityKeys: Record<string, MessageKey> = {
    card: "notification.card",
    employee: "notification.employee",
    branch: "notification.branch",
    company: "notification.company",
    "company-admin": "notification.company-admin",
    account: "notification.account",
  };
  const actionKey = actionKeys[item.action] ?? "notification.updated";
  const entityKey = entityKeys[item.entityType] ?? "notification.card";
  return `${item.actorEmail} ${translate(locale, actionKey)} ${translate(locale, entityKey)}`;
}

export default function CompanyNotifications({
  locale,
  showCompany = false,
}: {
  locale: AppLocale;
  showCompany?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const t = (key: MessageKey) => translate(locale, key);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
          ? result.message
          : translate(locale, "notification.error");
        throw new Error(message);
      }
      if (!isNotificationsResponse(result)) throw new Error(translate(locale, "notification.error"));
      setItems(result.items);
      setUnreadCount(result.unreadCount);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : translate(locale, "notification.error"));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 60_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open || unreadCount === 0) return;
    let cancelled = false;
    async function markAsRead() {
      try {
        const response = await fetch("/api/notifications", { method: "POST" });
        const result: unknown = await response.json();
        if (!response.ok) {
          const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
            ? result.message
            : translate(locale, "notification.error");
          throw new Error(message);
        }
        if (!cancelled) setUnreadCount(0);
      } catch (markError) {
        if (!cancelled) setError(markError instanceof Error ? markError.message : translate(locale, "notification.error"));
      }
    }
    void markAsRead();
    return () => { cancelled = true; };
  }, [open, unreadCount, locale]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`${t("notification.title")}${unreadCount ? ` (${unreadCount})` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section aria-label={t("notification.title")} className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold">{t("notification.title")}</h2>
            {loading && <LoaderCircle size={15} className="animate-spin text-slate-400" aria-label={t("settings.loading")} />}
          </header>
          {error ? <p role="alert" className="p-4 text-sm text-red-700">{error}</p> : items.length === 0
            ? <p className="p-4 text-sm text-slate-500">{loading ? t("settings.loading") : t("notification.empty")}</p>
            : <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <p className="text-sm text-slate-700">{notificationMessage(item, locale)}</p>
                  {showCompany && item.companyName && <p className="mt-1 text-xs font-semibold text-blue-700">{item.companyName}</p>}
                  <time className="mt-1 block text-xs text-slate-400" dateTime={item.createdAt}>
                    {new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : locale === "te" ? "te-IN" : "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}
                  </time>
                </li>
              ))}
            </ul>}
        </section>
      )}
    </div>
  );
}
