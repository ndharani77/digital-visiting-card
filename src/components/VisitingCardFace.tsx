import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { VisitingCard } from "@/lib/types";
import { DEFAULT_CARD_ACCENT, DEFAULT_CARD_BACKGROUND, DEFAULT_COMPANY_LOGO, getCardTextColors } from "@/lib/card-defaults";

type VisitingCardFaceProps = Pick<
  VisitingCard,
  "fullName" | "designation" | "company" | "countryCode" | "mobile" | "email" | "address" | "website" | "backgroundColor" | "accentColor"
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
  backgroundColor,
  accentColor,
  qrUrl,
  showPlaceholders = false,
  linksClickable = false,
}: VisitingCardFaceProps) {
  const accent = accentColor || DEFAULT_CARD_ACCENT;
  const textColors = getCardTextColors(backgroundColor);
  const detailClass = "truncate";

  function renderLink(value: string, href = value) {
    if (linksClickable) {
      return <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">{value}</a>;
    }
    return value;
  }

  return (
    <div
      className="aspect-[1.85/1] w-full overflow-hidden rounded-xl border border-blue-200 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.12)] sm:p-5"
      style={{ backgroundColor: backgroundColor || DEFAULT_CARD_BACKGROUND, color: textColors.foreground }}
    >
      <div className="flex h-full gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 flex min-w-0 items-center gap-2">
            <img src={DEFAULT_COMPANY_LOGO} alt={`${company || "Company"} logo`} className="h-8 w-8 shrink-0 rounded-md bg-white object-contain p-1" />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold uppercase tracking-wide sm:text-xs" style={{ color: accent }}>{company || (showPlaceholders ? "YOUR COMPANY" : "")}</p>
              <p className="text-[8px] sm:text-[9px]" style={{ color: textColors.secondary }}>Professional Business Card</p>
            </div>
          </div>
          <div className="mt-auto min-w-0">
            <h3 className="truncate text-sm font-bold sm:text-base">{fullName || (showPlaceholders ? "Your Name" : "")}</h3>
            <p className="truncate text-[9px] sm:text-[10px]" style={{ color: textColors.secondary }}>{designation || (showPlaceholders ? "Your Designation" : "")}</p>
            <div className="mt-2 h-px w-full" style={{ backgroundColor: `${accent}99` }} />
            <div className="mt-2 space-y-1 text-[8px] sm:text-[9px]" style={{ color: textColors.foreground }}>
              <p className={detailClass}>☎ {mobile ? `${countryCode || "+91"} ${mobile}` : showPlaceholders ? "Mobile number" : ""}</p>
              <p className={detailClass}>✉ {email || (showPlaceholders ? "Email address" : "")}</p>
              {address && <p className="whitespace-pre-line">⌖ {address}</p>}
              {website && <p className={detailClass}>↗ {linksClickable ? renderLink(website.replace(/^https?:\/\//i, "").replace(/\/$/, ""), website) : website}</p>}
            </div>
          </div>
        </div>
        <div className="flex w-[38%] shrink-0 flex-col items-center justify-center border-l pl-2" style={{ borderColor: textColors.divider }}>
          <div className="flex h-[160px] w-[160px] flex-col items-center justify-center rounded-lg bg-white p-2 text-slate-700 shadow-md">
            {qrUrl ? (
              <>
                <QRCodeSVG value={qrUrl} size={128} level="M" title="QR code for this visiting card" />
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
