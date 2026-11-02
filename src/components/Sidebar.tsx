import Link from "next/link";
import { CreditCard, LayoutDashboard, Plus, QrCode, Users } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-slate-950 p-6 text-white md:flex">
      <Link href="/" className="mb-12 flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2.5"><CreditCard size={24} /></div>
        <div><p className="text-lg font-bold">Card Reader</p><p className="text-xs text-slate-400">Digital Business Cards</p></div>
      </Link>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace</p>
      <nav className="space-y-2">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"><LayoutDashboard size={19} />Dashboard</Link>
        <Link href="/my-cards" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"><CreditCard size={19} />My Cards</Link>
        <Link href="/create-card" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"><Plus size={19} />Create New Card</Link>
      </nav>
      <p className="mb-4 mt-10 text-xs font-semibold uppercase tracking-wider text-slate-500">Management</p>
      <nav className="space-y-2">
        <Link href="/my-cards" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"><QrCode size={19} />QR Codes</Link>
        <Link href="/my-cards" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"><Users size={19} />Contacts / Cards</Link>
      </nav>
      <div className="mt-auto rounded-xl border border-slate-800 p-4">
        <p className="text-sm font-semibold">Card Reader Workspace</p>
        <p className="mt-1 text-xs text-slate-400">Digital identity management</p>
      </div>
    </aside>
  );
}
