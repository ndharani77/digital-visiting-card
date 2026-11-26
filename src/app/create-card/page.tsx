"use client";

import { Fragment, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Building2, Globe, Mail, MapPin, Phone, UserRound, Linkedin, Save, Share2 } from "lucide-react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import Sidebar from "@/components/Sidebar";
import { validateCardField, validateCardFields, type CardField, type CardFieldErrors } from "@/lib/card-validation";
import VisitingCardFace from "@/components/VisitingCardFace";
import {
  DEFAULT_CARD_ACCENT,
  DEFAULT_CARD_BACKGROUND,
  DEFAULT_COMPANY,
  DEFAULT_COMPANY_LOGO,
  DEFAULT_WEBSITE,
} from "@/lib/card-defaults";
import type { CompanyLocation } from "@/lib/company-settings";

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

function isCompanyLocation(value: unknown): value is CompanyLocation {
  return Boolean(
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "officeLocation" in value &&
    typeof value.officeLocation === "string"
  );
}

function isPublicCardFormSettings(value: unknown): value is {
  companyName: string;
  website: string;
  logoData: string;
  locations: CompanyLocation[];
} {
  return Boolean(
    value &&
    typeof value === "object" &&
    "companyName" in value &&
    typeof value.companyName === "string" &&
    "website" in value &&
    typeof value.website === "string" &&
    "logoData" in value &&
    typeof value.logoData === "string" &&
    "locations" in value &&
    Array.isArray(value.locations) &&
    value.locations.every(isCompanyLocation)
  );
}

