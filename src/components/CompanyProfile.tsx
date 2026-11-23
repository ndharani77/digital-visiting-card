"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pencil, X } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";
import CompanyProfilePrint from "@/components/CompanyProfilePrint";
import CompanyPreviewDetailsEditor from "@/components/CompanyPreviewDetailsEditor";
import {
  getCompanyCustomTabFieldContent,
  getCompanyPreviewTabOrder,
  isCompanyPreviewTabHidden,
  type CompanyCustomTab,
  type CompanyPreviewSettings,
} from "@/lib/company-content";

type ProfileTab =
  | { id: string; label: string; kind: "about" | "services" | "enquiry" }
  | { id: string; label: string; kind: "custom"; customTab: CompanyCustomTab };

export default function CompanyProfile({
  recipientEmail,
  preview,
  isActive,
  cardId,
  canEditPreview,
  isCustomPreview,
  onPreviewSaved,
}: {
  recipientEmail: string;
  preview: CompanyPreviewSettings;
  isActive: boolean;
  cardId: string;
  canEditPreview: boolean;
  isCustomPreview: boolean;
  onPreviewSaved: (preview: CompanyPreviewSettings, isCustom: boolean) => void;
}) {
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [activeSlide, setActiveSlide] = useState(() => getCompanyPreviewTabOrder(preview)[0] ?? "about");
  const visibleServices = preview.services.items.filter((service) => service.title || service.description || service.image);
  const customTabs = preview.customTabs ?? [];
  const tabs: ProfileTab[] = getCompanyPreviewTabOrder(preview).flatMap((id): ProfileTab[] => {
    if (isCompanyPreviewTabHidden(preview, id)) return [];
    if (id === "about") return [{ id, label: preview.tabs.about, kind: "about" as const }];
    if (id === "services") return [{ id, label: preview.tabs.services, kind: "services" as const }];
    if (id === "enquiry") return [{ id, label: preview.tabs.enquiry, kind: "enquiry" as const }];
    const customTab = customTabs.find((tab) => tab.id === id);
    return customTab ? [{ id, label: customTab.title, kind: "custom" as const, customTab }] : [];
  });
  const selectedSlide = tabs.some((tab) => tab.id === activeSlide) ? activeSlide : tabs[0]?.id ?? "about";
  const selectedTab = tabs.find((tab) => tab.id === selectedSlide);
  const activeSlideIndex = tabs.findIndex((tab) => tab.id === selectedSlide);
  if (tabs.length === 0 && !canEditPreview) return null;

  return (
    <>
    <section aria-label="Company information" className="company-profile-section mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {canEditPreview && <div className="flex justify-end border-b border-slate-200 px-4 py-2">
        <button type="button" onClick={() => setIsEditingPreview(true)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
          <Pencil size={15} />Edit preview
        </button>
      </div>}
      {tabs.length > 0 && <nav aria-label="Company information slides" className="company-profile-tabs flex overflow-x-auto border-b border-slate-200 bg-slate-50/70 px-4">
        {tabs.map((label) => (
          <button
            key={label.id}
            type="button"
            aria-pressed={selectedSlide === label.id}
            onClick={() => setActiveSlide(label.id)}
            className={`min-w-28 shrink-0 border-b-2 px-5 py-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
              selectedSlide === label.id
                ? "company-brand-border company-brand-text"
                : "border-transparent company-brand-text-subtle company-brand-hover"
            }`}
          >
            {label.label}
          </button>
        ))}
      </nav>}

      <div className="p-5">
        {tabs.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">There are no preview tabs to display.</p> : <>
        {selectedSlide === "about" ? (
          <div role="group" aria-label={preview.tabs.about} className="company-profile-screen space-y-7">
            <header className="mx-auto max-w-3xl text-center">
              {preview.about.kicker && <p className="company-brand-text-muted text-xs font-semibold uppercase tracking-[0.16em]">{preview.about.kicker}</p>}
              {preview.about.title && <h2 id="company-about-title" className="company-brand-text mt-2 text-2xl font-bold tracking-tight">{preview.about.title}</h2>}
              {preview.about.description && <p className="company-brand-text mt-3 whitespace-pre-line text-sm leading-6">{preview.about.description}</p>}
            </header>

            {preview.about.metrics.length > 0 && <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {preview.about.metrics.map((metric) => (
                <div key={metric.id} className="px-4 py-4">
                  <p className="company-brand-text text-2xl font-semibold tracking-tight">{metric.value}</p>
                  <p className="company-brand-text-muted mt-1 text-xs leading-5">{metric.label}</p>
                </div>
              ))}
            </div>}

            <div className="grid gap-4">
              {(preview.about.visionTitle || preview.about.vision) && <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-justify">
                {preview.about.visionTitle && <h3 className="company-brand-text mt-2 font-semibold">{preview.about.visionTitle}</h3>}
                {preview.about.vision && <p className="company-brand-text mt-2 whitespace-pre-line text-sm leading-6">{preview.about.vision}</p>}
              </article>}
              {(preview.about.missionTitle || preview.about.mission) && <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-justify">
                {preview.about.missionTitle && <h3 className="company-brand-text font-semibold">{preview.about.missionTitle}</h3>}
                {preview.about.mission && <p className="company-brand-text mt-3 whitespace-pre-line text-sm leading-6">{preview.about.mission}</p>}
              </article>}
            </div>
            {preview.about.sections.some((section) => section.title || section.content || section.image) && (
              <div className="grid gap-4">
                {preview.about.sections.filter((section) => section.title || section.content || section.image).map((section) => (
                  <article key={section.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
                    {section.image && <Image src={section.image} alt={section.title} width={960} height={540} unoptimized className="max-h-64 w-full object-cover" />}
                    <div className="p-5">
                      {section.title && <h3 className="company-brand-text font-semibold">{section.title}</h3>}
                      {section.content && <p className="company-brand-text mt-3 whitespace-pre-line text-sm leading-6">{section.content}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : selectedSlide === "services" ? (
          <div role="group" aria-label={preview.tabs.services} className="company-profile-screen">
            <header className="mb-6 text-center">
              <h2 id="company-services-title" className="company-brand-text mt-2 text-2xl font-bold tracking-tight">{preview.services.title}</h2>
            </header>
            {visibleServices.length > 0 ? <div className="grid grid-cols-1 gap-4">
              {visibleServices.map(({ id, title, description, image, href }) => (
                <article key={id} className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300">
                  {image && (href
                    ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`View ${title}`}><Image src={image} alt={title} width={960} height={540} unoptimized className="h-56 w-full object-cover" /></a>
                    : <Image src={image} alt={title} width={960} height={540} unoptimized className="h-56 w-full object-cover" />)}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="company-brand-text text-base font-bold leading-6">
                        {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{title}</a> : title}
                      </h3>
                      {href && <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title} page`} title="Open service page" className="company-brand-text-subtle company-brand-hover shrink-0 rounded p-1 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><ArrowUpRight size={16} aria-hidden="true" /></a>}
                    </div>
                    <p className="company-brand-text mt-2 whitespace-pre-line text-justify text-base leading-7">{description}</p>
                  </div>
                </article>
              ))}
            </div> : <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">No services have been added yet.</p>}
            {preview.services.moreLabel && preview.services.moreLink && <div className="mt-6 text-right">
              <a
                href={preview.services.moreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="company-brand-text inline-flex items-center gap-1 rounded text-sm font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {preview.services.moreLabel} <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>}
          </div>
        ) : selectedTab?.kind === "custom" ? (
          <div role="group" aria-label={selectedTab.customTab.title} className="company-profile-screen space-y-5">
            {selectedTab.customTab.fields.map((field) => {
              const { heading, description, image } = getCompanyCustomTabFieldContent(field);
              if (!heading && !description && !image) return null;
              return (
                <article key={field.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {image && <Image src={image} alt={heading || selectedTab.customTab.title} width={960} height={540} unoptimized className="max-h-80 w-full object-cover" />}
                  <div className="p-5">
                    {heading && <h3 className="company-brand-text text-base font-bold leading-6">
                      {field.type === "service" && field.href
                        ? <a href={field.href} target="_blank" rel="noopener noreferrer" className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{heading}</a>
                        : heading}
                    </h3>}
                    {description && <p className="company-brand-text mt-2 whitespace-pre-line text-justify text-base leading-7">{description}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="company-profile-screen">
            <EnquiryForm recipientEmail={recipientEmail} settings={preview.enquiry} isActive={isActive} />
          </div>
        )}

        <div className="company-profile-screen mt-7 flex items-center justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => setActiveSlide(tabs[Math.max(0, activeSlideIndex - 1)].id)}
            disabled={activeSlideIndex <= 0}
            className="company-brand-text company-brand-hover inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} /> {preview.labels.previous}
          </button>
          <span className="company-brand-text-muted text-xs font-medium tabular-nums" aria-live="polite">
            {activeSlideIndex + 1} / {tabs.length}
          </span>
          <button
            type="button"
            onClick={() => setActiveSlide(tabs[Math.min(tabs.length - 1, activeSlideIndex + 1)].id)}
            disabled={activeSlideIndex >= tabs.length - 1}
            className="company-brand-text company-brand-hover inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {preview.labels.next} <ArrowRight size={16} />
          </button>
        </div>
        <CompanyProfilePrint preview={preview} />
        </>}
      </div>
    </section>
    {isEditingPreview && <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/40">
      <button type="button" aria-label="Close preview editor" onClick={() => setIsEditingPreview(false)} className="absolute inset-0 h-full w-full cursor-default" />
      <aside role="dialog" aria-modal="true" aria-labelledby="preview-editor-drawer-title" className="relative flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
          <h2 id="preview-editor-drawer-title" className="text-base font-bold text-slate-950">Edit this card preview</h2>
          <button type="button" aria-label="Close preview editor" onClick={() => setIsEditingPreview(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </header>
        <CompanyPreviewDetailsEditor
          embedded
          initialCardId={cardId}
          initialPreview={preview}
          initialIsCustom={isCustomPreview}
          onSaved={onPreviewSaved}
          onClose={() => setIsEditingPreview(false)}
        />
      </aside>
    </div>}
    </>
  );
}
