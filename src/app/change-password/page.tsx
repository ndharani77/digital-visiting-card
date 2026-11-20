"use client";

import { useState, type FormEvent } from "react";
import { LockKeyhole, LoaderCircle } from "lucide-react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmation) {
      setError("The new passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to change password.");
      window.location.assign("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white">
          <LockKeyhole size={23} />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Your administrator provided a temporary password. Replace it before using the workspace.</p>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} className="mt-7 space-y-4">
          <input
            aria-label="Temporary password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Temporary password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600"
          />
          <input
            aria-label="New password"
            type="password"
            autoComplete="new-password"
            minLength={14}
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password (at least 14 characters)"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600"
          />
          <input
            aria-label="Confirm new password"
            type="password"
            autoComplete="new-password"
            minLength={14}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <><LoaderCircle size={17} className="animate-spin" />Saving</> : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}
