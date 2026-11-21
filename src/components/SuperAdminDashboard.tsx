import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  CreditCard,
  QrCode,
  ShieldCheck,
  Plus,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import CompanyNotifications from "@/components/CompanyNotifications";
import Sidebar from "@/components/Sidebar";
import type {
  ActivityLogOverview,
  CompanyRecord,
  PlatformStatistics,
} from "@/lib/platform-store";
import type { AppLocale } from "@/lib/user-preferences";

type SuperAdminDashboardProps = {
  locale: AppLocale;
  companies: CompanyRecord[];
  analytics: PlatformStatistics;
  activities: ActivityLogOverview[];
};

type RecentActivity = {
  id: string;
  title: string;
  description: string;
  entityType: string;
  companyName: string;
  actorEmail: string;
  createdAt: string;
};

type Metric = {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "violet" | "amber";
};

const activityEntityNames: Record<string, string> = {
  company: "Company",
  employee: "Employee",
  card: "Visiting card",
  "company-admin": "Company Admin",
  branch: "Branch",
  account: "Account",
};

const activityActionNames: Record<string, string> = {
  created: "created",
  updated: "updated",
  "updated-preview": "preview updated",
  activated: "activated",
  deactivated: "deactivated",
  deleted: "deleted",
  "password-changed": "password changed",
};

const activityTitles: Record<string, string> = {
  "company:created": "New company added",
  "company:updated": "Company details or settings updated",
  "company:activated": "Company activated",
  "company:deactivated": "Company deactivated",
  "company:deleted": "Company deleted",
  "employee:created": "New employee added",
  "employee:updated": "Employee details updated",
  "employee:deleted": "Employee deleted",
  "card:created": "Visiting card created",
  "card:updated": "Visiting card updated",
  "card:updated-preview": "Card preview updated",
  "card:activated": "Visiting card activated",
  "card:deactivated": "Visiting card deactivated",
  "card:deleted": "Visiting card deleted",
  "company-admin:created": "Company Admin added",
  "company-admin:updated": "Company Admin updated",
  "company-admin:activated": "Company Admin activated",
  "company-admin:deactivated": "Company Admin deactivated",
  "company-admin:deleted": "Company Admin deleted",
  "branch:created": "Branch added",
  "branch:updated": "Branch updated",
  "branch:deleted": "Branch deleted",
  "account:password-changed": "Account password changed",
  "qr-code:generated": "QR code generated",
};

const activityDescriptions: Record<string, string> = {
  "company:created": "Company workspace created.",
  "company:updated": "Company profile, branding, or settings changed.",
  "company:activated": "Company workspace activated.",
  "company:deactivated": "Company workspace deactivated.",
  "company:deleted": "Company workspace deleted.",
  "employee:created": "Employee account created.",
  "employee:updated": "Employee information changed.",
  "employee:deleted": "Employee and its last card removed.",
  "card:created": "A new digital visiting card is ready.",
  "card:updated": "Visiting card details or logo changed.",
  "card:updated-preview": "Visiting card preview settings changed.",
  "card:activated": "The visiting card is available to visitors.",
  "card:deactivated": "The visiting card is no longer available to visitors.",
  "card:deleted": "Visiting card removed.",
  "company-admin:created": "Company Admin account created.",
  "company-admin:updated": "Company Admin details or password changed.",
  "company-admin:activated": "Company Admin account activated.",
  "company-admin:deactivated": "Company Admin account deactivated.",
  "company-admin:deleted": "Company Admin account deleted.",
  "branch:created": "Branch created.",
  "branch:updated": "Branch information changed.",
  "branch:deleted": "Branch removed.",
  "account:password-changed": "Account password changed.",
  "qr-code:generated": "Generated with the visiting card.",
};

function getRecentActivities(activities: ActivityLogOverview[]): RecentActivity[] {
  return activities
    .flatMap((activity): RecentActivity[] => {
      const eventKey = `${activity.entityType}:${activity.action}`;
      const base = {
        companyName: activity.companyName || "Company workspace",
        actorEmail: activity.actorEmail,
        createdAt: activity.createdAt,
      };
      const entityName = activityEntityNames[activity.entityType] ?? activity.entityType.replace(/-/g, " ");
      const actionName = activityActionNames[activity.action] ?? activity.action.replace(/-/g, " ");
      const title = activityTitles[eventKey] ?? `${entityName} ${actionName}`;
      const description = activityDescriptions[eventKey] ?? "Application change recorded.";
      const recent: RecentActivity[] = [{
        ...base,
        id: activity.id,
        title,
        description,
        entityType: activity.entityType,
      }];
      if (activity.entityType === "card" && activity.action === "created") {
        recent.push({
          ...base,
          id: `${activity.id}-qr`,
          title: "QR code generated",
          description: "Generated with the visiting card.",
          entityType: "qr-code",
        });
      }
      return recent;
    })
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function formatActivityDate(value: string, locale: AppLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function BarRow({
  label,
  value,
  maxValue,
  tone,
}: {
  label: string;
  value: number;
  maxValue: number;
  tone: "blue" | "violet";
}) {
  const width = maxValue === 0 ? 0 : (value / maxValue) * 100;
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)_2rem] items-center gap-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={maxValue}
        aria-valuenow={value}
        className="h-2.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full ${tone === "blue" ? "bg-blue-600" : "bg-violet-500"}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-right font-semibold tabular-nums text-slate-700">{value}</span>
    </div>
  );
}

