"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  ChevronDown,
  CreditCard,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings2,
  Upload,
  X,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

type SessionUser = { role: UserRole; email: string; companyId: string | null };
type CompanyOption = { id: string; name: string };

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-cards", label: "My Cards", icon: CreditCard },
  { href: "/create-card", label: "Create card", icon: Plus, adminOnly: true },
  { href: "/import-excel", label: "Import contacts", icon: Upload, adminOnly: true },
  { href: "/export-qr", label: "Export QR codes", icon: Download },
];

const companyLinks = [
  { href: "/company", label: "Card Branding" },
  { href: "/company/preview-details", label: "Scan Page Content" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [companyOpen, setCompanyOpen] = useState(pathname.startsWith("/company"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspace() {
      try {
        const sessionResponse = await fetch("/api/auth/session");
        const session = await sessionResponse.json();
        if (!sessionResponse.ok) throw new Error(session.message || "Unable to load the current account.");
        if (cancelled) return;
        setUser(session.user as SessionUser);
        setActiveCompanyId(session.activeCompanyId);

        const companiesResponse = await fetch("/api/companies");
        const companyList = await companiesResponse.json();
        if (!companiesResponse.ok) throw new Error(companyList.message || "Unable to load companies.");
        if (!cancelled) setCompanies(companyList as CompanyOption[]);
      } catch (error) {
        if (!cancelled) setAccountError(error instanceof Error ? error.message : "Unable to load the current account.");
      }
    }
    void loadWorkspace();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/company")) setCompanyOpen(true);
    setMobileOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href;
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

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "COMPANY_ADMIN";
  const canCreateForCompany = user?.role !== "SUPER_ADMIN" || activeCompanyId !== null;
  const visibleNavigation = user
    ? navigation.filter((item) => (!item.adminOnly || isAdmin) && (canCreateForCompany || item.href !== "/create-card" && item.href !== "/import-excel"))
    : navigation.slice(0, 2);
  const visibleCompanyLinks = isAdmin && (user?.role !== "SUPER_ADMIN" || activeCompanyId !== null) ? companyLinks : [];
  const selectedCompanyName = companies.find((company) => company.id === activeCompanyId)?.name;

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
    if (user.role !== "SUPER_ADMIN") {
      return (
        <div className={`rounded-xl px-3 py-2 ${mobile ? "col-span-2 border border-slate-200 bg-slate-50" : "mb-5 border border-white/10 bg-white/[0.04]"}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Company</p>
          <p className={`mt-1 truncate text-sm font-medium ${mobile ? "text-slate-900" : "text-white"}`}>{selectedCompanyName || "Your company"}</p>
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

  function companyManagementLink(mobile = false) {
    if (!isAdmin) return null;
    const href = user?.role === "SUPER_ADMIN"
      ? "/companies"
      : user?.companyId
        ? `/companies/${encodeURIComponent(user.companyId)}`
        : "/companies";
    const label = user?.role === "SUPER_ADMIN" ? "Companies" : "Company access";
    const active = pathname === href || (href !== "/companies" && pathname.startsWith(`${href}/`));
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`${mobile ? "flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-sm" : `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${active ? "bg-blue-500/15 text-white ring-1 ring-inset ring-blue-400/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`} ${
          mobile && active ? "bg-blue-50 text-blue-700" : mobile ? "text-slate-600 hover:bg-slate-50" : ""
        }`}
      >
        <Settings2 size={18} />{label}
      </Link>
    );
  }

  function branchManagementLink(mobile = false) {
    if (!isAdmin) return null;
    const companyId = user?.role === "SUPER_ADMIN" ? activeCompanyId : user?.companyId;
    if (!companyId) return null;
    const href = `/companies/${encodeURIComponent(companyId)}/branches`;
    const active = pathname === href;
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`${mobile ? "flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-sm" : navClass(href)} ${
          mobile && active ? "bg-blue-50 text-blue-700" : mobile ? "text-slate-600 hover:bg-slate-50" : ""
        }`}
      >
        <Building2 size={18} />Branches
      </Link>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:hidden">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm shadow-blue-700/20">
            <CreditCard size={21} />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-slate-900">Card Reader</span>
            <span className="block text-[11px] text-slate-500">Digital Business Cards</span>
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
        <nav id="mobile-navigation" aria-label="Main navigation" className="absolute inset-x-0 top-[68px] z-40 border-b border-slate-200 bg-white p-3 shadow-xl md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {companyControl(true)}
            {visibleNavigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                  isHighlighted(href) ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={18} />{label}
              </Link>
            ))}
            {visibleCompanyLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                  pathname === href ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Building2 size={18} />{label}
              </Link>
            ))}
            {companyManagementLink(true)}
            {branchManagementLink(true)}
            <button type="button" onClick={() => void signOut()} disabled={signingOut} className="col-span-2 flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              <LogOut size={18} />{signingOut ? "Signing out..." : "Sign out"}
            </button>
            {accountError && <p role="alert" className="col-span-2 px-3 py-1 text-xs text-red-600">{accountError}</p>}
          </div>
        </nav>
      )}

      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col bg-[#101b31] px-4 py-6 text-white md:flex">
        <Link href="/" className="mb-6 flex items-center gap-3 px-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-950/30">
            <CreditCard size={23} />
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-tight">Card Reader</span>
            <span className="mt-0.5 block text-[11px] text-slate-400">Digital Business Cards</span>
          </span>
        </Link>
        {companyControl()}
        {accountError && <p role="alert" className="mb-3 px-2 text-xs text-red-300">{accountError}</p>}

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
        <nav aria-label="Workspace" className="space-y-1">
          {visibleNavigation.slice(0, 3).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={navClass(href)}>
              <Icon size={18} strokeWidth={1.8} />{label}
            </Link>
          ))}
          {visibleCompanyLinks.length > 0 && (
            <>
              <button
                type="button"
                aria-expanded={companyOpen}
                aria-controls="company-sidebar-options"
                onClick={() => setCompanyOpen((open) => !open)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors ${
                  pathname.startsWith("/company") ? "bg-blue-500/15 text-white ring-1 ring-inset ring-blue-400/20" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Building2 size={18} strokeWidth={1.8} />
                <span className="flex-1">Company Settings</span>
                <ChevronDown size={16} className={`transition-transform ${companyOpen ? "rotate-180" : ""}`} />
              </button>
              {companyOpen && (
                <div id="company-sidebar-options" role="group" aria-label="Company settings" className="ml-5 space-y-1 border-l border-slate-700 pl-3">
                  {visibleCompanyLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      aria-current={pathname === href ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-[13px] ${
                        pathname === href ? "bg-white/10 font-semibold text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </nav>

        <p className="mb-2 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Management</p>
        <nav aria-label="Management" className="space-y-1">
          {visibleNavigation.slice(3).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={navClass(href)}>
              <Icon size={18} strokeWidth={1.8} />{label}
            </Link>
          ))}
          {companyManagementLink()}
          {branchManagementLink()}
        </nav>

        <div className="mt-auto">
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="truncate text-xs font-semibold text-white">{user?.email || "Signed-in workspace"}</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">Manage the cards and company data assigned to your account.</p>
          </div>
          <button type="button" onClick={() => void signOut()} disabled={signingOut} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-60">
            <LogOut size={18} />{signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
