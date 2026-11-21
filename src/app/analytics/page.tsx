import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getPlatformStatistics } from "@/lib/platform-store";
import { getActiveCompanyId, requirePageUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const summaryLabels = [
  { key: "companies", label: "Companies" },
  { key: "cards", label: "Visiting cards" },
  { key: "activeQrCodes", label: "Active QR codes" },
] as const;

export default async function AnalyticsPage() {
  const user = await requirePageUser("/analytics");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  const [analytics, activeCompanyId] = await Promise.all([
    getPlatformStatistics(user),
    getActiveCompanyId(user),
  ]);
  const platformWide = user.role === "SUPER_ADMIN" && !activeCompanyId;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{platformWide ? "Platform analytics" : "Company analytics"}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Analytics</h1>
            <p className="mt-2 text-sm text-slate-500">{platformWide ? "Statistics across your company workspaces." : "Statistics scoped to your company."}</p>
          </header>

          <section aria-label="Summary analytics" className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summaryLabels.map(({ key, label }) => (
              <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{analytics[key]}</p>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-950">{platformWide ? "Company statistics" : "Workspace statistics"}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {platformWide && <th className="px-5 py-3 font-semibold">Company</th>}
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Cards</th>
                    <th className="px-5 py-3 font-semibold">Active cards</th>
                    <th className="px-5 py-3 font-semibold">Active QR codes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.byCompany.map((company) => (
                    <tr key={company.companyId}>
                      {platformWide && <td className="px-5 py-4 font-semibold text-slate-900">{company.companyName}</td>}
                      <td className="px-5 py-4 capitalize text-slate-700">{company.companyStatus}</td>
                      <td className="px-5 py-4 text-slate-700">{company.cards}</td>
                      <td className="px-5 py-4 text-slate-700">{company.activeCards}</td>
                      <td className="px-5 py-4 text-slate-700">{company.activeQrCodes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