export default function CreateCardPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [companyLogo, setCompanyLogo] = useState(DEFAULT_COMPANY_LOGO);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [companySettingsLoaded, setCompanySettingsLoaded] = useState(false);
  const [isCanvas, setIsCanvas] = useState(false);
  const [routeModeResolved, setRouteModeResolved] = useState(false);
  const [publicFormIdentifier, setPublicFormIdentifier] = useState("");
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [publicCardCreated, setPublicCardCreated] = useState(false);
  const [canGenerateFormLink, setCanGenerateFormLink] = useState(false);
  const [publicFormLink, setPublicFormLink] = useState("");
  const [creatingPublicFormLink, setCreatingPublicFormLink] = useState(false);
  const [publicFormLinkMessage, setPublicFormLinkMessage] = useState("");
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
      const pathSegments = window.location.pathname.split("/").filter(Boolean);
      const cardFormIdentifier = searchParams.get("publicToken") ||
        (pathSegments[0] === "f" ? pathSegments[1] || "" : "");
      setIsCanvas(searchParams.get("canvas") === "1");
      setRouteModeResolved(true);
      if (cardFormIdentifier) setPublicFormIdentifier(cardFormIdentifier);
      if (cardId) {
        setEditingId(cardId);
        setLoadingCard(true);
      }

      try {
        if (cardFormIdentifier) {
          const response = await fetch(`/api/public/card-form/${encodeURIComponent(cardFormIdentifier)}`);
          const result: unknown = await response.json();
          if (!response.ok) {
            const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
              ? result.message
              : "Unable to load this card form.";
            throw new Error(message);
          }
          if (!isPublicCardFormSettings(result)) throw new Error("Card form settings are invalid.");
          setCompanyLogo(result.logoData);
          setLocations(result.locations);
          setForm((current) => ({
            ...current,
            company: result.companyName,
            website: result.website,
            logoData: result.logoData,
          }));
          setCompanySettingsLoaded(true);
          return;
        }

        const [sessionResponse, settingsResponse, cardResponse] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/company"),
          cardId ? fetch(`/api/cards/${encodeURIComponent(cardId)}`) : Promise.resolve(null),
        ]);
        const [session, settings] = await Promise.all([
          sessionResponse.json(),
          settingsResponse.json(),
        ]);
        if (!sessionResponse.ok) throw new Error(session.message || "Unable to load account details.");
        const branchId = typeof session.user.branchId === "string" ? session.user.branchId : "";
        setCanGenerateFormLink(
          (session.user.role === "COMPANY_ADMIN" && !branchId) ||
          (session.user.role === "SUPER_ADMIN" && typeof session.activeCompanyId === "string")
        );
        if (branchId) setForm((current) => ({ ...current, branchId }));
        if (!settingsResponse.ok) throw new Error(settings.message || "Unable to load company settings.");
        const companyLocations: CompanyLocation[] = Array.isArray(settings.locations)
          ? settings.locations.filter(isCompanyLocation)
          : [];
        setCompanyLogo(settings.logoData);
        setLocations(companyLocations);
        setForm((current) => ({
          ...current,
          company: settings.companyName,
          website: settings.website,
          logoData: settings.logoData,
        }));
        setCompanySettingsLoaded(true);

        if (!cardId) return;
        if (!cardResponse) throw new Error("Unable to load card.");
        const result = await cardResponse.json();
        if (!cardResponse.ok) throw new Error(result.message || "Unable to load card.");
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
        setSelectedLocationId(
          companyLocations.find((location) => location.officeLocation === (result.address || ""))?.id || ""
        );
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
    if (field === "address" && !publicFormIdentifier) setSelectedLocationId("");
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
    if (publicFormIdentifier) {
      if (!locations.some((location) => location.id === selectedLocationId)) {
        validationErrors.address = "Select a location.";
      } else if (!form.address.trim()) {
        validationErrors.address = "Office address is required.";
      }
    }
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    if (publicFormIdentifier && !showPublicPreview) {
      setShowPublicPreview(true);
      return;
    }
    setLoading(true);
    try {
      const payload = publicFormIdentifier
        ? {
            fullName: form.fullName,
            designation: form.designation,
            countryCode: form.countryCode,
            mobile: form.mobile,
            email: form.email,
            address: form.address,
            linkedin: form.linkedin,
            locationId: selectedLocationId,
          }
        : form;
      const response = await fetch(
        publicFormIdentifier
          ? `/api/public/card-form/${encodeURIComponent(publicFormIdentifier)}`
          : editingId ? `/api/cards/${encodeURIComponent(editingId)}` : "/api/cards",
        {
        method: publicFormIdentifier ? "POST" : editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create card.");
      if (publicFormIdentifier) {
        if (!result || typeof result.id !== "string") throw new Error("Created card response is invalid.");
        setPublicCardCreated(true);
        setLoading(false);
        return;
      }
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

  async function copyFormLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      return;
    } catch {
      const input = document.createElement("textarea");
      input.value = link;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      if (!copied) throw new Error("The link was created, but could not be copied. Try copying it again.");
    }
  }

  async function generatePublicFormLink() {
    const response = await fetch("/api/company/card-form-link", { method: "POST" });
    const result: unknown = await response.json();
    const errorMessage = result && typeof result === "object" && "message" in result && typeof result.message === "string"
      ? result.message
      : "Unable to create a public card form link.";
    if (!response.ok) throw new Error(errorMessage);
    if (!result || typeof result !== "object" || !("identifier" in result) || typeof result.identifier !== "string") {
      throw new Error("Public card form link response is invalid.");
    }
    return new URL(`/f/${encodeURIComponent(result.identifier)}`, window.location.origin).toString();
  }

  async function sharePublicFormLink() {
    setCreatingPublicFormLink(true);
    setError("");
    setPublicFormLinkMessage("");
    try {
      const generatedNewLink = !publicFormLink;
      const linkPromise = publicFormLink ? Promise.resolve(publicFormLink) : generatePublicFormLink();
      let clipboardWritePromise: Promise<boolean> | undefined;
      if (
        generatedNewLink &&
        navigator.clipboard &&
        typeof navigator.clipboard.write === "function" &&
        typeof ClipboardItem !== "undefined"
      ) {
        try {
          clipboardWritePromise = navigator.clipboard.write([
            new ClipboardItem({
              "text/plain": linkPromise.then((link) => new Blob([link], { type: "text/plain" })),
            }),
          ]).then(() => true, () => false);
        } catch {
          clipboardWritePromise = Promise.resolve(false);
        }
      }
      const link = await linkPromise;
      if (generatedNewLink) setPublicFormLink(link);
      const copied = clipboardWritePromise ? await clipboardWritePromise : false;
      if (!copied) await copyFormLink(link);
      setPublicFormLinkMessage("Form link copied. Share it with anyone who needs a card; they can review details before confirming creation.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create a public card form link.");
    } finally {
      setCreatingPublicFormLink(false);
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
    <div className={isCanvas || publicFormIdentifier ? "min-h-screen bg-slate-50" : "flex min-h-screen flex-col md:flex-row"}>
      {!isCanvas && !publicFormIdentifier && <Sidebar />}
      <main className={isCanvas || publicFormIdentifier ? "min-w-0 p-4 sm:p-5" : "min-w-0 flex-1 p-5 md:p-8 xl:p-10"}>
        <div className={`create-card-shell mx-auto w-full ${isCanvas || publicFormIdentifier ? "max-w-2xl" : "max-w-4xl"}`}>
          {publicFormIdentifier ? (
            <header className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Digital card form</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{publicCardCreated ? "Your card is created!" : "Create your digital card"}</h1>
              <p className="mt-2 text-sm text-slate-500">{publicCardCreated ? `Your card has been saved successfully in ${form.company}.` : `Fill in your details and review the card before confirming its creation in ${form.company}.`}</p>
            </header>
          ) : !isCanvas && routeModeResolved && <header className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Card setup</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{editingId ? "Edit card details" : "Create a digital card"}</h1>
            <p className="mt-2 text-sm text-slate-500">{editingId ? "Update the contact details shown on this card." : "Enter contact details to create a digital card and QR code."}</p>
          </header>}
          <form noValidate onSubmit={submit} className="create-card-form rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)] sm:p-6 md:p-8">
            {loadingCard && <p role="status" className="mb-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Loading card details...</p>}
            {publicFormIdentifier && publicCardCreated ? (
              <section aria-label="Created digital card">
                <div className="mx-auto w-full max-w-[430px]">
                  <VisitingCardFace
                    fullName={form.fullName}
                    designation={form.designation}
                    company={form.company}
                    countryCode={form.countryCode}
                    mobile={form.mobile}
                    email={form.email}
                    address={form.address}
                    website={form.website}
                    linkedin={form.linkedin}
                    linkedinName=""
                    logoData={form.logoData}
                    accentColor={form.accentColor}
                  />
                </div>
              </section>
            ) : publicFormIdentifier && showPublicPreview ? (
              <section aria-labelledby="public-card-review-heading">
                <h2 id="public-card-review-heading" className="text-lg font-bold text-slate-900">Review your card</h2>
                <p className="mt-1 text-sm text-slate-500">Check your details. Choose Edit details to make corrections before creating your card.</p>
                <div className="mx-auto mt-6 w-full max-w-[430px]">
                  <VisitingCardFace
                    fullName={form.fullName}
                    designation={form.designation}
                    company={form.company}
                    countryCode={form.countryCode}
                    mobile={form.mobile}
                    email={form.email}
                    address={form.address}
                    website={form.website}
                    linkedin={form.linkedin}
                    linkedinName=""
                    logoData={form.logoData}
                    accentColor={form.accentColor}
                  />
                </div>
                {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => { setShowPublicPreview(false); setError(""); }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Edit details
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !companySettingsLoaded}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={17} />{loading ? "Creating card..." : "Confirm and create card"}
                  </button>
                </div>
              </section>
            ) : (
            <>
            <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UserRound size={19} /></span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900">Personal & professional information</h2>
                <p className="mt-1 text-sm text-slate-500">Fields marked with <span className="font-semibold text-red-500">*</span> are required.</p>
              </div>
              {!publicFormIdentifier && !editingId && canGenerateFormLink && companySettingsLoaded && (
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => { void sharePublicFormLink(); }}
                    disabled={creatingPublicFormLink}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Share2 size={16} />
                    {creatingPublicFormLink ? "Copying..." : "Copy link"}
                  </button>
                  {publicFormLink && (
                    <Link href={publicFormLink} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 underline underline-offset-2">
                      Open public form
                    </Link>
                  )}
                </div>
              )}
            </div>
            {publicFormLinkMessage && <p role="status" className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{publicFormLinkMessage}</p>}
            <div className="grid gap-5 sm:grid-cols-2">
              {fields
                .filter((field) => !publicFormIdentifier || (field.key !== "website" && field.key !== "linkedinName"))
                .map((field) => {
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
                const locationSelected = locations.some((location) => location.id === selectedLocationId);
                const locationSelectionError = publicFormIdentifier && !locationSelected ? fieldError : undefined;
                const isFixed = field.key === "company" || field.key === "website";
                if (field.key === "address") {
                  return (
                    <Fragment key={field.key}>
                      <label className="text-sm font-semibold text-slate-700">
                        Location{publicFormIdentifier && <span className="text-red-500"> *</span>}
                        <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                          <MapPin size={17} className="shrink-0 text-slate-400" />
                          <select
                            aria-label="Location"
                            aria-required={Boolean(publicFormIdentifier)}
                            aria-invalid={Boolean(locationSelectionError)}
                            aria-describedby={locationSelectionError ? "address-error" : undefined}
                            required={Boolean(publicFormIdentifier)}
                            value={selectedLocationId || (!publicFormIdentifier ? locations.find((location) => location.officeLocation === form.address)?.id || "" : "")}
                            disabled={locations.length === 0}
                            onChange={(event) => {
                              const location = locations.find((item) => item.id === event.target.value);
                              setSelectedLocationId(location?.id || "");
                              setForm((current) => ({ ...current, address: location?.officeLocation || "" }));
                              setFieldErrors((current) => ({ ...current, address: undefined }));
                            }}
                            className="w-full bg-transparent px-3 py-3 text-sm font-normal outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            <option value="">{locations.length ? "Select a location" : "No locations added"}</option>
                            {locations.map((location) => (
                              <option key={location.id} value={location.id}>{location.name}</option>
                            ))}
                          </select>
                        </div>
                        {locationSelectionError && <span id="address-error" className="mt-1 block text-xs font-normal text-red-600">{locationSelectionError}</span>}
                        {locations.length === 0 && <span className="mt-1 block text-xs font-normal text-slate-500">Add locations in Company Profile to choose one here.</span>}
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">{field.label}</span>
                        <div className={`flex items-start rounded-xl border bg-slate-50 px-3 ${fieldError ? "border-red-500" : "border-slate-200"}`}>
                          <Icon size={17} className="mt-3 shrink-0 text-slate-400" />
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
                        </div>
                        {fieldError && !locationSelectionError && <span id={`${field.key}-error`} className="mt-1 block text-xs text-red-600">{fieldError}</span>}
                      </label>
                    </Fragment>
                  );
                }
                return <label key={field.key}>
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">{field.label}{field.key === "linkedin" && publicFormIdentifier && <span className="text-xs font-normal text-slate-400">(optional)</span>}{field.required && <span className="text-red-500"> *</span>}{isFixed && <span className="text-xs font-normal text-slate-400">Fixed</span>}</span>
                  <div className={`flex items-center rounded-xl border bg-slate-50 px-3 ${fieldError ? "border-red-500" : "border-slate-200"}`}>
                    <Icon size={17} className="mt-3 shrink-0 text-slate-400" />
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
                  </div>
                  {fieldError && <span id={`${field.key}-error`} className="mt-1 block text-xs text-red-600">{fieldError}</span>}
                </label>;
              })}
            </div>
            {!publicFormIdentifier && <section aria-labelledby="card-logo-heading" className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
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
            </section>}
            {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">{isCanvas ? <button type="button" onClick={() => window.parent.postMessage({ type: "close-card-form" }, window.location.origin)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button> : !publicFormIdentifier && <Link href={editingId ? "/my-cards" : "/"} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</Link>}<button disabled={loading || loadingCard || !companySettingsLoaded} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={17} />{loading ? (editingId ? "Saving changes..." : "Creating card...") : publicFormIdentifier ? "Preview card" : editingId ? "Save changes" : "Create card"}</button></div>
            </>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
