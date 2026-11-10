"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Mail, MapPin, Phone, Linkedin, MessageCircle, Share2, Facebook, Link2, UserPlus, X } from "lucide-react";
import VisitingCardFace from "@/components/VisitingCardFace";
import QRCodeDownloads from "@/components/QRCodeDownloads";
import CompanyProfile from "@/components/CompanyProfile";
import type { VisitingCard } from "@/lib/types";
import { createVCard } from "@/lib/vcard";
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

  if (error) return <main className="flex min-h-screen items-center justify-center p-6"><div className="rounded-2xl bg-white p-8 text-center shadow"><h1 className="text-xl font-bold">Card unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p>{isQrVisit === false && <Link href="/" className="mt-5 inline-block text-blue-600">Back to dashboard</Link>}</div></main>;
  if (!card) return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading digital visiting card...</main>;
  const formattedMobile = card.mobile.replace(/^(\d{5})(\d{5})$/, "$1 $2");
  const phoneNumber = `${card.countryCode || "+91"} ${formattedMobile}`;
  const phoneHref = `${card.countryCode || "+91"}${card.mobile}`;
  const whatsappNumber = phoneHref.replace(/\D/g, "");
  return (
    <main className={isQrVisit ? "min-h-screen bg-[#f3f6fa] px-3 py-6" : "min-h-screen bg-slate-50 px-4 py-12"}>
      <div className={`mx-auto ${isQrVisit ? "max-w-[430px]" : "max-w-xl"}`}>
        {isQrVisit === false && <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link>}
        {isQrVisit ? (
          <section className="relative mx-auto max-w-[430px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
            <svg aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-[100px] w-[56%]" viewBox="0 0 240 112" preserveAspectRatio="none">
              <path d="M0 0h240v112C184 53 103 10 0 0Z" fill="#07518a" />
              <path d="M0 0C103 10 184 53 240 112" fill="none" stroke="#d8e6f2" strokeWidth="3" />
              <path d="M86 0C155 17 207 57 240 101" fill="none" stroke="#a9c5df" strokeWidth="2" />
            </svg>
            <img
              aria-hidden="true"
              src="/brihaspathi-logo.png"
              alt=""
              className="pointer-events-none absolute -right-10 top-28 h-44 w-44 object-contain opacity-[0.07]"
            />

            <header className="relative z-10 px-5 pt-5">
              <img src="/brihaspathi-brand.webp" alt="Brihaspathi Technologies — The Guru of Tomorrow's Technology" className="h-10 w-[150px] max-w-full object-contain object-left" />
            </header>

            <div className="relative z-10 mt-10 px-5">
              <div className="w-fit max-w-full">
                <h1 className="break-words text-xl font-bold leading-tight tracking-tight text-[#092f60]">{card.fullName}</h1>
                <div className="mt-2 h-[2px] w-full rounded-full bg-gradient-to-r from-[#2d83c5] via-[#70c4ff] to-[#2d83c5] shadow-[0_0_6px_rgba(45,131,197,0.55)]" />
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-600">{card.designation}</p>
            </div>

            <div className="relative z-10 space-y-3 px-5 pb-1 pt-6 text-[#092f60]">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#07518a] text-white"><Phone size={15} /></span>
                <span className="h-7 w-px shrink-0 bg-slate-300" />
                <a href={`tel:${phoneHref}`} className="min-w-0 break-all text-sm font-bold hover:underline">{phoneNumber}</a>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#07518a] text-white"><Mail size={15} /></span>
                <span className="h-7 w-px shrink-0 bg-slate-300" />
                <a href={`mailto:${card.email}`} className="min-w-0 break-all text-sm font-bold hover:underline">{card.email}</a>
              </div>
              {card.address && <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#07518a] text-white"><MapPin size={15} /></span>
                <span className="mt-0.5 min-h-7 w-px shrink-0 self-stretch bg-slate-300" />
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.address)}`} target="_blank" rel="noopener noreferrer" className="min-w-0 whitespace-pre-line text-sm leading-[1.4] hover:underline">{card.address}</a>
              </div>}
              {card.website && <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#07518a] text-white"><Globe size={15} /></span>
                <span className="h-7 w-px shrink-0 bg-slate-300" />
                <a href={card.website} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all text-sm hover:underline">{card.website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</a>
              </div>}
              {card.linkedin && <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#07518a] text-white"><Linkedin size={15} /></span>
                <span className="h-7 w-px shrink-0 bg-slate-300" />
                <a href={card.linkedin} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all text-sm hover:underline">{card.linkedinName?.trim() || card.fullName}</a>
              </div>}
            </div>

            <div className="relative z-10 mx-5 mt-5 border-t border-slate-200">
              <div className="grid grid-cols-5 gap-y-4 py-4">
                <a aria-label="Call" href={`tel:${phoneHref}`} className="flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700 hover:text-[#07518a]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#07518a]"><Phone size={18} /></span>Call
                </a>
                <button aria-label="Add contact" title="Add contact" type="button" onClick={addToContacts} className="flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700 hover:text-[#07518a]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#07518a]"><UserPlus size={18} /></span><span className="whitespace-nowrap">Add Contact</span>
                </button>
                <a aria-label="WhatsApp" href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi ${card.fullName},\n\nI came across your digital visiting card and would like to connect with you. Looking forward to speaking with you.`)}`} target="_blank" rel="noreferrer" className="flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700 hover:text-[#07518a]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#07518a]"><MessageCircle size={18} /></span>WhatsApp
                </a>
                <a aria-label="Email" href={`mailto:${card.email}`} className="flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700 hover:text-[#07518a]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#07518a]"><Mail size={18} /></span>Email
                </a>
                <button aria-label="Share contact" type="button" onClick={() => { setShareOptionsOpen(true); setShareMessage(""); }} className="flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700 hover:text-[#07518a]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#07518a]"><Share2 size={18} /></span>Share
                </button>
              </div>
              {contactError && <p role="alert" className="mb-3 text-center text-sm text-red-600">{contactError}</p>}
              {contactMessage && <p role="status" className="mb-3 text-center text-sm text-slate-600">{contactMessage}</p>}
            </div>
          </section>
        ) : (
          <VisitingCardFace {...card} qrUrl={qrUrl} linksClickable />
        )}

        {isQrVisit === false && <QRCodeDownloads name={card.fullName} value={qrUrl} />}
        {isQrVisit && (
          <CompanyProfile recipientEmail={card.email} />
        )}

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
              <a href={`https://wa.me/?text=${encodeURIComponent(`Here's ${card.fullName}'s digital visiting card:\n${qrUrl}`)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm text-slate-700 hover:bg-green-50">
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
