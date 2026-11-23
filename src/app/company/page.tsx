"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { Building2, Crop, Globe, ImagePlus, MapPin, Save } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { DEFAULT_COMPANY, DEFAULT_COMPANY_LOGO, DEFAULT_WEBSITE } from "@/lib/card-defaults";
import { DEFAULT_COMPANY_PREVIEW, isCompanyPreviewSettings } from "@/lib/company-content";
import { DEFAULT_CARD_APPEARANCE, DEFAULT_COMPANY_THEME, isCardAppearance, isCompanyTheme } from "@/lib/company-theme";
import type { CompanySettings } from "@/lib/company-settings";

const initialSettings: CompanySettings = {
  companyName: DEFAULT_COMPANY,
  address: "",
  website: DEFAULT_WEBSITE,
  logoData: DEFAULT_COMPANY_LOGO,
  preview: DEFAULT_COMPANY_PREVIEW,
  theme: DEFAULT_COMPANY_THEME,
  cardAppearance: DEFAULT_CARD_APPEARANCE,
};

function isCompanySettings(value: unknown): value is CompanySettings {
  return Boolean(
    value &&
    typeof value === "object" &&
    "companyName" in value &&
    typeof value.companyName === "string" &&
    "address" in value &&
    typeof value.address === "string" &&
    "website" in value &&
    typeof value.website === "string" &&
    "logoData" in value &&
    typeof value.logoData === "string" &&
    "theme" in value &&
    isCompanyTheme(value.theme) &&
    "cardAppearance" in value &&
    isCardAppearance(value.cardAppearance) &&
    "preview" in value &&
    isCompanyPreviewSettings(value.preview)
  );
}

function responseMessage(value: unknown, fallback: string) {
  return value && typeof value === "object" && "message" in value && typeof value.message === "string"
    ? value.message
    : fallback;
}

