"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";

export default function CardActions({ cardId, cardName }: { cardId: string; cardName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function removeCard() {
    if (!window.confirm(`Delete "${cardName}"? This cannot be undone.`)) return;

    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to delete card.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete card.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative">
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
            <Pencil size={16} /> Edit
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={deleting}
            onClick={removeCard}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 size={16} /> {deleting ? "Deleting..." : "Delete"}
          </button>
          {error && <p role="alert" className="px-3 py-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
