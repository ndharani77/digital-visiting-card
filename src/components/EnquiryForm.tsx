"use client";

import type { FormEvent } from "react";
import type { CompanyPreviewSettings } from "@/lib/company-content";

export default function EnquiryForm({
  recipientEmail,
  settings,
  isActive,
}: {
  recipientEmail: string;
  settings: CompanyPreviewSettings["enquiry"];
  isActive: boolean;
}) {
  function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isActive) return;
    const formData = new FormData(event.currentTarget);
    const messageField = settings.fields.find((field) => field.id === "message");
    const enquiry = [
      ...settings.fields
        .filter((field) => field.id !== "message")
        .map((field) => `${field.label}: ${formData.get(field.id) ?? ""}`),
      ...(messageField ? ["", String(formData.get(messageField.id) ?? "")] : []),
    ].join("\n");
    const mailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent("Enquiry from your digital visiting card")}&body=${encodeURIComponent(enquiry)}`;
    window.location.href = mailto;
  }

  return (
    <section aria-labelledby="service-enquiry-title" className="mx-auto mt-8 max-w-sm">
      <form onSubmit={submitEnquiry} className="mx-auto max-w-md rounded-lg bg-white px-5 py-7">
        <h2 id="service-enquiry-title" className="text-center text-lg font-semibold text-slate-900">{settings.title}</h2>
        {settings.description && <p className="mt-2 text-center text-sm leading-6 text-slate-600">{settings.description}</p>}
        <fieldset disabled={!isActive}>
          <div className="mt-7 grid grid-cols-2 gap-4">
            {settings.fields.map((field) => (
              <label key={field.id} className={field.type === "textarea" ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                <span className="sr-only">{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea
                    aria-label={field.label}
                    name={field.id}
                    placeholder={field.placeholder}
                    rows={2}
                    required={field.required}
                    className="w-full resize-y rounded border border-indigo-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <input
                    aria-label={field.label}
                    name={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    autoComplete={field.id === "name" ? "name" : field.id === "email" ? "email" : field.id === "phone" ? "tel" : "off"}
                    required={field.required}
                    className="w-full rounded border border-indigo-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                )}
              </label>
            ))}
          </div>
          <button type="submit" className="mt-8 rounded border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
            {settings.submitLabel}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