export default function CompanyPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cropSource, setCropSource] = useState("");

  useEffect(() => {
    fetch("/api/company")
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok) throw new Error(responseMessage(result, "Unable to load company settings."));
        if (!isCompanySettings(result)) throw new Error("Company settings response is invalid.");
        setSettings(result);
        setLoaded(true);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load company settings."))
      .finally(() => setLoading(false));
  }, []);

  async function updateLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
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
      setSettings((current) => ({ ...current, logoData }));
      setCropSource("");
      setError("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read this logo file.");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(responseMessage(result, "Unable to save company settings."));
      if (!isCompanySettings(result)) throw new Error("Company settings response is invalid.");
      setSettings(result);
      setMessage("Company settings saved. New cards will use this address and logo by default.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save company settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-3xl">
          <header className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Brand settings</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Card branding</h1>
            <p className="mt-1 text-sm text-slate-500">Manage company details and defaults for new cards.</p>
          </header>

          <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-5">
              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">Company name</span>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Building2 size={17} className="shrink-0 text-slate-400" />
                  <input required maxLength={100} value={settings.companyName} onChange={(event) => setSettings((current) => ({ ...current, companyName: event.target.value }))} className="w-full bg-transparent px-3 py-3 text-sm outline-none" />
                </div>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">Company address</span>
                <div className="flex items-start rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <MapPin size={17} className="mt-3 shrink-0 text-slate-400" />
                  <textarea
                    maxLength={250}
                    rows={3}
                    value={settings.address}
                    onChange={(event) => setSettings((current) => ({ ...current, address: event.target.value }))}
                    className="w-full resize-y bg-transparent px-3 py-3 text-sm outline-none"
                  />
                </div>
                <span className="mt-1 block text-xs text-slate-500">Used as the default address on new cards. You can change it on each card.</span>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">Website</span>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <Globe size={17} className="shrink-0 text-slate-400" />
                  <input required type="url" maxLength={2048} value={settings.website} onChange={(event) => setSettings((current) => ({ ...current, website: event.target.value }))} className="w-full bg-transparent px-3 py-3 text-sm outline-none" />
                </div>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">WhatsApp default message</span>
                <textarea
                  maxLength={2000}
                  rows={4}
                  value={settings.preview.whatsappMessage}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    preview: { ...current.preview, whatsappMessage: event.target.value },
                  }))}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  aria-describedby="whatsapp-message-help"
                />
                <span id="whatsapp-message-help" className="mt-1 block text-xs text-slate-500">Use {"{name}"} to insert the card owner&apos;s name.</span>
              </label>

              <div>
                <span className="mb-2 block text-sm font-semibold text-slate-700">Company logo</span>
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() => { setCropSource(settings.logoData); setError(""); }}
                    aria-label="Crop company logo"
                    title="Click to crop logo"
                    className="group relative h-16 w-16 overflow-hidden rounded-lg bg-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <img src={settings.logoData} alt="" className="h-full w-full object-contain" />
                    <span className="absolute inset-0 flex items-center justify-center gap-1 bg-slate-900/60 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      <Crop size={14} />Crop
                    </span>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                      <ImagePlus size={16} />Choose logo
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { void updateLogo(event); }} className="sr-only" />
                    </label>
                    <button type="button" onClick={() => { setSettings((current) => ({ ...current, logoData: DEFAULT_COMPANY_LOGO })); setCropSource(""); setError(""); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Restore default</button>
                  </div>
                  <p className="w-full text-xs text-slate-500">PNG, JPEG, or WebP · maximum 500 KB</p>
                </div>
              </div>

              {cropSource && (
                <LogoCropEditor
                  source={cropSource}
                  onCancel={() => setCropSource("")}
                  onApply={(logoData) => {
                    setSettings((current) => ({ ...current, logoData }));
                    setCropSource("");
                    setError("");
                    setMessage("");
                  }}
                />
              )}
            </div>

            {loading && <p role="status" className="mt-5 text-sm text-slate-500">Loading company settings...</p>}
            {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {message && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
              <button disabled={loading || !loaded || saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={17} />{saving ? "Saving..." : "Save company settings"}</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

type CropAspect = "square" | "landscape" | "portrait" | "original";

function isCropAspect(value: string): value is CropAspect {
  return value === "square" || value === "landscape" || value === "portrait" || value === "original";
}

function createCroppedLogo(
  image: HTMLImageElement,
  ratio: number,
  scale: number,
  horizontal: number,
  vertical: number,
  overflowX: number,
  overflowY: number
) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = Math.round(canvas.width / ratio);
  const context = canvas.getContext("2d");
  if (!context) return null;

  const viewportWidth = 240;
  const viewportHeight = viewportWidth / ratio;
  const cropWidth = viewportWidth / scale;
  const cropHeight = viewportHeight / scale;
  const sourceX = Math.max(0, (overflowX * horizontal / 100) / scale);
  const sourceY = Math.max(0, (overflowY * vertical / 100) / scale);
  context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.9);
}

function LogoCropEditor({
  source,
  onCancel,
  onApply,
}: {
  source: string;
  onCancel: () => void;
  onApply: (logoData: string) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [previewLogo, setPreviewLogo] = useState("");
  const [aspect, setAspect] = useState<CropAspect>("square");
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(50);
  const [vertical, setVertical] = useState(50);
  const [error, setError] = useState("");
  const viewportWidth = 240;

  useEffect(() => {
    setImage(null);
    setPreviewLogo("");
    const sourceImage = new window.Image();
    sourceImage.onload = () => setImage(sourceImage);
    sourceImage.onerror = () => setError("Unable to load this logo for cropping.");
    sourceImage.src = source;
    return () => {
      sourceImage.onload = null;
      sourceImage.onerror = null;
    };
  }, [source]);

  const ratio = image
    ? aspect === "square" ? 1
      : aspect === "landscape" ? 3
        : aspect === "portrait" ? 0.75
          : image.naturalWidth / image.naturalHeight
    : 1;
  const viewportHeight = viewportWidth / ratio;
  const scale = image ? Math.max(viewportWidth / image.naturalWidth, viewportHeight / image.naturalHeight) * zoom : 1;
  const renderedWidth = image ? image.naturalWidth * scale : viewportWidth;
  const renderedHeight = image ? image.naturalHeight * scale : viewportHeight;
  const overflowX = Math.max(0, renderedWidth - viewportWidth);
  const overflowY = Math.max(0, renderedHeight - viewportHeight);
  const imageLeft = -(overflowX * horizontal / 100);
  const imageTop = -(overflowY * vertical / 100);

  useEffect(() => {
    if (!image) return;
    const croppedLogo = createCroppedLogo(image, ratio, scale, horizontal, vertical, overflowX, overflowY);
    if (croppedLogo) setPreviewLogo(croppedLogo);
    else setError("Unable to prepare the cropped logo preview.");
  }, [image, ratio, scale, horizontal, vertical, overflowX, overflowY]);

  function applyCrop() {
    if (!image) return;
    const logoData = createCroppedLogo(image, ratio, scale, horizontal, vertical, overflowX, overflowY);
    if (!logoData) {
      setError("Unable to prepare the cropped logo.");
      return;
    }

    if (logoData.length > 700_000) {
      setError("The cropped logo is too large to save. Choose a smaller image.");
      return;
    }
    onApply(logoData);
  }

  return (
    <section aria-label="Crop company logo" className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Crop company logo</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a shape, adjust the crop, then apply it.</p>
        </div>
        <label className="text-sm font-semibold text-slate-700">
          Crop shape
          <select
            value={aspect}
            onChange={(event) => {
              if (isCropAspect(event.target.value)) {
                setAspect(event.target.value);
                setHorizontal(50);
                setVertical(50);
              }
            }}
            className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-normal"
          >
            <option value="square">Square</option>
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
            <option value="original">Original shape</option>
          </select>
        </label>
      </div>

      {image ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-center">
          <div
            className="relative mx-auto overflow-hidden rounded-lg border-2 border-blue-500 bg-white shadow-sm"
            style={{ width: viewportWidth, height: viewportHeight }}
          >
            <img
              src={source}
              alt="Logo crop preview"
              className="absolute max-w-none"
              style={{ width: renderedWidth, height: renderedHeight, left: imageLeft, top: imageTop }}
            />
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Zoom
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 block w-full accent-blue-600" />
            </label>
            {overflowX > 0 && <label className="block text-sm font-medium text-slate-700">
              Horizontal position
              <input type="range" min="0" max="100" value={horizontal} onChange={(event) => setHorizontal(Number(event.target.value))} className="mt-2 block w-full accent-blue-600" />
            </label>}
            {overflowY > 0 && <label className="block text-sm font-medium text-slate-700">
              Vertical position
              <input type="range" min="0" max="100" value={vertical} onChange={(event) => setVertical(Number(event.target.value))} className="mt-2 block w-full accent-blue-600" />
            </label>}
          </div>
        </div>
      ) : (
        <p role={error ? "alert" : "status"} className={`mt-5 text-sm ${error ? "text-red-600" : "text-slate-500"}`}>{error || "Loading image..."}</p>
      )}

      {image && (
        <div className="mt-7 border-t border-blue-100 pt-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-800">QR scan preview</h3>
            <p className="mt-1 text-xs text-slate-500">The logo updates live. Contact details are sample placeholders.</p>
          </div>
          <section aria-label="QR scanned card preview" className="relative mx-auto max-w-[430px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
            <svg aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-[100px] w-[56%]" viewBox="0 0 240 112" preserveAspectRatio="none">
              <path d="M0 0h240v112C184 53 103 10 0 0Z" fill="var(--company-brand-color)" />
              <path d="M0 0C103 10 184 53 240 112" fill="none" stroke="#d8e6f2" strokeWidth="3" />
              <path d="M86 0C155 17 207 57 240 101" fill="none" stroke="#a9c5df" strokeWidth="2" />
            </svg>
            <header className="relative z-10 px-5 pt-5">
              {previewLogo ? (
                <img src={previewLogo} alt="Cropped logo in QR scan card" className="h-10 w-[150px] max-w-full object-contain object-left" />
              ) : (
                <span className="flex h-10 w-[150px] items-center text-xs text-slate-400">Preparing preview...</span>
              )}
            </header>
            <div className="relative z-10 mt-8 px-5">
              <div className="w-fit max-w-full">
                <h4 className="break-words text-xl font-bold leading-tight tracking-tight text-[var(--company-brand-dark)]">Contact name</h4>
                <div className="mt-2 h-[2px] w-full rounded-full bg-gradient-to-r from-[var(--company-brand-light)] via-[var(--company-brand-color)] to-[var(--company-brand-dark)]" />
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-600">Job title</p>
            </div>
            <div className="relative z-10 space-y-3 px-5 pb-5 pt-6 text-sm text-[var(--company-brand-dark)]">
              <p className="border-b border-slate-100 pb-2">Phone number</p>
              <p className="border-b border-slate-100 pb-2">Email address</p>
              <p className="text-slate-500">Website (if available)</p>
            </div>
          </section>
        </div>
      )}

      {error && image && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="button" onClick={applyCrop} disabled={!image} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Apply crop</button>
      </div>
    </section>
  );
}
