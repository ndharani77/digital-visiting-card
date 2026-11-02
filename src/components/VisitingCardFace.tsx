import { Building2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { VisitingCard } from "@/lib/types";

type VisitingCardFaceProps = Pick<
  VisitingCard,
  "fullName" | "designation" | "company" | "countryCode" | "mobile" | "email" | "address" | "website" | "logoData" | "backgroundColor" | "accentColor"
> & {
  qrUrl?: string;
  showPlaceholders?: boolean;
  linksClickable?: boolean;
};

export default function VisitingCardFace({
  fullName,
  designation,
  company,
  countryCode,
  mobile,
  email,
  address,
  website,
  logoData,
  backgroundColor,
  accentColor,
  qrUrl,
  showPlaceholders = false,
  linksClickable = false,
}: VisitingCardFaceProps) {
  const accent = accentColor || "#d6ad55";
  const detailClass = "truncate";

  function renderLink(value: string) {
    if (linksClickable) {
      return <a href={value} target="_blank" rel="noopener noreferrer" className="hover:underline">{value}</a>;
    }
    return value;
  }

  return (
    <div
      className="aspect-[1.85/1] w-full overflow-hidden rounded-xl border border-slate-700/30 p-4 text-white shadow-[0_14px_35px_rgba(15,23,42,0.25)] sm:p-5"
      style={{ background: `linear-gradient(135deg, ${backgroundColor || "#17191f"}, #242832 70%, ${backgroundColor || "#17191f"})` }}
    >
      <div className="flex h-full gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 flex min-w-0 items-center gap-2">
            {logoData ? (
              <img src={logoData} alt={`${company || "Company"} logo`} className="h-8 w-8 shrink-0 rounded-md bg-white object-contain p-1" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/20"><Building2 size={16} /></div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold uppercase tracking-wide sm:text-xs" style={{ color: accent }}>{company || (showPlaceholders ? "YOUR COMPANY" : "")}</p>
              <p className="text-[8px] text-slate-300 sm:text-[9px]">Professional Business Card</p>
            </div>
          </div>
          <div className="mt-auto min-w-0">
            <h3 className="truncate text-sm font-bold sm:text-base">{fullName || (showPlaceholders ? "Your Name" : "")}</h3>
            <p className="truncate text-[9px] text-slate-300 sm:text-[10px]">{designation || (showPlaceholders ? "Your Designation" : "")}</p>
            <div className="mt-2 h-px w-full" style={{ backgroundColor: `${accent}99` }} />
            <div className="mt-2 space-y-1 text-[8px] text-slate-100 sm:text-[9px]">
              <p className={detailClass}>☎ {mobile ? `${countryCode || "+91"} ${mobile}` : showPlaceholders ? "Mobile number" : ""}</p>
              <p className={detailClass}>✉ {email || (showPlaceholders ? "Email address" : "")}</p>
              {address && <p className="line-clamp-1">⌖ {address}</p>}
              {website && <p className={detailClass}>↗ {renderLink(website)}</p>}
            </div>
          </div>
        </div>
        <div className="flex w-[27%] shrink-0 flex-col items-center justify-center border-l border-white/20 pl-2">
          <div className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-md bg-white p-1.5 text-slate-700 shadow-md">
            {qrUrl ? (
              <>
                <QRCodeSVG value={qrUrl} size={60} level="M" title="QR code for this visiting card" />
                <span className="mt-1 text-center text-[7px] leading-tight">SCAN TO OPEN</span>
              </>
            ) : (
              <>
                <QrCode size={48} strokeWidth={1.5} />
                <span className="mt-1 text-center text-[7px] leading-tight">Generated after saving</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
