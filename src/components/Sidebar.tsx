"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  Download,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Settings2,
  ArrowLeftRight,
  X,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import { DEFAULT_COMPANY_THEME, isCompanyTheme } from "@/lib/company-theme";
import {
  DEFAULT_USER_PREFERENCES,
  isAppLocale,
  isDisplayDensity,
  type AppLocale,
} from "@/lib/user-preferences";
import { translate, type MessageKey } from "@/lib/messages";
import { WorkspaceLayoutContext } from "@/layout/WorkspaceLayoutContext";
import CreateCardDrawerButton from "@/components/CreateCardDrawerButton";

type SessionUser = { role: UserRole; email: string; companyId: string | null; branchId: string | null };
type CompanyOption = { id: string; name: string; branchEnabled?: boolean };
type CompanyBrand = { name: string; logoData: string };
type NavigationItem = { href: string; label: string; messageKey: MessageKey | null; icon: LucideIcon };

function isCompanyBrand(value: unknown): value is CompanyBrand {
  return Boolean(
    value &&
    typeof value === "object" &&
    "name" in value && typeof value.name === "string" &&
    "logoData" in value && typeof value.logoData === "string"
  );
}

const navigation: NavigationItem[] = [
  { href: "/", label: "Dashboard", messageKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/all-cards", label: "Cards", messageKey: null, icon: CreditCard },
  { href: "/companies", label: "Companies", messageKey: null, icon: Building2 },
  { href: "/analytics", label: "Analytics", messageKey: null, icon: LayoutDashboard },
  { href: "/change-password", label: "Settings", messageKey: "nav.settings", icon: Settings2 },
];

const companyNavigation: NavigationItem[] = [
  { href: "/", label: "Dashboard", messageKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/my-cards", label: "Visiting Cards", messageKey: "nav.cards", icon: CreditCard },
  { href: "/bulk-management", label: "Import / Export", messageKey: null, icon: ArrowLeftRight },
  { href: "/company", label: "Company Profile", messageKey: "nav.companyProfile", icon: Building2 },
  { href: "/settings", label: "Settings", messageKey: "nav.settings", icon: Palette },
];

const employeeNavigation: NavigationItem[] = [
  { href: "/", label: "Dashboard", messageKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/my-cards", label: "My Cards", messageKey: "nav.cards", icon: CreditCard },
  { href: "/bulk-management?tab=export", label: "QR Codes", messageKey: "nav.qrCodes", icon: Download },
];

export default function Sidebar({ persistent = false }: { persistent?: boolean }) {
  const insideWorkspaceLayout = useContext(WorkspaceLayoutContext);
  if (insideWorkspaceLayout && !persistent) return null;
  return <SidebarContents persistent={persistent} />;
}

function SidebarContents({ persistent = false }: { persistent?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_USER_PREFERENCES.locale);
  const [companyBrand, setCompanyBrand] = useState<CompanyBrand | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    let cancelled = false;
    function handleBrandingUpdate(event: Event) {
      if (event instanceof CustomEvent && isCompanyBrand(event.detail)) {
        setCompanyBrand(event.detail);
      }
    }
    window.addEventListener("company-branding-updated", handleBrandingUpdate);
    async function loadWorkspace() {
      try {
        const sessionResponse = await fetch("/api/auth/session");
        const session = await sessionResponse.json();
        if (!sessionResponse.ok) throw new Error(session.message || "Unable to load the current account.");
        if (cancelled) return;
        setUser(session.user as SessionUser);
        setActiveCompanyId(session.activeCompanyId);
        const preferencesResponse = await fetch("/api/auth/preferences");
        const preferences = await preferencesResponse.json();
        if (!preferencesResponse.ok) throw new Error(preferences.message || "Unable to load personal preferences.");
        if (isAppLocale(preferences.locale)) {
          setLocale(preferences.locale);
          document.documentElement.lang = preferences.locale;
        }
        if (isDisplayDensity(preferences.displayDensity)) {
          document.documentElement.dataset.displayDensity = preferences.displayDensity;
        }
        const hasCompanyWorkspace = session.user.role === "COMPANY_ADMIN" ||
          (session.user.role === "SUPER_ADMIN" && Boolean(session.activeCompanyId));
        if (!hasCompanyWorkspace) {
          document.documentElement.dataset.companyTheme = DEFAULT_COMPANY_THEME;
          if (session.user.role === "EMPLOYEE") return;
        }

        const companiesResponse = await fetch("/api/companies");
        const companyList = await companiesResponse.json();
        if (!companiesResponse.ok) throw new Error(companyList.message || "Unable to load companies.");
        if (!cancelled) setCompanies(companyList as CompanyOption[]);
        if (hasCompanyWorkspace) {
          const settingsResponse = await fetch("/api/company");
          const settings = await settingsResponse.json();
          if (!settingsResponse.ok) throw new Error(settings.message || "Unable to load company theme.");
          if (typeof settings.companyName !== "string" ||
              typeof settings.logoData !== "string" ||
              !isCompanyTheme(settings.theme)) {
            throw new Error("Company branding settings are invalid.");
          }
          if (!cancelled) {
            setCompanyBrand({ name: settings.companyName, logoData: settings.logoData });
            document.documentElement.dataset.companyTheme = settings.theme;
          }
        }
      } catch (error) {
        if (!cancelled) setAccountError(error instanceof Error ? error.message : "Unable to load the current account.");
      }
    }
    void loadWorkspace();
    return () => {
      cancelled = true;
      window.removeEventListener("company-branding-updated", handleBrandingUpdate);
      document.documentElement.dataset.companyTheme = DEFAULT_COMPANY_THEME;
      document.documentElement.dataset.displayDensity = DEFAULT_USER_PREFERENCES.displayDensity;
      document.documentElement.lang = DEFAULT_USER_PREFERENCES.locale;
    };
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  function isActive(href: string) {
    const path = href.split("?")[0];
    return path === "/" ? pathname === "/" : pathname === path;
  }

  function isHighlighted(href: string) {
    return isActive(href) && href !== "/create-card";
  }

  function navClass(href: string) {
    return `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
      isHighlighted(href)
        ? "bg-blue-500/15 text-white ring-1 ring-inset ring-blue-400/20"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;
  }

  const isPlatformWideAdmin = user?.role === "SUPER_ADMIN" && !activeCompanyId;
  const isCompanyWorkspace = user?.role === "COMPANY_ADMIN" ||
    (user?.role === "SUPER_ADMIN" && activeCompanyId !== null);
  const visibleNavigation = !user
    ? employeeNavigation.slice(0, 2)
    : isPlatformWideAdmin
      ? navigation
      : isCompanyWorkspace
        ? (() => {
          const baseNavigation = user.role === "SUPER_ADMIN"
            ? companyNavigation.filter(({ href }) => href !== "/my-cards")
            : companyNavigation;
          const activeCompanyIdForNavigation = activeCompanyId ?? user.companyId;
          const activeCompany = companies.find((company) => company.id === activeCompanyIdForNavigation);
          if (!activeCompany?.branchEnabled || user.branchId) return baseNavigation;
          const withBranches = [...baseNavigation];
          const insertAt = Math.max(1, withBranches.findIndex(({ href }) => href === "/company"));
          withBranches.splice(insertAt >= 0 ? insertAt : withBranches.length, 0, {
            href: "/branches",
            label: "Branches",
            messageKey: null,
            icon: GitBranch,
          });
          return withBranches;
        })()
        : employeeNavigation;
  const translateNavigation = (label: string, key: MessageKey | null) =>
    key ? translate(locale, key) : label;
  const companyLogo = companyBrand?.logoData ? (
    <Image
      src={companyBrand.logoData}
      alt={`${companyBrand.name} logo`}
      width={44}
      height={44}
      unoptimized
      className="h-full w-full rounded-xl object-contain"
    />
  ) : (
    <CreditCard size={21} />
  );
  const brandName = companyBrand?.name || "Card Reader";
  const brandSubtitle = companyBrand ? "Card Reader" : "Digital Business Cards";

  async function switchCompany(companyId: string) {
    setSwitchingCompany(true);
    setAccountError("");
    try {
      const response = await fetch("/api/auth/active-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: companyId || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to switch companies.");
      window.location.reload();
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Unable to switch companies.");
    } finally {
      setSwitchingCompany(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out.");
      window.location.assign("/login");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Unable to sign out.");
      setSigningOut(false);
    }
  }

  function companyControl(mobile = false) {
    if (!user || user.role === "EMPLOYEE") return null;
    if (user.role !== "SUPER_ADMIN") return null;
    if (activeCompanyId) {
      return (
        <div className={`rounded-xl px-3 py-2 ${mobile ? "col-span-2 border border-slate-200 bg-slate-50" : "mb-5 border border-white/10 bg-white/[0.04]"}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Company workspace</p>
          <button
            type="button"
            disabled={switchingCompany}
            onClick={() => void switchCompany("")}
            className={`mt-1 text-xs font-semibold underline underline-offset-2 disabled:opacity-60 ${mobile ? "text-blue-700" : "text-blue-300"}`}
          >
            {switchingCompany ? "Changing workspace..." : "All workspaces"}
          </button>
        </div>
      );
    }
    return (
      <label className={`block rounded-xl px-3 py-2 ${mobile ? "col-span-2 border border-slate-200 bg-slate-50" : "mb-5 border border-white/10 bg-white/[0.04]"}`}>
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Active company</span>
        <select
          aria-label="Select active company"
          value={activeCompanyId ?? ""}
          disabled={switchingCompany}
          onChange={(event) => void switchCompany(event.target.value)}
          className={`w-full bg-transparent text-sm outline-none disabled:opacity-60 ${mobile ? "text-slate-900" : "text-white"}`}
        >
          <option value="" className="text-slate-900">All companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id} className="text-slate-900">{company.name}</option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:hidden">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
            companyBrand?.logoData ? "bg-white" : "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm shadow-blue-700/20"
          }`}>
            {companyLogo}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-slate-900">{brandName}</span>
            <span className="block text-[11px] text-slate-500">{brandSubtitle}</span>
          </span>
        </Link>
        <button
          type="button"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileOpen && (
        <nav id="mobile-navigation" aria-label="Main navigation" className="fixed inset-x-0 top-[68px] z-40 max-h-[calc(100vh-68px)] overflow-y-auto border-b border-slate-200 bg-white p-3 shadow-xl md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {companyControl(true)}
            {visibleNavigation.map(({ href, label, messageKey, icon: Icon }) => (
              href === "/create-card" ? (
                <CreateCardDrawerButton
                  key={href}
                  className="flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Icon size={18} />{translateNavigation(label, messageKey ?? null)}
                </CreateCardDrawerButton>
              ) : (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                    isHighlighted(href) ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={18} />{translateNavigation(label, messageKey ?? null)}
                </Link>
              )
            ))}
            <button type="button" onClick={() => void signOut()} disabled={signingOut} className="col-span-2 flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              <LogOut size={18} />{signingOut ? "Signing out..." : "Sign out"}
            </button>
            {accountError && <p role="alert" className="col-span-2 px-3 py-1 text-xs text-red-600">{accountError}</p>}
          </div>
        </nav>
      )}

      <aside style={{ backgroundColor: "var(--company-sidebar-background)" }} className={`${persistent ? "fixed inset-y-0 left-0 z-50" : "sticky top-0"} hidden h-screen w-[264px] shrink-0 flex-col overflow-y-auto px-4 py-6 text-white md:flex`}>
        <Link href="/" className="mb-6 flex min-w-0 items-center gap-3 px-2">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
            companyBrand?.logoData ? "bg-white" : "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-950/30"
          }`}>
            {companyBrand?.logoData ? (
              <Image
                src={companyBrand.logoData}
                alt={`${companyBrand.name} logo`}
                width={44}
                height={44}
                unoptimized
                className="h-full w-full object-contain"
              />
            ) : <CreditCard size={23} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold tracking-tight">{brandName}</span>
            <span className="mt-0.5 block text-[11px] text-slate-400">{brandSubtitle}</span>
          </span>
        </Link>
        {companyControl()}
        {accountError && <p role="alert" className="mb-3 px-2 text-xs text-red-300">{accountError}</p>}

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {isPlatformWideAdmin ? "Platform" : "Workspace"}
        </p>
        <nav aria-label={isPlatformWideAdmin ? "Platform navigation" : "Workspace navigation"} className="space-y-1">
          {visibleNavigation.map(({ href, label, messageKey, icon: Icon }) => (
            href === "/create-card" ? (
              <CreateCardDrawerButton key={href} className={navClass(href)}>
                <Icon size={18} strokeWidth={1.8} />{translateNavigation(label, messageKey ?? null)}
              </CreateCardDrawerButton>
            ) : (
              <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={navClass(href)}>
                <Icon size={18} strokeWidth={1.8} />{translateNavigation(label, messageKey ?? null)}
              </Link>
            )
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between rounded-xl px-3.5 py-2">
          <span className="text-sm font-medium text-slate-300">Admin</span>
          <button
            type="button"
            aria-label={signingOut ? "Signing out" : "Sign out"}
            title={signingOut ? "Signing out" : "Sign out"}
            onClick={() => void signOut()}
            disabled={signingOut}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-60"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
