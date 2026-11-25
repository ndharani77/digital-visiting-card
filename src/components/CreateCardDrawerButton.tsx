"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function CreateCardDrawerButton({
  children,
  className,
  cardId,
}: {
  children: ReactNode;
  className: string;
  cardId?: string;
}) {
  const router = useRouter();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleMessage(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (!event.data || typeof event.data !== "object" || !("type" in event.data) ||
          typeof event.data.type !== "string") return;
      if (event.data.type === "close-card-form") {
        setOpen(false);
      } else if (event.data.type === "card-created" && "success" in event.data && event.data.success === true) {
        setOpen(false);
        router.refresh();
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("message", handleMessage);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, router]);

  const formUrl = cardId
    ? `/create-card?canvas=1&id=${encodeURIComponent(cardId)}`
    : "/create-card?canvas=1";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/45">
          <button
            type="button"
            aria-label="Close card form"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-card-drawer-title"
            className="relative flex h-full w-full flex-col border-l border-slate-200 bg-slate-50 shadow-2xl sm:w-1/2"
          >
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Card setup</p>
                <h2 id="create-card-drawer-title" className="text-lg font-bold text-slate-950">
                  {cardId ? "Edit card details" : "Create a digital card"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close card form"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            <iframe
              ref={frameRef}
              title={cardId ? "Edit visiting card form" : "Create visiting card form"}
              src={formUrl}
              className="min-h-0 w-full flex-1 border-0 bg-slate-50"
            />
          </aside>
        </div>
      )}
    </>
  );
}
