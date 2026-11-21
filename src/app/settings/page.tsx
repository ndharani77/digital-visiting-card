"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Bell, Building2, Check, ImagePlus, LoaderCircle, MonitorCog, Palette } from "lucide-react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import PasswordChangeForm from "@/components/PasswordChangeForm";
import {
  COMPANY_THEMES,
  COMPANY_THEME_COLORS,
  CARD_APPEARANCES,
  DEFAULT_COMPANY_THEME,
  DEFAULT_CARD_APPEARANCE,
  COMPANY_SIDEBAR_COLORS,
  isCardAppearance,
  isCompanyTheme,
  type CardAppearance,
  type CompanyTheme,
} from "@/lib/company-theme";
import {
  DEFAULT_USER_PREFERENCES,
  isAppLocale,
  isDisplayDensity,
  type UserPreferences,
} from "@/lib/user-preferences";
import type { AppLocale } from "@/lib/user-preferences";
import { translate } from "@/lib/messages";
import { DEFAULT_COMPANY_LOGO } from "@/lib/card-defaults";

const themeLabels: Record<CompanyTheme, string> = {
  blue: "theme.blue",
  teal: "theme.teal",
  violet: "theme.violet",
  rose: "theme.rose",
  amber: "theme.amber",
};

const appearanceLabels: Record<CardAppearance, string> = {
  classic: "card.classic",
  midnight: "card.midnight",
  sand: "card.sand",
};

const localeLabels: Record<AppLocale, string> = {
  en: "language.english",
  hi: "language.hindi",
  te: "language.telugu",
};

function responseMessage(value: unknown, fallback: string) {
  return value && typeof value === "object" && "message" in value && typeof value.message === "string"
    ? value.message
    : fallback;
}

function isUserPreferences(value: unknown): value is UserPreferences {
  if (!value || typeof value !== "object" || !("notifications" in value) ||
      typeof value.notifications !== "object" || value.notifications === null) return false;
  return "locale" in value && isAppLocale(value.locale) &&
    "displayDensity" in value && isDisplayDensity(value.displayDensity) &&
    "enabled" in value.notifications && typeof value.notifications.enabled === "boolean" &&
    "cards" in value.notifications && typeof value.notifications.cards === "boolean" &&
    "company" in value.notifications && typeof value.notifications.company === "boolean" &&
    "account" in value.notifications && typeof value.notifications.account === "boolean" &&
    "lastReadAt" in value.notifications && typeof value.notifications.lastReadAt === "string";
}

