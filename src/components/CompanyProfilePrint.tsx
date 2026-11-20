import Image from "next/image";
import type { CompanyPreviewSettings } from "@/lib/company-content";

export default function CompanyProfilePrint({ preview }: { preview: CompanyPreviewSettings }) {
  const services = preview.services.items.filter((service) => service.title || service.description || service.image);

  return (
    <div className="company-profile-print">
      <section
        aria-label={preview.tabs.about}
        className="pdf-export-page company-profile-print-slide company-profile-about-page space-y-7"
      >
        <header className="mx-auto max-w-3xl text-center">
          {preview.about.kicker && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#07518a]/75">{preview.about.kicker}</p>}
          {preview.about.title && <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#07518a]">{preview.about.title}</h2>}
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
      </section>

      {services.length > 0 ? services.map(({ id, title, description, image, href }, index) => (
        <section
          key={id}
          aria-label={`${preview.services.title}: ${title}`}
          className="pdf-export-page company-profile-print-slide company-profile-service-page space-y-6"
        >
          <header className="border-b border-slate-200 pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#07518a]/70">{preview.services.title}</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[#07518a]">{title}</h2>
          </header>

          {image && (
            <div className="overflow-hidden rounded-2xl bg-slate-100">
              <Image src={image} alt={title} width={1400} height={800} unoptimized className="max-h-[360px] w-full object-cover" />
            </div>
          )}

          {description && <p className="whitespace-pre-line text-justify text-base leading-7 text-slate-700">{description}</p>}

          {href && <div className="mt-auto border-t border-slate-200 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#07518a]/70">{preview.services.moreLabel}</p>
            <p className="mt-1 break-all text-sm font-medium text-[#07518a]">{href}</p>
          </div>}
          <p className="text-right text-xs font-medium tabular-nums text-slate-400">{index + 1} / {services.length}</p>
        </section>
      )) : (
        <section
          aria-label={preview.tabs.services}
          className="pdf-export-page company-profile-print-slide company-profile-service-page"
        >
          <h2 className="text-3xl font-bold tracking-tight text-[#07518a]">{preview.services.title}</h2>
          {preview.services.moreLink && <p className="mt-5 break-all text-sm text-[#07518a]">{preview.services.moreLink}</p>}
        </section>
      )}
    </div>
  );
}
