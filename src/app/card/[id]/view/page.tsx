"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
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
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Your QR code is ready</h1>
          <p className="mt-2 text-sm text-slate-500">Scan to open {card.fullName}&apos;s digital visiting card.</p>
          <div className="mx-auto mt-6 w-fit rounded-2xl border border-slate-100 bg-white p-3">
            <QRCodeSVG value={qrUrl} size={256} level="H" includeMargin title={`QR code for ${card.fullName}`} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <QRCodeDownloads name={card.fullName} value={qrUrl} className="" />
            <button
              type="button"
              aria-label={previewOpen ? "Hide scanned contact preview" : "Show scanned contact preview"}
              title={previewOpen ? "Hide scanned contact preview" : "Show scanned contact preview"}
              aria-expanded={previewOpen}
              aria-controls="scan-preview"
              onClick={() => setPreviewOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <Eye size={20} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section id="scan-preview" aria-labelledby="scan-preview-title" hidden={!previewOpen} className="mt-8">
          {previewOpen && <>
            <div className="mb-4 text-center">
              <h2 id="scan-preview-title" className="text-xl font-bold text-slate-900">Preview after scanning</h2>
              <p className="mt-1 text-sm text-slate-500">This is the contact page people will see when they scan your QR code.</p>
            </div>
            <div className="mx-auto max-w-[390px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <iframe
                title={`Scanned contact page preview for ${card.fullName}`}
                src={qrUrl}
                className="block h-[760px] w-full border-0 bg-[#f3f6fa]"
              />
            </div>
          </>}
        </section>
      </div>
    </main>
  );
}
