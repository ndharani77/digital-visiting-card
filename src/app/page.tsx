import Link from "next/link";
import { ArrowUpRight, Plus, QrCode } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DashboardCardSearch from "@/components/DashboardCardSearch";

async function getCards() {
  try {
    const { getCards } = await import("@/lib/store");
    return await getCards();
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const cards = await getCards();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Manage your digital visiting cards in one place.</p></div>
          <Link href="/create-card" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus size={18} />Create Card</Link>
        </header>

        <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 p-7 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div><p className="mb-2 text-sm text-blue-200">Welcome to Card Reader</p><h2 className="text-2xl font-bold">Your digital identity starts here.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Create a professional visiting card, generate a unique QR code and let people save your contact in seconds.</p><Link href="/create-card" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue-900 hover:bg-blue-50">Create a Visiting Card<ArrowUpRight size={17} /></Link></div>
            <div className="hidden h-32 w-32 items-center justify-center rounded-2xl border border-white/20 bg-white/10 md:flex"><QrCode size={88} strokeWidth={1.2} /></div>
          </div>
        </section>

        <DashboardCardSearch cards={cards} />
      </main>
    </div>
  );
}
