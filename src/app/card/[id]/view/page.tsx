"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCodeDownloads from "@/components/QRCodeDownloads";
import type { VisitingCard } from "@/lib/types";

export default function VisitingCardPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const [card, setCard] = useState<VisitingCard | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [error, setError] = useState("");
  const [id, setId] = useState("");

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
          <h1 className="text-2xl font-bold text-slate-900">Your QR Code Is Ready</h1>
          <p className="mt-2 text-sm text-slate-500">Scan to open {card.fullName}&apos;s contact page with the same contact and sharing options.</p>
          <div className="mx-auto mt-6 w-fit rounded-2xl border border-slate-100 bg-white p-3">
            <QRCodeSVG value={qrUrl} size={256} level="H" includeMargin title={`QR code for ${card.fullName}`} />
          </div>
          <div className="flex justify-center">
            <QRCodeDownloads name={card.fullName} value={qrUrl} />
          </div>
        </section>
      </div>
    </main>
  );
}
