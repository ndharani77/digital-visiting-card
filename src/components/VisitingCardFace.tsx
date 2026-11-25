import Image from "next/image";
import { Globe, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import type { VisitingCard } from "@/lib/types";
import { DEFAULT_CARD_ACCENT, DEFAULT_COMPANY_LOGO } from "@/lib/card-defaults";

type VisitingCardFaceProps = Pick<
  VisitingCard,
  | "fullName"
  | "designation"
  | "company"
  | "countryCode"
  | "mobile"
  | "email"
  | "address"
  | "website"
  | "linkedin"
  | "linkedinName"
  | "logoData"
  | "accentColor"
> & {
  showPlaceholders?: boolean;
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
  linkedin,
  linkedinName,
  logoData,
  accentColor,
  showPlaceholders = false,
}: VisitingCardFaceProps) {
  const accent = accentColor || DEFAULT_CARD_ACCENT;
  const rows = [
    {
      Icon: Phone,
      value: mobile ? `${countryCode || "+91"} ${mobile}` : showPlaceholders ? "Mobile number" : "",
    },
    { Icon: Mail, value: email || (showPlaceholders ? "Email address" : "") },
    ...(address ? [{ Icon: MapPin, value: address }] : []),
    ...(website || showPlaceholders
      ? [{
          Icon: Globe,
          value: website
            ? website.replace(/^https?:\/\//i, "").replace(/\/$/, "")
            : "Website (if available)",
        }]
      : []),
    ...(linkedin
      ? [{ Icon: Linkedin, value: linkedinName?.trim() || fullName }]
      : []),
  ].filter((row) => row.value);

  return (
    <article
      className="relative mx-auto w-full overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.10)]"
      style={{ "--card-preview-accent": accent } as React.CSSProperties}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-[100px] w-[56%]"
        viewBox="0 0 240 112"
        preserveAspectRatio="none"
      >
        <path d="M0 0h240v112C184 53 103 10 0 0Z" fill="var(--card-preview-accent)" />
        <path d="M0 0C103 10 184 53 240 112" fill="none" stroke="#d8e6f2" strokeWidth="3" />
        <path d="M86 0C155 17 207 57 240 101" fill="none" stroke="#a9c5df" strokeWidth="2" />
      </svg>

      <header className="relative z-10 px-5 pt-5">
        <Image
          src={logoData || DEFAULT_COMPANY_LOGO}
          alt={`${company || "Company"} logo`}
          width={150}
          height={40}
          unoptimized
          className="h-10 w-[150px] max-w-full object-contain object-left"
        />
      </header>

      <div className="relative z-10 px-5 pb-5 pt-10">
        <h2 className="break-words text-xl font-bold leading-tight tracking-tight text-slate-950">
          {fullName || (showPlaceholders ? "Your Name" : "")}
        </h2>
        <div className="mt-2 h-[2px] w-fit min-w-24 max-w-full bg-[var(--card-preview-accent)]" />
        <p className="mt-2 break-words text-sm leading-5 text-slate-600">
          {designation || (showPlaceholders ? "Your Designation" : "")}
        </p>

        <div className="mt-6 space-y-3">
          {rows.map(({ Icon, value }, index) => (
            <div key={`${index}-${value}`} className="flex min-w-0 items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--card-preview-accent)] text-white">
                <Icon size={15} aria-hidden="true" />
              </span>
              <span className="mt-0.5 min-h-7 w-px shrink-0 self-stretch bg-slate-300" />
              <span className="min-w-0 break-words pt-0.5 text-sm leading-[1.4] text-slate-800">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
