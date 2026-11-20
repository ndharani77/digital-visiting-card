import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CirclePause,
  CreditCard,
  Plus,
  QrCode,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DashboardCardSearch from "@/components/DashboardCardSearch";
import { getActiveCompanyId, requirePageUser } from "@/lib/auth";
import { getCardsForUser, listCompanies } from "@/lib/platform-store";
import type { UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

type DashboardMetric = {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "amber" | "violet";
};

type DashboardAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
};

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Platform administrator",
  COMPANY_ADMIN: "Company administrator",
  EMPLOYEE: "Card holder",
};

export default async function Dashboard() {
  const user = await requirePageUser("/");
  const [cards, companies] = await Promise.all([
    getCardsForUser(user),
    listCompanies(user),
  ]);
  const activeCompanyId = await getActiveCompanyId(user);
  const company = user.role === "SUPER_ADMIN"
    ? companies.find((item) => item.id === activeCompanyId)
    : companies[0];
  const activeCards = cards.filter((card) => card.isActive);
  const inactiveCards = cards.length - activeCards.length;
  const cardHolderCount = new Set(cards.map((card) => card.employeeId).filter(Boolean)).size;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isCompanyAdmin = user.role === "COMPANY_ADMIN";
  const title = isSuperAdmin
    ? "Platform overview"
    : isCompanyAdmin
      ? "Company dashboard"
      : "My card dashboard";
  const headline = isSuperAdmin
    ? "Your platform, at a glance."
    : isCompanyAdmin
      ? "Your team’s digital presence, organized."
      : "Your professional card, ready to share.";
  const description = isSuperAdmin
    ? "Monitor company workspaces and keep card operations moving from one place."
    : isCompanyAdmin
      ? "Manage your team’s cards, review their status, and keep company details up to date."
      : "Keep your details current and share your digital card whenever you make a new connection.";
  const eyebrow = isSuperAdmin
    ? "Platform management"
    : isCompanyAdmin
      ? "Company operations"
      : "Personal workspace";
  const heroContext = isSuperAdmin
    ? company?.name ?? "All companies"
    : company?.name ?? roleLabels[user.role];

  const metrics: DashboardMetric[] = isSuperAdmin
    ? [
        {
          label: "Companies",
          value: companies.length,
          detail: "Workspaces on the platform",
          icon: Building2,
          tone: "blue",
        },
        {
          label: "Active companies",
          value: companies.filter((item) => item.status === "active").length,
          detail: "Ready to manage cards",
          icon: CheckCircle2,
          tone: "green",
        },
        {
          label: company ? "Cards in selected company" : "Cards across companies",
          value: cards.length,
          detail: company ? company.name : "Select a company to focus your workspace",
          icon: CreditCard,
          tone: "violet",
        },
        {
          label: "Inactive cards",
          value: inactiveCards,
          detail: "Cards not currently available to visitors",
          icon: CirclePause,
          tone: "amber",
        },
      ]
    : isCompanyAdmin
      ? [
          {
            label: "Card holders",
            value: cardHolderCount,
            detail: "People represented in your workspace",
            icon: Users,
            tone: "blue",
          },
          {
            label: "Total cards",
            value: cards.length,
            detail: "Cards managed by your company",
            icon: CreditCard,
            tone: "violet",
          },
          {
            label: "Active cards",
            value: activeCards.length,
            detail: "Available to visitors",
            icon: CheckCircle2,
            tone: "green",
          },
          {
            label: "Inactive cards",
            value: inactiveCards,
            detail: "Not currently available to visitors",
            icon: CirclePause,
            tone: "amber",
          },
        ]
      : [
          {
            label: "My cards",
            value: cards.length,
            detail: "Cards assigned to your account",
            icon: CreditCard,
            tone: "blue",
          },
          {
            label: "Card status",
            value: cards.length === 0 ? "Unassigned" : activeCards.length > 0 ? "Active" : "Inactive",
            detail: cards.length === 0 ? "Ask your administrator for a card" : "Control your visitor availability",
            icon: cards.length > 0 && activeCards.length > 0 ? CheckCircle2 : CirclePause,
            tone: cards.length > 0 && activeCards.length > 0 ? "green" : "amber",
          },
          {
            label: "Company",
            value: company?.name ?? "Not assigned",
            detail: "Your card workspace",
            icon: Building2,
            tone: "violet",
          },
        ];

  const actions: DashboardAction[] = isSuperAdmin
    ? [
        { href: "/companies", label: "Manage companies", icon: Building2, primary: true },
        ...(company ? [{ href: "/create-card", label: "Create a card", icon: Plus }] : []),
        ...(company && cards.length > 0 ? [{ href: "/export-qr", label: "Export QR codes", icon: QrCode }] : []),
      ]
    : isCompanyAdmin
      ? [
          { href: "/create-card", label: "Create team card", icon: Plus, primary: true },
          { href: "/import-excel", label: "Import contacts", icon: Users },
          ...(company ? [{ href: `/companies/${company.id}`, label: "Manage team", icon: Settings2 }] : []),
        ]
      : cards[0]
        ? [
            { href: `/create-card?id=${encodeURIComponent(cards[0].id)}`, label: "Update my card", icon: UserRound, primary: true },
            { href: `/card/${encodeURIComponent(cards[0].id)}/view`, label: "Preview and share", icon: ArrowUpRight },
          ]
        : [];

  const cardScope = isSuperAdmin
    ? company?.name ?? "All companies"
    : company?.name ?? "Your workspace";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
              <p className="mt-2 text-sm text-slate-500">
                {company ? `${company.name} workspace` : "All company workspaces"}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              {isSuperAdmin ? <ShieldCheck size={15} /> : isCompanyAdmin ? <Building2 size={15} /> : <UserRound size={15} />}
              {roleLabels[user.role]}
            </span>
          </header>

          <section className="relative mb-7 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#10233f] via-[#123c70] to-[#146ac0] p-7 text-white shadow-xl shadow-blue-950/10 md:p-9">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-16 h-64 w-64 rounded-full border border-white/10" />
            <div className="relative flex flex-wrap items-center justify-between gap-8">
              <div className="max-w-2xl">
                <span className="inline-flex max-w-full items-center truncate rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-blue-100">
                  {heroContext}
                </span>
                <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight md:text-4xl">{headline}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 md:text-base">{description}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {actions.map(({ href, label, icon: Icon, primary }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        primary
                          ? "bg-white text-blue-950 shadow-sm hover:bg-blue-50"
                          : "border border-white/25 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon size={17} />{label}<ArrowRight size={15} />
                    </Link>
                  ))}
                  {isSuperAdmin && !company && (
                    <p className="self-center text-sm text-blue-100">Select a company in the sidebar to manage its cards.</p>
                  )}
                  {!isSuperAdmin && !isCompanyAdmin && cards.length === 0 && (
                    <p className="self-center text-sm text-blue-100">Your company administrator can create your card.</p>
                  )}
                </div>
              </div>
              <div className="hidden h-36 w-36 shrink-0 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm lg:flex">
                {isSuperAdmin
                  ? <ShieldCheck size={76} strokeWidth={1.2} />
                  : isCompanyAdmin
                    ? <Building2 size={76} strokeWidth={1.2} />
                    : <CreditCard size={76} strokeWidth={1.2} />}
              </div>
            </div>
          </section>

          <section aria-label="Workspace summary" className={`mb-8 grid gap-3 sm:grid-cols-2 ${metrics.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
            {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
              <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">{value}</p>
                  </div>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    tone === "green" ? "bg-emerald-50 text-emerald-700"
                      : tone === "amber" ? "bg-amber-50 text-amber-700"
                        : tone === "violet" ? "bg-violet-50 text-violet-700"
                          : "bg-blue-50 text-blue-700"
                  }`}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 truncate text-xs text-slate-500">{detail}</p>
              </article>
            ))}
          </section>

          <DashboardCardSearch
            cards={cards}
            role={user.role}
            canCreateCard={user.role !== "EMPLOYEE" && (user.role !== "SUPER_ADMIN" || activeCompanyId !== null)}
            scopeLabel={cardScope}
            hasCompanySelected={user.role !== "SUPER_ADMIN" || activeCompanyId !== null}
          />
        </div>
      </main>
    </div>
  );
}
