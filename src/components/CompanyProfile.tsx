"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";

const companyMetrics = [
  { value: "20+", label: "Years of excellence" },
  { value: "2M+", label: "Cameras deployed" },
  { value: "15k+", label: "Clients" },
  { value: "400+", label: "Professionals" },
];

const services = [
  {
    title: "Smart Bus Solutions",
    href: "https://brihaspathi.com/services/smart-bus-solutions",
    description: "Our smart bus systems combine AI CCTV, GPS tracking, Wi-Fi, displays, breath analysis, and analytics for public transport. Real-time monitoring supports passenger safety and fleet oversight, while route insights help operators improve service efficiency. Optional features include pedestrian blind-spot detection and driver fatigue monitoring.",
    image: "/services/smart-bus-solutions.jpeg",
  },
  {
    title: "Sustainable Energy Revolution: Solar EPC Excellence",
    href: "https://brihaspathi.com/solutions/solar-epc",
    description: "Our Solar EPC service delivers turnkey solar power projects for residential, commercial, and industrial clients. We manage site assessments, engineering and system design, procurement of quality components, construction, grid integration, testing, and commissioning. Quality checks and project management help ensure reliable performance, streamlined delivery, and lasting renewable energy benefits.",
    image: "/services/solar-epc.jpg",
  },
  {
    title: "Software Products & Services",
    href: "https://brihaspathi.com/services/software-products-services",
    description: "We develop software for communication, automation, and business management, including web and app development, IoT applications, E-Communication, and ERP systems. Solutions such as Biz Track ERP help streamline operations, support customer engagement, and provide insights for growing businesses.",
    image: "/services/software-products-services.jpeg",
  },
  {
    title: "HRMS",
    href: "https://brihaspathi.com/product/hrms",
    description: "Brihaspathi's HRMS centralizes employee records and supports recruitment, onboarding, attendance, leave, payroll, performance, and document management. Workflow automation, biometric integration, notifications, dashboards, and employee self-service help HR teams streamline everyday processes and maintain visibility across the employee lifecycle.",
    image: "/services/hrms.jpg",
  },
  {
    title: "AI Visitor Management System",
    href: "https://brihaspathi.com/product/ai-visitor-management-system",
    description: "Improve facility security with AI facial recognition, visitor identification, and multi-camera tracking. The system supports digital registration, QR visitor passes, and approval workflows, while a centralized dashboard helps security teams monitor visitor activity, movement, alerts, and events across the premises.",
    image: "/services/ai-visitor-management.png",
  },
  {
    title: "Command & Control Centre Engineering",
    href: "https://brihaspathi.com/services/command-control-centre-engineering",
    description: "We design and build Integrated Command & Control Centres (ICCCs) with video walls, operator consoles, monitoring platforms, and backend infrastructure. These integrated environments give teams real-time visibility to coordinate operations, monitor incidents, and make informed decisions across connected systems.",
    image: "/services/command-control.jpeg",
  },
];

export default function CompanyProfile({ recipientEmail }: { recipientEmail: string }) {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <section aria-label="Company information" className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <nav aria-label="Company information slides" className="flex border-b border-slate-200 bg-slate-50/70 px-4">
        {["About Us", "Services", "Enquiry"].map((label, index) => (
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

      <div className="p-5">
        {activeSlide === 0 ? (
          <div role="group" aria-labelledby="company-about-title" className="space-y-7">
            <header className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#07518a]/75">Company profile</p>
              <h2 id="company-about-title" className="mt-2 text-2xl font-bold tracking-tight text-[#07518a]">Brihaspathi Technologies</h2>
              <p className="mt-3 text-sm leading-6 text-[#07518a]">
                An AI-powered mission-critical technology company with capabilities spanning proprietary product engineering, electronics manufacturing, software platforms, AI video intelligence and nationwide project execution.
              </p>
            </header>

            <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {companyMetrics.map((metric) => (
                <div key={metric.label} className="px-4 py-4">
                  <p className="text-2xl font-semibold tracking-tight text-[#07518a]">{metric.value}</p>
                  <p className="mt-1 text-xs leading-5 text-[#07518a]/75">{metric.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#07518a]/75">Our vision</p>
                <p className="mt-3 text-sm leading-6 text-[#07518a]">
                  To become one of India’s leading AI-powered mission-critical technology companies with global relevance.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#07518a]/75">Our mission</p>
                <p className="mt-3 text-sm leading-6 text-[#07518a]">
                  To build an AI-powered mission-critical technology enterprise combining proprietary hardware, software, AI platforms, electronics manufacturing and managed services for Defence, Public Safety, Railways, Mobility and Critical Infrastructure.
                </p>
              </article>
            </div>
          </div>
        ) : activeSlide === 1 ? (
          <div role="group" aria-labelledby="company-services-title">
            <header className="mb-6 text-center">
              <h2 id="company-services-title" className="mt-2 text-2xl font-bold tracking-tight text-[#07518a]">Our services</h2>
            </header>
            <div className="grid grid-cols-1 gap-4">
              {services.map(({ title, description, image, href }) => (
                <article key={title} className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300">
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`View ${title}`}>
                    <Image
                      src={image}
                      alt={title}
                      width={960}
                      height={540}
                      className={`h-56 w-full object-cover ${title === "HRMS" ? "origin-left scale-x-[1.45]" : ""}`}
                    />
                  </a>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold leading-6 text-[#07518a]">
                        <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                          {title}
                        </a>
                      </h3>
                      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title} page`} title="Open service page" className="shrink-0 rounded p-1 text-[#07518a]/70 hover:bg-slate-100 hover:text-[#07518a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                    </div>
                    <p className="mt-2 text-justify text-base leading-7 text-[#07518a]">{description}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 text-right">
              <a
                href="https://brihaspathi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded text-sm font-semibold text-[#07518a] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                More <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : (
          <EnquiryForm recipientEmail={recipientEmail} />
        )}

        <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => setActiveSlide((current) => Math.max(0, current - 1))}
            disabled={activeSlide === 0}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#07518a] transition-colors hover:bg-slate-100 hover:text-[#07518a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Previous
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
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
