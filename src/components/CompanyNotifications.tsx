"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Building2, CreditCard, LoaderCircle, Settings2, ShieldCheck, UserRound, Users } from "lucide-react";
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
  const panelRef = useRef<HTMLDivElement>(null);
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

  const markAsRead = useCallback(async () => {
    if (unreadCount === 0) return;
    let cancelled = false;
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
    return () => { cancelled = true; };
  }, [locale, unreadCount]);

  useEffect(() => {
    if (!open || unreadCount === 0) return;
    void markAsRead();
  }, [open, unreadCount, markAsRead]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function NotificationIcon({ entityType }: { entityType: string }) {
    if (entityType === "branch") return <Building2 size={16} />;
    if (entityType === "company") return <Building2 size={16} />;
    if (entityType === "card") return <CreditCard size={16} />;
    if (entityType === "employee") return <UserRound size={16} />;
    if (entityType === "company-admin") return <ShieldCheck size={16} />;
    if (entityType === "account") return <Settings2 size={16} />;
    return <Users size={16} />;
  }

  return (
    <div ref={panelRef} className="relative z-[100]">
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
        <section aria-label={t("notification.title")} className="absolute right-0 top-full z-50 mt-2 w-[min(384px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_18px_50px_-12px_rgba(15,23,42,0.28)]">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold">{t("notification.title")}</h2>
            <div className="flex items-center gap-2">
              {loading && <LoaderCircle size={15} className="animate-spin text-slate-400" aria-label={t("settings.loading")} />}
              {unreadCount > 0 && (
                <button type="button" onClick={() => void markAsRead()} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                  {t("notification.markRead")}
                </button>
              )}
            </div>
          </header>
          {error ? <p role="alert" className="p-4 text-sm text-red-700">{error}</p> : items.length === 0
            ? <p className="p-4 text-sm text-slate-500">{loading ? t("settings.loading") : t("notification.empty")}</p>
            : <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto" aria-live="polite">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <NotificationIcon entityType={item.entityType} />
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm leading-5 text-slate-700">{notificationMessage(item, locale)}</p>
                  {showCompany && item.companyName && <p className="mt-1 text-xs font-semibold text-blue-700">{item.companyName}</p>}
                    <time className="mt-1 block text-xs text-slate-400" dateTime={item.createdAt}>
                    {new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : locale === "te" ? "te-IN" : "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}
                    </time>
                  </div>
                </li>
              ))}
            </ul>}
        </section>
      )}
    </div>
  );
}
