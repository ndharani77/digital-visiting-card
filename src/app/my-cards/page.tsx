import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CreditCard, Plus, QrCode } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getCards } from "@/lib/store";
import CardActions from "@/components/CardActions";

export const dynamic = "force-dynamic";

export default async function MyCardsPage() {
  const cards = await getCards();
  return (
    <div className="flex min-h-screen"><Sidebar /><main className="min-w-0 flex-1 p-5 md:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link><h1 className="text-2xl font-bold">My Visiting Cards</h1><p className="mt-1 text-sm text-slate-500">View all created digital visiting cards and their QR pages.</p></div><Link href="/create-card" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={18} />Create Card</Link></header>
      {cards.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><CreditCard className="mx-auto mb-4 text-slate-400" size={36} /><h2 className="font-semibold">No cards created yet</h2><p className="mt-1 text-sm text-slate-500">Your created cards will appear here.</p><Link href="/create-card" className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Create your first card</Link></div> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map((card) => <article key={card.id} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md"><div className="absolute right-3 top-3 z-10"><CardActions cardId={card.id} cardName={card.fullName} /></div><Link href={`/card/${card.id}/view`} className="block"><div className="mb-5 flex items-center justify-between pr-10"><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><CreditCard size={22} /></div><QrCode className="text-slate-400" size={22} /></div><h2 className="font-bold">{card.fullName}</h2><p className="mt-1 text-sm text-slate-500">{card.designation}</p><p className="mt-1 text-sm text-slate-500">{card.company}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-blue-600"><span>Open card & QR</span><ArrowUpRight size={17} /></div></Link></article>)}</div>}
    </main></div>
  );
}
