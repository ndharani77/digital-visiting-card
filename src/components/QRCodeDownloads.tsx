"use client";

import { useRef, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type DownloadFormat = "png" | "jpg" | "pdf";

function safeFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/[. ]+$/g, "").trim() || "contact";
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Unable to create the QR code image."));
    }, type, quality);
  });
}

function createPdf(jpegBytes: Uint8Array, imageSize: number) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets = [0];
  let length = 0;
  const append = (chunk: Uint8Array) => {
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

export default function QRCodeDownloads({ name, value }: { name: string; value: string }) {
  const qrContainer = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<DownloadFormat | "">("");
  const [formatsOpen, setFormatsOpen] = useState(false);

  async function download(format: DownloadFormat) {
    const svg = qrContainer.current?.querySelector("svg");
    if (!svg) {
      setError("The QR code is not ready yet.");
      return;
    }

    setError("");
    setDownloading(format);
    let imageUrl = "";
    try {
      const svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
      imageUrl = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.src = imageUrl;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to prepare the QR code image.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      let blob: Blob;
      if (format === "pdf") {
        const jpeg = await canvasBlob(canvas, "image/jpeg", 0.95);
        blob = createPdf(new Uint8Array(await jpeg.arrayBuffer()), canvas.width);
      } else {
        blob = await canvasBlob(canvas, format === "png" ? "image/png" : "image/jpeg", 0.95);
      }

      const fileUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = `${safeFileName(name)}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to download the QR code.");
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setDownloading("");
      setFormatsOpen(false);
    }
  }

  return (
    <section className="mt-5">
      <div className="relative inline-block">
        <button
          type="button"
          disabled={Boolean(downloading)}
          aria-expanded={formatsOpen}
          aria-controls="qr-download-formats"
          onClick={() => setFormatsOpen((open) => !open)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
        >
          <Download size={16} aria-hidden="true" />
          {downloading ? "Preparing..." : "Download"}
          <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${formatsOpen ? "rotate-180" : ""}`} />
        </button>
        {formatsOpen && (
          <div id="qr-download-formats" role="menu" aria-label="Choose download format" className="absolute left-0 top-full z-10 mt-2 min-w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {([
              { format: "png", label: "PNG image" },
              { format: "jpg", label: "JPG image" },
              { format: "pdf", label: "PDF document" },
            ] as const).map(({ format, label }) => (
              <button
                key={format}
                type="button"
                role="menuitem"
                onClick={() => { void download(format); }}
                disabled={Boolean(downloading)}
                className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
              >
                <span>{label}</span>
                <span className="text-xs font-medium uppercase text-slate-400">.{format}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div ref={qrContainer} aria-hidden="true" className="pointer-events-none fixed -left-[2000px] top-0">
        <QRCodeSVG value={value} size={1024} level="H" includeMargin />
      </div>
    </section>
  );
}
