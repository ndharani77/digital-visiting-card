"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Globe, Mail, MapPin, Phone, Linkedin, MessageCircle, Share2, Facebook, Link2, UserPlus, X } from "lucide-react";
import VisitingCardFace from "@/components/VisitingCardFace";
import QRCodeDownloads from "@/components/QRCodeDownloads";
import CompanyProfile from "@/components/CompanyProfile";
import type { VisitingCard } from "@/lib/types";
import { createVCard } from "@/lib/vcard";
import {
  DEFAULT_CARD_ACCENT,
} from "@/lib/card-defaults";

export default function PublicCardPage({ params }: { params: Promise<{ id: string }> }) {
  const [card, setCard] = useState<VisitingCard | null>(null);
  const [error, setError] = useState("");
  const [id, setId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isQrVisit, setIsQrVisit] = useState<boolean | null>(null);
  const [contactError, setContactError] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [shareOptionsOpen, setShareOptionsOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    params.then(({ id: cardId }) => {
      setId(cardId);
      setQrUrl(`${window.location.origin}/card/${cardId}?source=qr`);
      setIsQrVisit(new URLSearchParams(window.location.search).get("source") === "qr");
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/cards/${id}`).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Card not found.");
      setCard(result as VisitingCard);
    }).catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load card."));
  }, [id]);

  async function shareCard() {
    if (!card || !qrUrl) return;
    const shareData = {
      title: `${card.fullName} | Digital Visiting Card`,
      text: `Contact ${card.fullName}`,
      url: qrUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(qrUrl);
        window.alert("Card link copied.");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setContactError(err instanceof Error ? err.message : "Unable to share this card.");
    }
  }

  async function copyCardLink() {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setShareMessage("Card link copied.");
    } catch (err) {
      setShareMessage(err instanceof Error ? "Unable to copy the card link in this browser." : "Unable to copy the card link.");
    }
  }

  async function addToContacts() {
    if (!card) return;
    setContactError("");
    setContactMessage("");
    if (!window.confirm(`Continue to add ${card.fullName} to your contacts? Choose Contacts in the next screen, then tap Save or Done.`)) return;

    const fileName = `${card.fullName.replace(/[^a-z0-9-_]/gi, "_") || "contact"}.vcf`;
    const contactFile = new File([createVCard(card)], fileName, { type: "text/vcard" });
    if (!navigator.canShare?.({ files: [contactFile] })) {
      setContactMessage("Opening the contact file. Choose Contacts, then tap Save or Done to finish.");
      window.location.assign(`/api/cards/${encodeURIComponent(id)}/vcf`);
      return;
    }

    try {
      await navigator.share({ files: [contactFile], title: card.fullName });
      setContactMessage("If you chose Contacts, tap Save or Done there to finish adding this contact.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setContactError(err instanceof Error ? err.message : "Unable to open the contact-saving menu.");
    }
  }

  if (error) return <main className="flex min-h-screen items-center justify-center p-6"><div className="rounded-2xl bg-white p-8 text-center shadow"><h1 className="text-xl font-bold">Card unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link href="/" className="mt-5 inline-block text-blue-600">Back to dashboard</Link></div></main>;
  if (!card) return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading digital visiting card...</main>;
  const phoneNumber = `${card.countryCode || "+91"} ${card.mobile}`;
  const phoneHref = `${card.countryCode || "+91"}${card.mobile}`;
  const whatsappNumber = phoneHref.replace(/\D/g, "");
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className={`mx-auto ${isQrVisit ? "max-w-4xl" : "max-w-xl"}`}>
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link>
        {isQrVisit ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="px-6 py-7" style={{ backgroundColor: DEFAULT_CARD_ACCENT, color: "#ffffff" }}>
              <div className="mb-5 flex h-16 w-full items-center justify-start">
                <img
                  src="/brihaspathi-brand-cropped.jpg"
                  alt="Brihaspathi Technologies"
                  className="h-16 max-w-full object-contain"
                />
              </div>
              <h1 className="mt-2 text-2xl font-bold">{card.fullName}</h1>
              <p className="mt-1 text-sm text-blue-100">{card.designation}</p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Phone size={19} className="mt-0.5 shrink-0" style={{ color: DEFAULT_CARD_ACCENT }} />
                  <div className="min-w-0"><a href={`tel:${phoneHref}`} className="block break-all text-sm font-bold" style={{ color: DEFAULT_CARD_ACCENT }}>{phoneNumber}</a></div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={19} className="mt-0.5 shrink-0" style={{ color: DEFAULT_CARD_ACCENT }} />
                  <div className="min-w-0"><a href={`mailto:${card.email}`} className="block break-all text-sm font-bold" style={{ color: DEFAULT_CARD_ACCENT }}>{card.email}</a></div>
                </div>
                {card.address && <div className="flex items-start gap-3"><MapPin size={19} className="mt-0.5 shrink-0" style={{ color: DEFAULT_CARD_ACCENT }} /><div className="min-w-0"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.address)}`} target="_blank" rel="noopener noreferrer" className="block whitespace-pre-line text-sm hover:underline" style={{ color: DEFAULT_CARD_ACCENT }}>{card.address}</a></div></div>}
                {card.website && <div className="flex items-start gap-3"><Globe size={19} className="mt-0.5 shrink-0" style={{ color: DEFAULT_CARD_ACCENT }} /><div className="min-w-0"><a href={card.website} target="_blank" rel="noopener noreferrer" className="block break-all text-sm font-medium hover:underline" style={{ color: DEFAULT_CARD_ACCENT }}>{card.website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</a></div></div>}
                {card.linkedin && <div className="flex items-start gap-3"><Linkedin size={19} className="mt-0.5 shrink-0" style={{ color: DEFAULT_CARD_ACCENT }} /><div className="min-w-0"><a href={card.linkedin} target="_blank" rel="noopener noreferrer" className="block break-all text-sm font-medium hover:underline" style={{ color: DEFAULT_CARD_ACCENT }}>View LinkedIn profile</a></div></div>}
              </div>
              <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex flex-wrap justify-center gap-4">
            <a aria-label="Call phone" href={`tel:${phoneHref}`} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700">
              <Phone size={19} />
            </a>
            <button
              aria-label="Add contact"
              title="Add contact"
              type="button"
              onClick={addToContacts}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700"
            >
              <UserPlus size={19} />
            </button>
            <a aria-label="Open WhatsApp" href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi ${card.fullName},\n\nI came across your digital visiting card and would like to connect with you. Looking forward to speaking with you.`)}`} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700">
              <MessageCircle size={19} />
            </a>
            <a aria-label="Send email" href={`mailto:${card.email}`} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700">
              <Mail size={19} />
            </a>
            <button aria-label="Share contact" type="button" onClick={() => { setShareOptionsOpen(true); setShareMessage(""); }} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700">
              <Share2 size={19} />
            </button>
          </div>
          {contactError && <p role="alert" className="mt-3 text-center text-sm text-red-600">{contactError}</p>}
          {contactMessage && <p role="status" className="mt-3 text-center text-sm text-slate-600">{contactMessage}</p>}
              </div>
            </div>
          </section>
        ) : (
          <VisitingCardFace {...card} qrUrl={qrUrl} linksClickable />
        )}

        {isQrVisit === false && <QRCodeDownloads name={card.fullName} value={qrUrl} />}
        {isQrVisit && <CompanyProfile />}

        {shareOptionsOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShareOptionsOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="share-dialog-title" className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="share-dialog-title" className="text-lg font-bold text-slate-900">Share this contact</h2>
                <p className="mt-1 text-sm text-slate-500">{card.fullName}</p>
              </div>
              <button type="button" onClick={() => setShareOptionsOpen(false)} aria-label="Close share options" className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">Close</button>
            </div>
            <div className="grid max-h-[55vh] grid-cols-3 gap-3 overflow-y-auto">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Hi ${card.fullName},\n\nI came across your digital visiting card and would like to connect with you. Looking forward to speaking with you.`)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-green-50">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white"><MessageCircle size={23} /></span>WhatsApp
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(qrUrl)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-blue-50">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] text-white"><Facebook size={23} /></span>Facebook
              </a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(qrUrl)}&text=${encodeURIComponent(`Contact ${card.fullName}`)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-slate-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white"><X size={23} /></span>X
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(qrUrl)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-blue-50">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white"><Linkedin size={23} /></span>LinkedIn
              </a>
              <a href={`mailto:?subject=${encodeURIComponent(`${card.fullName} | Digital Visiting Card`)}&body=${encodeURIComponent(qrUrl)}`} className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-slate-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-white"><Mail size={23} /></span>Email
              </a>
              <button type="button" onClick={copyCardLink} className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-slate-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-800"><Link2 size={23} /></span>Copy link
              </button>
            </div>
            {shareMessage && <p role="status" className="mt-4 text-center text-sm text-slate-600">{shareMessage}</p>}
            <button type="button" onClick={shareCard} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Share2 size={17} /> More sharing options
            </button>
          </section>
        </div>}

        <p className="mt-5 text-center text-xs text-slate-400">Digital contact card · Powered by Card Reader</p>
      </div>
    </main>
  );
}
