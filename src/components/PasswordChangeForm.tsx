"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import type { AppLocale } from "@/lib/user-preferences";
import { translate } from "@/lib/messages";

export default function PasswordChangeForm({
  redirectOnSuccess = true,
  standalone = false,
  locale = "en",
}: {
  redirectOnSuccess?: boolean;
  standalone?: boolean;
  locale?: AppLocale;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({
    current: false,
    new: false,
    confirmation: false,
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const Heading = standalone ? "h1" : "h2";
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmation) {
      setError(t("password.mismatch"));
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
      if (redirectOnSuccess) {
        window.location.assign("/");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setMessage(t("password.saved"));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <LockKeyhole size={21} />
      </span>
      <Heading className={`font-bold text-slate-950 ${standalone ? "mt-6 text-2xl tracking-tight" : "mt-4 text-xl"}`}>{t("password.title")}</Heading>
      <p className="mt-1 text-sm leading-6 text-slate-500">{t("password.description")}</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          {t("password.current")}
          <div className="relative mt-2">
            <input
              type={visiblePasswords.current ? "text" : "password"}
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-blue-600"
            />
            <button
              type="button"
              aria-label={visiblePasswords.current ? "Hide current password" : "Show current password"}
              aria-pressed={visiblePasswords.current}
              onClick={() => setVisiblePasswords((current) => ({ ...current, current: !current.current }))}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
            >
              {visiblePasswords.current ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </label>
        <label className="text-sm font-medium text-slate-700">
          {t("password.new")}
          <div className="relative mt-2">
            <input
              type={visiblePasswords.new ? "text" : "password"}
              autoComplete="new-password"
              minLength={14}
              maxLength={72}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-blue-600"
            />
            <button
              type="button"
              aria-label={visiblePasswords.new ? "Hide new password" : "Show new password"}
              aria-pressed={visiblePasswords.new}
              onClick={() => setVisiblePasswords((current) => ({ ...current, new: !current.new }))}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
            >
              {visiblePasswords.new ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </label>
        <label className="text-sm font-medium text-slate-700">
          {t("password.confirm")}
          <div className="relative mt-2">
            <input
              type={visiblePasswords.confirmation ? "text" : "password"}
              autoComplete="new-password"
              minLength={14}
              maxLength={72}
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-blue-600"
            />
            <button
              type="button"
              aria-label={visiblePasswords.confirmation ? "Hide confirmation password" : "Show confirmation password"}
              aria-pressed={visiblePasswords.confirmation}
              onClick={() => setVisiblePasswords((current) => ({ ...current, confirmation: !current.confirmation }))}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
            >
              {visiblePasswords.confirmation ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
        >
          {loading ? <><LoaderCircle size={17} className="animate-spin" />{t("password.saving")}</> : t("password.save")}
        </button>
      </form>
    </section>
  );
}
