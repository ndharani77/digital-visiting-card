import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BulkQRCodeExport from "@/components/BulkQRCodeExport";
import Sidebar from "@/components/Sidebar";

export default function ExportQRCodesPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600">
            <ArrowLeft size={16} />Back to dashboard
          </Link>
          <header className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900">Export QR Codes</h1>
            <p className="mt-1 text-sm text-slate-500">Select the cards you want to export, then save them to a folder or download them as a ZIP.</p>
          </header>
          <BulkQRCodeExport />
        </div>
      </main>
    </div>
  );
}
