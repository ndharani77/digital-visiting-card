import Sidebar from "@/components/Sidebar";
import ImportContactsBulk from "@/components/ImportContactsBulk";

export default function ImportExcelPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 xl:p-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Bulk management</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Import contacts</h1>
            <p className="mt-1 text-sm text-slate-500">Upload an .xlsx workbook to create contact cards and QR codes for each valid row.</p>
          </header>
          <ImportContactsBulk />
        </div>
      </main>
    </div>
  );
}
