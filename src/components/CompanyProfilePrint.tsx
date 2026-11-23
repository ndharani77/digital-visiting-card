import Image from "next/image";
import type { ReactNode } from "react";
import {
  getCompanyCustomTabFieldContent,
  getCompanyPreviewTabOrder,
  isCompanyPreviewTabHidden,
  type CompanyPreviewSettings,
} from "@/lib/company-content";

export default function CompanyProfilePrint({ preview }: { preview: CompanyPreviewSettings }) {
  const services = preview.services.enabled === false
    ? []
    : preview.services.items.filter((service) => service.title || service.description || service.image);

  const slides: Record<string, ReactNode[]> = {
    about: [
      <section key="about" aria-label={preview.tabs.about} className="pdf-export-page company-profile-print-slide company-profile-about-page space-y-7">
        <header className="mx-auto max-w-3xl text-center">
          {preview.about.kicker && <p className="company-brand-text-muted text-xs font-semibold uppercase tracking-[0.16em]">{preview.about.kicker}</p>}
          {preview.about.title && <h2 className="company-brand-text mt-2 text-2xl font-bold tracking-tight">{preview.about.title}</h2>}
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
      </section>,
    ],
    services: services.map(({ id, title, description, image, href }, index) => (
      <section key={id} aria-label={`${preview.services.title}: ${title}`} className="pdf-export-page company-profile-print-slide company-profile-service-page space-y-6">
        <header className="border-b border-slate-200 pb-5">
          <p className="company-brand-text-subtle text-xs font-bold uppercase tracking-[0.18em]">{preview.services.title}</p>
          <h2 className="company-brand-text mt-3 text-3xl font-bold leading-tight tracking-tight">{title}</h2>
        </header>
        {image && <div className="overflow-hidden rounded-2xl bg-slate-100">
          <Image src={image} alt={title} width={1400} height={800} unoptimized className="max-h-[360px] w-full object-cover" />
        </div>}
        {description && <p className="whitespace-pre-line text-justify text-base leading-7 text-slate-700">{description}</p>}
        {href && <div className="mt-auto border-t border-slate-200 pt-4">
          <p className="company-brand-text-subtle text-[11px] font-semibold uppercase tracking-wide">{preview.services.moreLabel}</p>
          <p className="company-brand-text mt-1 break-all text-sm font-medium">{href}</p>
        </div>}
        <p className="text-right text-xs font-medium tabular-nums text-slate-400">{index + 1} / {services.length}</p>
      </section>
    )),
  };
  for (const tab of preview.customTabs ?? []) {
    slides[tab.id] = [
      <section key={tab.id} aria-label={tab.title} className="pdf-export-page company-profile-print-slide company-profile-about-page space-y-6">
        <header className="border-b border-slate-200 pb-5">
          <h2 className="company-brand-text text-3xl font-bold tracking-tight">{tab.title}</h2>
        </header>
        {tab.fields.map((field) => {
          const { heading, description, image } = getCompanyCustomTabFieldContent(field);
          if (!heading && !description && !image) return null;
          return (
            <article key={field.id} className="space-y-4 rounded-xl border border-slate-200 p-5">
              {heading && <h3 className="company-brand-text text-xl font-semibold">{heading}</h3>}
              {image && <Image src={image} alt={heading || tab.title} width={1400} height={800} unoptimized className="max-h-[360px] w-full rounded-2xl object-cover" />}
              {description && <p className="whitespace-pre-line text-justify text-base leading-7 text-slate-700">{description}</p>}
              {field.type === "service" && field.href && <p className="company-brand-text break-all text-sm">{field.href}</p>}
            </article>
          );
        })}
      </section>,
    ];
  }

  return <div className="company-profile-print">
    {getCompanyPreviewTabOrder(preview)
      .filter((id) => !isCompanyPreviewTabHidden(preview, id))
      .flatMap((id) => slides[id] ?? [])}
  </div>;
}
