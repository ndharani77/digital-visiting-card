"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WorkspaceHeader({ showDashboardLink }: { showDashboardLink: boolean }) {
  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur md:flex md:px-8 xl:px-10">
      {showDashboardLink ? (
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-700">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to dashboard
        </Link>
      ) : (
        <p className="text-sm font-semibold tracking-tight text-slate-800">Digital Visiting Cards</p>
      )}
      <p className="hidden text-xs font-medium text-slate-500 sm:block">Workspace management</p>
    </header>
  );
}
