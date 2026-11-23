"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CreditCard, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authConfigurationMissing, setAuthConfigurationMissing] = useState(false);

  useEffect(() => {
    setAuthConfigurationMissing(new URLSearchParams(window.location.search).get("configuration") === "auth");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to sign in.");
      if (result.user?.mustChangePassword) {
        window.location.assign("/change-password");
        return;
      }
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : "/";
      window.location.assign(nextPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white">
            <CreditCard size={24} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-950">Card Reader</p>
            <p className="text-xs text-slate-500">Secure workspace sign in</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in with the account provided by your administrator.</p>
        {authConfigurationMissing && (
          <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            The session security secret is not configured. Set AUTH_SECRET before signing in.
          </p>
        )}
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 px-3.5 py-3 focus-within:border-blue-600">
              <Mail size={18} className="text-slate-400" />
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </span>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 px-3.5 py-3 focus-within:border-blue-600">
              <LockKeyhole size={18} className="text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <><LoaderCircle size={17} className="animate-spin" />Signing in</> : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
