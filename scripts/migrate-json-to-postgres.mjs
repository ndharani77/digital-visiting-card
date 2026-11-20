import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import postgres from "postgres";

const migrationId = "json-store-to-postgres-v1";
const root = process.cwd();
nextEnv.loadEnvConfig(root);
const dataDirectory = path.join(root, "data");
const cardsPath = path.join(dataDirectory, "cards.json");
const settingsPath = path.join(dataDirectory, "company-settings.json");
const schemaPath = path.join(root, "db", "schema.sql");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to migrate the JSON data.");
}

function stableUuid(value) {
  const bytes = createHash("sha256").update(value).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function requireCardId(value) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("The JSON store contains a card without a valid UUID. No records were migrated.");
  }
  return value;
}

function employeeSignature(card) {
  return [
    String(card.fullName ?? "").trim().toLowerCase(),
    String(card.mobile ?? "").trim(),
    String(card.countryCode ?? "+91").trim(),
    String(card.designation ?? "").trim().toLowerCase(),
    String(card.address ?? "").trim().toLowerCase(),
    String(card.linkedin ?? "").trim().toLowerCase(),
    String(card.linkedinName ?? "").trim().toLowerCase(),
  ].join("\u0000");
}

const timestamp = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const backupDirectory = path.join(dataDirectory, "backups", timestamp);
await mkdir(backupDirectory, { recursive: true });
await copyFile(cardsPath, path.join(backupDirectory, "cards.json"));
await copyFile(settingsPath, path.join(backupDirectory, "company-settings.json"));

const [cards, settings, schema] = await Promise.all([
  readFile(cardsPath, "utf8").then(JSON.parse),
  readFile(settingsPath, "utf8").then(JSON.parse),
  readFile(schemaPath, "utf8"),
]);

if (!Array.isArray(cards)) throw new Error("data/cards.json must contain an array.");
if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
  throw new Error("data/company-settings.json must contain an object.");
}

const companyName = typeof settings.companyName === "string" && settings.companyName.trim()
  ? settings.companyName.trim()
  : String(cards[0]?.company ?? "Imported Company").trim();
const companyId = stableUuid(`legacy-company:${companyName.toLowerCase()}`);
const employees = new Map();
const migratedCards = cards.map((card) => {
  const id = requireCardId(card.id);
  const email = normalizeEmail(card.email);
  if (!email) throw new Error(`Card ${id} has no email; migration stopped before writing data.`);
  const existingEmployee = employees.get(email);
  if (existingEmployee && employeeSignature(existingEmployee.card) !== employeeSignature(card)) {
    throw new Error("Multiple legacy contacts use the same email with different identity details. Review the backup before retrying.");
  }
  const employeeId = existingEmployee?.id ?? stableUuid(`legacy-employee:${companyId}:${email}`);
  if (!existingEmployee) employees.set(email, { id: employeeId, card });
  return { ...card, id, employeeId, email };
});

const sql = postgres(connectionString, { max: 1, connect_timeout: 10, prepare: false });
try {
  for (const statement of schema.split(";").map((part) => part.trim()).filter(Boolean)) {
    await sql.unsafe(statement);
  }
  await sql.begin(async (transaction) => {
    const [alreadyMigrated] = await transaction`
      SELECT id FROM migration_runs WHERE id = ${migrationId}
    `;
    if (alreadyMigrated) return;

    await transaction`
      INSERT INTO companies (
        id, name, website, logo_data, preview
      ) VALUES (
        ${companyId},
        ${companyName},
        ${String(settings.website ?? "")},
        ${String(settings.logoData ?? "")},
        ${JSON.stringify(settings.preview ?? {})}::jsonb
      )
      ON CONFLICT (id) DO NOTHING
    `;

    for (const { id, card } of employees.values()) {
      await transaction`
        INSERT INTO employees (
          id, company_id, full_name, designation, country_code, mobile, email,
          address, linkedin, linkedin_name, status
        ) VALUES (
          ${id}, ${companyId}, ${String(card.fullName ?? "").trim()},
          ${String(card.designation ?? "").trim()}, ${String(card.countryCode ?? "+91")},
          ${String(card.mobile ?? "").trim()}, ${normalizeEmail(card.email)},
          ${String(card.address ?? "")}, ${String(card.linkedin ?? "")},
          ${String(card.linkedinName ?? "")}, 'active'
        )
      `;
    }

    for (const card of migratedCards) {
      await transaction`
        INSERT INTO cards (
          id, company_id, employee_id, full_name, designation, country_code,
          mobile, email, address, website, linkedin, linkedin_name, is_active,
          preview, created_at
        ) VALUES (
          ${card.id}, ${companyId}, ${card.employeeId}, ${String(card.fullName ?? "").trim()},
          ${String(card.designation ?? "").trim()}, ${String(card.countryCode ?? "+91")},
          ${String(card.mobile ?? "").trim()}, ${normalizeEmail(card.email)},
          ${String(card.address ?? "")}, ${String(card.website ?? settings.website ?? "")},
          ${String(card.linkedin ?? "")}, ${String(card.linkedinName ?? "")},
          ${card.isActive !== false}, ${card.preview ? JSON.stringify(card.preview) : null}::jsonb,
          ${card.createdAt ? new Date(card.createdAt) : new Date()}
        )
      `;
    }

    await transaction`
      INSERT INTO migration_runs (id) VALUES (${migrationId})
      ON CONFLICT (id) DO NOTHING
    `;
  });
  console.log(`Migration complete. Backup saved under data/backups/${timestamp}.`);
} finally {
  await sql.end();
}
