"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VisitingCardFace from "@/components/VisitingCardFace";
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
  if (!card) return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading visiting card...</main>;
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link>
        <div className="mb-5"><h1 className="text-2xl font-bold text-slate-900">Visiting Card Preview</h1><p className="mt-1 text-sm text-slate-500">Scan the QR code to open this contact card and choose Save Contact or WhatsApp.</p></div>
        <VisitingCardFace {...card} qrUrl={qrUrl} linksClickable />
        <p className="mt-4 text-center text-xs text-slate-500">The QR code opens this card online. The phone must be able to reach this website.</p>
      </div>
    </main>
  );
}
