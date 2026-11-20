import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { requirePageUser } from "@/lib/auth";
import { getCardsForUser } from "@/lib/platform-store";
import MyCardsStatusFilter from "@/components/MyCardsStatusFilter";

export const dynamic = "force-dynamic";

export default async function MyCardsPage() {
  const user = await requirePageUser("/my-cards");
  const cards = await getCardsForUser(user);
  const canCreateCard = user.role !== "EMPLOYEE";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Card library</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">My cards</h1>
              <p className="mt-2 text-sm text-slate-500">Manage card details, scan previews, and active status.</p>
            </div>
            {canCreateCard && (
              <Link href="/create-card" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 hover:-translate-y-0.5 hover:bg-blue-800">
                <Plus size={18} />Create card
              </Link>
            )}
          </header>

          {cards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><CreditCard size={27} /></span>
              <h2 className="mt-5 text-lg font-bold text-slate-950">Your card library is ready</h2>
              <p className="mt-2 text-sm text-slate-500">Create a visiting card to generate its shareable QR code.</p>
              {canCreateCard && <Link href="/create-card" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"><Plus size={17} />Create your first card</Link>}
            </div>
          ) : (
            <MyCardsStatusFilter cards={cards} role={user.role} />
          )}
        </div>
      </main>
    </div>
  );
}
