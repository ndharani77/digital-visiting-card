"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, KeyRound, LoaderCircle, UserPlus } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import CompanyManagementTabs from "@/components/CompanyManagementTabs";
import type { UserRole } from "@/lib/types";

type Company = { id: string; name: string };
type Employee = { id: string; fullName: string; email: string; status: string };
type UserAccount = {
  id: string;
  email: string;
  role: UserRole;
  employee_id: string | null;
  status: string;
  must_change_password: boolean;
};

export default function CompanyAccessPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [accountRole, setAccountRole] = useState<"COMPANY_ADMIN" | "EMPLOYEE">("EMPLOYEE");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const [sessionResponse, companyResponse, usersResponse, employeesResponse] = await Promise.all([
      fetch("/api/auth/session"),
      fetch(`/api/companies/${encodeURIComponent(companyId)}`),
      fetch(`/api/companies/${encodeURIComponent(companyId)}/users`),
      fetch(`/api/companies/${encodeURIComponent(companyId)}/employees`),
    ]);
    const [session, companyResult, userResult, employeeResult] = await Promise.all([
      sessionResponse.json(),
      companyResponse.json(),
      usersResponse.json(),
      employeesResponse.json(),
    ]);
    const failure = [sessionResponse, companyResponse, usersResponse, employeesResponse].find((response) => !response.ok);
    if (failure) {
      const result = [session, companyResult, userResult, employeeResult][[sessionResponse, companyResponse, usersResponse, employeesResponse].indexOf(failure)];
      throw new Error(result?.message || "Unable to load company access details.");
    }
    setRole(session.user.role);
    setCompany(companyResult);
    setAccounts(userResult);
    setEmployees(employeeResult);
  }, [companyId]);

  useEffect(() => {
    loadData()
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load company access details."))
      .finally(() => setLoading(false));
  }, [loadData]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    setTemporaryPassword("");
    try {
      const response = await fetch(`/api/companies/${encodeURIComponent(companyId)}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role: accountRole,
          employeeId: accountRole === "EMPLOYEE" ? employeeId : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create account.");
      setTemporaryPassword(result.temporaryPassword);
      setMessage("Account created. Copy the temporary password now and provide it to the account holder.");
      setEmail("");
      setEmployeeId("");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create account.");
    } finally {
      setSaving(false);
    }
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setMessage("Temporary password copied.");
    } catch {
      setError("Unable to copy the password. Select and copy it manually.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/companies" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-700">
            <ArrowLeft size={16} />Back to company management
          </Link>
          <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Access management</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{company?.name ?? "Company accounts"}</h1>
            <p className="mt-2 text-sm text-slate-500">Create employee or company administrator access. Temporary passwords are shown only once.</p>
          </header>
          <CompanyManagementTabs companyId={companyId} active="access" />

          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

          {temporaryPassword && (
            <section className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <KeyRound size={20} className="mt-0.5 shrink-0 text-amber-700" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-amber-950">Temporary password</h2>
                  <p className="mt-1 text-sm text-amber-800">Share this securely with the account holder. They must change it at first sign-in.</p>
                  <code className="mt-3 block break-all rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-slate-900">{temporaryPassword}</code>
                  <button type="button" onClick={() => void copyPassword()} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
                    <Copy size={15} />Copy password
                  </button>
                </div>
              </div>
            </section>
          )}

          {role && role !== "EMPLOYEE" && (
            <form onSubmit={createAccount} className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-950">Create an account</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">
                  Account type
                  <select value={accountRole} onChange={(event) => setAccountRole(event.target.value as "COMPANY_ADMIN" | "EMPLOYEE")} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3">
                    {role === "SUPER_ADMIN" && <option value="COMPANY_ADMIN">Company Admin</option>}
                    <option value="EMPLOYEE">Employee</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Login email
                  <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" />
                </label>
                {accountRole === "EMPLOYEE" && (
                  <label className="text-sm font-medium text-slate-700">
                    Employee
                    <select required value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3">
                      <option value="">Select an employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>{employee.fullName} ({employee.email})</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <button type="submit" disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                {saving ? <LoaderCircle size={17} className="animate-spin" /> : <UserPlus size={17} />}
                {saving ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          <section aria-labelledby="accounts-title" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 id="accounts-title" className="text-lg font-bold text-slate-950">Accounts</h2>
              <p className="mt-1 text-sm text-slate-500">Sign-in access scoped to this company.</p>
            </div>
            {loading ? (
              <p className="p-6 text-sm text-slate-500">Loading accounts...</p>
            ) : accounts.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No accounts have been created for this company.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {accounts.map((account) => (
                  <li key={account.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                      <p className="font-semibold text-slate-900">{account.email}</p>
                      <p className="mt-1 text-xs text-slate-500">{account.role.replace("_", " ")}{account.must_change_password ? " · Password change required" : ""}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${account.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{account.status}</span>
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