export default function SuperAdminDashboard({
  locale,
  companies,
  analytics,
  activities,
}: SuperAdminDashboardProps) {
  const numberFormat = new Intl.NumberFormat(locale);
  const recentActivities = getRecentActivities(activities);
  const statisticsByCompany = new Map(analytics.byCompany.map((company) => [company.companyId, company]));
  const maxChartValue = Math.max(
    0,
    ...analytics.byCompany.flatMap((company) => [company.cards, company.activeCards]),
  );
  const metrics: Metric[] = [
    { label: "Total Companies", value: analytics.companies, detail: `${numberFormat.format(analytics.activeCompanies)} active`, icon: Building2, tone: "blue" },
    { label: "Total Employees", value: analytics.employees, detail: "Across all companies", icon: Users, tone: "green" },
    { label: "Total Visiting Cards", value: analytics.cards, detail: "Across all companies", icon: CreditCard, tone: "violet" },
    { label: "Total QR Codes", value: analytics.cards, detail: `${numberFormat.format(analytics.activeQrCodes)} currently active`, icon: QrCode, tone: "amber" },
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-[1440px] space-y-8">
          <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Platform management</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Super Admin Dashboard</h1>
              <p className="mt-2 text-sm text-slate-500">A live overview of companies, people, visiting cards, and activity.</p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <CompanyNotifications locale={locale} showCompany />
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                  <ShieldCheck size={15} />Super Admin
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Quick actions</span>
                <Link href="/companies?createCompany=true" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">
                  <Plus size={16} />Add Company
                </Link>
                <Link href="/companies" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <UserPlus size={16} />Add Company Admin
                </Link>
              </div>
            </div>
          </header>

          <section aria-label="Overview statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{numberFormat.format(value)}</p>
                  </div>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    tone === "green" ? "bg-emerald-50 text-emerald-700"
                      : tone === "violet" ? "bg-violet-50 text-violet-700"
                        : tone === "amber" ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                  }`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">{detail}</p>
              </article>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,0.9fr)]">
            <section aria-labelledby="company-overview-title" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-3">
              <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 id="company-overview-title" className="font-bold text-slate-950">Company Overview</h2>
                  <p className="mt-1 text-xs text-slate-500">Company workspaces and their current activity.</p>
                </div>
                <Link href="/companies" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800">
                  All companies <ArrowRight size={15} />
                </Link>
              </header>
              {companies.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">No companies have been added yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[690px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th scope="col" className="px-5 py-3">Company</th>
                        <th scope="col" className="px-4 py-3">Employees</th>
                        <th scope="col" className="px-4 py-3">Visiting cards</th>
                        <th scope="col" className="px-4 py-3">Status</th>
                        <th scope="col" className="px-5 py-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {companies.map((company) => {
                        const statistics = statisticsByCompany.get(company.id);
                        return (
                          <tr key={company.id} className="hover:bg-slate-50/70">
                            <td className="px-5 py-4">
                              <div className="flex min-w-0 items-center gap-3">
                                {company.logoData ? (
                                  <Image
                                    src={company.logoData}
                                    alt={`${company.name} logo`}
                                    width={40}
                                    height={40}
                                    unoptimized
                                    className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1"
                                  />
                                ) : (
                                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                                    {company.name.slice(0, 1).toUpperCase()}
                                  </span>
                                )}
                                <span className="max-w-[220px] truncate font-semibold text-slate-900">{company.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 tabular-nums text-slate-600">{numberFormat.format(statistics?.employees ?? 0)}</td>
                            <td className="px-4 py-4 tabular-nums text-slate-600">{numberFormat.format(statistics?.cards ?? 0)}</td>
                            <td className="px-4 py-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                company.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                              }`}>
                                {company.status === "active" ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/companies?companyId=${encodeURIComponent(company.id)}`}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                              >
                                View details <ArrowRight size={14} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section aria-labelledby="recent-activities-title" className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-1">
              <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <Activity size={17} className="text-blue-700" />
                  <div>
                    <h2 id="recent-activities-title" className="font-bold text-slate-950">Recent Activities</h2>
                    <p className="mt-1 text-xs text-slate-500">All recorded application changes.</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{recentActivities.length}</span>
              </header>
              {recentActivities.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">No recent activities to show.</p>
              ) : (
                <ol className="max-h-[440px] divide-y divide-slate-100 overflow-y-auto">
                  {recentActivities.map((activity) => (
                    <li key={activity.id} className="flex gap-3 px-5 py-4 sm:px-6">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        {activity.entityType === "company" || activity.entityType === "branch" ? <Building2 size={16} />
                          : activity.entityType === "employee" || activity.entityType === "company-admin" || activity.entityType === "account" ? <Users size={16} />
                            : activity.entityType === "qr-code" ? <QrCode size={16} />
                              : <CreditCard size={16} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{activity.description} · {activity.companyName}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">{activity.actorEmail} · {formatActivityDate(activity.createdAt, locale)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section aria-labelledby="company-analytics-title" className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 id="company-analytics-title" className="font-bold text-slate-950">Company Analytics</h2>
                    <p className="mt-1 text-xs text-slate-500">Total and active visiting cards across all companies.</p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />Total cards</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" />Active cards</span>
                </div>
              </header>
              {analytics.byCompany.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Company analytics will appear when companies are added.</p>
              ) : (
                <div className="max-h-[520px] space-y-5 overflow-y-auto p-5 sm:p-6">
                  {analytics.byCompany.map((company) => (
                    <div key={company.companyId} className="grid gap-2 border-b border-slate-100 pb-5 last:border-0 last:pb-0 sm:grid-cols-[minmax(130px,0.8fr)_minmax(0,2fr)] sm:items-center sm:gap-6">
                      <p className="truncate text-sm font-semibold text-slate-800" title={company.companyName}>{company.companyName}</p>
                      <div className="space-y-2.5">
                        <BarRow label="Total cards" value={company.cards} maxValue={maxChartValue} tone="blue" />
                        <BarRow label="Active cards" value={company.activeCards} maxValue={maxChartValue} tone="violet" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