export default function CompanySettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [logoData, setLogoData] = useState("");
  const [theme, setTheme] = useState<CompanyTheme>(DEFAULT_COMPANY_THEME);
  const [cardAppearance, setCardAppearance] = useState<CardAppearance>(DEFAULT_CARD_APPEARANCE);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [brandingError, setBrandingError] = useState("");
  const [preferencesError, setPreferencesError] = useState("");
  const [brandingMessage, setBrandingMessage] = useState("");
  const [preferencesMessage, setPreferencesMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      try {
        const sessionResponse = await fetch("/api/auth/session");
        const session = await sessionResponse.json();
        if (sessionResponse.status === 401) {
          window.location.assign("/login");
          return;
        }
        if (!sessionResponse.ok) throw new Error(responseMessage(session, "Unable to verify your account."));
        if (session.user?.mustChangePassword) {
          window.location.assign("/change-password");
          return;
        }
        const hasCompanyWorkspace = session.user?.role === "COMPANY_ADMIN" ||
          (session.user?.role === "SUPER_ADMIN" && Boolean(session.activeCompanyId));
        if (!hasCompanyWorkspace) {
          window.location.assign("/");
          return;
        }

        const [companyResponse, preferencesResponse] = await Promise.all([
          fetch("/api/company"),
          fetch("/api/auth/preferences"),
        ]);
        const [companyResult, preferencesResult]: [unknown, unknown] = await Promise.all([
          companyResponse.json(),
          preferencesResponse.json(),
        ]);
        if (!companyResponse.ok) throw new Error(responseMessage(companyResult, "Unable to load company settings."));
        if (!companyResult || typeof companyResult !== "object" ||
            !("companyName" in companyResult) || typeof companyResult.companyName !== "string" ||
            !("logoData" in companyResult) || typeof companyResult.logoData !== "string" ||
            !("theme" in companyResult) || !isCompanyTheme(companyResult.theme) ||
            !("cardAppearance" in companyResult) || !isCardAppearance(companyResult.cardAppearance)) {
          throw new Error("Company dashboard settings are invalid.");
        }
        if (!preferencesResponse.ok) throw new Error(responseMessage(preferencesResult, "Unable to load personal preferences."));
        if (!isUserPreferences(preferencesResult)) throw new Error("Personal preferences response is invalid.");
        if (!cancelled) {
          setCompanyName(companyResult.companyName);
          setLogoData(companyResult.logoData);
          setTheme(companyResult.theme);
          setCardAppearance(companyResult.cardAppearance);
          document.documentElement.dataset.companyTheme = companyResult.theme;
          setPreferences(preferencesResult);
          document.documentElement.dataset.displayDensity = preferencesResult.displayDensity;
          document.documentElement.lang = preferencesResult.locale;
        }
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : "Unable to load settings.";
          setBrandingError(message);
          setPreferencesError(message);
        }
      } finally {
        if (!cancelled) {
          setBrandingLoading(false);
          setPreferencesLoading(false);
        }
      }
    }
    void loadSettings();
    return () => { cancelled = true; };
  }, []);

  async function updateLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setBrandingError("Choose a PNG, JPEG, or WebP logo.");
      return;
    }
    if (file.size > 500 * 1024) {
      setBrandingError("Choose a logo no larger than 500 KB.");
      return;
    }
    try {
      const nextLogo = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("Unable to read this logo file."));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = () => reject(new Error("Unable to read this logo file."));
        reader.readAsDataURL(file);
      });
      setLogoData(nextLogo);
      setBrandingError("");
      setBrandingMessage("");
    } catch (logoError) {
      setBrandingError(logoError instanceof Error ? logoError.message : "Unable to read this logo file.");
    }
  }

  async function saveBranding() {
    setSavingBranding(true);
    setBrandingError("");
    setBrandingMessage("");
    try {
      const response = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, logoData, theme, cardAppearance }),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(responseMessage(result, "Unable to save company appearance."));
      if (!result || typeof result !== "object" ||
          !("companyName" in result) || typeof result.companyName !== "string" ||
          !("logoData" in result) || typeof result.logoData !== "string" ||
          !("theme" in result) || !isCompanyTheme(result.theme) ||
          !("cardAppearance" in result) || !isCardAppearance(result.cardAppearance)) {
        throw new Error("Company dashboard settings response is invalid.");
      }
      setCompanyName(result.companyName);
      setLogoData(result.logoData);
      setTheme(result.theme);
      setCardAppearance(result.cardAppearance);
      document.documentElement.dataset.companyTheme = result.theme;
      window.dispatchEvent(new CustomEvent("company-branding-updated", {
        detail: { name: result.companyName, logoData: result.logoData },
      }));
      setBrandingMessage(translate(preferences.locale, "settings.savedBranding"));
    } catch (saveError) {
      setBrandingError(saveError instanceof Error ? saveError.message : "Unable to save company appearance.");
    } finally {
      setSavingBranding(false);
    }
  }

  async function savePreferences() {
    setSavingPreferences(true);
    setPreferencesError("");
    setPreferencesMessage("");
    try {
      const response = await fetch("/api/auth/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: preferences.locale,
          displayDensity: preferences.displayDensity,
          notifications: {
            enabled: preferences.notifications.enabled,
            cards: preferences.notifications.cards,
            company: preferences.notifications.company,
            account: preferences.notifications.account,
          },
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(responseMessage(result, "Unable to save personal preferences."));
      if (!isUserPreferences(result)) throw new Error("Personal preferences response is invalid.");
      setPreferences(result);
      document.documentElement.dataset.displayDensity = result.displayDensity;
      document.documentElement.lang = result.locale;
      setPreferencesMessage(translate(result.locale, "settings.savedPreferences"));
    } catch (saveError) {
      setPreferencesError(saveError instanceof Error ? saveError.message : "Unable to save personal preferences.");
    } finally {
      setSavingPreferences(false);
    }
  }

  const t = (key: Parameters<typeof translate>[1]) => translate(preferences.locale, key);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Workspace preferences</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{t("settings.title")}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("settings.subtitle")}</p>
          </header>

          <section aria-labelledby="theme-heading" className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-8 grid gap-8 border-b border-slate-100 pb-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{t("settings.dashboardBranding")}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{t("settings.dashboardBrandingDescription")}</p>
                <label className="mt-5 block text-sm font-semibold text-slate-700">
                  {t("settings.companyName")}
                  <input
                    required
                    maxLength={100}
                    value={companyName}
                    disabled={brandingLoading || savingBranding}
                    onChange={(event) => {
                      setCompanyName(event.currentTarget.value);
                      setBrandingMessage("");
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />
                </label>
                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-700">{t("settings.companyLogo")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-500">
                      {logoData
                        ? <Image src={logoData} alt="" width={48} height={48} unoptimized className="h-full w-full object-contain" />
                        : <Building2 size={22} />}
                    </span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <ImagePlus size={16} />{t("settings.chooseLogo")}
                      <input type="file" accept="image/png,image/jpeg,image/webp" disabled={brandingLoading || savingBranding} onChange={(event) => { void updateLogo(event); }} className="sr-only" />
                    </label>
                    <button
                      type="button"
                      disabled={brandingLoading || savingBranding}
                      onClick={() => {
                        setLogoData(DEFAULT_COMPANY_LOGO);
                        setBrandingError("");
                        setBrandingMessage("");
                      }}
                      className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-60"
                    >
                      {t("settings.restoreLogo")}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">PNG, JPEG, or WebP · maximum 500 KB</p>
                </div>
              </div>

              <aside aria-label={t("settings.dashboardPreview")} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t("settings.dashboardPreview")}</p>
                <div className="rounded-xl p-4 text-white shadow-lg" style={{ backgroundColor: COMPANY_SIDEBAR_COLORS[theme] }}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                      {logoData
                        ? <Image src={logoData} alt="" width={40} height={40} unoptimized className="h-full w-full object-contain" />
                        : <Building2 size={20} className="text-slate-500" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{companyName || t("settings.companyName")}</span>
                      <span className="block text-[11px] text-slate-400">Card Reader</span>
                    </span>
                  </div>
                  <div className="mt-5 rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: COMPANY_THEME_COLORS[theme] }}>
                    {t("nav.dashboard")}
                  </div>
                </div>
              </aside>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Palette size={21} />
              </span>
              <div>
                <h2 id="theme-heading" className="text-xl font-bold text-slate-950">{t("settings.theme")}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{t("settings.themeDescription")}</p>
              </div>
            </div>
            <fieldset disabled={brandingLoading || savingBranding} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <legend className="sr-only">Choose a company color theme</legend>
              {COMPANY_THEMES.map((option) => (
                <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                  theme === option ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/15" : "border-slate-200 hover:bg-slate-50"
                }`}>
                  <input
                    type="radio"
                    name="company-theme"
                    value={option}
                    checked={theme === option}
                    onChange={() => { setTheme(option); setBrandingMessage(""); }}
                    className="sr-only"
                  />
                  <span className="h-9 w-9 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: COMPANY_THEME_COLORS[option] }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{t(themeLabels[option] as Parameters<typeof translate>[1])}</span>
                    <span className="block text-xs text-slate-500">{COMPANY_THEME_COLORS[option]}</span>
                  </span>
                  {theme === option && <Check size={18} className="text-blue-700" aria-hidden="true" />}
                </label>
              ))}
            </fieldset>
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-base font-bold text-slate-900">{t("settings.cardAppearance")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("settings.cardAppearanceDescription")}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {CARD_APPEARANCES.map((option) => (
                  <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                    cardAppearance === option ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/15" : "border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input type="radio" name="card-appearance" value={option} checked={cardAppearance === option} onChange={() => {
                      setCardAppearance(option);
                      setBrandingMessage("");
                    }} className="sr-only" />
                    <span className="h-9 w-9 shrink-0 rounded-lg border border-slate-300" style={{ backgroundColor: option === "classic" ? "#fff" : option === "midnight" ? "#111827" : "#fff7ed" }} />
                    <span className="text-sm font-semibold text-slate-900">{t(appearanceLabels[option] as Parameters<typeof translate>[1])}</span>
                    {cardAppearance === option && <Check size={17} className="ml-auto text-blue-700" aria-hidden="true" />}
                  </label>
                ))}
              </div>
            </div>
            {brandingLoading && <p role="status" className="mt-4 text-sm text-slate-500">{t("settings.loading")}</p>}
            {brandingError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{brandingError}</p>}
            {brandingMessage && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{brandingMessage}</p>}
            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => void saveBranding()}
                disabled={brandingLoading || savingBranding}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingBranding && <LoaderCircle size={17} className="animate-spin" />}
                {t("settings.saveBranding")}
              </button>
            </div>
          </section>

          <section aria-labelledby="preferences-heading" className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <MonitorCog size={21} />
              </span>
              <div>
                <h2 id="preferences-heading" className="text-xl font-bold text-slate-950">{t("settings.preferences")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("settings.preferencesDescription")}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                {t("settings.language")}
                <select value={preferences.locale} onChange={(event) => {
                  const locale = event.currentTarget.value;
                  if (isAppLocale(locale)) setPreferences((current) => ({ ...current, locale }));
                }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal">
                  {(["en", "hi", "te"] as const).map((option) => <option key={option} value={option}>{t(localeLabels[option] as Parameters<typeof translate>[1])}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                {t("settings.displayDensity")}
                <select value={preferences.displayDensity} onChange={(event) => {
                  const displayDensity = event.currentTarget.value;
                  if (isDisplayDensity(displayDensity)) setPreferences((current) => ({ ...current, displayDensity }));
                }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal">
                  <option value="comfortable">{t("settings.comfortable")}</option>
                  <option value="compact">{t("settings.compact")}</option>
                </select>
              </label>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="flex items-start gap-3">
                <Bell size={20} className="mt-0.5 text-blue-700" />
                <div>
                  <h3 className="font-bold text-slate-900">{t("settings.notifications")}</h3>
                  <p className="mt-1 text-sm text-slate-500">{t("settings.notificationsDescription")}</p>
                </div>
              </div>
              <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={preferences.notifications.enabled} onChange={(event) => setPreferences((current) => ({
                  ...current,
                  notifications: { ...current.notifications, enabled: event.target.checked },
                }))} className="h-4 w-4 accent-blue-700" />
                {t("settings.notificationsEnabled")}
              </label>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {([
                  ["cards", "settings.cardUpdates"],
                  ["company", "settings.companyUpdates"],
                  ["account", "settings.accountUpdates"],
                ] as const).map(([field, labelKey]) => (
                  <label key={field} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                    <input type="checkbox" checked={preferences.notifications[field]} disabled={!preferences.notifications.enabled} onChange={(event) => setPreferences((current) => ({
                      ...current,
                      notifications: { ...current.notifications, [field]: event.target.checked },
                    }))} className="h-4 w-4 accent-blue-700" />
                    {t(labelKey)}
                  </label>
                ))}
              </div>
            </div>
            {preferencesLoading && <p role="status" className="mt-4 text-sm text-slate-500">{t("settings.loading")}</p>}
            {preferencesError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{preferencesError}</p>}
            {preferencesMessage && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{preferencesMessage}</p>}
            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
              <button type="button" onClick={() => void savePreferences()} disabled={preferencesLoading || savingPreferences} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                {savingPreferences && <LoaderCircle size={17} className="animate-spin" />}
                {t("settings.savePreferences")}
              </button>
            </div>
          </section>

          <PasswordChangeForm redirectOnSuccess={false} locale={preferences.locale} />
        </div>
      </main>
    </div>
  );
}
