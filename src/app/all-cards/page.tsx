import { redirect } from "next/navigation";
import MyCardsStatusFilter from "@/components/MyCardsStatusFilter";
import Sidebar from "@/components/Sidebar";
import { requirePageUser } from "@/lib/auth";
import {
  getAllCardsForSuperAdmin,
  listAllCompaniesForSuperAdmin,
} from "@/lib/platform-store";

export const dynamic = "force-dynamic";

export default async function AllCardsPage() {
  const user = await requirePageUser("/all-cards");
  if (user.role !== "SUPER_ADMIN") redirect("/");

  const [cards, companies] = await Promise.all([
    getAllCardsForSuperAdmin(user),
    listAllCompaniesForSuperAdmin(user),
  ]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Platform management</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">All cards</h1>
            <p className="mt-2 text-sm text-slate-500">Search and filter visiting cards across all companies.</p>
          </header>
          {cards.length > 0 ? (
            <MyCardsStatusFilter
              cards={cards}
              role={user.role}
              companies={companies.map(({ id, name }) => ({ id, name }))}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No visiting cards have been created yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
