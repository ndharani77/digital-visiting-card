import Link from "next/link";
import { Building2, Users } from "lucide-react";

export default function CompanyManagementTabs({
  companyId,
  active,
}: {
  companyId: string;
  active: "access" | "branches";
}) {
  const links = [
    { key: "access" as const, href: `/companies/${encodeURIComponent(companyId)}`, label: "People & access", icon: Users },
    { key: "branches" as const, href: `/companies/${encodeURIComponent(companyId)}/branches`, label: "Branches", icon: Building2 },
  ];

  return (
    <nav aria-label="Company management options" className="mb-6 flex w-fit max-w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {links.map(({ key, href, label, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          aria-current={active === key ? "page" : undefined}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
            active === key
              ? "bg-blue-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Icon size={16} aria-hidden="true" />{label}
        </Link>
      ))}
    </nav>
  );
}
