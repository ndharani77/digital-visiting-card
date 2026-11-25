"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Power, QrCode, Trash2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCodeDownloads from "@/components/QRCodeDownloads";
import VisitingCardFace from "@/components/VisitingCardFace";
import type { UserRole, VisitingCard } from "@/lib/types";
import { getCardQrPath } from "@/lib/card-slug";

export default function CardPreviewDrawer({
  card,
  role,
  onClose,
}: {
  card: VisitingCard;
  role: UserRole;
  onClose: () => void;
}) {
  const router = useRouter();
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const previewResizeObserverRef = useRef<ResizeObserver | null>(null);
  const previewMutationObserverRef = useRef<MutationObserver | null>(null);
  const qrCodeRef = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(card.isActive);
  const [qrUrl, setQrUrl] = useState("");
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setQrUrl(`${window.location.origin}${getCardQrPath(card)}`);
  }, [card]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      previewResizeObserverRef.current?.disconnect();
      previewMutationObserverRef.current?.disconnect();
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, []);

  useEffect(() => {
    previewResizeObserverRef.current?.disconnect();
    previewMutationObserverRef.current?.disconnect();
    setPreviewHeight(null);
    setPreviewReady(false);
    setFrameLoaded(false);
    setIsEditing(false);
    setIsActive(card.isActive);
  }, [card.id, card.isActive]);

  function resizePreviewFrame() {
    const frameDocument = previewFrameRef.current?.contentDocument;
    const previewPage = frameDocument?.querySelector<HTMLElement>(".public-card-page");
    if (!frameDocument?.body || !previewPage) return;
    const height = Math.max(
      previewPage.scrollHeight,
      frameDocument.body.scrollHeight,
      frameDocument.documentElement.scrollHeight,
    );
    setPreviewReady(true);
    setPreviewHeight(Math.max(420, Math.ceil(height)));
  }

  function handlePreviewFrameLoad() {
    setFrameLoaded(true);
    const frameDocument = previewFrameRef.current?.contentDocument;
    if (!frameDocument?.body) return;

    previewResizeObserverRef.current?.disconnect();
    previewMutationObserverRef.current?.disconnect();
    const observer = new ResizeObserver(resizePreviewFrame);
    observer.observe(frameDocument.body);
    observer.observe(frameDocument.documentElement);
    const previewPage = frameDocument.querySelector<HTMLElement>(".public-card-page");
    if (previewPage) observer.observe(previewPage);
    previewResizeObserverRef.current = observer;
    const mutationObserver = new MutationObserver(resizePreviewFrame);
    mutationObserver.observe(frameDocument.body, { childList: true, subtree: true });
    previewMutationObserverRef.current = mutationObserver;
    resizePreviewFrame();
  }

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    function handlePreviewMessage(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin || event.source !== previewFrameRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object" || !("type" in event.data) ||
          !("cardId" in event.data) || event.data.cardId !== card.id) return;
      if (event.data.type === "card-preview-ready") {
        setPreviewReady(true);
      } else if (event.data.type === "card-preview-height" && "height" in event.data &&
          typeof event.data.height === "number" && Number.isFinite(event.data.height)) {
        setPreviewReady(true);
        setPreviewHeight(Math.max(420, Math.ceil(event.data.height)));
      } else if (event.data.type === "card-preview-status-changed" && "isActive" in event.data &&
          typeof event.data.isActive === "boolean") {
        setIsActive(event.data.isActive);
        setPreviewReady(false);
        router.refresh();
      } else if (event.data.type === "card-preview-edit-state" && "isEditing" in event.data &&
          typeof event.data.isEditing === "boolean") {
        setIsEditing(event.data.isEditing);
      } else if (event.data.type === "card-preview-deleted") {
        router.refresh();
        onClose();
      }
    }

    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
  }, [card.id, onClose, router]);

  async function toggleActive() {
    setUpdatingStatus(true);
    setError("");
    try {
      const response = await fetch(`/api/cards/${encodeURIComponent(card.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
          ? result.message
          : "Unable to update card status.";
        throw new Error(message);
      }
      if (!result || typeof result !== "object" || !("isActive" in result) || typeof result.isActive !== "boolean") {
        throw new Error("Card status response is invalid.");
      }
      setIsActive(result.isActive);
      setIsEditing(false);
      setPreviewReady(false);
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update card status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function deleteCard() {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/cards/${encodeURIComponent(card.id)}`, { method: "DELETE" });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
          ? result.message
          : "Unable to delete card.";
        throw new Error(message);
      }
      if (!result || typeof result !== "object" || !("success" in result) || result.success !== true) {
        throw new Error("Card deletion response is invalid.");
      }
      router.refresh();
      onClose();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete card.");
    } finally {
      setDeleting(false);
    }
  }

  function toggleEdit() {
    previewFrameRef.current?.contentWindow?.postMessage(
      { type: "card-preview-toggle-edit", cardId: card.id },
      window.location.origin,
    );
  }

  function scrollToQrCode() {
    qrCodeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/45">
      <button
        type="button"
        aria-label="Close card preview"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-preview-drawer-title"
        className="relative flex h-full w-full flex-col overflow-y-auto border-l border-slate-200 bg-slate-50 shadow-2xl sm:w-1/2"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Card preview</p>
            <h2 id="card-preview-drawer-title" className="truncate text-lg font-bold text-slate-950">{card.fullName}</h2>
          </div>
          <button
            type="button"
            aria-label="Close card preview"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <section aria-label="Card management" className="sticky top-[73px] z-10 border-b border-slate-200 bg-white px-4 py-3">
          {!isActive && <p role="status" className="mb-2 text-sm text-amber-800">Inactive - public card access is disabled.</p>}
          <div className="flex flex-wrap items-center gap-2">
            {isActive && (
              <button
                type="button"
                disabled={!previewReady || updatingStatus || deleting}
                onClick={toggleEdit}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
              >
                {isEditing ? <X size={16} aria-hidden="true" /> : <Pencil size={16} aria-hidden="true" />}
                {isEditing ? "Cancel" : "Edit"}
              </button>
            )}
            <button
              type="button"
              disabled={!qrUrl}
              onClick={scrollToQrCode}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              <QrCode size={16} aria-hidden="true" />QR code
            </button>
            <button
              type="button"
              disabled={updatingStatus || deleting}
              onClick={() => { void toggleActive(); }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              {updatingStatus ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Power size={16} aria-hidden="true" />}
              {updatingStatus ? "Updating..." : isActive ? "Deactivate" : "Activate"}
            </button>
            {role !== "EMPLOYEE" && (
              <button
                type="button"
                disabled={updatingStatus || deleting}
                onClick={() => { setError(""); setDeleteConfirmationOpen(true); }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
              >
                <Trash2 size={16} aria-hidden="true" />Delete
              </button>
            )}
          </div>
          {error && !deleteConfirmationOpen && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
        </section>
        <div className="px-2 pb-3 pt-1 sm:px-3 sm:pb-4 sm:pt-2">
          {isActive ? (
            <div className="relative mx-auto w-full max-w-[500px]">
              {!frameLoaded && (
                <div role="status" className="absolute inset-0 z-10 flex min-h-[420px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500">
                  <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                  Loading card preview...
                </div>
              )}
              <iframe
                ref={previewFrameRef}
                title={`${card.fullName}'s live digital visiting card`}
                src={getCardQrPath(card)}
                scrolling="no"
                onLoad={handlePreviewFrameLoad}
                style={previewHeight ? { height: `${previewHeight}px` } : undefined}
                className={`mx-auto block min-h-[420px] w-full rounded-xl border border-slate-200 bg-white ${frameLoaded ? "" : "invisible"}`}
              />
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[430px]">
              <VisitingCardFace {...card} />
            </div>
          )}
        </div>
        {qrUrl && (
          <section ref={qrCodeRef} id="card-preview-qr-code" aria-label={`${card.fullName} QR code`} className="mx-auto mb-6 flex w-full max-w-[500px] scroll-mt-36 flex-col items-center border-t border-slate-200 px-4 pt-5">
            <h3 className="text-base font-semibold text-slate-900">Card QR code</h3>
            <p className="mt-1 text-center text-sm text-slate-600">
              {isActive
                ? `Scan to open ${card.fullName}'s digital visiting card.`
                : "This QR code will work after the card is activated."}
            </p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin title={`QR code for ${card.fullName}`} />
            </div>
            <QRCodeDownloads name={card.fullName} value={qrUrl} className="mt-4" />
          </section>
        )}
      </aside>
      {deleteConfirmationOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="preview-delete-title" aria-describedby="preview-delete-description" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 id="preview-delete-title" className="text-lg font-bold text-slate-950">Delete this card?</h2>
                <p id="preview-delete-description" className="mt-2 text-sm leading-6 text-slate-600">
                  This permanently deletes {card.fullName}&apos;s visiting card. This action cannot be undone.
                </p>
              </div>
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" autoFocus disabled={deleting} onClick={() => setDeleteConfirmationOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                Cancel
              </button>
              <button type="button" disabled={deleting} onClick={() => { void deleteCard(); }} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60">
                {deleting && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                {deleting ? "Deleting..." : "Delete card"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
