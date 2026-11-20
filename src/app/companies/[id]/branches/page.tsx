"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Plus, Power } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import CompanyManagementTabs from "@/components/CompanyManagementTabs";

type Branch = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: "active" | "inactive";
};

type BranchForm = Pick<Branch, "name" | "code" | "address" | "city" | "state" | "country">;

const emptyForm: BranchForm = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  country: "",
};

export default function CompanyBranchesPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;
  const [company, setCompany] = useState<{ id: string; name: string } | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingBranchId, setUpdatingBranchId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const [companyResponse, branchesResponse] = await Promise.all([
      fetch(`/api/companies/${encodeURIComponent(companyId)}`),
      fetch(`/api/companies/${encodeURIComponent(companyId)}/branches`),
    ]);
    const [companyResult, branchResult] = await Promise.all([
      companyResponse.json(),
      branchesResponse.json(),
    ]);
    if (!companyResponse.ok) throw new Error(companyResult.message || "Unable to load company details.");
    if (!branchesResponse.ok) throw new Error(branchResult.message || "Unable to load branches.");
    setCompany(companyResult);
    setBranches(branchResult as Branch[]);
  }, [companyId]);

  useEffect(() => {
    loadData()
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load branches."))
      .finally(() => setLoading(false));
  }, [loadData]);

  async function createBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/companies/${encodeURIComponent(companyId)}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create branch.");
      setForm(emptyForm);
      setMessage(`${result.name} was added to ${company?.name ?? "this company"}.`);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create branch.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBranchStatus(branch: Branch) {
    setUpdatingBranchId(branch.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/companies/${encodeURIComponent(companyId)}/branches/${encodeURIComponent(branch.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: branch.status === "active" ? "inactive" : "active" }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update branch status.");
      setMessage(`${result.name} is now ${result.status}.`);
      await loadData();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update branch status.");
    } finally {
      setUpdatingBranchId("");
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link href={`/companies/${encodeURIComponent(companyId)}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-700">
              <ArrowLeft size={16} />Back to company management
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Building2 size={14} />Company branches
            </span>
          </div>

          <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Company structure</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Branches</h1>
            <p className="mt-2 text-sm text-slate-500">
              {company ? `Organize ${company.name} cards by office or location.` : "Organize company cards by office or location."}
            </p>
          </header>
          <CompanyManagementTabs companyId={companyId} active="branches" />

          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

          <form onSubmit={createBranch} className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Plus size={19} /></span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Add a branch</h2>
                <p className="mt-1 text-sm text-slate-500">A branch belongs to this company. It is not a separate company, and assignment to a branch is optional.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Branch name
                <input required maxLength={160} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Bengaluru Office" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Branch code <span className="font-normal text-slate-400">Optional</span>
                <input maxLength={100} value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="e.g. BLR-01" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                City <span className="font-normal text-slate-400">Optional</span>
                <input maxLength={120} value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                Address <span className="font-normal text-slate-400">Optional</span>
                <input maxLength={1000} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Street address" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                State / province <span className="font-normal text-slate-400">Optional</span>
                <input maxLength={120} value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Country <span className="font-normal text-slate-400">Optional</span>
                <input maxLength={120} value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" />
              </label>
            </div>
            <button type="submit" disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Plus size={17} />{saving ? "Creating branch..." : "Create branch"}
            </button>
          </form>

          <section aria-labelledby="branch-list-title" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 id="branch-list-title" className="text-lg font-bold text-slate-950">Company branches</h2>
              <p className="mt-1 text-sm text-slate-500">{branches.length} {branches.length === 1 ? "branch" : "branches"}</p>
            </div>
            {loading ? (
              <p className="p-6 text-sm text-slate-500">Loading branches...</p>
            ) : branches.length === 0 ? (
              <div className="p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><Building2 size={22} /></span>
                <h3 className="mt-4 font-semibold text-slate-900">No branches yet</h3>
                <p className="mt-1 text-sm text-slate-500">Branches are optional. Cards can stay at company level until you add locations.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {branches.map((branch) => (
                  <li key={branch.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Building2 size={18} /></span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{branch.name}</h3>
                          {branch.code && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{branch.code}</span>}
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${branch.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{branch.status}</span>
                        </div>
                        {(branch.address || branch.city || branch.state || branch.country) && (
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <MapPin size={14} />{[branch.address, branch.city, branch.state, branch.country].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={updatingBranchId === branch.id}
                      onClick={() => void toggleBranchStatus(branch)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Power size={15} />{updatingBranchId === branch.id ? "Updating..." : branch.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
