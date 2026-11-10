"use client";

import type { FormEvent } from "react";

export default function EnquiryForm({ recipientEmail }: { recipientEmail: string }) {
  function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const enquiry = [
      `Name: ${formData.get("name")}`,
      `Email: ${formData.get("email")}`,
      `Mobile: ${formData.get("phone")}`,
      "",
      formData.get("message"),
    ].join("\n");
    const mailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent("Enquiry from your digital visiting card")}&body=${encodeURIComponent(enquiry)}`;
    window.location.href = mailto;
  }

  return (
    <section aria-labelledby="service-enquiry-title" className="mx-auto mt-8 max-w-sm">
      <form onSubmit={submitEnquiry} className="mx-auto max-w-md rounded-lg bg-white px-5 py-7">
        <h2 id="service-enquiry-title" className="mb-7 text-center text-lg font-semibold text-slate-900">Enquiry Form</h2>
        <div className="space-y-5">
          <input aria-label="Name" name="name" placeholder="Name" autoComplete="name" required className="w-full rounded border border-indigo-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          <div className="grid grid-cols-2 gap-4">
            <input aria-label="Email" name="email" type="email" placeholder="Email" autoComplete="email" required className="min-w-0 w-full rounded border border-indigo-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            <input aria-label="Mobile" name="phone" type="tel" placeholder="Mobile" autoComplete="tel" className="min-w-0 w-full rounded border border-indigo-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <textarea aria-label="Message" name="message" placeholder="Type your message" rows={2} required className="w-full resize-y rounded border border-indigo-100 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <button type="submit" className="mt-8 rounded border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
          Send
        </button>
      </form>
    </section>
  );
}
