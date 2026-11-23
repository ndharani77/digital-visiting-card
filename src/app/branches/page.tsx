"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Building2, CirclePlus, LoaderCircle, Pencil, Search, Trash2, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";

type Branch = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  website: string;
  logoData: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  status: "active" | "inactive";
};

type BranchAdmin = { email: string; status: "active" | "inactive" };

const emptyBranch: Omit<Branch, "id" | "companyId"> = {
  name: "",
  code: "",
  email: "",
  phone: "",
  website: "",
  logoData: "",
  address: "",
  city: "",
  state: "",
  country: "",
  description: "",
  status: "active",
};

export default function BranchesPage() {
  const [companyId, setCompanyId] = useState("");
  const [parentCompanyName, setParentCompanyName] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [query, setQuery] = useState("");
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({});
  const [branchAdmins, setBranchAdmins] = useState<Record<string, BranchAdmin | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyBranch);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminStatus, setAdminStatus] = useState<"active" | "inactive">("active");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [canManageBranches, setCanManageBranches] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredBranches = branches.filter((branch) =>
    [
      branch.name,
      branch.code,
      branch.email,
      branch.phone,
      branch.website,
      branch.address,
      branch.city,
      branch.state,
      branch.country,
    ].some((value) => value.toLowerCase().includes(normalizedQuery))
  );

  async function loadBranches(selectedCompanyId: string) {
    const response = await fetch(`/api/branches?companyId=${encodeURIComponent(selectedCompanyId)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Unable to load branches.");
    setBranches(result);
    const accounts = await Promise.all((result as Branch[]).map(async (branch) => {
      const adminResponse = await fetch(`/api/branches/${encodeURIComponent(branch.id)}/admin?companyId=${encodeURIComponent(selectedCompanyId)}`);
      const adminResult = await adminResponse.json();
      if (!adminResponse.ok) throw new Error(adminResult.message || `Unable to load Branch Admin for ${branch.name}.`);
      return [branch.id, adminResult.account as BranchAdmin | null] as const;
    }));
    setBranchAdmins(Object.fromEntries(accounts));
  }

  useEffect(() => {
    async function load() {
      try {
        const sessionResponse = await fetch("/api/auth/session");
        const session = await sessionResponse.json();
        if (!sessionResponse.ok) throw new Error(session.message || "Unable to load the current account.");
        if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
          throw new Error("Only Company Admins can manage branches.");
        }
        if (session.user.branchId) {
          throw new Error("Branch Admins manage their branch workspace, not sibling branches.");
        }
        setCanManageBranches(true);
        const selectedCompanyId = session.user.companyId || session.activeCompanyId;
        if (!selectedCompanyId) throw new Error("Select a company workspace first.");
        setCompanyId(selectedCompanyId);
        await loadBranches(selectedCompanyId);
        const [companyResponse, cardsResponse] = await Promise.all([
          fetch(`/api/companies/${encodeURIComponent(selectedCompanyId)}`),
          fetch("/api/cards"),
        ]);
        if (companyResponse.ok) {
          const company = await companyResponse.json();
          setParentCompanyName(company.name);
        }
        if (cardsResponse.ok) {
          const cards = await cardsResponse.json() as Array<{ branchId?: string }>;
          const counts: Record<string, number> = {};
          for (const card of cards) {
            if (card.branchId) counts[card.branchId] = (counts[card.branchId] ?? 0) + 1;
          }
          setCardCounts(counts);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load branches.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function showCreate() {
    setEditing(null);
    setForm(emptyBranch);
    setAdminEmail("");
    setAdminPassword("");
    setAdminStatus("active");
    setError("");
    setNotice("");
    setOpen(true);
  }

  function showEdit(branch: Branch) {
    setEditing(branch);
    setForm({
      name: branch.name,
      code: branch.code,
      email: branch.email,
      phone: branch.phone,
      website: branch.website,
      logoData: branch.logoData,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      country: branch.country,
      description: branch.description,
      status: branch.status,
    });
    const account = branchAdmins[branch.id];
    setAdminEmail(account?.email ?? "");
    setAdminPassword("");
    setAdminStatus(account?.status ?? "active");
    setError("");
    setNotice("");
    setOpen(true);
  }

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(editing ? `/api/branches/${encodeURIComponent(editing.id)}` : "/api/branches", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, companyId, adminEmail, adminPassword, adminStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to save branch.");
      await loadBranches(companyId);
      setNotice(editing
        ? `Branch profile updated for ${form.name}.`
        : `Branch created. Branch Admin sign-in email: ${adminEmail}.`);
      setOpen(false);
      setEditing(null);
      setAdminEmail("");
      setAdminPassword("");
      setAdminStatus("active");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save branch.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(branch: Branch) {
    if (!window.confirm(`Delete ${branch.name}?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/branches/${encodeURIComponent(branch.id)}?companyId=${encodeURIComponent(companyId)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to delete branch.");
      await loadBranches(companyId);
      const cardsResponse = await fetch("/api/cards");
      if (cardsResponse.ok) {
        const cards = await cardsResponse.json() as Array<{ branchId?: string }>;
        const counts: Record<string, number> = {};
        for (const card of cards) {
          if (card.branchId) counts[card.branchId] = (counts[card.branchId] ?? 0) + 1;
        }
        setCardCounts(counts);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete branch.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Company branches</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Branches</h1>
              {parentCompanyName && <p className="mt-2 text-sm text-slate-500">Part of parent company: <span className="font-semibold text-slate-700">{parentCompanyName}</span></p>}
            </div>
            {canManageBranches && (
              <button type="button" onClick={showCreate} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">
                <CirclePlus size={17} />Add branch
              </button>
            )}
          </header>
          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          {!loading && branches.length > 0 && (
            <label className="relative mb-6 block">
              <span className="sr-only">Search branches</span>
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search branches by name, code, contact, or location"
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 shadow-sm outline-none"
              />
              {query && <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear branch search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} aria-hidden="true" />
              </button>}
            </label>
          )}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading branches...</div>
          ) : branches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Building2 size={28} className="mx-auto text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-800">No branches have been created.</p>
            </div>
          ) : filteredBranches.length === 0 ? (
            <div role="status" className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No branches match your search.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
            {filteredBranches.map((branch) => (
                <article key={branch.id} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                  <Link
                    href={`/my-cards?companyId=${encodeURIComponent(companyId)}&branchId=${encodeURIComponent(branch.id)}`}
                    aria-label={`View ${branch.name} visiting cards`}
                    className="absolute inset-0 z-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  />
                  <div className="pointer-events-none relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-slate-950">{branch.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{branch.email || branch.phone || branch.address || "Branch details not added"}</p>
                      <p className="mt-2 text-xs font-semibold text-blue-700">{cardCounts[branch.id] ?? 0} visiting cards</p>
                      {branchAdmins[branch.id] && (
                        <p className="mt-2 truncate text-xs text-slate-500" title={branchAdmins[branch.id]?.email}>
                          Branch Admin: {branchAdmins[branch.id]?.email}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${branch.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{branch.status}</span>
                  </div>
                  <div className="relative z-10 mt-5 flex gap-2 border-t border-slate-100 pt-4">
                    <button type="button" onClick={() => showEdit(branch)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={15} />Profile</button>
                    <button type="button" onClick={() => void remove(branch)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><Trash2 size={15} />Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/40" />
          <aside role="dialog" aria-modal="true" className="relative z-10 h-full w-full overflow-y-auto bg-white shadow-2xl md:w-1/2">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{editing ? "Branch profile" : "New branch"}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">{editing?.name || "Branch profile"}</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </header>
            <form onSubmit={save} className="space-y-5 p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Branch / company name<input required value={form.name} onChange={(event) => update("name", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
                <label className="text-sm font-medium text-slate-700">Branch code<input value={form.code} onChange={(event) => update("code", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
                <label className="text-sm font-medium text-slate-700">Email<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
                <label className="text-sm font-medium text-slate-700">Contact number<input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Website<input type="url" value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="https://" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Branch logo<input value={form.logoData} onChange={(event) => update("logoData", event.target.value)} placeholder="Paste an image URL or data URL" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Address<input value={form.address} onChange={(event) => update("address", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
                <label className="text-sm font-medium text-slate-700">City<input value={form.city} onChange={(event) => update("city", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
                <label className="text-sm font-medium text-slate-700">State / province<input value={form.state} onChange={(event) => update("state", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
                <label className="text-sm font-medium text-slate-700">Country<input value={form.country} onChange={(event) => update("country", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
                <label className="text-sm font-medium text-slate-700">Status<select value={form.status} onChange={(event) => update("status", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Branch description<textarea rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" /></label>
              </div>
              <section aria-labelledby="branch-admin-title" className="border-t border-slate-200 pt-5">
                <h3 id="branch-admin-title" className="font-semibold text-slate-950">Branch Admin access</h3>
                <p className="mt-1 text-sm text-slate-500">{editing
                  ? "Manage the sign-in account for this branch. Leave the password blank to keep the current one."
                  : "Create the sign-in account for this branch and set its password."}</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Branch Admin email
                    <input type="email" autoComplete="username" required value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">{editing ? "Reset password" : "Set password"}
                    <input type="password" autoComplete="new-password" required={!editing || !branchAdmins[editing.id]} minLength={adminPassword ? 14 : undefined} maxLength={72} value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder={editing ? "Leave blank to keep current password" : "At least 14 characters"} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
                    <span className="mt-1 block text-xs font-normal text-slate-500">When setting a password, use at least 14 characters.</span>
                  </label>
                  <label className="text-sm font-medium text-slate-700">Admin account status
                    <select value={adminStatus} onChange={(event) => setAdminStatus(event.target.value as "active" | "inactive")} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>
              </section>
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <footer className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle size={17} className="animate-spin" />}{saving ? "Saving..." : "Save profile"}</button>
              </footer>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
