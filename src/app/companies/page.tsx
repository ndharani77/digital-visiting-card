"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CirclePlus, LoaderCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import type { UserRole } from "@/lib/types";

type Company = {
  id: string;
  name: string;
  email: string;
  website: string;
  status: "active" | "inactive";
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  async function loadCompanies() {
    const [sessionResponse, companiesResponse] = await Promise.all([
      fetch("/api/auth/session"),
      fetch("/api/companies"),
    ]);
    const [session, companyResult] = await Promise.all([
      sessionResponse.json(),
      companiesResponse.json(),
    ]);
    if (!sessionResponse.ok) throw new Error(session.message || "Unable to load the current account.");
    if (!companiesResponse.ok) throw new Error(companyResult.message || "Unable to load companies.");
    setRole(session.user.role);
    setActiveCompanyId(session.activeCompanyId);
    setCompanies(companyResult);
  }

  useEffect(() => {
    loadCompanies()
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load companies."))
      .finally(() => setLoading(false));
  }, []);

  async function createCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, website }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create company.");
      setName("");
      setEmail("");
      setWebsite("");
      setMessage(`${result.name} was added. Create a Company Admin account from its management page.`);
      await loadCompanies();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create company.");
    } finally {
      setSaving(false);
    }
  }

  async function selectCompany(companyId: string) {
    setError("");
    try {
      const response = await fetch("/api/auth/active-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to switch companies.");
      window.location.assign("/");
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "Unable to switch companies.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Platform administration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Company management</h1>
            <p className="mt-2 text-sm text-slate-500">Manage company workspaces and assign administrator access.</p>
          </header>

          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

          {role === "SUPER_ADMIN" && (
            <form onSubmit={createCompany} className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Create a company workspace</h2>
              <p className="mt-1 text-sm text-slate-500">Companies are top-level workspaces. Add office locations as branches inside a company.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">
                  Company name
                  <input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Company email
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Website
                  <input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" />
                </label>
              </div>
              <button type="submit" disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                {saving ? <LoaderCircle size={17} className="animate-spin" /> : <CirclePlus size={17} />}
                {saving ? "Creating company..." : "Create company"}
              </button>
            </form>
          )}

          <section aria-labelledby="companies-title">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 id="companies-title" className="text-xl font-bold text-slate-950">Workspaces</h2>
                <p className="mt-1 text-sm text-slate-500">{companies.length} {companies.length === 1 ? "company" : "companies"}</p>
              </div>
            </div>
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Building2 size={28} className="mx-auto text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-800">No companies have been created.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {companies.map((company) => (
                  <article key={company.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 size={18} className="shrink-0 text-blue-700" />
                          <h3 className="truncate font-bold text-slate-950">{company.name}</h3>
                        </div>
                        <p className="mt-2 truncate text-sm text-slate-500">{company.email || company.website || "Company details not added"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${company.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {company.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <Link href={`/companies/${company.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Company access<ArrowRight size={15} />
                      </Link>
                      <Link href={`/companies/${company.id}/branches`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Manage branches<ArrowRight size={15} />
                      </Link>
                      {role === "SUPER_ADMIN" && activeCompanyId !== company.id && (
                        <button type="button" onClick={() => void selectCompany(company.id)} className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                          Switch to company
                        </button>
                      )}
                      {role === "SUPER_ADMIN" && activeCompanyId === company.id && (
                        <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Selected workspace</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
