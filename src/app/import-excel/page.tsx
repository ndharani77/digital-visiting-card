"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, QrCode, Upload } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { readSheet, type Row } from "read-excel-file/browser";
import Sidebar from "@/components/Sidebar";
import { validateCardFields } from "@/lib/card-validation";
import {
  DEFAULT_CARD_ACCENT,
  DEFAULT_CARD_BACKGROUND,
  DEFAULT_COMPANY,
  DEFAULT_COMPANY_LOGO,
  DEFAULT_WEBSITE,
} from "@/lib/card-defaults";

type ContactDetails = {
  fullName: string;
  designation: string;
  countryCode: string;
  mobile: string;
  email: string;
  address: string;
  linkedin: string;
};

type ImportRow = {
  rowNumber: number;
  contact: ContactDetails;
  errors: string[];
  cardId?: string;
  saveError?: string;
};

const template = [
  ["Full Name", "Designation", "Country Code", "Mobile", "Email", "Office Address", "LinkedIn Profile"],
  ["Jane Smith", "Marketing Manager", "+1", "2025550100", "jane@example.com", "123 Main Street", "https://linkedin.com/in/janesmith"],
];

const headers = {
  fullName: ["fullname", "name", "contactname"],
  designation: ["designation", "jobtitle", "title"],
  countryCode: ["countrycode", "callingcode", "countrycallingcode"],
  mobile: ["mobile", "mobilenumber", "phone", "phonenumber", "telephone"],
  email: ["email", "emailaddress"],
  address: ["officeaddress", "address"],
  linkedin: ["linkedinprofile", "linkedin"],
} satisfies Record<keyof ContactDetails, string[]>;

function normalizeHeader(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function text(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isInteger(value)) return value.toFixed(0);
  return String(value).trim();
}

function cellValue(row: Row, headerIndexes: Map<string, number>, field: keyof ContactDetails) {
  const index = headers[field].map((header) => headerIndexes.get(header)).find((candidate) => candidate !== undefined);
  return index === undefined ? "" : text(row[index]);
}

function contactFromRow(row: Row, headerIndexes: Map<string, number>): ContactDetails {
  const phone = cellValue(row, headerIndexes, "mobile").replace(/\s+/g, "");
  const givenCountryCode = cellValue(row, headerIndexes, "countryCode");
  let countryCode = givenCountryCode ? (givenCountryCode.startsWith("+") ? givenCountryCode : `+${givenCountryCode}`) : "+91";
  let mobile = phone.replace(/\D/g, "");

  if (phone.startsWith("+") || phone.startsWith("00")) {
    const parsedPhone = parsePhoneNumberFromString(phone.startsWith("00") ? `+${phone.slice(2)}` : phone);
    if (parsedPhone) {
      countryCode = `+${parsedPhone.countryCallingCode}`;
      mobile = parsedPhone.nationalNumber;
    }
  }

  return {
    fullName: cellValue(row, headerIndexes, "fullName"),
    designation: cellValue(row, headerIndexes, "designation"),
    countryCode,
    mobile,
    email: cellValue(row, headerIndexes, "email"),
    address: cellValue(row, headerIndexes, "address"),
    linkedin: cellValue(row, headerIndexes, "linkedin"),
  };
}

function downloadTemplate() {
  const csv = template.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "contact-import-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function rowErrors(contact: ContactDetails) {
  const errors = validateCardFields({
    ...contact,
    company: DEFAULT_COMPANY,
    website: DEFAULT_WEBSITE,
    logoData: DEFAULT_COMPANY_LOGO,
    backgroundColor: DEFAULT_CARD_BACKGROUND,
    accentColor: DEFAULT_CARD_ACCENT,
  });
  return Object.values(errors);
}

