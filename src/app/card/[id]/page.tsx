"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, LoaderCircle, Mail, MapPin, Phone, Linkedin, MessageCircle, Share2, Facebook, Link2, UserPlus, X } from "lucide-react";
import VisitingCardFace from "@/components/VisitingCardFace";
import QRCodeDownloads from "@/components/QRCodeDownloads";
import CompanyProfile from "@/components/CompanyProfile";
import CardPreviewPdfDownload from "@/components/CardPreviewPdfDownload";
import type { VisitingCard } from "@/lib/types";
import { createVCard } from "@/lib/vcard";
import {
  isCompanyPreviewSettings,
  mergeCardPreviewWithCompanyDefaults,
  type CompanyPreviewSettings,
} from "@/lib/company-content";
import { DEFAULT_COMPANY_THEME, normalizeCompanyTheme, type CompanyTheme } from "@/lib/company-theme";

type CompanyBranding = { companyName: string; logoData: string };

function oklabToRgb(lightness: number, a: number, b: number, alpha?: string) {
  const l = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const m = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const s = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l * l * l;
  const m3 = m * m * m;
  const s3 = s * s * s;
  const channels = [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
  const toSrgb = (channel: number) => {
    const linear = Math.max(0, Math.min(1, channel));
    const srgb = linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055;
    return Math.round(srgb * 255);
  };
  const rgb = channels.map(toSrgb).join(" ");
  if (!alpha) return `rgb(${rgb})`;
  const opacity = alpha.endsWith("%") ? Number(alpha.slice(0, -1)) / 100 : Number(alpha);
  return `rgb(${rgb} / ${Math.max(0, Math.min(1, opacity))})`;
}

function colorFunctionsToRgb(value: string) {
  return value
    .replace(/oklch\(([^()]*)\)/gi, (_color, components: string) => {
      const [colorChannels, alpha] = components.split("/").map((part) => part.trim());
      const [lightness, chroma, hue] = colorChannels.split(/\s+/).map(Number);
      return oklabToRgb(lightness / 100, chroma * Math.cos(hue * Math.PI / 180), chroma * Math.sin(hue * Math.PI / 180), alpha);
    })
    .replace(/oklab\(([^()]*)\)/gi, (_color, components: string) => {
      const [colorChannels, alpha] = components.split("/").map((part) => part.trim());
      const [lightness, a, b] = colorChannels.split(/\s+/).map(Number);
      return oklabToRgb(lightness, a, b, alpha);
    })
    .replace(/\s+in\s+oklab(?=[,)]|$)/gi, "");
}

