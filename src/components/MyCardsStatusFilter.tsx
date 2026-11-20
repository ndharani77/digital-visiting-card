"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CirclePause, CreditCard, QrCode } from "lucide-react";
import CardActions from "@/components/CardActions";
import type { VisitingCard } from "@/lib/types";
import type { UserRole } from "@/lib/types";

type CardFilter = "all" | "active" | "inactive";

export default function MyCardsStatusFilter({ cards, role }: { cards: VisitingCard[]; role: UserRole }) {
  const [filter, setFilter] = useState<CardFilter>("all");
  const activeCards = cards.filter((card) => card.isActive);
  const inactiveCards = cards.filter((card) => !card.isActive);

  return (
    <>
      <section aria-label="Filter cards by status" className="mb-9 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<CreditCard size={20} />}
          label="Total cards"
          count={cards.length}
          tone="blue"
          selected={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <SummaryCard
          icon={<CheckCircle2 size={20} />}
          label="Active"
          count={activeCards.length}
          tone="green"
          selected={filter === "active"}
          onClick={() => setFilter("active")}
        />
        <SummaryCard
          icon={<CirclePause size={20} />}
          label="Inactive"
          count={inactiveCards.length}
          tone="slate"
          selected={filter === "inactive"}
          onClick={() => setFilter("inactive")}
        />
      </section>

      <div className="space-y-10">
        {(filter === "all" || filter === "active") && activeCards.length > 0 && (
          <CardSection title="Active cards" cards={activeCards} isActive role={role} />
        )}
        {(filter === "all" || filter === "inactive") && inactiveCards.length > 0 && (
          <CardSection title="Inactive cards" cards={inactiveCards} isActive={false} role={role} />
        )}
        {filter === "active" && activeCards.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">There are no active cards. Reactivate one from the Inactive cards section.</p>
        )}
        {filter === "inactive" && inactiveCards.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">There are no inactive cards.</p>
        )}
      </div>
    </>
  );
}

function SummaryCard({
  icon,
  label,
  count,
  tone,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  tone: "blue" | "green" | "slate";
  selected: boolean;
  onClick: () => void;
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm shadow-slate-900/[0.02] transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>{icon}</span>
      <span>
        <span className="block text-sm font-medium text-slate-500">{label}</span>
        <span className="mt-1 block text-2xl font-bold tracking-tight text-slate-950">{count}</span>
      </span>
    </button>
  );
}

function CardSection({ title, cards, isActive, role }: { title: string; cards: VisitingCard[]; isActive: boolean; role: UserRole }) {
  return (
    <section aria-labelledby={`${isActive ? "active" : "inactive"}-cards-title`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id={`${isActive ? "active" : "inactive"}-cards-title`} className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{isActive ? "Cards available to share and scan." : "Cards are hidden from active contact actions."}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{cards.length}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.id} className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/[0.08]">
            <div className="absolute right-3 top-3 z-10"><CardActions cardId={card.id} cardName={card.fullName} isActive={card.isActive} role={role} /></div>
            <Link href={`/card/${card.id}/view`} className="block">
              <div className="mb-5 flex items-center justify-between pr-10">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActive ? "bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-800" : "bg-slate-100 text-slate-500"}`}>
                  <CreditCard size={22} />
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <h3 className="truncate text-base font-bold tracking-tight text-slate-950">{card.fullName}</h3>
              <p className="mt-1 truncate text-sm font-medium text-slate-600">{card.designation}</p>
              <p className="mt-1 truncate text-sm text-slate-500">{card.company}</p>
              {card.branchName && <p className="mt-1 truncate text-xs font-medium text-blue-700">Branch: {card.branchName}</p>}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                <span>View QR code</span>
                <span className="flex items-center gap-2"><QrCode size={17} /><ArrowUpRight size={16} /></span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
