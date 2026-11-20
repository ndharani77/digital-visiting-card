"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ImagePlus, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import {
  DEFAULT_COMPANY_PREVIEW,
  isCompanyPreviewSettings,
  type CompanyAboutSection,
  type CompanyMetric,
  type CompanyPreviewSettings,
  type CompanyService,
  type EnquiryField,
} from "@/lib/company-content";

let entryCounter = 0;

function createEntryId() {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
  entryCounter += 1;
  return `entry-${Date.now().toString(36)}-${entryCounter.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function responseMessage(value: unknown, fallback: string) {
  return value && typeof value === "object" && "message" in value && typeof value.message === "string"
    ? value.message
    : fallback;
}

function ImageEditor({
  label,
  value,
  onChange,
  onUpload,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex flex-wrap items-center gap-3">
        {value && <Image src={value} alt={`${label} preview`} width={112} height={80} unoptimized className="h-20 w-28 rounded-lg border border-slate-200 bg-white object-cover" />}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {value.startsWith("data:image/") ? (
            <p className="text-sm text-slate-600">Uploaded image</p>
          ) : (
            <input value={value} onChange={(event) => onChange(event.target.value)} maxLength={2048} placeholder="Image URL or public path" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          )}
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ImagePlus size={16} />Upload image
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} className="sr-only" />
            </label>
            {value && <button type="button" onClick={() => onChange("")} className="rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Remove image</button>}
          </div>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-500">PNG, JPEG, or WebP · maximum 500 KB</p>
    </div>
  );
}

export default function CompanyPreviewDetailsPage() {
  const [preview, setPreview] = useState<CompanyPreviewSettings>(DEFAULT_COMPANY_PREVIEW);
  const [cardId, setCardId] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [activeSlide, setActiveSlide] = useState<"about" | "services" | "enquiry">("about");
  const [focusItemId, setFocusItemId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const selectedCardId = new URLSearchParams(window.location.search).get("cardId") || "";
    setCardId(selectedCardId);
    fetch(selectedCardId ? `/api/cards/${encodeURIComponent(selectedCardId)}/preview` : "/api/company")
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok) throw new Error(responseMessage(result, "Unable to load preview details."));
        if (!result || typeof result !== "object" || !("preview" in result) || !isCompanyPreviewSettings(result.preview)) {
          throw new Error("Preview details response is invalid.");
        }
        setPreview(result.preview);
        if (selectedCardId) {
          if (!("isCustom" in result) || typeof result.isCustom !== "boolean") {
            throw new Error("Card preview response is invalid.");
          }
          setIsCustom(result.isCustom);
        }
        setLoaded(true);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load preview details."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!focusItemId) return;
    const item = document.getElementById(`preview-entry-${focusItemId}`);
    if (!item) return;
    item.scrollIntoView({ behavior: "smooth", block: "center" });
    item.focus({ preventScroll: true });
  }, [focusItemId]);

  function updateAbout<K extends keyof CompanyPreviewSettings["about"]>(
    key: K,
    value: CompanyPreviewSettings["about"][K]
  ) {
    setPreview((current) => ({ ...current, about: { ...current.about, [key]: value } }));
  }

  function updateMetric(id: string, key: keyof CompanyMetric, value: string) {
    updateAbout("metrics", preview.about.metrics.map((metric) => metric.id === id ? { ...metric, [key]: value } : metric));
  }

  function updateSection(id: string, key: keyof CompanyAboutSection, value: string) {
    updateAbout("sections", preview.about.sections.map((section) => section.id === id ? { ...section, [key]: value } : section));
  }

  function updateService(id: string, key: keyof CompanyService, value: string) {
    setPreview((current) => ({
      ...current,
      services: {
        ...current.services,
        items: current.services.items.map((service) => service.id === id ? { ...service, [key]: value } : service),
      },
    }));
  }

  function updateEnquiryField<K extends keyof EnquiryField>(id: string, key: K, value: EnquiryField[K]) {
    setPreview((current) => ({
      ...current,
      enquiry: {
        ...current.enquiry,
        fields: current.enquiry.fields.map((field) => field.id === id ? { ...field, [key]: value } : field),
      },
    }));
  }

  function isEnquiryFieldType(value: string): value is EnquiryField["type"] {
    return value === "text" || value === "email" || value === "tel" || value === "textarea";
  }

  function addMetric() {
    const metric = { id: createEntryId(), value: "", label: "" };
    setPreview((current) => ({ ...current, about: { ...current.about, metrics: [...current.about.metrics, metric] } }));
    setFocusItemId(metric.id);
  }

  function addAboutSection() {
    const section = { id: createEntryId(), title: "", content: "", image: "" };
    setPreview((current) => ({ ...current, about: { ...current.about, sections: [...current.about.sections, section] } }));
    setFocusItemId(section.id);
  }

  function addService() {
    const service = { id: createEntryId(), title: "", href: "", description: "", image: "" };
    setPreview((current) => ({ ...current, services: { ...current.services, items: [...current.services.items, service] } }));
    setFocusItemId(service.id);
  }

  function addEnquiryField() {
    const field: EnquiryField = { id: createEntryId(), label: "", placeholder: "", type: "text", required: false };
    setPreview((current) => ({ ...current, enquiry: { ...current.enquiry, fields: [...current.enquiry.fields, field] } }));
    setFocusItemId(field.id);
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 500 * 1024) {
      setError("Choose an image no larger than 500 KB.");
      return;
    }

    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read this image."));
        reader.onerror = () => reject(new Error("Unable to read this image."));
        reader.readAsDataURL(file);
      });
      onChange(image);
      setError("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read this image.");
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(cardId ? `/api/cards/${encodeURIComponent(cardId)}/preview` : "/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview }),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(responseMessage(result, "Unable to save preview details."));
      if (!result || typeof result !== "object" || !("preview" in result) || !isCompanyPreviewSettings(result.preview)) {
        throw new Error("Preview details response is invalid.");
      }
      setPreview(result.preview);
      if (cardId) setIsCustom(true);
      setMessage(cardId ? "This card’s scan preview and WhatsApp message were saved." : "Preview details saved. They will appear on scanned contact pages.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save preview details.");
    } finally {
      setSaving(false);
    }
  }

  async function restoreCompanyDefaults() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/cards/${encodeURIComponent(cardId)}/preview`, { method: "DELETE" });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(responseMessage(result, "Unable to restore company defaults."));
      if (!result || typeof result !== "object" || !("preview" in result) || !isCompanyPreviewSettings(result.preview)) {
        throw new Error("Preview details response is invalid.");
      }
      setPreview(result.preview);
      setIsCustom(false);
      setMessage("This card now uses the company-wide preview defaults.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to restore company defaults.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-4xl">
          <Link href={cardId ? "/my-cards" : "/"} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"><ArrowLeft size={16} />{cardId ? "Back to My Visiting Cards" : "Back to dashboard"}</Link>
          <header className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{cardId ? "Individual card settings" : "Company defaults"}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{cardId ? "Card preview" : "Scan page content"}</h1>
            <p className="mt-1 text-sm text-slate-500">{cardId
              ? "Customize the About Us, Services, Enquiry form, and default WhatsApp message for this card. Until saved, it uses company-wide defaults."
              : "Manage the default About Us, Services, Enquiry content, and WhatsApp message used by cards without custom preview details. Enquiries continue to open the card owner’s email app."}</p>
          </header>

          <div role="group" aria-label="Preview detail slides" className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {([
              { id: "about", label: "About Us" },
              { id: "services", label: "Services" },
              { id: "enquiry", label: "Enquiry Form" },
            ] as const).map(({ id: slide, label }) => (
              <button
                key={slide}
                type="button"
                aria-pressed={activeSlide === slide}
                aria-controls={`preview-details-${slide}`}
                onClick={() => setActiveSlide(slide)}
                className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                  activeSlide === slide ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <section id="preview-details-about" aria-labelledby="preview-details-about-title" hidden={activeSlide !== "about"} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <h2 id="preview-details-about-title" className="text-lg font-bold text-slate-900">About Us</h2>
              <div className="mt-5 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField label="Eyebrow text" value={preview.about.kicker} onChange={(value) => updateAbout("kicker", value)} />
                  <TextField label="Tab label" maxLength={100} value={preview.tabs.about} onChange={(value) => setPreview((current) => ({ ...current, tabs: { ...current.tabs, about: value } }))} />
                  <TextField label="Heading" value={preview.about.title} onChange={(value) => updateAbout("title", value)} />
                </div>
                <TextArea label="Introduction" value={preview.about.description} onChange={(value) => updateAbout("description", value)} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField label="Vision heading" value={preview.about.visionTitle} onChange={(value) => updateAbout("visionTitle", value)} />
                  <TextField label="Mission heading" value={preview.about.missionTitle} onChange={(value) => updateAbout("missionTitle", value)} />
                </div>
                <TextArea label="Vision" value={preview.about.vision} onChange={(value) => updateAbout("vision", value)} />
                <TextArea label="Mission" value={preview.about.mission} onChange={(value) => updateAbout("mission", value)} />
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">Company metrics</h3>
                  <AddButton onClick={addMetric}>Add metric</AddButton>
                </div>
                <div className="space-y-3">
                  {preview.about.metrics.map((metric) => (
                    <div key={metric.id} id={`preview-entry-${metric.id}`} tabIndex={-1} className="grid gap-3 rounded-xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:grid-cols-[1fr_1fr_auto]">
                      <TextField label="Value" value={metric.value} onChange={(value) => updateMetric(metric.id, "value", value)} />
                      <TextField label="Label" value={metric.label} onChange={(value) => updateMetric(metric.id, "label", value)} />
                      <RemoveButton label="Remove metric" onClick={() => updateAbout("metrics", preview.about.metrics.filter((item) => item.id !== metric.id))} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">Additional About Us sections</h3>
                  <AddButton onClick={addAboutSection}>Add section</AddButton>
                </div>
                <div className="space-y-4">
                  {preview.about.sections.map((section) => (
                    <article key={section.id} id={`preview-entry-${section.id}`} tabIndex={-1} className="space-y-4 rounded-xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <div className="flex items-start gap-3">
                        <TextField label="Section heading" value={section.title} onChange={(value) => updateSection(section.id, "title", value)} />
                        <RemoveButton label="Remove section" onClick={() => updateAbout("sections", preview.about.sections.filter((item) => item.id !== section.id))} />
                      </div>
                      <TextArea label="Section content" value={section.content} onChange={(value) => updateSection(section.id, "content", value)} />
                      <ImageEditor label="Section image" value={section.image} onChange={(value) => updateSection(section.id, "image", value)} onUpload={(event) => { void uploadImage(event, (value) => updateSection(section.id, "image", value)); }} />
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="mb-4 font-semibold text-slate-900">Scan page labels</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Call action" maxLength={100} value={preview.labels.call} onChange={(value) => setPreview((current) => ({ ...current, labels: { ...current.labels, call: value } }))} />
                  <TextField label="Contact action" maxLength={100} value={preview.labels.addContact} onChange={(value) => setPreview((current) => ({ ...current, labels: { ...current.labels, addContact: value } }))} />
                  <TextField label="WhatsApp action" maxLength={100} value={preview.labels.whatsapp} onChange={(value) => setPreview((current) => ({ ...current, labels: { ...current.labels, whatsapp: value } }))} />
                  <TextField label="Email action" maxLength={100} value={preview.labels.email} onChange={(value) => setPreview((current) => ({ ...current, labels: { ...current.labels, email: value } }))} />
                  <TextField label="Share action" maxLength={100} value={preview.labels.share} onChange={(value) => setPreview((current) => ({ ...current, labels: { ...current.labels, share: value } }))} />
                  <TextField label="Previous button" maxLength={100} value={preview.labels.previous} onChange={(value) => setPreview((current) => ({ ...current, labels: { ...current.labels, previous: value } }))} />
                  <TextField label="Next button" maxLength={100} value={preview.labels.next} onChange={(value) => setPreview((current) => ({ ...current, labels: { ...current.labels, next: value } }))} />
                </div>
                <TextArea label="Page footer" maxLength={200} value={preview.labels.footer} onChange={(value) => setPreview((current) => ({ ...current, labels: { ...current.labels, footer: value } }))} />
                <TextArea label="Default WhatsApp message" maxLength={2000} value={preview.whatsappMessage} onChange={(value) => setPreview((current) => ({ ...current, whatsappMessage: value }))} />
                <p className="text-xs text-slate-500">Use {"{name}"} to insert the card holder&apos;s name.</p>
              </div>
            </section>

            <section id="preview-details-services" aria-labelledby="preview-details-services-title" hidden={activeSlide !== "services"} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="preview-details-services-title" className="text-lg font-bold text-slate-900">Services</h2>
                  <p className="mt-1 text-sm text-slate-500">Add, edit, or remove service cards and their images.</p>
                </div>
                <AddButton onClick={addService}>Add service</AddButton>
              </div>
              <div className="mb-5 grid gap-5 sm:grid-cols-2">
                <TextField label="Tab label" maxLength={100} value={preview.tabs.services} onChange={(value) => setPreview((current) => ({ ...current, tabs: { ...current.tabs, services: value } }))} />
                <TextField label="Section heading" value={preview.services.title} onChange={(value) => setPreview((current) => ({ ...current, services: { ...current.services, title: value } }))} />
                <TextField label="More link label" maxLength={100} value={preview.services.moreLabel} onChange={(value) => setPreview((current) => ({ ...current, services: { ...current.services, moreLabel: value } }))} />
                <TextField label="More link URL" maxLength={2048} value={preview.services.moreLink} onChange={(value) => setPreview((current) => ({ ...current, services: { ...current.services, moreLink: value } }))} />
              </div>
              <div className="space-y-5">
                {preview.services.items.map((service, index) => (
                  <article key={service.id} id={`preview-entry-${service.id}`} tabIndex={-1} className="space-y-4 rounded-xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-900">Service {index + 1}</h3>
                      <RemoveButton label={`Remove service ${index + 1}`} onClick={() => setPreview((current) => ({ ...current, services: { ...current.services, items: current.services.items.filter((item) => item.id !== service.id) } }))} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField label="Title" value={service.title} onChange={(value) => updateService(service.id, "title", value)} />
                      <TextField label="Link URL" maxLength={2048} value={service.href} onChange={(value) => updateService(service.id, "href", value)} />
                    </div>
                    <TextArea label="Description" value={service.description} onChange={(value) => updateService(service.id, "description", value)} />
                    <ImageEditor label="Service image" value={service.image} onChange={(value) => updateService(service.id, "image", value)} onUpload={(event) => { void uploadImage(event, (value) => updateService(service.id, "image", value)); }} />
                  </article>
                ))}
              </div>
            </section>

            <section id="preview-details-enquiry" aria-labelledby="preview-details-enquiry-title" hidden={activeSlide !== "enquiry"} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <h2 id="preview-details-enquiry-title" className="text-lg font-bold text-slate-900">Enquiry Form</h2>
              <p className="mt-1 text-sm text-slate-500">The form will still address the message to the card owner&apos;s email.</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <TextField label="Tab label" maxLength={100} value={preview.tabs.enquiry} onChange={(value) => setPreview((current) => ({ ...current, tabs: { ...current.tabs, enquiry: value } }))} />
                <TextField label="Form heading" value={preview.enquiry.title} onChange={(value) => setPreview((current) => ({ ...current, enquiry: { ...current.enquiry, title: value } }))} />
                <TextField label="Submit button label" maxLength={100} value={preview.enquiry.submitLabel} onChange={(value) => setPreview((current) => ({ ...current, enquiry: { ...current.enquiry, submitLabel: value } }))} />
                <TextArea label="Introductory text" maxLength={2000} value={preview.enquiry.description} onChange={(value) => setPreview((current) => ({ ...current, enquiry: { ...current.enquiry, description: value } }))} />
              </div>
              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">Form fields</h3>
                  <AddButton onClick={addEnquiryField}>Add field</AddButton>
                </div>
                <div className="space-y-4">
                  {preview.enquiry.fields.map((field, index) => (
                    <article key={field.id} id={`preview-entry-${field.id}`} tabIndex={-1} className="grid gap-4 rounded-xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:grid-cols-2">
                      <div className="flex items-end gap-3">
                        <TextField label={`Field ${index + 1} label`} value={field.label} onChange={(value) => updateEnquiryField(field.id, "label", value)} />
                        <RemoveButton label={`Remove field ${index + 1}`} onClick={() => setPreview((current) => ({ ...current, enquiry: { ...current.enquiry, fields: current.enquiry.fields.filter((item) => item.id !== field.id) } }))} />
                      </div>
                      <TextField label="Placeholder" value={field.placeholder} onChange={(value) => updateEnquiryField(field.id, "placeholder", value)} />
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">Field type</span>
                        <select value={field.type} onChange={(event) => { if (isEnquiryFieldType(event.target.value)) updateEnquiryField(field.id, "type", event.target.value); }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                          <option value="text">Text</option><option value="email">Email</option><option value="tel">Phone</option><option value="textarea">Message area</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
                        <input type="checkbox" checked={field.required} onChange={(event) => updateEnquiryField(field.id, "required", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                        Required
                      </label>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {loading && <p role="status" className="mt-5 text-sm text-slate-500">Loading preview details...</p>}
          {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
          <div className="mt-7 flex justify-end border-t border-slate-200 pt-6">
            <div className="flex flex-wrap justify-end gap-3">
              {cardId && <button type="button" onClick={() => { void restoreCompanyDefaults(); }} disabled={loading || !loaded || saving || !isCustom} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"><RotateCcw size={17} />Use company defaults</button>}
              <button type="button" onClick={() => { void save(); }} disabled={loading || !loaded || saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={17} />{saving ? "Saving..." : "Save preview details"}</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TextField({ label, value, onChange, maxLength = 200 }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number }) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
    </label>
  );
}

function TextArea({ label, value, onChange, maxLength = 10_000 }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} maxLength={maxLength} className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
    </label>
  );
}

function AddButton({ children, onClick }: { children: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"><Plus size={16} />{children}</button>;
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>;
}