export default function ImportExcelPage() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setRows([]);
    setError("");
    setProgress("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Choose an Excel workbook in .xlsx format.");
      event.target.value = "";
      return;
    }

    setReading(true);
    try {
      const sheetRows = await readSheet(file);
      if (sheetRows.length < 2) throw new Error("The first worksheet must contain a header row and at least one contact.");
      const headerIndexes = new Map<string, number>();
      sheetRows[0].forEach((value, index) => {
        const key = normalizeHeader(value);
        if (key && !headerIndexes.has(key)) headerIndexes.set(key, index);
      });

      const requiredHeaders = ["fullName", "designation", "mobile", "email"] as const;
      const missingHeaders = requiredHeaders.filter((field) => !headers[field].some((header) => headerIndexes.has(header)));
      if (missingHeaders.length) {
        const labels: Record<(typeof requiredHeaders)[number], string> = {
          fullName: "Full Name",
          designation: "Designation",
          mobile: "Mobile",
          email: "Email",
        };
        throw new Error(`Missing required columns: ${missingHeaders.map((field) => labels[field]).join(", ")}.`);
      }

      const importedRows = sheetRows.slice(1)
        .map((row, index) => ({ row, rowNumber: index + 2 }))
        .filter(({ row }) => row.some((value) => text(value) !== ""))
        .map(({ row, rowNumber }) => {
          const contact = contactFromRow(row, headerIndexes);
          return { rowNumber, contact, errors: rowErrors(contact) };
        });
      if (importedRows.length === 0) throw new Error("No contact rows were found in the first worksheet.");
      setRows(importedRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read this Excel workbook.");
    } finally {
      setReading(false);
      event.target.value = "";
    }
  }

  async function importContacts() {
    const pendingRows = rows.filter((row) => row.errors.length === 0 && !row.cardId);
    if (pendingRows.length === 0) return;

    setSaving(true);
    setError("");
    let completed = 0;
    for (const row of pendingRows) {
      try {
        const response = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...row.contact,
            company: DEFAULT_COMPANY,
            website: DEFAULT_WEBSITE,
            logoData: DEFAULT_COMPANY_LOGO,
            backgroundColor: DEFAULT_CARD_BACKGROUND,
            accentColor: DEFAULT_CARD_ACCENT,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to save this contact.");
        setRows((current) => current.map((item) => item === row ? { ...item, cardId: result.id } : item));
      } catch (err) {
        setRows((current) => current.map((item) => item === row ? { ...item, saveError: err instanceof Error ? err.message : "Unable to save this contact." } : item));
      } finally {
        completed += 1;
        setProgress(`Saving contact ${completed} of ${pendingRows.length}...`);
      }
    }
    setProgress("Import finished. Open each saved QR code from this list or Contacts / Cards.");
    setSaving(false);
  }

  const validCount = rows.filter((row) => row.errors.length === 0 && !row.cardId).length;
  const savedCount = rows.filter((row) => Boolean(row.cardId)).length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"><ArrowLeft size={16} />Back to dashboard</Link>
          <header className="mb-7">
            <h1 className="text-2xl font-bold">Import Contacts from Excel</h1>
            <p className="mt-1 text-sm text-slate-500">Upload an .xlsx workbook to create contact cards and QR codes for each valid row.</p>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">Prepare your spreadsheet</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  The first worksheet must have Full Name, Designation, Mobile, and Email columns. Country Code, Office Address, and LinkedIn Profile are optional. Missing country codes default to +91; company and website use the app defaults.
                </p>
              </div>
              <button type="button" onClick={downloadTemplate} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Download size={16} />Download template
              </button>
            </div>

            <label className="mt-6 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center hover:border-blue-400 hover:bg-blue-50/50">
              <FileSpreadsheet size={30} className="mb-3 text-emerald-700" />
              <span className="font-semibold text-slate-800">{reading ? "Reading workbook..." : "Choose an Excel workbook"}</span>
              <span className="mt-1 text-sm text-slate-500">.xlsx files · first worksheet is imported</span>
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { void handleFileChange(event); }} className="sr-only" disabled={reading || saving} />
            </label>

            {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            {rows.length > 0 && (
              <div className="mt-7">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">Import preview</h2>
                    <p className="mt-1 text-sm text-slate-500">{rows.length} rows · {validCount} ready · {savedCount} saved</p>
                  </div>
                  <button type="button" onClick={() => { void importContacts(); }} disabled={saving || validCount === 0} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Upload size={16} />{saving ? "Importing..." : `Import ${validCount} contacts`}
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr><th className="px-4 py-3">Excel row</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row) => {
                        const status = row.cardId ? "Saved" : row.saveError ? row.saveError : row.errors.length ? row.errors.join(" ") : "Ready";
                        return (
                          <tr key={row.rowNumber}>
                            <td className="px-4 py-3 text-slate-500">{row.rowNumber}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{row.contact.fullName || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{row.contact.countryCode} {row.contact.mobile}</td>
                            <td className="px-4 py-3 text-slate-600">{row.contact.email || "—"}</td>
                            <td className="px-4 py-3">
                              {row.cardId ? <Link href={`/card/${row.cardId}/view`} className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"><QrCode size={15} />Open QR code</Link> : <span className={row.errors.length || row.saveError ? "text-red-600" : "text-emerald-700"}>{status}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {progress && <p role="status" className="mt-4 text-sm text-slate-600">{progress}</p>}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
