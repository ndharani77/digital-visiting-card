"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { VisitingCard } from "@/lib/types";
import { getCardQrPath } from "@/lib/card-slug";

type ExportWritable = {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
};

type ExportFileHandle = {
  createWritable(): Promise<ExportWritable>;
};

type ExportDirectoryHandle = {
  getFileHandle(name: string, options: { create: boolean }): Promise<ExportFileHandle>;
};

type ZipEntry = {
  name: string;
  data: ArrayBuffer;
};

type ExportFormat = "png" | "jpg" | "pdf";

declare global {
  interface Window {
    showDirectoryPicker?: (options: { mode: "readwrite" }) => Promise<ExportDirectoryHandle>;
  }
}

function safeFileName(name: string) {
  const cleaned = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/[. ]+$/g, "").trim();
  return cleaned && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(cleaned) ? cleaned : `${cleaned || "contact"}_`;
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(`Unable to create the ${type} QR code file.`));
    }, type, quality);
  });
}

function createPdf(jpegBytes: Uint8Array<ArrayBuffer>, imageSize: number) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const offsets = [0];
  let length = 0;
  const append = (chunk: Uint8Array<ArrayBuffer>) => {
    chunks.push(chunk);
    length += chunk.length;
  };
  const appendText = (text: string) => append(encoder.encode(text));

  appendText("%PDF-1.4\n");
  offsets[1] = length;
  appendText("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  offsets[2] = length;
  appendText("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  offsets[3] = length;
  appendText("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /XObject << /QR 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");
  offsets[4] = length;
  appendText(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageSize} /Height ${imageSize} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  append(jpegBytes);
  appendText("\nendstream\nendobj\n");
  const content = "q\n300 0 0 300 0 0 cm\n/QR Do\nQ\n";
  offsets[5] = length;
  appendText(`5 0 obj\n<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`);

  const xrefOffset = length;
  appendText(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  const pdf = new Uint8Array(length);
  let position = 0;
  for (const chunk of chunks) {
    pdf.set(chunk, position);
    position += chunk.length;
  }
  return new Blob([pdf], { type: "application/pdf" });
}

function crc32(data: ArrayBuffer) {
  let crc = 0xffffffff;
  for (const byte of new Uint8Array(data)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(entries: ZipEntry[]) {
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  const centralDirectory: Uint8Array<ArrayBuffer>[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = new Uint8Array(entry.data);
    const checksum = crc32(entry.data);
    const localHeader = new Uint8Array(30 + name.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    localHeader.set(name, 30);
    parts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + name.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, localOffset, true);
    centralHeader.set(name, 46);
    centralDirectory.push(centralHeader);
    localOffset += localHeader.length + data.length;
  }

  const centralDirectorySize = centralDirectory.reduce((size, header) => size + header.length, 0);
  parts.push(...centralDirectory);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralDirectorySize, true);
  endView.setUint32(16, localOffset, true);
  parts.push(endRecord);
  return new Blob(parts, { type: "application/zip" });
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function createQrFile(svg: SVGSVGElement, format: ExportFormat) {
  const svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to prepare a QR code image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    if (format === "pdf") {
      const jpeg = await canvasBlob(canvas, "image/jpeg", 0.95);
      return createPdf(new Uint8Array(await jpeg.arrayBuffer()), canvas.width);
    }

    return canvasBlob(canvas, format === "png" ? "image/png" : "image/jpeg", 0.95);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function BulkQRCodeExport() {
  const qrContainer = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<VisitingCard[]>([]);
  const [qrCards, setQrCards] = useState<VisitingCard[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/cards")
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok) {
          const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
            ? result.message
            : "Unable to load saved cards.";
          throw new Error(message);
        }
        if (!Array.isArray(result)) throw new Error("The saved cards response is invalid.");
        if (active) setCards(result as VisitingCard[]);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load saved cards.");
      })
      .finally(() => {
        if (active) setLoadingCards(false);
      });

    return () => { active = false; };
  }, []);

  async function exportQRCodes() {
    setError("");
    setProgress("");
    const selectedCards = cards.filter((card) => selectedIds.includes(card.id));
    if (selectedCards.length === 0) {
      setError("Select at least one card to export.");
      return;
    }

    setBusy(true);
    try {
      const directory = window.isSecureContext && window.showDirectoryPicker
        ? await window.showDirectoryPicker({ mode: "readwrite" })
        : undefined;
      if (!directory) setProgress("Folder selection is unavailable here. Preparing a ZIP download instead...");

      flushSync(() => setQrCards(selectedCards));
      const svgs = qrContainer.current?.querySelectorAll("svg");
      if (!svgs || svgs.length !== selectedCards.length) {
        throw new Error("Unable to prepare the selected QR codes for export.");
      }

      const nameCounts = new Map<string, number>();
      const failures: string[] = [];
      const zipEntries: ZipEntry[] = [];
      for (const [index, card] of selectedCards.entries()) {
        setProgress(`Exporting ${index + 1} of ${selectedCards.length}: ${card.fullName}`);
        const baseName = safeFileName(card.fullName);
        const count = (nameCounts.get(baseName.toLowerCase()) ?? 0) + 1;
        nameCounts.set(baseName.toLowerCase(), count);
        const fileName = `${baseName}${count > 1 ? ` (${count})` : ""}.${format}`;

        try {
          const blob = await createQrFile(svgs[index], format);
          if (directory) {
            const file = await directory.getFileHandle(fileName, { create: true });
            const writable = await file.createWritable();
            try {
              await writable.write(blob);
              await writable.close();
            } catch (writeError) {
              await writable.abort();
              throw writeError;
            }
          } else {
            zipEntries.push({ name: fileName, data: await blob.arrayBuffer() });
          }
        } catch (exportError) {
          failures.push(`${card.fullName}: ${exportError instanceof Error ? exportError.message : "Export failed."}`);
        }
      }

      const exportedCount = selectedCards.length - failures.length;
      if (directory) {
        setProgress(`Exported ${exportedCount} of ${selectedCards.length} selected QR codes as ${format.toUpperCase()} files.`);
      } else if (zipEntries.length > 0) {
        downloadBlob(createZip(zipEntries), `qr-codes-${format}.zip`);
        setProgress(`Downloaded ${zipEntries.length} selected QR codes as ${format.toUpperCase()} files in a ZIP.`);
      }
      if (failures.length > 0) setError(failures.join(" "));
    } catch (exportError) {
      if (exportError instanceof DOMException && exportError.name === "AbortError") return;
      setError(exportError instanceof Error ? exportError.message : "Unable to export QR codes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Select cards to export</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Choose the cards and file format. Files use each contact&apos;s full name.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedIds(selectedIds.length === cards.length ? [] : cards.map((card) => card.id))}
            disabled={loadingCards || cards.length === 0 || busy}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {selectedIds.length === cards.length && cards.length > 0 ? "Deselect all" : "Select all"}
          </button>
        </div>

        {loadingCards ? (
          <p role="status" className="mt-6 text-sm text-slate-500">Loading saved cards...</p>
        ) : cards.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No saved cards to export.</p>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const checked = selectedIds.includes(card.id);
              return (
                <li key={card.id}>
                  <label className={`flex h-full cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${checked ? "border-blue-300 bg-blue-50/70" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={busy}
                      onChange={(event) => setSelectedIds((current) => event.target.checked
                        ? [...current, card.id]
                        : current.filter((id) => id !== card.id))}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">{card.fullName}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{card.designation} · {card.email}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6">
          <label htmlFor="qr-export-format" className="mb-2 block text-sm font-semibold text-slate-700">File format</label>
          <select
            id="qr-export-format"
            value={format}
            onChange={(event) => setFormat(event.target.value as ExportFormat)}
            disabled={busy}
            className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          >
            <option value="png">PNG image</option>
            <option value="jpg">JPG image</option>
            <option value="pdf">PDF document</option>
          </select>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => { void exportQRCodes(); }}
            disabled={busy || loadingCards || selectedIds.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={17} />
            {busy ? "Exporting..." : `Export ${selectedIds.length} selected`}
          </button>
          {progress && <p role="status" className="text-sm text-slate-600">{progress}</p>}
        </div>
        {error && <p role="alert" className="mt-4 whitespace-pre-line text-sm text-red-600">{error}</p>}
      </section>

      <div ref={qrContainer} aria-hidden="true" className="pointer-events-none fixed -left-[2000px] top-0">
        {qrCards.map((card) => (
          <QRCodeSVG key={card.id} value={`${window.location.origin}${getCardQrPath(card)}`} size={1024} level="H" includeMargin />
        ))}
      </div>
    </>
  );
}
