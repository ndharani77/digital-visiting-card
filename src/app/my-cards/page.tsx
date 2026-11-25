import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, CreditCard, GitBranch, Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getActiveCompanyId, requirePageUser } from "@/lib/auth";
import { getCardsForUser, getCompany, listBranches, listCompanies } from "@/lib/platform-store";
import MyCardsStatusFilter from "@/components/MyCardsStatusFilter";
import CreateCardDrawerButton from "@/components/CreateCardDrawerButton";

export const dynamic = "force-dynamic";

type MyCardsPageProps = {
  searchParams: Promise<{ companyId?: string; branchId?: string; showBranches?: string }>;
};

export default async function MyCardsPage({ searchParams }: MyCardsPageProps) {
  const user = await requirePageUser("/my-cards");
  const [cards, activeCompanyId, companies, workspaceCompany, params] = await Promise.all([
    getCardsForUser(user),
    getActiveCompanyId(user),
    user.role === "SUPER_ADMIN" ? listCompanies(user) : Promise.resolve([]),
    user.role !== "SUPER_ADMIN" ? getCompany(user) : Promise.resolve(null),
    searchParams,
  ]);
  const selectedCompany = companies.find((company) => company.id === params.companyId) ??
    (user.role === "COMPANY_ADMIN" ? workspaceCompany : null);
  const branches = selectedCompany ? await listBranches(user, selectedCompany.id) : [];
  const selectedBranch = branches.find((branch) => branch.id === params.branchId) ??
    (user.branchId ? branches.find((branch) => branch.id === user.branchId) : undefined);
  const isPlatformWideSuperAdmin = user.role === "SUPER_ADMIN" && !activeCompanyId;
  const showingCompanyList = isPlatformWideSuperAdmin && !selectedCompany;
  const showingBranchList = Boolean(
    selectedCompany && branches.length > 0 && params.showBranches === "true" && !selectedBranch
  );
  const companyCards = selectedCompany
    ? cards.filter((card) => card.companyId === selectedCompany.id)
    : cards;
  const displayedCards = selectedBranch
    ? companyCards.filter((card) => card.branchId === selectedBranch.id)
    : branches.length > 0
      ? companyCards.filter((card) => !card.branchId)
      : companyCards;
  const branchCardCounts = new Map<string, number>();
  for (const card of companyCards) {
    if (card.branchId) branchCardCounts.set(card.branchId, (branchCardCounts.get(card.branchId) ?? 0) + 1);
  }
  const canCreateCard = user.role === "COMPANY_ADMIN" ||
    (user.role === "SUPER_ADMIN" && Boolean(activeCompanyId));
  const cardCounts = new Map<string, number>();
  for (const card of cards) {
    if (card.companyId) cardCounts.set(card.companyId, (cardCounts.get(card.companyId) ?? 0) + 1);
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Card library</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {showingCompanyList
                  ? "Visiting cards by company"
                  : showingBranchList && selectedCompany
                    ? `${selectedCompany.name} branches`
                    : selectedBranch
                      ? `${selectedBranch.name} cards`
                      : selectedCompany
                        ? `${selectedCompany.name} cards`
                        : workspaceCompany
                          ? `${workspaceCompany.name} cards`
                          : "My cards"}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {showingCompanyList
                  ? "Select a company to view its visiting cards."
                  : showingBranchList && selectedCompany
                    ? "Select a branch to view its visiting cards."
                    : selectedBranch
                      ? `${selectedCompany?.name} · Manage this branch's visiting cards.`
                      : selectedCompany
                        ? `Manage visiting cards for ${selectedCompany.name}.`
                        : workspaceCompany
                          ? `Manage visiting cards for ${workspaceCompany.name}.`
                          : "Manage card details, scan previews, and active status."}
              </p>
              {selectedCompany && isPlatformWideSuperAdmin && (
                <Link
                  href={selectedBranch || showingBranchList
                    ? selectedBranch
                      ? `/my-cards?companyId=${encodeURIComponent(selectedCompany.id)}&showBranches=true`
                      : `/my-cards?companyId=${encodeURIComponent(selectedCompany.id)}`
                    : "/my-cards"}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  <ArrowLeft size={16} />
                  {selectedBranch ? "Back to branches" : showingBranchList ? "Back to company cards" : "All companies"}
                </Link>
              )}
              {selectedBranch &&
                ((user.role === "COMPANY_ADMIN" && !user.branchId) ||
                  (user.role === "SUPER_ADMIN" && !isPlatformWideSuperAdmin)) && (
                <Link
                  href={user.role === "SUPER_ADMIN"
                    ? `/my-cards?companyId=${encodeURIComponent(selectedCompany?.id ?? "")}&showBranches=true`
                    : "/branches"}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  <ArrowLeft size={16} />Back to branches
                </Link>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {selectedCompany && branches.length > 0 && user.role === "SUPER_ADMIN" && !showingBranchList && !selectedBranch && (
                <Link
                  href={`/my-cards?companyId=${encodeURIComponent(selectedCompany.id)}&showBranches=true`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <GitBranch size={18} />Branches
                </Link>
              )}
              {canCreateCard && (
                <CreateCardDrawerButton className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 hover:-translate-y-0.5 hover:bg-blue-800">
                  <Plus size={18} />Create card
                </CreateCardDrawerButton>
              )}
            </div>
          </header>

          {showingCompanyList ? (
            companies.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Building2 size={27} /></span>
                <h2 className="mt-5 text-lg font-bold text-slate-950">No companies available</h2>
                <p className="mt-2 text-sm text-slate-500">Create a company before managing its visiting cards.</p>
              </div>
            ) : (
              <section aria-label="Companies" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {companies.map((company) => {
                  const count = cardCounts.get(company.id) ?? 0;
                  return (
                    <Link
                      key={company.id}
                      href={`/my-cards?companyId=${encodeURIComponent(company.id)}`}
                      aria-label={`View ${company.name} visiting cards`}
                      className="group flex min-h-36 items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                    >
                      <span className="flex min-w-0 items-center gap-4">
                        {company.logoData ? (
                          <Image
                            src={company.logoData}
                            alt={`${company.name} logo`}
                            width={48}
                            height={48}
                            unoptimized
                            className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Building2 size={22} /></span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-slate-950">{company.name}</span>
                          <span className="mt-1 block text-sm text-slate-500">{count} {count === 1 ? "visiting card" : "visiting cards"}</span>
                        </span>
                      </span>
                      <ArrowRight size={18} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
                    </Link>
                  );
                })}
              </section>
            )
          ) : showingBranchList && selectedCompany ? (
            <section aria-label={`Branches of ${selectedCompany?.name}`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {branches.map((branch) => {
                const count = branchCardCounts.get(branch.id) ?? 0;
                return (
                  <Link
                    key={branch.id}
                    href={`/my-cards?companyId=${encodeURIComponent(selectedCompany.id)}&branchId=${encodeURIComponent(branch.id)}`}
                    className="group flex min-h-40 items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      {branch.logoData ? (
                        <Image
                          src={branch.logoData}
                          alt={`${branch.name} logo`}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1"
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><GitBranch size={22} /></span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-slate-950">{branch.name}</span>
                        <span className="mt-1 block truncate text-xs text-slate-500">Parent: {selectedCompany.name}</span>
                        <span className="mt-2 block text-sm font-medium text-slate-600">{count} {count === 1 ? "visiting card" : "visiting cards"}</span>
                      </span>
                    </span>
                    <ArrowRight size={18} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
                  </Link>
                );
              })}
            </section>
          ) : displayedCards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><CreditCard size={27} /></span>
              <h2 className="mt-5 text-lg font-bold text-slate-950">
                {selectedBranch
                  ? `No visiting cards for ${selectedBranch.name}`
                  : selectedCompany
                    ? `No visiting cards for ${selectedCompany.name}`
                    : "Your card library is ready"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {selectedBranch
                  ? "This branch does not have any cards yet."
                  : selectedCompany
                    ? "This company does not have any cards yet."
                    : "Create a visiting card to generate its shareable QR code."}
              </p>
              {canCreateCard && <CreateCardDrawerButton className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"><Plus size={17} />Create your first card</CreateCardDrawerButton>}
            </div>
          ) : (
            <MyCardsStatusFilter cards={displayedCards} role={user.role} />
          )}
        </div>
      </main>
    </div>
  );
}
