"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Building2, CirclePlus, LoaderCircle, Save, Search, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import CompanyAdminsManager from "@/components/CompanyAdminsManager";
import type { UserRole } from "@/lib/types";

type Company = {
  id: string;
  name: string;
  email: string;
  website: string;
  status: "active" | "inactive";
  branchEnabled: boolean;
};

type CompanyProfile = Company & {
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
};

type CompanyAdmin = {
  email: string;
  companyId: string;
  status: "active" | "inactive";
};

function clearDashboardQueryParameter(parameter: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete(parameter);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyAdmins, setCompanyAdmins] = useState<CompanyAdmin[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [profileCompany, setProfileCompany] = useState<CompanyProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [updatingCompanyId, setUpdatingCompanyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [branchEnabled, setBranchEnabled] = useState(false);

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
    let adminList: CompanyAdmin[] = [];
    if (session.user.role === "SUPER_ADMIN") {
      const adminsResponse = await fetch("/api/company-admins");
      const adminResult = await adminsResponse.json();
      if (!adminsResponse.ok) throw new Error(adminResult.message || "Unable to load Company Admins.");
      adminList = adminResult;
    }
    setRole(session.user.role);
    setActiveCompanyId(session.activeCompanyId);
    setCompanyAdmins(adminList);
    setCompanies(
      session.user.role === "SUPER_ADMIN" && session.activeCompanyId
        ? companyResult.filter((company: Company) => company.id === session.activeCompanyId)
        : companyResult
    );
  }

  useEffect(() => {
    loadCompanies()
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load companies."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!createFormOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        setCreateFormOpen(false);
        clearDashboardQueryParameter("createCompany");
        setCreateError("");
        setName("");
        setEmail("");
        setWebsite("");
        setAdminEmail("");
        setAdminPassword("");
        setPhone("");
        setAddress("");
        setCity("");
        setState("");
        setCountry("");
        setDescription("");
        setStatus("active");
        setBranchEnabled(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [createFormOpen, saving]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !profileSaving) {
        setSelectedCompanyId("");
        clearDashboardQueryParameter("companyId");
        setProfileCompany(null);
        setProfileError("");
        setProfileMessage("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCompanyId, profileSaving]);

  function closeCreateForm() {
    if (saving) return;
    setCreateFormOpen(false);
    clearDashboardQueryParameter("createCompany");
    setCreateError("");
    setName("");
    setEmail("");
    setWebsite("");
    setAdminEmail("");
    setAdminPassword("");
    setPhone("");
    setAddress("");
    setCity("");
    setState("");
    setCountry("");
    setDescription("");
    setStatus("active");
    setBranchEnabled(false);
  }

  function closeCompanyProfile() {
    if (profileSaving) return;
    setSelectedCompanyId("");
    clearDashboardQueryParameter("companyId");
    setProfileCompany(null);
    setProfileError("");
    setProfileMessage("");
  }

  const openCompanyProfile = useCallback(async (companyId: string) => {
    setSelectedCompanyId(companyId);
    setProfileCompany(null);
    setProfileLoading(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const response = await fetch(`/api/companies/${encodeURIComponent(companyId)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to load company details.");
      setProfileCompany({
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        website: result.website,
        address: result.address,
        city: result.city,
        state: result.state,
        country: result.country,
        description: result.description,
        status: result.status,
        branchEnabled: result.branchEnabled === true,
      });
    } catch (loadError) {
      setProfileError(loadError instanceof Error ? loadError.message : "Unable to load company details.");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    if (parameters.get("createCompany") === "true") setCreateFormOpen(true);
    const companyId = parameters.get("companyId");
    if (companyId) void openCompanyProfile(companyId);
  }, [openCompanyProfile]);

  function updateProfile(field: keyof CompanyProfile, value: string) {
    setProfileCompany((current) => current ? ({
      ...current,
      [field]: field === "branchEnabled" ? value === "true" : value,
    }) : current);
  }

  async function saveCompanyProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileCompany) return;
    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");
    const { id, status, ...details } = profileCompany;
    try {
      const response = await fetch(`/api/companies/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role === "SUPER_ADMIN" ? { ...details, status } : details),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to save company details.");
      const updatedCompany = { ...profileCompany, ...result } as CompanyProfile;
      setProfileCompany(updatedCompany);
      setCompanies((current) => current.map((company) =>
        company.id === updatedCompany.id
          ? { ...company, name: updatedCompany.name, email: updatedCompany.email, website: updatedCompany.website, status: updatedCompany.status }
          : company
      ));
      setProfileMessage("Company details saved.");
    } catch (saveError) {
      setProfileError(saveError instanceof Error ? saveError.message : "Unable to save company details.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function createCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setCreateError("");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          website,
          address,
          city,
          state,
          country,
          description,
          status,
          branchEnabled,
          adminEmail,
          adminPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create company.");
      setName("");
      setEmail("");
      setWebsite("");
      setAdminEmail("");
      setAdminPassword("");
      setPhone("");
      setAddress("");
      setCity("");
      setState("");
      setCountry("");
      setDescription("");
      setStatus("active");
      setBranchEnabled(false);
      setCreateFormOpen(false);
      clearDashboardQueryParameter("createCompany");
      setMessage(`${result.name} and its Company Admin account were created.`);
    } catch (saveError) {
      setCreateError(saveError instanceof Error ? saveError.message : "Unable to create company.");
      return;
    } finally {
      setSaving(false);
    }
    try {
      await loadCompanies();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to refresh companies.");
    }
  }

  async function toggleCompanyStatus(company: Company) {
    setUpdatingCompanyId(company.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/companies/${encodeURIComponent(company.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: company.status === "active" ? "inactive" : "active" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update company status.");
      setMessage(`${company.name} is now ${result.status}.`);
      await loadCompanies();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update company status.");
    } finally {
      setUpdatingCompanyId("");
    }
  }

  const companyAdminEmails = new Map<string, string>();
  for (const admin of companyAdmins) {
    const existing = companyAdminEmails.get(admin.companyId);
    if (!existing || admin.status === "active") {
      companyAdminEmails.set(admin.companyId, admin.email);
    }
  }
  const filteredCompanies = companies.filter((company) =>
    (statusFilter === "all" || company.status === statusFilter) &&
    [company.name, company.email, company.website, companyAdminEmails.get(company.id) ?? ""]
      .some((value) => value.toLowerCase().includes(query.trim().toLowerCase()))
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                {activeCompanyId ? "Company operations" : "Platform administration"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Company management</h1>
              <p className="mt-2 text-sm text-slate-500">
                {activeCompanyId
                  ? "Manage the selected company profile."
                  : "Manage company workspaces and assign administrator access."}
              </p>
            </div>
            {role === "SUPER_ADMIN" && !activeCompanyId && (
              <button
                type="button"
                onClick={() => {
                  setCreateError("");
                  setError("");
                  setMessage("");
                  setCreateFormOpen(true);
                }}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
              >
                <CirclePlus size={17} />
                Create company
              </button>
            )}
          </header>

          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

          <section aria-labelledby="companies-title">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 id="companies-title" className="text-xl font-bold text-slate-950">
                  {activeCompanyId ? "Selected company" : "Workspaces"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeCompanyId ? "Company details and management" : `${companies.length} ${companies.length === 1 ? "company" : "companies"}`}
                </p>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Search size={17} className="text-slate-400" />
                <span className="sr-only">Search companies</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies" className="w-full bg-transparent text-sm outline-none" />
              </label>
              <label className="text-sm text-slate-600">
                <span className="sr-only">Filter company status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Building2 size={28} className="mx-auto text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-800">No companies have been created.</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No companies match this search or status.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredCompanies.map((company) => (
                  <article
                    key={company.id}
                    className="group relative min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md"
                  >
                    <Link
                      href={`/my-cards?companyId=${encodeURIComponent(company.id)}`}
                      aria-label={`View ${company.name} visiting cards`}
                      className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                    />
                    <div className="pointer-events-none relative z-10 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 size={18} className="shrink-0 text-blue-700" />
                          <h3 className="truncate font-bold text-slate-950">{company.name}</h3>
                        </div>
                        <p className="mt-2 truncate text-sm text-slate-500">{company.email || company.website || "Company details not added"}</p>
                        {role === "SUPER_ADMIN" && (
                          <p className="mt-1 truncate text-xs text-slate-500">
                            Admin: {companyAdminEmails.get(company.id) ?? "Not assigned"}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${company.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {company.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="pointer-events-none relative z-10 mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        disabled={profileLoading && selectedCompanyId === company.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void openCompanyProfile(company.id);
                        }}
                        className="pointer-events-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Profile
                      </button>
                      {role === "SUPER_ADMIN" && (
                        <button
                          type="button"
                          disabled={updatingCompanyId === company.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void toggleCompanyStatus(company);
                          }}
                          className="pointer-events-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          {updatingCompanyId === company.id ? "Updating..." : company.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      {createFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close create company form"
            onClick={closeCreateForm}
            className="absolute inset-0 bg-slate-950/40"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-company-title"
            className="relative z-10 flex h-full w-full flex-col overflow-y-auto bg-white shadow-2xl md:w-1/2"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">New workspace</p>
                <h2 id="create-company-title" className="mt-2 text-xl font-bold tracking-tight text-slate-950">Create a company</h2>
                <p className="mt-1 text-sm text-slate-500">Add the company details to set up its workspace.</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={saving}
                onClick={closeCreateForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </header>
            <form onSubmit={createCompany} className="flex flex-1 flex-col">
              <div className="flex-1 space-y-5 px-5 py-6 sm:px-7">
                <p className="text-sm leading-6 text-slate-600">Add company information and set up its Company Admin account.</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Company name
                    <input autoFocus required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Company email
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Contact number
                    <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Website
                    <input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                  </label>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Address
                    <input value={address} onChange={(event) => setAddress(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    City
                    <input value={city} onChange={(event) => setCity(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    State / province
                    <input value={state} onChange={(event) => setState(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Country
                    <input value={country} onChange={(event) => setCountry(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Status
                    <select value={status} onChange={(event) => setStatus(event.target.value as "active" | "inactive")} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <fieldset className="text-sm font-medium text-slate-700 sm:col-span-2">
                    <legend>Does this company have branches?</legend>
                    <div className="mt-2 flex gap-3">
                      <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5">
                        <input type="radio" name="branchEnabled" checked={branchEnabled} onChange={() => setBranchEnabled(true)} />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5">
                        <input type="radio" name="branchEnabled" checked={!branchEnabled} onChange={() => setBranchEnabled(false)} />
                        No
                      </label>
                    </div>
                  </fieldset>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Company description
                    <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                  </label>
                </div>
                <section aria-labelledby="create-company-admin-title" className="border-t border-slate-200 pt-5">
                  <h3 id="create-company-admin-title" className="font-semibold text-slate-950">Company Admin account</h3>
                  <p className="mt-1 text-sm text-slate-500">Set the sign-in credentials for this company’s administrator.</p>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                      Company Admin email
                      <input type="email" autoComplete="username" required value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Company Admin password
                      <input type="password" autoComplete="new-password" required minLength={14} maxLength={72} value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="At least 14 characters" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                      <span className="mt-1 block text-xs font-normal text-slate-500">Use at least 14 characters. The password is stored securely as a hash.</span>
                    </label>
                  </div>
                </section>
                {createError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{createError}</p>}
              </div>
              <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeCreateForm}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {saving ? <LoaderCircle size={17} className="animate-spin" /> : <CirclePlus size={17} />}
                  {saving ? "Creating company..." : "Create company"}
                </button>
              </footer>
            </form>
          </aside>
        </div>
      )}
      {selectedCompanyId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close company profile"
            onClick={closeCompanyProfile}
            className="absolute inset-0 bg-slate-950/40"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-profile-title"
            className="relative z-10 flex h-full w-full flex-col overflow-y-auto bg-white shadow-2xl md:w-1/2"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Company profile</p>
                <h2 id="company-profile-title" className="mt-2 truncate text-xl font-bold tracking-tight text-slate-950">
                  {profileCompany?.name || "Company details"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">View and edit this company in the side panel.</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={profileSaving}
                onClick={closeCompanyProfile}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </header>
            {profileLoading ? (
              <div role="status" className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500">
                <LoaderCircle size={18} className="animate-spin" />Loading company details...
              </div>
            ) : profileCompany ? (
              <div className="flex-1">
                <form onSubmit={saveCompanyProfile} className="flex flex-col">
                  <div className="space-y-5 px-5 py-6 sm:px-7">
                    <div className="grid gap-5 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                      Company name
                      <input required maxLength={160} value={profileCompany.name} onChange={(event) => updateProfile("name", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Company email
                      <input type="email" value={profileCompany.email} onChange={(event) => updateProfile("email", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Contact number
                      <input type="tel" value={profileCompany.phone} onChange={(event) => updateProfile("phone", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Website
                      <input type="url" value={profileCompany.website} onChange={(event) => updateProfile("website", event.target.value)} placeholder="https://" className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                    </label>
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                      Address
                      <input value={profileCompany.address} onChange={(event) => updateProfile("address", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      City
                      <input value={profileCompany.city} onChange={(event) => updateProfile("city", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      State / province
                      <input value={profileCompany.state} onChange={(event) => updateProfile("state", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Country
                      <input value={profileCompany.country} onChange={(event) => updateProfile("country", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                    </label>
                    {role === "SUPER_ADMIN" && (
                      <>
                        <label className="text-sm font-medium text-slate-700">
                          Status
                          <select value={profileCompany.status} onChange={(event) => updateProfile("status", event.target.value as CompanyProfile["status"])} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </label>
                        <fieldset className="text-sm font-medium text-slate-700 sm:col-span-2">
                          <legend>Does this company have branches?</legend>
                          <div className="mt-2 flex gap-3">
                            <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5">
                              <input type="radio" name={`branchEnabled-${profileCompany.id}`} checked={profileCompany.branchEnabled} onChange={() => updateProfile("branchEnabled", "true")} />
                              Yes
                            </label>
                            <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5">
                              <input type="radio" name={`branchEnabled-${profileCompany.id}`} checked={!profileCompany.branchEnabled} onChange={() => updateProfile("branchEnabled", "false")} />
                              No
                            </label>
                          </div>
                        </fieldset>
                      </>
                    )}
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                      Company description
                      <textarea rows={4} value={profileCompany.description} onChange={(event) => updateProfile("description", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
                    </label>
                    </div>
                    {profileError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{profileError}</p>}
                    {profileMessage && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{profileMessage}</p>}
                  </div>
                  <footer className="flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
                    <button type="button" disabled={profileSaving} onClick={closeCompanyProfile} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={profileSaving} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                      {profileSaving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
                      {profileSaving ? "Saving..." : "Save company"}
                    </button>
                  </footer>
                </form>
                {role === "SUPER_ADMIN" && (
                  <div className="border-t border-slate-200 px-5 py-6 sm:px-7">
                    <CompanyAdminsManager
                      key={profileCompany.id}
                      companyFilterId={profileCompany.id}
                      companyIsActive={profileCompany.status === "active"}
                      embedded
                      onChange={() => {
                        void loadCompanies().catch((loadError: unknown) =>
                          setError(loadError instanceof Error ? loadError.message : "Unable to refresh company data.")
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <p role="alert" className="text-sm text-red-700">{profileError || "Unable to load company details."}</p>
                <button type="button" onClick={closeCompanyProfile} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
