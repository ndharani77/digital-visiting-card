"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CirclePause, CreditCard, QrCode, Search, X } from "lucide-react";
import CardActions from "@/components/CardActions";
import type { VisitingCard } from "@/lib/types";
import type { UserRole } from "@/lib/types";
import { getCardQrPath, getCardQrViewerPath } from "@/lib/card-slug";

type CardFilter = "all" | "active" | "inactive";

export default function MyCardsStatusFilter({ cards, role }: { cards: VisitingCard[]; role: UserRole }) {
  const [filter, setFilter] = useState<CardFilter>("all");
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const branchNames = [...new Set(cards.map((card) => card.branchName).filter((name): name is string => Boolean(name)))]
    .sort((left, right) => left.localeCompare(right));
  const activeCards = cards.filter((card) => card.isActive);
  const inactiveCards = cards.filter((card) => !card.isActive);
  const normalizedQuery = query.trim().toLowerCase();
  const matchingCards = cards.filter((card) => {
    const matchesBranch = branchFilter === "all"
      || (branchFilter === "__parent__" ? !card.branchId : card.branchName === branchFilter);
    const matchesQuery = !normalizedQuery || [
      card.id,
      card.fullName,
      card.designation,
      card.company,
      card.email,
      card.mobile,
      card.branchName ?? "",
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
    return matchesBranch && matchesQuery;
  });
  const matchingActiveCards = matchingCards.filter((card) => card.isActive);
  const matchingInactiveCards = matchingCards.filter((card) => !card.isActive);

  return (
    <>
      <div className="mb-6 flex w-full flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
        <label htmlFor="visiting-card-search" className="sr-only">Search visiting cards</label>
        <div className="relative">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="visiting-card-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, title, company, email, or phone"
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear card search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={16} aria-hidden="true" />
          </button>}
        </div>
        </div>
        {branchNames.length > 0 && (
          <label className="text-sm font-medium text-slate-700">
            <span className="sr-only">Filter by branch</span>
            <select
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
              className="h-full min-h-12 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-sm"
            >
              <option value="all">All branches and parent</option>
              <option value="__parent__">Parent company only</option>
              {branchNames.map((branchName) => (
                <option key={branchName} value={branchName}>{branchName}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <section aria-label="Filter cards by status" className="dashboard-card-grid mb-9 grid gap-4 sm:grid-cols-3">
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
        {(filter === "all" || filter === "active") && matchingActiveCards.length > 0 && (
          <CardSection title="Active cards" cards={matchingActiveCards} isActive role={role} />
        )}
        {(filter === "all" || filter === "inactive") && matchingInactiveCards.length > 0 && (
          <CardSection title="Inactive cards" cards={matchingInactiveCards} isActive={false} role={role} />
        )}
        {normalizedQuery && matchingCards.length === 0 && (
          <p role="status" className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No visiting cards match “{query.trim()}”.</p>
        )}
        {branchFilter !== "all" && matchingCards.length === 0 && (
          <p role="status" className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No visiting cards match the selected branch.</p>
        )}
        {!normalizedQuery && filter === "active" && activeCards.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">There are no active cards. Reactivate one from the Inactive cards section.</p>
        )}
        {normalizedQuery && filter === "active" && matchingCards.length > 0 && matchingActiveCards.length === 0 && (
          <p role="status" className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No active cards match your search.</p>
        )}
        {!normalizedQuery && filter === "inactive" && inactiveCards.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">There are no inactive cards.</p>
        )}
        {normalizedQuery && filter === "inactive" && matchingCards.length > 0 && matchingInactiveCards.length === 0 && (
          <p role="status" className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No inactive cards match your search.</p>
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
      className={`dashboard-stat-card flex w-full items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm shadow-slate-900/[0.02] transition hover:-translate-y-0.5 hover:shadow-md ${
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
      <div className="dashboard-card-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.id} className="dashboard-card-tile group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/[0.08]">
            <div className="absolute right-3 top-3 z-10"><CardActions cardId={card.id} cardName={card.fullName} isActive={card.isActive} role={role} /></div>
            <Link href={getCardQrPath(card)} aria-label={`Preview ${card.fullName}'s scanned visiting card`} className="block">
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
              {card.branchName && <p className="mt-1 truncate text-xs font-semibold text-blue-700">Branch: {card.branchName}</p>}
            </Link>
            <Link href={getCardQrViewerPath(card)} className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-blue-700 hover:text-blue-800">
              <span>View QR code</span>
              <span className="flex items-center gap-2"><QrCode size={17} /><ArrowUpRight size={16} /></span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
