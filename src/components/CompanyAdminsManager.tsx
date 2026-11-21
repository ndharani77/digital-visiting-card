"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Pencil, Trash2, UserPlus, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";

type Company = { id: string; name: string; status: "active" | "inactive" };
type CompanyAdmin = {
  id: string;
  email: string;
  companyId: string;
  companyName: string;
  status: "active" | "inactive";
  mustChangePassword: boolean;
};

type CompanyAdminsManagerProps = {
  companyFilterId?: string;
  companyIsActive?: boolean;
  embedded?: boolean;
  onChange?: () => void;
};

export default function CompanyAdminsManager({
  companyFilterId,
  companyIsActive,
  embedded = false,
  onChange,
}: CompanyAdminsManagerProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [admins, setAdmins] = useState<CompanyAdmin[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const [companyResponse, adminResponse] = await Promise.all([
      fetch("/api/companies"),
      fetch("/api/company-admins"),
    ]);
    const [companyResult, adminResult] = await Promise.all([
      companyResponse.json(),
      adminResponse.json(),
    ]);
    if (!companyResponse.ok) throw new Error(companyResult.message || "Unable to load companies.");
    if (!adminResponse.ok) throw new Error(adminResult.message || "Unable to load Company Admins.");
    setCompanies(companyResult);
    setAdmins(companyFilterId
      ? adminResult.filter((admin: CompanyAdmin) => admin.companyId === companyFilterId)
      : adminResult);
    setCompanyId((current) =>
      companyFilterId ||
      (companyResult.some((company: Company) => company.id === current && company.status === "active")
        ? current
        : companyResult.find((company: Company) => company.status === "active")?.id || "")
    );
  }, [companyFilterId]);

  function startEditing(admin: CompanyAdmin) {
    setEditingId(admin.id);
    setEditEmail(admin.email);
    setEditCompanyId(admin.companyId);
    setEditPassword("");
    setError("");
    setMessage("");
  }

  function cancelEditing() {
    setEditingId("");
    setEditEmail("");
    setEditCompanyId("");
    setEditPassword("");
  }

  async function saveAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setUpdatingId(editingId);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/company-admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingId,
          email: editEmail,
          companyId: companyFilterId || editCompanyId,
          ...(editPassword ? { password: editPassword } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update Company Admin.");
      onChange?.();
      cancelEditing();
      setMessage("Company Admin details updated.");
      try {
        await loadData();
      } catch {
        setError("The administrator was updated, but the list could not be refreshed.");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update Company Admin.");
    } finally {
      setUpdatingId("");
    }
  }

  async function deleteAdmin(admin: CompanyAdmin) {
    if (!window.confirm(`Permanently delete the Company Admin account for ${admin.email}?`)) return;
    setDeletingId(admin.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/company-admins?userId=${encodeURIComponent(admin.id)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to delete Company Admin.");
      onChange?.();
      setMessage(`${admin.email} was deleted.`);
      try {
        await loadData();
      } catch {
        setError("The administrator was deleted, but the list could not be refreshed.");
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete Company Admin.");
    } finally {
      setDeletingId("");
    }
  }

  useEffect(() => {
    loadData()
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load Company Admins."))
      .finally(() => setLoading(false));
  }, [loadData]);

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/company-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: companyFilterId || companyId, email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create Company Admin.");
      onChange?.();
      setEmail("");
      setPassword("");
      setMessage("Company Admin created. They can sign in with the email and password you provided.");
      try {
        await loadData();
      } catch {
        setError("The account was created, but the administrator list could not be refreshed.");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create Company Admin.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(admin: CompanyAdmin) {
    setUpdatingId(admin.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/company-admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: admin.id, status: admin.status === "active" ? "inactive" : "active" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update Company Admin.");
      onChange?.();
      await loadData();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update Company Admin.");
    } finally {
      setUpdatingId("");
    }
  }

  const assignedCompanyId = companyFilterId || companyId;
  const assignedCompanyIsActive = companyFilterId && companyIsActive !== undefined
    ? companyIsActive
    : companies.some((company) => company.id === assignedCompanyId && company.status === "active");
  const ContentWrapper = embedded ? "div" : "main";

  return (
    <div className={embedded ? "space-y-5" : "flex min-h-screen flex-col md:flex-row"}>
      {!embedded && <Sidebar />}
      <ContentWrapper className={embedded ? "min-w-0" : "min-w-0 flex-1 p-5 md:p-8 xl:p-10"}>
        <div className={embedded ? "space-y-5" : "mx-auto max-w-5xl"}>
          {!embedded && <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Platform management</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Company Admins</h1>
            <p className="mt-2 text-sm text-slate-500">Assign independent administrator accounts to company workspaces.</p>
          </header>}

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

          <form onSubmit={createAdmin} className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${embedded ? "" : "sm:p-6"}`}>
            <h2 className="text-lg font-bold text-slate-950">{embedded ? "Add a Company Admin" : "Create a Company Admin"}</h2>
            <p className="mt-1 text-sm text-slate-500">Set their sign-in email and password. Passwords must be at least 14 characters.</p>
            <div className={`mt-5 grid gap-4 ${embedded ? "lg:grid-cols-2" : "md:grid-cols-3"}`}>
              {!companyFilterId && <label className="text-sm font-medium text-slate-700">
                Company
                <select required value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3" disabled={!companies.some((company) => company.status === "active")}>
                  <option value="">Select a company</option>
                  {companies.filter((company) => company.status === "active").map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </label>}
              <label className="text-sm font-medium text-slate-700">
                Login email
                <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Sign-in password
                <input type="password" autoComplete="new-password" minLength={14} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3" />
              </label>
            </div>
            {companyFilterId && !assignedCompanyIsActive && <p className="mt-4 text-sm text-amber-700">New administrators cannot be added while this company is inactive.</p>}
            <button type="submit" disabled={saving || !assignedCompanyIsActive} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
              {saving ? <LoaderCircle size={17} className="animate-spin" /> : <UserPlus size={17} />}
              {saving ? "Creating account..." : "Create Company Admin"}
            </button>
          </form>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">{companyFilterId ? "Administrators for this company" : "Administrator accounts"}</h2>
            </div>
            {loading ? (
              <p className="p-6 text-sm text-slate-500">Loading Company Admins...</p>
            ) : admins.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">{companyFilterId ? "No Company Admin accounts are assigned to this company." : "No Company Admin accounts have been created."}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {admins.map((admin) => (
                  <li key={admin.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{admin.email}</p>
                      {(admin.mustChangePassword || !companyFilterId) && <p className="mt-1 text-xs text-slate-500">{!companyFilterId ? admin.companyName : ""}{admin.mustChangePassword ? `${!companyFilterId ? " · " : ""}Password change required` : ""}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${admin.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{admin.status}</span>
                      <button type="button" disabled={Boolean(updatingId || deletingId)} onClick={() => startEditing(admin)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                        <Pencil size={14} />Edit
                      </button>
                      <button type="button" disabled={Boolean(updatingId || deletingId)} onClick={() => void updateStatus(admin)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                        {updatingId === admin.id ? "Updating..." : admin.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      <button type="button" disabled={Boolean(updatingId || deletingId)} onClick={() => void deleteAdmin(admin)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
                        {deletingId === admin.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {deletingId === admin.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                    {editingId === admin.id && (
                      <form onSubmit={saveAdmin} className={`mt-4 grid w-full gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 ${companyFilterId ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                        <label className="text-xs font-semibold text-slate-600">
                          Login email
                          <input type="email" autoComplete="email" required value={editEmail} onChange={(event) => setEditEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900" />
                        </label>
                        {!companyFilterId && <label className="text-xs font-semibold text-slate-600">
                          Company
                          <select required value={editCompanyId} onChange={(event) => setEditCompanyId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900">
                            {companies.filter((company) => company.status === "active" || company.id === admin.companyId).map((company) => <option key={company.id} value={company.id}>{company.name}{company.status === "inactive" ? " (inactive)" : ""}</option>)}
                          </select>
                        </label>}
                        <label className="text-xs font-semibold text-slate-600">
                          New password (optional)
                          <input type="password" autoComplete="new-password" minLength={14} maxLength={72} value={editPassword} onChange={(event) => setEditPassword(event.target.value)} placeholder="At least 14 characters" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900" />
                        </label>
                        <div className={`flex gap-2 ${companyFilterId ? "md:col-span-2" : "md:col-span-3"}`}>
                          <button type="submit" disabled={updatingId === admin.id || (!companyFilterId && !editCompanyId)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                            {updatingId === admin.id ? <LoaderCircle size={14} className="animate-spin" /> : null}
                            Save changes
                          </button>
                          <button type="button" onClick={cancelEditing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white">
                            <X size={14} />Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </ContentWrapper>
    </div>
  );
}
