"use client";

import { useState } from "react";
import { CheckCircle2, CirclePause, CreditCard, Search, X } from "lucide-react";
import CardPreviewDrawer from "@/components/CardPreviewDrawer";
import CardPreviewTile from "@/components/CardPreviewTile";
import type { UserRole, VisitingCard } from "@/lib/types";

type CardFilter = "all" | "active" | "inactive";

export default function MyCardsStatusFilter({
  cards,
  role,
  companies = [],
}: {
  cards: VisitingCard[];
  role: UserRole;
  companies?: { id: string; name: string }[];
}) {
  const [filter, setFilter] = useState<CardFilter>("all");
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [selectedCard, setSelectedCard] = useState<VisitingCard | null>(null);
  const branchNames = [...new Set(cards.map((card) => card.branchName).filter((name): name is string => Boolean(name)))]
    .sort((left, right) => left.localeCompare(right));
  const companyCards = companyFilter === "all"
    ? cards
    : cards.filter((card) => card.companyId === companyFilter);
  const activeCards = companyCards.filter((card) => card.isActive);
  const inactiveCards = companyCards.filter((card) => !card.isActive);
  const normalizedQuery = query.trim().toLowerCase();
  const matchingCards = companyCards.filter((card) => {
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
        {companies.length > 0 && (
          <label className="min-w-[200px] text-sm font-medium text-slate-700">
            <span className="sr-only">Filter by company</span>
            <select
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="h-full min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-sm"
            >
              <option value="all">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
        )}
        {branchNames.length > 0 && companies.length === 0 && (
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
          count={companyCards.length}
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
          <CardSection title="Active cards" cards={matchingActiveCards} isActive onSelectCard={setSelectedCard} />
        )}
        {(filter === "all" || filter === "inactive") && matchingInactiveCards.length > 0 && (
          <CardSection title="Inactive cards" cards={matchingInactiveCards} isActive={false} onSelectCard={setSelectedCard} />
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
      {selectedCard && (
        <CardPreviewDrawer card={selectedCard} role={role} onClose={() => setSelectedCard(null)} />
      )}
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

function CardSection({
  title,
  cards,
  isActive,
  onSelectCard,
}: {
  title: string;
  cards: VisitingCard[];
  isActive: boolean;
  onSelectCard: (card: VisitingCard) => void;
}) {
  return (
    <section aria-labelledby={`${isActive ? "active" : "inactive"}-cards-title`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id={`${isActive ? "active" : "inactive"}-cards-title`} className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{isActive ? "Cards available to share and scan." : "Cards are hidden from active contact actions."}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{cards.length}</span>
      </div>
      <div className="dashboard-card-grid grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <CardPreviewTile key={card.id} card={card} onSelect={onSelectCard} />
        ))}
      </div>
    </section>
  );
}
