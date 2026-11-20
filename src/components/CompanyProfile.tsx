"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";
import CompanyProfilePrint from "@/components/CompanyProfilePrint";
import type { CompanyPreviewSettings } from "@/lib/company-content";

export default function CompanyProfile({
  recipientEmail,
  preview,
  isActive,
}: {
  recipientEmail: string;
  preview: CompanyPreviewSettings;
  isActive: boolean;
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const tabs = [preview.tabs.about, preview.tabs.services, preview.tabs.enquiry];

  return (
    <section aria-label="Company information" className="company-profile-section mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <nav aria-label="Company information slides" className="company-profile-tabs flex border-b border-slate-200 bg-slate-50/70 px-4">
        {tabs.map((label, index) => (
          <button
            key={index}
            type="button"
            aria-pressed={activeSlide === index}
            onClick={() => setActiveSlide(index)}
            className={`min-w-28 border-b-2 px-5 py-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
              activeSlide === index
                ? "border-[#07518a] text-[#07518a]"
                : "border-transparent text-[#07518a]/70 hover:text-[#07518a]"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="p-5">
        {activeSlide === 0 ? (
          <div role="group" aria-label={preview.tabs.about} className="company-profile-screen space-y-7">
            <header className="mx-auto max-w-3xl text-center">
              {preview.about.kicker && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#07518a]/75">{preview.about.kicker}</p>}
              {preview.about.title && <h2 id="company-about-title" className="mt-2 text-2xl font-bold tracking-tight text-[#07518a]">{preview.about.title}</h2>}
              {preview.about.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#07518a]">{preview.about.description}</p>}
            </header>

            {preview.about.metrics.length > 0 && <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {preview.about.metrics.map((metric) => (
                <div key={metric.id} className="px-4 py-4">
                  <p className="text-2xl font-semibold tracking-tight text-[#07518a]">{metric.value}</p>
                  <p className="mt-1 text-xs leading-5 text-[#07518a]/75">{metric.label}</p>
                </div>
              ))}
            </div>}

            <div className="grid gap-4">
              {(preview.about.visionTitle || preview.about.vision) && <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-justify">
                {preview.about.visionTitle && <h3 className="mt-2 font-semibold text-[#07518a]">{preview.about.visionTitle}</h3>}
                {preview.about.vision && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#07518a]">{preview.about.vision}</p>}
              </article>}
              {(preview.about.missionTitle || preview.about.mission) && <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-justify">
                {preview.about.missionTitle && <h3 className="font-semibold text-[#07518a]">{preview.about.missionTitle}</h3>}
                {preview.about.mission && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#07518a]">{preview.about.mission}</p>}
              </article>}
            </div>
            {preview.about.sections.some((section) => section.title || section.content || section.image) && (
              <div className="grid gap-4">
                {preview.about.sections.filter((section) => section.title || section.content || section.image).map((section) => (
                  <article key={section.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
                    {section.image && <Image src={section.image} alt={section.title} width={960} height={540} unoptimized className="max-h-64 w-full object-cover" />}
                    <div className="p-5">
                      {section.title && <h3 className="font-semibold text-[#07518a]">{section.title}</h3>}
                      {section.content && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#07518a]">{section.content}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : activeSlide === 1 ? (
          <div role="group" aria-label={preview.tabs.services} className="company-profile-screen">
            <header className="mb-6 text-center">
              <h2 id="company-services-title" className="mt-2 text-2xl font-bold tracking-tight text-[#07518a]">{preview.services.title}</h2>
            </header>
            <div className="grid grid-cols-1 gap-4">
              {preview.services.items.filter((service) => service.title || service.description || service.image).map(({ id, title, description, image, href }) => (
                <article key={id} className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300">
                  {image && (href
                    ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`View ${title}`}><Image src={image} alt={title} width={960} height={540} unoptimized className="h-56 w-full object-cover" /></a>
                    : <Image src={image} alt={title} width={960} height={540} unoptimized className="h-56 w-full object-cover" />)}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold leading-6 text-[#07518a]">
                        {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{title}</a> : title}
                      </h3>
                      {href && <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title} page`} title="Open service page" className="shrink-0 rounded p-1 text-[#07518a]/70 hover:bg-slate-100 hover:text-[#07518a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><ArrowUpRight size={16} aria-hidden="true" /></a>}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-justify text-base leading-7 text-[#07518a]">{description}</p>
                  </div>
                </article>
              ))}
            </div>
            {preview.services.moreLabel && preview.services.moreLink && <div className="mt-6 text-right">
              <a
                href={preview.services.moreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded text-sm font-semibold text-[#07518a] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {preview.services.moreLabel} <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>}
          </div>
        ) : (
          <div className="company-profile-screen">
            <EnquiryForm recipientEmail={recipientEmail} settings={preview.enquiry} isActive={isActive} />
          </div>
        )}

        <div className="company-profile-screen mt-7 flex items-center justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => setActiveSlide((current) => Math.max(0, current - 1))}
            disabled={activeSlide === 0}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#07518a] transition-colors hover:bg-slate-100 hover:text-[#07518a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} /> {preview.labels.previous}
          </button>
          <span className="text-xs font-medium tabular-nums text-[#07518a]/75" aria-live="polite">
            {activeSlide + 1} / 3
          </span>
          <button
            type="button"
            onClick={() => setActiveSlide((current) => Math.min(2, current + 1))}
            disabled={activeSlide === 2}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#07518a] transition-colors hover:bg-slate-100 hover:text-[#07518a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {preview.labels.next} <ArrowRight size={16} />
          </button>
        </div>
        <CompanyProfilePrint preview={preview} />
      </div>
    </section>
  );
}
