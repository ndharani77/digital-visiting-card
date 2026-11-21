"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ellipsis, Pencil, Power, SlidersHorizontal, Trash2 } from "lucide-react";
import type { UserRole } from "@/lib/types";

export default function CardActions({
  cardId,
  cardName,
  isActive,
  role = "COMPANY_ADMIN",
}: {
  cardId: string;
  cardName: string;
  isActive: boolean;
  role?: UserRole;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !actionsRef.current?.contains(event.target)) {
        setOpen(false);
        setError("");
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  async function toggleActive() {
    setUpdatingStatus(true);
    setError("");
    try {
      const response = await fetch(`/api/cards/${encodeURIComponent(cardId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update card status.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update card status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function removeCard() {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to delete card.");
      setConfirmDeleteOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete card.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div ref={actionsRef} className="relative">
      <button
        type="button"
        aria-label={`Actions for ${cardName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => { setOpen((current) => !current); setError(""); }}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <Ellipsis size={20} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          <Link
            role="menuitem"
            href={`/create-card?id=${encodeURIComponent(cardId)}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={16} /> Edit card
          </Link>
          <Link
            role="menuitem"
            href={`/company/preview-details?cardId=${encodeURIComponent(cardId)}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <SlidersHorizontal size={16} /> Edit preview
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={updatingStatus}
            onClick={() => { void toggleActive(); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <Power size={16} /> {updatingStatus ? "Updating..." : isActive ? "Deactivate card" : "Activate card"}
          </button>
          {role !== "EMPLOYEE" && (
            <button
              type="button"
              role="menuitem"
              disabled={deleting}
              onClick={() => { setOpen(false); setConfirmDeleteOpen(true); setError(""); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={16} />Delete card
            </button>
          )}
          {error && <p role="alert" className="px-3 py-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-card-title-${cardId}`}
            aria-describedby={`delete-card-description-${cardId}`}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 id={`delete-card-title-${cardId}`} className="text-lg font-bold text-slate-950">Delete this card?</h2>
                <p id={`delete-card-description-${cardId}`} className="mt-2 text-sm leading-6 text-slate-600">
                  This permanently deletes {cardName}&apos;s card and QR code. This action cannot be undone.
                </p>
              </div>
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                disabled={deleting}
                onClick={() => { setConfirmDeleteOpen(false); setError(""); }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => { void removeCard(); }}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} aria-hidden="true" />{deleting ? "Deleting card..." : "Delete card"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
