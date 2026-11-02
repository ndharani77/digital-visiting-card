"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Globe, Mail, MapPin, Phone, UserRound, Linkedin, Save } from "lucide-react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import Sidebar from "@/components/Sidebar";
import VisitingCardFace from "@/components/VisitingCardFace";
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
  address: "", website: DEFAULT_WEBSITE, linkedin: "", logoData: DEFAULT_COMPANY_LOGO,
  backgroundColor: DEFAULT_CARD_BACKGROUND, accentColor: DEFAULT_CARD_ACCENT,
};

export default function CreateCardPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CardFieldErrors>({});
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  function countryFlag(iso: string) {
    return String.fromCodePoint(...[...iso].map((letter) => letter.charCodeAt(0) + 127397));
  }

  useEffect(() => {
    const cardId = new URLSearchParams(window.location.search).get("id");
    if (!cardId) return;

    setEditingId(cardId);
    setLoadingCard(true);
    fetch(`/api/cards/${encodeURIComponent(cardId)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load card.");
        setForm({
          ...initialForm,
          fullName: result.fullName,
          designation: result.designation,
          company: DEFAULT_COMPANY,
          countryCode: result.countryCode || "+91",
          mobile: result.mobile,
          email: result.email,
          address: result.address || "",
          website: DEFAULT_WEBSITE,
          linkedin: result.linkedin || "",
          logoData: DEFAULT_COMPANY_LOGO,
          backgroundColor: result.backgroundColor || initialForm.backgroundColor,
          accentColor: result.accentColor || initialForm.accentColor,
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load card."))
      .finally(() => setLoadingCard(false));
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
    if (field in fieldErrors) {
      setFieldErrors((current) => ({
        ...current,
        [field]: validateCardField(field, value),
      }));
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
      const response = await fetch(editingId ? `/api/cards/${encodeURIComponent(editingId)}` : "/api/cards", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create card.");
      window.location.href = `/card/${result.id}/view`;
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
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mb-7"><Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link><h1 className="text-2xl font-bold">{editingId ? "Edit Visiting Card" : "Create Visiting Card"}</h1><p className="mt-1 text-sm text-slate-500">{editingId ? "Update this card's contact details and branding." : "Enter professional details to create a shareable digital visiting card."}</p></div>
        <div className="mx-auto grid max-w-6xl gap-7 xl:grid-cols-[1.4fr_.8fr]">
          <form noValidate onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            {loadingCard && <p role="status" className="mb-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Loading card details...</p>}
            <div className="mb-6"><h2 className="text-lg font-bold">Personal & professional information</h2><p className="mt-1 text-sm text-slate-500">Fields marked with * are required.</p></div>
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
                      <div className={`flex min-w-0 items-center rounded-xl border bg-slate-50 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 ${fieldErrors.mobile || countryCodeError ? "border-red-500" : "border-slate-200 focus-within:border-blue-500"}`}>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            aria-label="Choose country calling code"
                            aria-haspopup="listbox"
                            aria-expanded={countryPickerOpen}
                            aria-invalid={Boolean(countryCodeError)}
                            aria-describedby={countryCodeError ? "countryCode-error" : undefined}
                            className="flex h-11 min-w-[96px] items-center justify-center gap-1.5 rounded-l-xl border-r border-slate-200 bg-transparent px-2 text-sm outline-none hover:bg-slate-100"
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
                              className="w-full border-b border-slate-200 px-3 py-2.5 text-sm outline-none"
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
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100"
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
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100"
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
                          className="h-11 w-[84px] shrink-0 border-r border-slate-200 bg-transparent px-2 text-sm outline-none"
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
                          className="h-11 min-w-0 w-full rounded-r-xl bg-transparent px-3 text-sm outline-none placeholder:text-slate-400"
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
                  <div className={`flex items-start rounded-xl border bg-slate-50 px-3 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 ${fieldError ? "border-red-500" : "border-slate-200 focus-within:border-blue-500"}`}>
                    <Icon size={17} className="mt-3 shrink-0 text-slate-400" />
                    {field.key === "address" ? (
                      <textarea
                        id={field.key}
                        aria-invalid={Boolean(fieldError)}
                        aria-describedby={fieldError ? `${field.key}-error` : undefined}
                        className="min-h-28 w-full resize-y bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
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
                        className={`w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400 ${isFixed ? "cursor-not-allowed text-slate-600" : ""}`}
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
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-base font-bold text-slate-900">Card branding & customization</h3>
              <p className="mt-1 text-sm text-slate-500">The company logo is fixed. Choose the card colours.</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Company logo <span className="font-normal text-slate-400">(fixed)</span></span>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <img src={DEFAULT_COMPANY_LOGO} alt="Brihaspathi Technologies logo" className="h-12 w-12 rounded-lg bg-white object-contain p-1" />
                    <span className="text-sm text-slate-600">Brihaspathi Technologies</span>
                  </div>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Card background</span>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
                    <input aria-label="Card background colour" type="color" value={form.backgroundColor} onChange={(e) => update("backgroundColor", e.target.value)} className="h-10 w-14 cursor-pointer rounded border-0 bg-transparent" />
                    <span className="text-sm text-slate-600">{form.backgroundColor}</span>
                  </div>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Accent colour</span>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
                    <input aria-label="Accent colour" type="color" value={form.accentColor} onChange={(e) => update("accentColor", e.target.value)} className="h-10 w-14 cursor-pointer rounded border-0 bg-transparent" />
                    <span className="text-sm text-slate-600">{form.accentColor}</span>
                  </div>
                </label>
              </div>
            </div>
            {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6"><Link href={editingId ? "/my-cards" : "/"} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</Link><button disabled={loading || loadingCard} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={17} />{loading ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Visiting Card")}</button></div>
          </form>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Live card preview</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">FRONT SIDE</span>
            </div>
            <VisitingCardFace
              fullName={form.fullName}
              designation={form.designation}
              company={form.company}
              countryCode={form.countryCode}
              mobile={form.mobile}
              email={form.email}
              address={form.address}
              website={form.website}
              backgroundColor={form.backgroundColor}
              accentColor={form.accentColor}
              showPlaceholders
            />
            <p className="mt-4 text-xs leading-5 text-slate-500">Option 4: elegant dark card with a gold accent. You can upload a company logo and customize both background and accent colours.</p>
          </aside>
        </div>
      </main>
    </div>
  );
}
