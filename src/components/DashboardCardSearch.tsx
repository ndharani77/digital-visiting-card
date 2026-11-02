"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CreditCard, Search } from "lucide-react";
import CardActions from "@/components/CardActions";
import type { VisitingCard } from "@/lib/types";

export default function DashboardCardSearch({ cards }: { cards: VisitingCard[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const matchingCards = normalizedQuery
    ? cards.filter((card) =>
        [card.fullName, card.designation, card.company, card.email, card.mobile]
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      )
    : cards.slice(0, 6);

  return (
    <>
      <div className="mb-9 flex items-center gap-3">
        <section className="min-w-0 flex-1">
          <label htmlFor="card-search" className="sr-only">Search visiting cards</label>
          <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 transition-colors focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
            <Search size={17} className="shrink-0 text-slate-500" aria-hidden="true" />
            <input
              id="card-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cards by name, company, or email"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
            />
          </div>
        </section>

        <section className="w-fit shrink-0">
          <div className="flex h-12 items-center gap-4 rounded-lg border border-slate-300 bg-white px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Total Cards</p>
            <h3 className="text-lg font-semibold tabular-nums text-slate-900">{cards.length}</h3>
          </div>
        </section>
      </div>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{normalizedQuery ? "Search Results" : "Recent Visiting Cards"}</h2>
            <p className="mt-1 text-sm text-slate-500">{normalizedQuery ? `${matchingCards.length} matching cards` : "Your latest created cards."}</p>
          </div>
          <Link href="/my-cards" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">View all<ArrowRight size={16} /></Link>
        </div>
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><CreditCard size={28} /></div>
            <h3 className="font-semibold">No visiting cards yet</h3>
            <p className="mt-1 text-sm text-slate-500">Create your first card to get started.</p>
            <Link href="/create-card" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Create Card</Link>
          </div>
        ) : matchingCards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">No cards match “{query}”.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {matchingCards.map((card) => (
              <article key={card.id} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="absolute right-3 top-3 z-10"><CardActions cardId={card.id} cardName={card.fullName} /></div>
                <Link href={`/card/${card.id}`} className="block">
                  <div className="mb-5 flex items-start justify-between pr-10">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><CreditCard size={22} /></div>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Active</span>
                  </div>
                  <h3 className="font-bold">{card.fullName}</h3>
                  <p className="mt-1 text-sm text-slate-500">{card.designation} · {card.company}</p>
                  <p className="mt-4 text-sm text-slate-500">{card.email}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-medium text-blue-600"><span>View digital card</span><ArrowUpRight size={17} /></div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
