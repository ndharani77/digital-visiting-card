"use client";

import { useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BulkQRCodeExport from "@/components/BulkQRCodeExport";
import ImportContactsBulk from "@/components/ImportContactsBulk";

type BulkTab = "import" | "export";

export default function BulkManagementPage() {
  const [activeTab, setActiveTab] = useState<BulkTab>("import");

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "export") setActiveTab("export");
  }, []);

  function selectTab(tab: BulkTab) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url);
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Bulk management</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Import / Export
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Add contacts in bulk or export QR codes for your saved cards.
            </p>
          </header>

          <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="Bulk management">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "import"}
              onClick={() => selectTab("import")}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${
                activeTab === "import" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Upload size={16} />
              Import contacts
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "export"}
              onClick={() => selectTab("export")}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${
                activeTab === "export" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Download size={16} />
              Export QR codes
            </button>
          </div>

          {activeTab === "import" ? <ImportContactsBulk /> : <BulkQRCodeExport />}
        </div>
      </main>
    </div>
  );
}
