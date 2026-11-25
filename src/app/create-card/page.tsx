"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Building2, Globe, Mail, MapPin, Phone, UserRound, Linkedin, Save } from "lucide-react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import Sidebar from "@/components/Sidebar";
import { validateCardField, validateCardFields, type CardField, type CardFieldErrors } from "@/lib/card-validation";
import {
  DEFAULT_CARD_ACCENT,
  DEFAULT_CARD_BACKGROUND,
  DEFAULT_COMPANY,
  DEFAULT_COMPANY_LOGO,
  DEFAULT_WEBSITE,
} from "@/lib/card-defaults";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryCodes = getCountries()
  .map((iso) => ({
    country: countryNames.of(iso) || iso,
    iso,
    code: `+${getCountryCallingCode(iso)}`,
  }))
  .sort((left, right) => left.country.localeCompare(right.country));

const initialForm = {
  fullName: "", designation: "", company: DEFAULT_COMPANY, countryCode: "+91", mobile: "", email: "",
  address: "", website: DEFAULT_WEBSITE, linkedin: "", linkedinName: "", logoData: DEFAULT_COMPANY_LOGO, branchId: "",
  backgroundColor: DEFAULT_CARD_BACKGROUND, accentColor: DEFAULT_CARD_ACCENT,
};

