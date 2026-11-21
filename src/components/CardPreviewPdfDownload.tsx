"use client";

import { Download, LoaderCircle } from "lucide-react";

export default function CardPreviewPdfDownload({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={isLoading ? "Creating PDF" : "Download the full card preview as a PDF"}
      title="Download the complete card preview as a PDF"
      onClick={onClick}
      disabled={isLoading}
      className="company-brand-hover flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-700 disabled:cursor-wait disabled:opacity-60"
    >
      <span className="company-brand-text flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        {isLoading ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
      </span>
      <span>{isLoading ? "Creating…" : "PDF"}</span>
    </button>
  );
}
