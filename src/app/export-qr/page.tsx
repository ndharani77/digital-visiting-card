import BulkQRCodeExport from "@/components/BulkQRCodeExport";
import Sidebar from "@/components/Sidebar";

export default function ExportQRCodesPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Bulk management</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Export QR codes</h1>
            <p className="mt-1 text-sm text-slate-500">Select the cards you want to export, then save them to a folder or download them as a ZIP.</p>
          </header>
          <BulkQRCodeExport />
        </div>
      </main>
    </div>
  );
}