export default function CreateCardPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [companyLogo, setCompanyLogo] = useState(DEFAULT_COMPANY_LOGO);
  const [companySettingsLoaded, setCompanySettingsLoaded] = useState(false);
  const [isCanvas, setIsCanvas] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<CardFieldErrors>({});
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!countryPickerOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !countryPickerRef.current?.contains(event.target)) {
        setCountryPickerOpen(false);
        setCountrySearch("");
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [countryPickerOpen]);

  function countryFlag(iso: string) {
    return String.fromCodePoint(...[...iso].map((letter) => letter.charCodeAt(0) + 127397));
  }

  useEffect(() => {
    async function loadForm() {
      const searchParams = new URLSearchParams(window.location.search);
      const cardId = searchParams.get("id");
      setIsCanvas(searchParams.get("canvas") === "1");
      if (cardId) {
        setEditingId(cardId);
        setLoadingCard(true);
      }

      try {
        const sessionResponse = await fetch("/api/auth/session");
        const session = await sessionResponse.json();
        if (!sessionResponse.ok) throw new Error(session.message || "Unable to load account details.");
        const branchId = typeof session.user.branchId === "string" ? session.user.branchId : "";
        if (branchId) setForm((current) => ({ ...current, branchId }));
        const settingsResponse = await fetch("/api/company");
        const settings = await settingsResponse.json();
        if (!settingsResponse.ok) throw new Error(settings.message || "Unable to load company settings.");
        setCompanyLogo(settings.logoData);
        setForm((current) => ({
          ...current,
          company: settings.companyName,
          address: settings.address || "",
          website: settings.website,
          logoData: settings.logoData,
        }));
        setCompanySettingsLoaded(true);

        if (!cardId) return;
        const response = await fetch(`/api/cards/${encodeURIComponent(cardId)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load card.");
        setForm({
          ...initialForm,
          fullName: result.fullName,
          designation: result.designation,
          company: settings.companyName,
          countryCode: result.countryCode || "+91",
          mobile: result.mobile,
          email: result.email,
          address: result.address || "",
          website: settings.website,
          linkedin: result.linkedin || "",
          linkedinName: result.linkedinName || "",
          logoData: result.logoData || settings.logoData,
          backgroundColor: result.backgroundColor || initialForm.backgroundColor,
          accentColor: result.accentColor || initialForm.accentColor,
          branchId: result.branchId || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load card.");
      } finally {
        setLoadingCard(false);
      }
    }

    void loadForm();
  }, []);

  function update(field: keyof typeof initialForm, value: string) {
    if (field === "company" || field === "website") return;
    if (field === "fullName") {
      value = value.replace(/[^\p{L}\p{M} ]/gu, "");
    }
    if (field === "mobile") {
      value = value.replace(/\D/g, "").slice(0, 15);
    }
    setForm((current) => ({ ...current, [field]: value }));
    if (field !== "branchId" && field in fieldErrors) {
      setFieldErrors((current) => ({
        ...current,
        [field]: validateCardField(field, value),
      }));
    }
  }

  async function updateCardLogo(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPEG, or WebP logo.");
      return;
    }
    if (file.size > 500 * 1024) {
      setError("Choose a logo no larger than 500 KB.");
      return;
    }

    try {
      const logoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("Unable to read this logo file."));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = () => reject(new Error("Unable to read this logo file."));
        reader.readAsDataURL(file);
      });
      update("logoData", logoData);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read this logo file.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validationErrors = validateCardFields(form);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setLoading(true);
    try {
      const payload = form;
      const response = await fetch(editingId ? `/api/cards/${encodeURIComponent(editingId)}` : "/api/cards", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create card.");
      if (new URLSearchParams(window.location.search).get("canvas") === "1" && window.parent !== window) {
        window.parent.postMessage({ type: "card-created", success: true }, window.location.origin);
        return;
      }
      const cardRouteId = typeof result.publicSlug === "string" ? result.publicSlug : result.id;
      window.location.href = `/card/${encodeURIComponent(cardRouteId)}/view`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  const fields: { key: CardField; label: string; placeholder: string; icon: typeof UserRound; required?: boolean; type?: string; maxLength?: number }[] = [
    { key: "fullName", label: "Full name", placeholder: "Full Name", icon: UserRound, required: true, maxLength: 100 },
    { key: "designation", label: "Designation", placeholder: "e.g. Software Developer", icon: Building2, required: true, maxLength: 100 },
    { key: "company", label: "Company name", placeholder: "e.g. ABC Technologies", icon: Building2, required: true, maxLength: 100 },
    { key: "mobile", label: "Phone number", placeholder: "Phone number", icon: Phone, required: true, type: "tel", maxLength: 15 },
    { key: "email", label: "Email address", placeholder: "e.g. name@gmail.com", icon: Mail, required: true, type: "email", maxLength: 254 },
    { key: "address", label: "Office address", placeholder: "Enter office address", icon: MapPin, maxLength: 250 },
    { key: "website", label: "Website", placeholder: "https://company.com", icon: Globe, type: "url", maxLength: 2048 },
    { key: "linkedin", label: "LinkedIn profile", placeholder: "https://linkedin.com/in/username", icon: Linkedin, type: "url", maxLength: 2048 },
    { key: "linkedinName", label: "LinkedIn display name", placeholder: "Name shown on LinkedIn", icon: Linkedin, maxLength: 100 },
  ];

  return (
    <div className={isCanvas ? "min-h-screen" : "flex min-h-screen flex-col md:flex-row"}>
      {!isCanvas && <Sidebar />}
      <main className={isCanvas ? "min-w-0 p-4 sm:p-5" : "min-w-0 flex-1 p-5 md:p-8 xl:p-10"}>
        <div className={`create-card-shell mx-auto w-full ${isCanvas ? "max-w-2xl" : "max-w-4xl"}`}>
          {!isCanvas && <header className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Card setup</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{editingId ? "Edit card details" : "Create a digital card"}</h1>
            <p className="mt-2 text-sm text-slate-500">{editingId ? "Update the contact details shown on this card." : "Enter contact details to create a digital card and QR code."}</p>
          </header>}
          <form noValidate onSubmit={submit} className="create-card-form rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)] sm:p-6 md:p-8">
            {loadingCard && <p role="status" className="mb-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Loading card details...</p>}
            <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UserRound size={19} /></span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Personal & professional information</h2>
                <p className="mt-1 text-sm text-slate-500">Fields marked with <span className="font-semibold text-red-500">*</span> are required.</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((field) => {
                if (field.key === "mobile") {
                  const countryCodeError = fieldErrors.countryCode;
                  const isCustomCountryCode = !countryCodes.some(({ code }) => code === form.countryCode);
                  const selectedCountry = countryCodes.find(({ code }) => code === form.countryCode);
                  const filteredCountryCodes = countryCodes.filter(({ country, iso, code }) =>
                    `${country} ${iso} ${code}`.toLowerCase().includes(countrySearch.trim().toLowerCase())
                  );
                  return (
                    <div key="phone-fields">
                      <label htmlFor="mobile" className="mb-2 block text-sm font-semibold text-slate-700">{field.label}<span className="text-red-500"> *</span></label>
                      <div className={`flex min-w-0 items-center rounded-xl border bg-slate-50 ${fieldErrors.mobile || countryCodeError ? "border-red-500" : "border-slate-200"}`}>
                        <div ref={countryPickerRef} className="relative shrink-0">
                          <button
                            type="button"
                            aria-label="Choose country calling code"
                            aria-haspopup="listbox"
                            aria-expanded={countryPickerOpen}
                            aria-describedby={countryCodeError ? "countryCode-error" : undefined}
                            className="flex h-11 min-w-[96px] items-center justify-center gap-1.5 rounded-l-xl border-r border-slate-200 bg-transparent px-2 text-sm outline-none focus:outline-none hover:bg-slate-100"
                            onClick={() => { setCountryPickerOpen((open) => !open); setCountrySearch(""); }}
                          >
                            <span aria-hidden="true">{selectedCountry ? countryFlag(selectedCountry.iso) : "🌐"}</span>
                            <span>{selectedCountry?.code || "Other"}</span>
                            <span aria-hidden="true" className="text-xs text-slate-500">▾</span>
                          </button>
                          {countryPickerOpen && <div className="absolute left-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                            <input
                              autoFocus
                              aria-label="Search countries"
                              className="w-full border-b border-slate-200 px-3 py-2.5 text-sm outline-none focus:outline-none"
                              value={countrySearch}
                              onChange={(event) => setCountrySearch(event.target.value)}
                              placeholder="Search country or code"
                            />
                            <div role="listbox" aria-label="Countries" className="max-h-60 overflow-y-auto p-1">
                              {filteredCountryCodes.map(({ country, iso, code }) => (
                                <button
                                  key={`${iso}-${code}`}
                                  type="button"
                                  role="option"
                                  aria-selected={code === form.countryCode}
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm outline-none focus:outline-none hover:bg-slate-100"
                                  onClick={() => {
                                    update("countryCode", code);
                                    setCountryPickerOpen(false);
                                    setCountrySearch("");
                                  }}
                                >
                                  <span aria-hidden="true">{countryFlag(iso)}</span>
                                  <span className="min-w-0 flex-1 truncate">{country}</span>
                                  <span className="text-slate-500">{code}</span>
                                </button>
                              ))}
                              {filteredCountryCodes.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">No matching countries.</p>}
                              <button
                                type="button"
                                role="option"
                                aria-selected={isCustomCountryCode}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm outline-none focus:outline-none hover:bg-slate-100"
                                onClick={() => {
                                  update("countryCode", "");
                                  setCountryPickerOpen(false);
                                  setCountrySearch("");
                                }}
                              >
                                <span aria-hidden="true">🌐</span><span className="flex-1">Other country code</span>
                              </button>
                            </div>
                          </div>}
                        </div>
                        {isCustomCountryCode && <input
                          aria-label="Custom country calling code"
                          aria-invalid={Boolean(countryCodeError)}
                          aria-describedby={countryCodeError ? "countryCode-error" : undefined}
                          className="h-11 w-[84px] shrink-0 border-r border-slate-200 bg-transparent px-2 text-sm outline-none focus:outline-none"
                          inputMode="tel"
                          maxLength={4}
                          value={form.countryCode}
                          onChange={(event) => update("countryCode", event.target.value)}
                          onBlur={(event) => setFieldErrors((current) => ({ ...current, countryCode: validateCardField("countryCode", event.target.value) }))}
                          placeholder="+358"
                        />}
                        <input
                          id="mobile"
                          aria-invalid={Boolean(fieldErrors.mobile)}
                          aria-describedby={fieldErrors.mobile ? "mobile-error" : undefined}
                          className="h-11 min-w-0 w-full rounded-r-xl bg-transparent px-3 text-sm outline-none focus:outline-none placeholder:text-slate-400"
                          type="tel"
                          inputMode="tel"
                          required
                          maxLength={field.maxLength}
                          value={form.mobile}
                          onChange={(event) => update("mobile", event.target.value)}
                          onBlur={(event) => setFieldErrors((current) => ({ ...current, mobile: validateCardField("mobile", event.target.value) }))}
                          placeholder={field.placeholder}
                        />
                      </div>
                      {countryCodeError && <span id="countryCode-error" className="mt-1 block text-xs text-red-600">{countryCodeError}</span>}
                      {fieldErrors.mobile && <span id="mobile-error" className="mt-1 block text-xs text-red-600">{fieldErrors.mobile}</span>}
                    </div>
                  );
                }

                const Icon = field.icon;
                const fieldError = fieldErrors[field.key];
                const isFixed = field.key === "company" || field.key === "website";
                return <label key={field.key} className={field.key === "address" ? "sm:col-span-2" : ""}>
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">{field.label}{field.required && <span className="text-red-500"> *</span>}{isFixed && <span className="text-xs font-normal text-slate-400">Fixed</span>}</span>
                  <div className={`flex items-start rounded-xl border bg-slate-50 px-3 ${fieldError ? "border-red-500" : "border-slate-200"}`}>
                    <Icon size={17} className="mt-3 shrink-0 text-slate-400" />
                    {field.key === "address" ? (
                      <textarea
                        id={field.key}
                        aria-invalid={Boolean(fieldError)}
                        aria-describedby={fieldError ? `${field.key}-error` : undefined}
                        className="min-h-28 w-full resize-y bg-transparent px-3 py-3 text-sm outline-none focus:outline-none placeholder:text-slate-400"
                        maxLength={field.maxLength}
                        value={form.address}
                        onChange={(event) => update("address", event.target.value)}
                        onBlur={(event) => setFieldErrors((current) => ({ ...current, address: validateCardField("address", event.target.value) }))}
                        placeholder={field.placeholder}
                        rows={4}
                      />
                    ) : (
                      <input
                        id={field.key}
                        aria-invalid={Boolean(fieldError)}
                        aria-describedby={fieldError ? `${field.key}-error` : undefined}
                        className={`w-full bg-transparent px-3 py-3 text-sm outline-none focus:outline-none placeholder:text-slate-400 ${isFixed ? "cursor-not-allowed text-slate-600" : ""}`}
                        type={field.type || "text"}
                        required={field.required}
                        readOnly={isFixed}
                        maxLength={field.maxLength}
                        value={form[field.key]}
                        onChange={(event) => update(field.key, event.target.value)}
                        onBlur={(event) => setFieldErrors((current) => ({ ...current, [field.key]: validateCardField(field.key, event.target.value) }))}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                  {fieldError && <span id={`${field.key}-error`} className="mt-1 block text-xs text-red-600">{fieldError}</span>}
                </label>;
              })}
            </div>
            <section aria-labelledby="card-logo-heading" className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <h2 id="card-logo-heading" className="text-sm font-semibold text-slate-800">Card logo</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Each card has its own logo. New cards start with the workspace logo, but changing it later won&apos;t change saved cards.</p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                  <Image src={form.logoData || DEFAULT_COMPANY_LOGO} alt="Card logo preview" width={48} height={48} unoptimized className="h-full w-full object-contain" />
                </span>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  <Building2 size={16} />Choose card logo
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { void updateCardLogo(event); }} className="sr-only" />
                </label>
                <button type="button" onClick={() => update("logoData", companyLogo)} className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Use workspace logo</button>
                <p className="w-full text-xs text-slate-500">PNG, JPEG, or WebP · maximum 500 KB</p>
              </div>
            </section>
            {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">{isCanvas ? <button type="button" onClick={() => window.parent.postMessage({ type: "close-card-form" }, window.location.origin)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button> : <Link href={editingId ? "/my-cards" : "/"} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</Link>}<button disabled={loading || loadingCard || !companySettingsLoaded} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={17} />{loading ? (editingId ? "Saving changes..." : "Creating card...") : (editingId ? "Save changes" : "Create card")}</button></div>
          </form>
        </div>
      </main>
    </div>
  );
}