async function createPreviewPdf(fileName: string) {
  const pages = Array.from(document.querySelectorAll<HTMLElement>(".pdf-export-page"));
  const servicePageCount = document.querySelectorAll(".company-profile-service-page").length;
  if (servicePageCount === 0 || pages.length !== servicePageCount + 2) {
    throw new Error("The full card preview is not ready to download.");
  }
  const exportRoot = document.querySelector<HTMLElement>(".public-card-page-content");
  if (!exportRoot) throw new Error("The card preview is not ready to download.");

  const images = pages.flatMap((page) => Array.from(page.querySelectorAll("img")));
  images.forEach((image) => {
    image.loading = "eager";
  });
  await Promise.all(images.map((image) => image.decode()));

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const rootStyle = getComputedStyle(document.documentElement);
  const legacyColorTokens = Array.from(rootStyle)
    .filter((property) => property.startsWith("--color-"))
    .map((property) => [property, colorFunctionsToRgb(rootStyle.getPropertyValue(property).trim())] as const);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const colorProperties = [
    "color",
    "background-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
    "caret-color",
    "column-rule-color",
    "-webkit-text-fill-color",
    "-webkit-text-stroke-color",
    "box-shadow",
    "text-shadow",
    "background-image",
    "--tw-gradient-stops",
    "--tw-gradient-via-stops",
    "--tw-gradient-position",
  ];

  for (const [index, page] of pages.entries()) {
    const canvas = await html2canvas(page, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      imageTimeout: 15000,
      logging: false,
      onclone: (clonedDocument) => {
        const clonedWindow = clonedDocument.defaultView;
        if (!clonedWindow) return;
        for (const [property, value] of legacyColorTokens) {
          clonedDocument.documentElement.style.setProperty(property, value);
        }
        const clonedPage = clonedDocument.querySelectorAll<HTMLElement>(".pdf-export-page")[index];
        if (!clonedPage) return;
        const elements = [clonedPage, ...Array.from(clonedPage.querySelectorAll<HTMLElement | SVGElement>("*"))];
        for (const element of elements) {
          const computedStyle = clonedWindow.getComputedStyle(element);
          for (const property of colorProperties) {
            const value = computedStyle.getPropertyValue(property);
            if (!/oklch|oklab/i.test(value)) continue;
            const compatibleValue = colorFunctionsToRgb(value);
            if (compatibleValue !== value) element.style.setProperty(property, compatibleValue);
          }
        }
      },
    });
    const imageData = canvas.toDataURL("image/jpeg", 0.95);
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    const imageWidth = canvas.width * ratio;
    const imageHeight = canvas.height * ratio;

    if (index > 0) pdf.addPage();
    pdf.addImage(imageData, "JPEG", (pageWidth - imageWidth) / 2, margin, imageWidth, imageHeight);
  }

  pdf.save(fileName);
}

