"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import type { UserRole } from "@/lib/types";

type Company = {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  status: "active" | "inactive";
};

const emptyCompany: Company = {
  id: "",
  name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  state: "",
  country: "",
  description: "",
  status: "active",
};

export default function CompanyProfilePage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;
  const [company, setCompany] = useState<Company>(emptyCompany);
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCompany = useCallback(async () => {
    const [companyResponse, sessionResponse] = await Promise.all([
      fetch(`/api/companies/${encodeURIComponent(companyId)}`),
      fetch("/api/auth/session"),
    ]);
    const [companyResult, session] = await Promise.all([
      companyResponse.json(),
      sessionResponse.json(),
    ]);
    if (!companyResponse.ok) throw new Error(companyResult.message || "Unable to load company details.");
    if (!sessionResponse.ok) throw new Error(session.message || "Unable to load account details.");
    setCompany({ ...emptyCompany, ...companyResult });
    setRole(session.user.role);
    setActiveCompanyId(session.activeCompanyId);
  }, [companyId]);

  useEffect(() => {
    loadCompany()
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load company details."))
      .finally(() => setLoading(false));
  }, [loadCompany]);

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const { status, ...details } = company;
    try {
      const response = await fetch(`/api/companies/${encodeURIComponent(companyId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role === "SUPER_ADMIN" ? { ...details, status } : details),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to save company details.");
      setCompany((current) => ({ ...current, ...result }));
      setMessage("Company details saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save company details.");
    } finally {
      setSaving(false);
    }
  }

  function update(field: keyof Company, value: string) {
    setCompany((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/companies" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-700">
            <ArrowLeft size={16} />Back to companies
          </Link>
          <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Company profile</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{company.name || "Company details"}</h1>
            <p className="mt-2 text-sm text-slate-500">Company information and contact details.</p>
          </header>

          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading company details...</div>
          ) : (
            <form onSubmit={saveCompany} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Company name
                  <input required maxLength={160} value={company.name} onChange={(event) => update("name", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Company email
                  <input type="email" value={company.email} onChange={(event) => update("email", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Contact number
                  <input type="tel" value={company.phone} onChange={(event) => update("phone", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Website
                  <input type="url" value={company.website} onChange={(event) => update("website", event.target.value)} placeholder="https://" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Address
                  <input value={company.address} onChange={(event) => update("address", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  City
                  <input value={company.city} onChange={(event) => update("city", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  State / province
                  <input value={company.state} onChange={(event) => update("state", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Country
                  <input value={company.country} onChange={(event) => update("country", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                </label>
                {role === "SUPER_ADMIN" && (
                  <label className="text-sm font-medium text-slate-700">
                    Status
                    <select value={company.status} onChange={(event) => update("status", event.target.value as Company["status"])} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                )}
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Company description
                  <textarea rows={4} value={company.description} onChange={(event) => update("description", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                </label>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                  {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
                  {saving ? "Saving..." : "Save company details"}
                </button>
                {(role !== "SUPER_ADMIN" || activeCompanyId === companyId) && (
                  <Link href="/company" className="text-sm font-semibold text-blue-700 hover:text-blue-900">Manage logo and card branding</Link>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
