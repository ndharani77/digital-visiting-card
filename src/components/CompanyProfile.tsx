"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, BrainCircuit, GraduationCap, ShieldCheck, TrainFront, Video } from "lucide-react";
import { DEFAULT_CARD_ACCENT } from "@/lib/card-defaults";

const companyMetrics = [
  { value: "20+", label: "Years of excellence" },
  { value: "2M+", label: "Cameras deployed" },
  { value: "15k+", label: "Clients" },
  { value: "400+", label: "Professionals" },
];

const services = [
  {
    title: "Defence, Homeland Security & Public Safety",
    description: "Security and surveillance technologies for critical assets, borders and public spaces, including drone and anti-drone systems, long-range surveillance, perimeter protection, emergency fleet management, body-worn cameras, cybersecurity and smart border monitoring.",
    icon: ShieldCheck,
  },
  {
    title: "Managed Surveillance & Event Intelligence",
    description: "End-to-end surveillance for elections, examinations, public gatherings and large events, combining live webcasting, GPS-enabled fleet management, mobile enforcement, command centres, video analytics and crowd monitoring.",
    icon: Video,
  },
  {
    title: "Railways & Intelligent Mobility",
    description: "Integrated technology for safer transport networks, including AI-powered surveillance, vehicle tracking, preventive maintenance, collision avoidance, station and corridor monitoring, intelligent traffic management and command-centre integration.",
    icon: TrainFront,
  },
  {
    title: "Smart & Critical Infrastructure",
    description: "Connected solutions for cities and industries, from command centres, traffic management and smart utilities to fleet management, predictive maintenance, communications, AI analytics and digital twins.",
    icon: Building2,
  },
  {
    title: "Education & Digital Governance",
    description: "Digital ecosystems for educational institutions and government, including smart classrooms, digital campuses, student information systems, e-governance platforms, smart libraries and biometric authentication.",
    icon: GraduationCap,
  },
  {
    title: "AI, Software & Digital Platforms",
    description: "AI-powered command and control centres, facial recognition, video analytics, ERP platforms, process automation and custom software to improve security and accelerate digital transformation.",
    icon: BrainCircuit,
  },
];

export default function CompanyProfile() {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <section aria-label="Company information" className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <nav aria-label="Company information slides" className="flex border-b border-slate-200 bg-slate-50/70 px-4 sm:px-7">
        {["About Us", "Services"].map((label, index) => (
          <button
            key={label}
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

      <div className="p-5 sm:p-8">
        {activeSlide === 0 ? (
          <div role="group" aria-labelledby="company-about-title" className="space-y-7">
            <header className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#07518a]/75">Company profile</p>
              <h2 id="company-about-title" className="mt-2 text-2xl font-bold tracking-tight text-[#07518a] sm:text-3xl">Brihaspathi Technologies</h2>
              <p className="mt-3 text-sm leading-6 text-[#07518a] sm:text-base">
                An AI-powered mission-critical technology company with capabilities spanning proprietary product engineering, electronics manufacturing, software platforms, AI video intelligence and nationwide project execution.
              </p>
            </header>

            <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-y-0">
              {companyMetrics.map((metric) => (
                <div key={metric.label} className="px-4 py-4 sm:px-3 sm:py-5">
                  <p className="text-2xl font-semibold tracking-tight text-[#07518a]">{metric.value}</p>
                  <p className="mt-1 text-xs leading-5 text-[#07518a]/75 sm:text-sm">{metric.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#07518a]/75">Our vision</p>
                <p className="mt-3 text-sm leading-6 text-[#07518a]">
                  To become one of India’s leading AI-powered mission-critical technology companies with global relevance.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#07518a]/75">Our mission</p>
                <p className="mt-3 text-sm leading-6 text-[#07518a]">
                  To build an AI-powered mission-critical technology enterprise combining proprietary hardware, software, AI platforms, electronics manufacturing and managed services for Defence, Public Safety, Railways, Mobility and Critical Infrastructure.
                </p>
              </article>
            </div>
          </div>
        ) : (
          <div role="group" aria-labelledby="company-services-title">
            <header className="mb-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#07518a]/75">Capabilities</p>
              <h2 id="company-services-title" className="mt-2 text-2xl font-bold tracking-tight text-[#07518a]">Our services</h2>
              <p className="mt-2 text-sm leading-6 text-[#07518a]">Technology solutions for mission-critical operations and essential services.</p>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              {services.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100" style={{ color: DEFAULT_CARD_ACCENT }}><Icon size={19} strokeWidth={1.8} /></span>
                    <div>
                      <h3 className="text-sm font-semibold leading-5 text-[#07518a]">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#07518a]">{description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => setActiveSlide(0)}
            disabled={activeSlide === 0}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#07518a] transition-colors hover:bg-slate-100 hover:text-[#07518a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Previous
          </button>
          <span className="text-xs font-medium tabular-nums text-[#07518a]/75" aria-live="polite">
            {activeSlide + 1} / 2
          </span>
          <button
            type="button"
            onClick={() => setActiveSlide(1)}
            disabled={activeSlide === 1}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#07518a] transition-colors hover:bg-slate-100 hover:text-[#07518a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