export default function PublicCardPage({ params }: { params: Promise<{ id: string }> }) {
  const [card, setCard] = useState<VisitingCard | null>(null);
  const [companyPreview, setCompanyPreview] = useState<CompanyPreviewSettings | null>(null);
  const [companyBranding, setCompanyBranding] = useState<CompanyBranding | null>(null);
  const [companyTheme, setCompanyTheme] = useState<CompanyTheme>(DEFAULT_COMPANY_THEME);
  const [canEditCardPreview, setCanEditCardPreview] = useState(false);
  const [isCardPreviewCustom, setIsCardPreviewCustom] = useState(false);
  const [defaultServiceIds, setDefaultServiceIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [id, setId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isQrVisit, setIsQrVisit] = useState<boolean | null>(null);
  const [canReturnToDashboard, setCanReturnToDashboard] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [shareOptionsOpen, setShareOptionsOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    params.then(({ id: cardId }) => {
      setId(cardId);
      setQrUrl(`${window.location.origin}/card/${cardId}?source=qr`);
      setIsQrVisit(new URLSearchParams(window.location.search).get("source") === "qr");
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;
    const qrVisit = new URLSearchParams(window.location.search).get("source") === "qr";
    async function loadCard() {
      try {
        const response = await fetch(`/api/public/cards/${encodeURIComponent(id)}`);
        const result: unknown = await response.json();
        if (!response.ok) {
          const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
            ? result.message
            : "Card not found.";
          throw new Error(message);
        }
        if (!result || typeof result !== "object" || !("card" in result) || !("company" in result)) {
          throw new Error("Visiting card details are invalid.");
        }
        const loadedCard = result.card as VisitingCard;
        const company = result.company as {
          companyName?: unknown;
          logoData?: unknown;
          preview?: unknown;
          theme?: unknown;
        };
        if (
          typeof company.companyName !== "string" ||
          typeof company.logoData !== "string" ||
          !isCompanyPreviewSettings(company.preview)
        ) {
          throw new Error("Company branding details are invalid.");
        }
        if (loadedCard.preview !== undefined && !isCompanyPreviewSettings(loadedCard.preview)) {
          throw new Error("Card preview details are invalid.");
        }
        setCompanyTheme(normalizeCompanyTheme(company.theme));
        setCard(loadedCard);
        if (!qrVisit) return;
        setCompanyPreview(mergeCardPreviewWithCompanyDefaults(company.preview, loadedCard.preview));
        setCompanyBranding({ companyName: company.companyName, logoData: company.logoData });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load card.");
      }
    }
    void loadCard();
  }, [id]);

  useEffect(() => {
    if (!id || isQrVisit !== true) return;
    let cancelled = false;
    async function checkCardPreviewAccess() {
      try {
        const response = await fetch(`/api/cards/${encodeURIComponent(id)}/preview`);
        if (response.status === 401 || response.status === 403 || response.status === 404) return;
        const result: unknown = await response.json();
        if (!response.ok) {
          const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
            ? result.message
            : "Unable to verify preview editing access.";
          throw new Error(message);
        }
        if (!result || typeof result !== "object" || !("preview" in result) ||
            !isCompanyPreviewSettings(result.preview) ||
            !("isCustom" in result) || typeof result.isCustom !== "boolean" ||
            !("defaultServiceIds" in result) || !Array.isArray(result.defaultServiceIds) ||
            !result.defaultServiceIds.every((serviceId) => typeof serviceId === "string")) {
          throw new Error("Card preview access response is invalid.");
        }
        if (!cancelled) {
          setCanEditCardPreview(true);
          setCompanyPreview(result.preview);
          setIsCardPreviewCustom(result.isCustom);
          setDefaultServiceIds(result.defaultServiceIds);
        }
      } catch (accessError) {
        if (!cancelled) console.error("Unable to verify card preview editing access.", accessError);
      }
    }
    void checkCardPreviewAccess();
    return () => { cancelled = true; };
  }, [id, isQrVisit]);

  useEffect(() => {
    if (isQrVisit !== true) return;
    let cancelled = false;
    async function checkDashboardAccess() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.status === 401) return;
        if (!response.ok) throw new Error("Unable to verify dashboard access.");
        if (!cancelled) setCanReturnToDashboard(true);
      } catch (accessError) {
        if (!cancelled) console.error("Unable to verify dashboard access from the card preview.", accessError);
      }
    }
    void checkDashboardAccess();
    return () => { cancelled = true; };
  }, [isQrVisit]);

  useEffect(() => {
    document.documentElement.dataset.companyTheme = companyTheme;
    return () => { document.documentElement.dataset.companyTheme = DEFAULT_COMPANY_THEME; };
  }, [companyTheme]);

  async function shareCard() {
    if (!card?.isActive || !qrUrl) return;
    const shareData = {
      title: `${card.fullName} | Digital Visiting Card`,
      text: `Contact ${card.fullName}`,
      url: qrUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(qrUrl);
        window.alert("Card link copied.");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setContactError(err instanceof Error ? err.message : "Unable to share this card.");
    }
  }

  async function copyCardLink() {
    if (!card?.isActive || !qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setShareMessage("Card link copied.");
    } catch (err) {
      setShareMessage(err instanceof Error ? "Unable to copy the card link in this browser." : "Unable to copy the card link.");
    }
  }

  async function addToContacts() {
    if (!card?.isActive) return;
    setContactError("");
    setContactMessage("");
    if (!window.confirm(`Continue to add ${card.fullName} to your contacts? Choose Contacts in the next screen, then tap Save or Done.`)) return;

    const fileName = `${card.fullName.replace(/[^a-z0-9-_]/gi, "_") || "contact"}.vcf`;
    const contactFile = new File([createVCard(card)], fileName, { type: "text/vcard" });
    if (!navigator.canShare?.({ files: [contactFile] })) {
      setContactMessage("Opening the contact file. Choose Contacts, then tap Save or Done to finish.");
      window.location.assign(`/api/public/cards/${encodeURIComponent(id)}/vcf`);
      return;
    }

    try {
      await navigator.share({ files: [contactFile], title: card.fullName });
      setContactMessage("If you chose Contacts, tap Save or Done there to finish adding this contact.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setContactError(err instanceof Error ? err.message : "Unable to open the contact-saving menu.");
    }
  }

  async function downloadPreviewPdf() {
    if (!card || isPdfLoading) return;
    setPdfError("");
    setIsPdfLoading(true);
    document.body.classList.add("pdf-exporting");
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await document.fonts.ready;
      const safeName = card.fullName.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
      await createPreviewPdf(`${safeName || "visiting-card"}-preview.pdf`);
    } catch (err) {
      console.error("Unable to create the visiting card PDF.", err);
      setPdfError(err instanceof Error ? `Unable to create the PDF: ${err.message}` : "Unable to create the PDF. Please try again.");
    } finally {
      document.body.classList.remove("pdf-exporting");
      setIsPdfLoading(false);
    }
  }

  if (error) return <main className="flex min-h-screen items-center justify-center p-6"><div className="rounded-2xl bg-white p-8 text-center shadow"><h1 className="text-xl font-bold">Card unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p>{(isQrVisit === false || canReturnToDashboard) && <Link href="/" className="mt-5 inline-flex items-center gap-2 text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link>}</div></main>;
  if (!card) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-sm text-slate-500">{canReturnToDashboard && <Link href="/" className="inline-flex items-center gap-2 text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link>}Loading digital visiting card...</main>;
  if (isQrVisit && (!companyPreview || !companyBranding)) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-sm text-slate-500">{canReturnToDashboard && <Link href="/" className="inline-flex items-center gap-2 text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link>}Loading digital visiting card...</main>;
  const formattedMobile = card.mobile.replace(/^(\d{5})(\d{5})$/, "$1 $2");
  const phoneNumber = `${card.countryCode || "+91"} ${formattedMobile}`;
  const phoneHref = `${card.countryCode || "+91"}${card.mobile}`;
  const whatsappNumber = phoneHref.replace(/\D/g, "");
  return (
    <main className={isQrVisit ? "public-card-page min-h-screen bg-[#f3f6fa] px-3 py-6" : "min-h-screen bg-slate-50 px-4 py-12"}>
      {isPdfLoading && <div role="status" className="fixed inset-0 z-[100] flex items-center justify-center bg-white/85 text-sm font-semibold text-slate-700">
        <LoaderCircle size={20} className="mr-2 animate-spin" aria-hidden="true" /> Preparing your PDF…
      </div>}
      <div className={`public-card-page-content mx-auto ${isQrVisit ? "max-w-[430px]" : "max-w-xl"}`}>
        {(isQrVisit === false || canReturnToDashboard) && <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link>}
        {isQrVisit ? (
          <section className="pdf-export-page public-card-cover-pdf relative mx-auto max-w-[430px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
            <svg aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-[100px] w-[56%]" viewBox="0 0 240 112" preserveAspectRatio="none">
              <path d="M0 0h240v112C184 53 103 10 0 0Z" fill="var(--company-brand-color)" />
              <path d="M0 0C103 10 184 53 240 112" fill="none" stroke="#d8e6f2" strokeWidth="3" />
              <path d="M86 0C155 17 207 57 240 101" fill="none" stroke="#a9c5df" strokeWidth="2" />
            </svg>
            <header className="relative z-10 px-5 pt-5">
              <img src={card.logoData || companyBranding?.logoData || "/brihaspathi-brand.webp"} alt={companyBranding?.companyName || "Company"} className="h-10 w-[150px] max-w-full object-contain object-left" />
            </header>

            <div className="relative z-10 mt-10 px-5">
              <div className="w-fit max-w-full">
                <h1 className="break-words text-xl font-bold leading-tight tracking-tight text-[var(--company-brand-dark)]">{card.fullName}</h1>
                <div className="mt-2 h-[2px] w-full rounded-full bg-gradient-to-r from-[var(--company-brand-light)] via-[var(--company-brand-color)] to-[var(--company-brand-dark)] shadow-[0_0_6px_rgba(45,131,197,0.55)]" />
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-600">{card.designation}</p>
            </div>

            <div className="relative z-10 space-y-3 px-5 pb-1 pt-6 text-[var(--company-brand-dark)]">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"><Phone size={15} /></span>
                <span className="h-7 w-px shrink-0 bg-slate-300" />
                {card.isActive
                  ? <a href={`tel:${phoneHref}`} className="min-w-0 break-all text-sm font-bold hover:underline">{phoneNumber}</a>
                  : <span aria-disabled="true" className="min-w-0 break-all text-sm font-bold">{phoneNumber}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"><Mail size={15} /></span>
                <span className="h-7 w-px shrink-0 bg-slate-300" />
                {card.isActive
                  ? <a href={`mailto:${card.email}`} className="min-w-0 break-all text-sm font-bold hover:underline">{card.email}</a>
                  : <span aria-disabled="true" className="min-w-0 break-all text-sm font-bold">{card.email}</span>}
              </div>
              {card.address && <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"><MapPin size={15} /></span>
                <span className="mt-0.5 min-h-7 w-px shrink-0 self-stretch bg-slate-300" />
                {card.isActive
                  ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.address)}`} target="_blank" rel="noopener noreferrer" className="min-w-0 whitespace-pre-line text-sm leading-[1.4] hover:underline">{card.address}</a>
                  : <span aria-disabled="true" className="min-w-0 whitespace-pre-line text-sm leading-[1.4]">{card.address}</span>}
              </div>}
              {card.website && <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"><Globe size={15} /></span>
                <span className="h-7 w-px shrink-0 bg-slate-300" />
                {card.isActive
                  ? <a href={card.website} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all text-sm hover:underline">{card.website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</a>
                  : <span aria-disabled="true" className="min-w-0 break-all text-sm">{card.website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</span>}
              </div>}
              {card.linkedin && <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"><Linkedin size={15} /></span>
                <span className="h-7 w-px shrink-0 bg-slate-300" />
                {card.isActive
                  ? <a href={card.linkedin} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all text-sm hover:underline">{card.linkedinName?.trim() || card.fullName}</a>
                  : <span aria-disabled="true" className="min-w-0 break-all text-sm">{card.linkedinName?.trim() || card.fullName}</span>}
              </div>}
            </div>

            <div className="relative z-10 mx-5 mt-5 border-t border-slate-200">
              <div className="card-contact-actions grid grid-cols-6 gap-y-4 py-4">
                {card.isActive ? <a aria-label={companyPreview?.labels.call} href={`tel:${phoneHref}`} className="company-brand-hover flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700">
                  <span className="company-brand-text flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><Phone size={18} /></span>{companyPreview?.labels.call}
                </a> : <span aria-disabled="true" className="flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700">
                  <span className="company-brand-text flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><Phone size={18} /></span>{companyPreview?.labels.call}
                </span>}
                <button aria-label={companyPreview?.labels.addContact} title={companyPreview?.labels.addContact} type="button" onClick={addToContacts} disabled={!card.isActive} className="company-brand-hover flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                  <span className="company-brand-text flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><UserPlus size={18} /></span><span className="whitespace-nowrap">{companyPreview?.labels.addContact}</span>
                </button>
                {card.isActive ? <a aria-label={companyPreview?.labels.whatsapp} href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(companyPreview?.whatsappMessage.replace(/\{name\}/gi, card.fullName) || "")}`} target="_blank" rel="noreferrer" className="company-brand-hover flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700">
                  <span className="company-brand-text flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><MessageCircle size={18} /></span>{companyPreview?.labels.whatsapp}
                </a> : <span aria-disabled="true" className="flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700">
                  <span className="company-brand-text flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><MessageCircle size={18} /></span>{companyPreview?.labels.whatsapp}
                </span>}
                {card.isActive ? <a aria-label={companyPreview?.labels.email} href={`mailto:${card.email}`} className="company-brand-hover flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700">
                  <span className="company-brand-text flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><Mail size={18} /></span>{companyPreview?.labels.email}
                </a> : <span aria-disabled="true" className="flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700">
                  <span className="company-brand-text flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><Mail size={18} /></span>{companyPreview?.labels.email}
                </span>}
                <button aria-label={companyPreview?.labels.share} type="button" disabled={!card.isActive} onClick={() => { setShareOptionsOpen(true); setShareMessage(""); }} className="company-brand-hover flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                  <span className="company-brand-text flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><Share2 size={18} /></span>{companyPreview?.labels.share}
                </button>
                {card.isActive && companyBranding && <CardPreviewPdfDownload isLoading={isPdfLoading} onClick={downloadPreviewPdf} />}
              </div>
              {card.isActive && pdfError && <p role="alert" className="card-action-feedback mb-3 text-center text-sm text-red-600">{pdfError}</p>}
              {card.isActive && contactError && <p role="alert" className="card-action-feedback mb-3 text-center text-sm text-red-600">{contactError}</p>}
              {card.isActive && contactMessage && <p role="status" className="card-action-feedback mb-3 text-center text-sm text-slate-600">{contactMessage}</p>}
            </div>
          </section>
        ) : (
          <VisitingCardFace {...card} qrUrl={qrUrl} linksClickable />
        )}

        {isQrVisit === false && <QRCodeDownloads name={card.fullName} value={qrUrl} />}
        {isQrVisit && companyPreview && (
          <CompanyProfile
            recipientEmail={card.email}
            preview={companyPreview}
            isActive={card.isActive}
            cardId={id}
            canEditPreview={canEditCardPreview}
            isCustomPreview={isCardPreviewCustom}
            defaultServiceIds={defaultServiceIds}
            onPreviewSaved={(updatedPreview, isCustom) => {
              setCompanyPreview(updatedPreview);
              setIsCardPreviewCustom(isCustom);
            }}
          />
        )}

        {card.isActive && shareOptionsOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShareOptionsOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="share-dialog-title" className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="share-dialog-title" className="text-lg font-bold text-slate-900">{companyPreview?.labels.shareDialogTitle ?? "Share this contact"}</h2>
                <p className="mt-1 text-sm text-slate-500">{card.fullName}</p>
              </div>
              <button type="button" onClick={() => setShareOptionsOpen(false)} aria-label="Close share options" className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">Close</button>
            </div>
            <div className="grid max-h-[55vh] grid-cols-3 gap-3 overflow-y-auto">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Here's ${card.fullName}'s digital visiting card:\n${qrUrl}`)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-green-50">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white"><MessageCircle size={23} /></span>WhatsApp
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(qrUrl)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-blue-50">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] text-white"><Facebook size={23} /></span>Facebook
              </a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(qrUrl)}&text=${encodeURIComponent(`Contact ${card.fullName}`)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-slate-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white"><X size={23} /></span>X
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(qrUrl)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-blue-50">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white"><Linkedin size={23} /></span>LinkedIn
              </a>
              <a href={`mailto:?subject=${encodeURIComponent(`${card.fullName} | Digital Visiting Card`)}&body=${encodeURIComponent(qrUrl)}`} className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-slate-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-white"><Mail size={23} /></span>Email
              </a>
              <button type="button" onClick={copyCardLink} className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-slate-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-800"><Link2 size={23} /></span>Copy link
              </button>
            </div>
            {shareMessage && <p role="status" className="mt-4 text-center text-sm text-slate-600">{shareMessage}</p>}
            <button type="button" onClick={shareCard} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Share2 size={17} /> More sharing options
            </button>
          </section>
        </div>}

        {(isQrVisit ? companyPreview?.labels.footer : "Digital contact card · Powered by Card Reader") && (
          <p className={`${isQrVisit ? "public-card-page-footer" : ""} mt-5 text-center text-xs text-slate-400`}>{isQrVisit ? companyPreview?.labels.footer : "Digital contact card · Powered by Card Reader"}</p>
        )}
      </div>
    </main>
  );
}
