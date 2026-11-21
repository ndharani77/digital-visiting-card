"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCodeDownloads from "@/components/QRCodeDownloads";
import type { VisitingCard } from "@/lib/types";

export default function VisitingCardPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const [card, setCard] = useState<VisitingCard | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [error, setError] = useState("");
  const [id, setId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => { params.then(({ id }) => setId(id)); }, [params]);

  useEffect(() => {
    if (!id) return;
    setQrUrl(`${window.location.origin}/card/${id}?source=qr`);
    fetch(`/api/cards/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Card not found.");
        setCard(data as VisitingCard);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load card."));
  }, [id]);

  if (error) return <main className="flex min-h-screen items-center justify-center p-6"><div className="rounded-2xl bg-white p-8 text-center shadow"><h1 className="text-xl font-bold">Card unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link href="/my-cards" className="mt-5 inline-block text-blue-600">Back to My Cards</Link></div></main>;
  if (!card) return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading QR code...</main>;
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 px-4 py-8 sm:py-12">
      <div className={`mx-auto grid w-full items-start gap-6 ${previewOpen ? "max-w-6xl lg:grid-cols-[minmax(340px,440px)_minmax(0,1fr)] lg:gap-8" : "max-w-xl"}`}>
        <section className={`rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-8 ${previewOpen ? "lg:sticky lg:top-8" : ""}`}>
          <div className="mx-auto mb-6 max-w-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Digital visiting card</p>
          <h1 className="text-2xl font-bold text-slate-900">Your QR code is ready</h1>
          <p className="mt-2 text-sm text-slate-500">Scan to open {card.fullName}&apos;s digital visiting card.</p>
          </div>
          <div className="mx-auto mt-6 w-fit rounded-2xl border border-slate-100 bg-white p-3">
            <QRCodeSVG value={qrUrl} size={256} level="H" includeMargin title={`QR code for ${card.fullName}`} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <QRCodeDownloads name={card.fullName} value={qrUrl} className="" />
            <button
              type="button"
              aria-label={previewOpen ? "Hide scanned contact preview" : "Show scanned contact preview"}
              aria-expanded={previewOpen}
              aria-controls="scan-preview"
              onClick={() => setPreviewOpen((open) => !open)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <Eye size={18} aria-hidden="true" />
              {previewOpen ? "Hide preview" : "Show preview"}
            </button>
          </div>
        </section>

        <section id="scan-preview" aria-labelledby="scan-preview-title" hidden={!previewOpen} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          {previewOpen && <>
            <header className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Live preview</p>
              <h2 id="scan-preview-title" className="text-xl font-bold text-slate-900">Preview after scanning</h2>
              <p className="mt-1 text-sm text-slate-500">This is the contact page people see after scanning the QR code.</p>
            </header>
            <div className="bg-slate-100 p-2 sm:p-3">
              <iframe
                title={`Scanned contact page preview for ${card.fullName}`}
                src={qrUrl}
                className="block h-[760px] w-full rounded-xl border border-slate-200 bg-[#f3f6fa]"
              />
            </div>
          </>}
        </section>
      </div>
    </main>
  );
}
