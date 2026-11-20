"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, QrCode, Search } from "lucide-react";
import CardActions from "@/components/CardActions";
import type { VisitingCard } from "@/lib/types";
import type { UserRole } from "@/lib/types";

type CardFilter = "recent" | "all" | "active" | "inactive";

export default function DashboardCardSearch({
  cards,
  role,
  canCreateCard,
  scopeLabel,
  hasCompanySelected,
}: {
  cards: VisitingCard[];
  role: UserRole;
  canCreateCard: boolean;
  scopeLabel: string;
  hasCompanySelected: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CardFilter>("recent");
  const normalizedQuery = query.trim().toLowerCase();
  const activeCards = cards.filter((card) => card.isActive);
  const inactiveCards = cards.filter((card) => !card.isActive);
  const sourceCards = filter === "active"
    ? activeCards
    : filter === "inactive"
      ? inactiveCards
      : filter === "recent" && !normalizedQuery
        ? cards.slice(0, 6)
        : cards;
  const matchingCards = normalizedQuery
    ? sourceCards.filter((card) =>
        [card.fullName, card.designation, card.company, card.branchName ?? "", card.email, card.mobile]
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      )
    : sourceCards;
  const sectionTitle = normalizedQuery
    ? "Search results"
    : filter === "recent"
      ? role === "EMPLOYEE"
        ? "My card"
        : role === "COMPANY_ADMIN"
          ? "Company cards"
          : scopeLabel === "All companies"
            ? "Cards across companies"
            : `${scopeLabel} cards`
      : filter === "all"
        ? "All cards"
        : filter === "active"
          ? "Active cards"
          : "Inactive cards";
  const countNoun = matchingCards.length === 1 ? "card" : "cards";
  const resultLabel = normalizedQuery
    ? `${matchingCards.length} ${matchingCards.length === 1 ? "result" : "results"}`
    : filter === "recent"
      ? `${matchingCards.length} recent ${countNoun}`
      : filter === "active"
        ? `${matchingCards.length} active ${countNoun}`
        : filter === "inactive"
          ? `${matchingCards.length} inactive ${countNoun}`
          : `${matchingCards.length} ${countNoun}`;
  const emptyTitle = role === "EMPLOYEE"
    ? "No card assigned yet"
    : role === "SUPER_ADMIN" && !hasCompanySelected
          ? "No cards to display"
          : role === "COMPANY_ADMIN"
            ? "No company cards yet"
            : "No cards in this workspace";
  const emptyDescription = role === "EMPLOYEE"
    ? "Ask your company administrator to create or assign your digital card."
    : role === "SUPER_ADMIN" && !hasCompanySelected
          ? "Select a company from the sidebar, or create a company workspace to get started."
          : "Create a digital card to represent a team member and generate a shareable QR code.";
  const emptyActionHref = role === "SUPER_ADMIN" && !hasCompanySelected ? "/companies" : "/create-card";
  const emptyActionLabel = role === "SUPER_ADMIN" && !hasCompanySelected ? "Manage companies" : "Create card";
  const showEmptyAction = canCreateCard || (role === "SUPER_ADMIN" && !hasCompanySelected);
  const searchPlaceholder = role === "EMPLOYEE"
    ? "Search your card by name or contact details"
    : "Search by name, designation, company, email, or phone";
  const filterOptions: { value: CardFilter; label: string; count?: number }[] = [
    { value: "recent", label: "Recent" },
    { value: "all", label: "All", count: cards.length },
    { value: "active", label: "Active", count: activeCards.length },
    { value: "inactive", label: "Inactive", count: inactiveCards.length },
  ];

  return (
    <>
      <div className="dashboard-card-search mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-900/[0.02]">
        <section className="min-w-0 flex-1">
          <label htmlFor="card-search" className="sr-only">Search visiting cards</label>
          <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition-colors">
            <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="card-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </section>
        <div role="group" aria-label="Filter cards" className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                filter === option.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {option.label}
              {option.count !== undefined && <span className="ml-1.5 text-slate-400">{option.count}</span>}
            </button>
          ))}
        </div>
        <span className="px-2 text-xs font-semibold text-slate-500">{resultLabel}</span>
      </div>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">{sectionTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {normalizedQuery
                ? `${matchingCards.length} matching ${countNoun}`
                : filter === "recent"
                  ? role === "EMPLOYEE"
                    ? "The card assigned to your account."
                    : role === "COMPANY_ADMIN"
                      ? `Cards managed by ${scopeLabel}.`
                      : `Cards in ${scopeLabel}.`
                  : `${matchingCards.length} ${countNoun}`}
            </p>
          </div>
          {role !== "EMPLOYEE" && (
            <Link href="/my-cards" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">View all cards<ArrowRight size={16} /></Link>
          )}
        </div>
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><CreditCard size={28} /></div>
            <h3 className="font-semibold">{emptyTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
            {showEmptyAction && (
              <Link href={emptyActionHref} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                {emptyActionLabel}<ArrowRight size={16} />
              </Link>
            )}
          </div>
        ) : matchingCards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
            {normalizedQuery ? `No cards match “${query}”.` : filter === "active" ? "There are no active cards." : "There are no inactive cards."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {matchingCards.map((card) => (
              <article key={card.id} className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/[0.08]">
                <div className="absolute right-3 top-3 z-10"><CardActions cardId={card.id} cardName={card.fullName} isActive={card.isActive} role={role} /></div>
                <Link href={`/card/${card.id}/view`} className="block">
                  <div className="mb-5 flex items-center justify-between pr-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-800"><CreditCard size={22} /></div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${card.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${card.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {card.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-bold tracking-tight text-slate-950">{card.fullName}</h3>
                  <p className="mt-1 truncate text-sm font-medium text-slate-600">{card.designation}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{card.company}</p>
                  {card.branchName && <p className="mt-1 truncate text-xs font-medium text-blue-700">Branch: {card.branchName}</p>}
                  <p className="mt-4 truncate text-sm text-slate-500">{card.email}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-blue-700 group-hover:text-blue-800"><span>View QR code</span><QrCode size={17} /></div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
