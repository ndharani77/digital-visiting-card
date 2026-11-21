import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  DEFAULT_CARD_ACCENT,
  DEFAULT_CARD_BACKGROUND,
  DEFAULT_COMPANY,
  DEFAULT_COMPANY_LOGO,
  DEFAULT_WEBSITE,
} from "@/lib/card-defaults";
import { createDefaultCompanyPreview, normalizeCompanyPreviewSettings } from "@/lib/company-content";
import {
  DEFAULT_CARD_APPEARANCE,
  DEFAULT_COMPANY_THEME,
  normalizeCardAppearance,
  normalizeCompanyTheme,
} from "@/lib/company-theme";
import { normalizeUserPreferences, type UserPreferences } from "@/lib/user-preferences";
import type { CompanyRecord } from "@/lib/platform-store";
import type { UserRole, VisitingCard } from "@/lib/types";

export type JsonEmployee = {
  id: string;
  companyId: string;
  fullName: string;
  designation: string;
  countryCode: string;
  mobile: string;
  email: string;
  address: string;
  linkedin: string;
  linkedinName: string;
  status: "active" | "inactive";
};

export type JsonUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  companyId: string | null;
  employeeId: string | null;
  status: "active" | "inactive";
  mustChangePassword: boolean;
  createdAt: string;
  preferences?: UserPreferences;
};

export type JsonBranch = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type JsonActivityLog = {
  id: string;
  companyId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export type JsonPlatformState = {
  version: 3;
  companies: CompanyRecord[];
  branches: JsonBranch[];
  employees: JsonEmployee[];
  users: JsonUser[];
  cards: VisitingCard[];
  activityLogs: JsonActivityLog[];
};

const dataDirectory = path.join(process.cwd(), "data");
const platformFile = path.join(dataDirectory, "platform.json");
const legacyCardsFile = path.join(dataDirectory, "cards.json");
const legacySettingsFile = path.join(dataDirectory, "company-settings.json");
const writeQueue = globalThis as typeof globalThis & { __jsonPlatformWriteQueue?: Promise<void> };

export function usesJsonStorage(): boolean {
  return true;
}

async function withJsonLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = writeQueue.__jsonPlatformWriteQueue ?? Promise.resolve();
  let release!: () => void;
  writeQueue.__jsonPlatformWriteQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

async function readLegacyFile(file: string): Promise<unknown | undefined> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as unknown;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return undefined;
    }
    throw new Error(`Unable to read valid JSON from ${path.basename(file)}.`, { cause: error });
  }
}

async function writeState(state: JsonPlatformState): Promise<void> {
  const temporaryFile = `${platformFile}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryFile, JSON.stringify(state, null, 2), "utf8");
    await fs.rename(temporaryFile, platformFile);
  } finally {
    await fs.rm(temporaryFile, { force: true });
  }
}

async function createInitialState(): Promise<JsonPlatformState> {
  const [legacyCards, legacySettings] = await Promise.all([
    readLegacyFile(legacyCardsFile),
    readLegacyFile(legacySettingsFile),
  ]);
  if (legacyCards !== undefined && !Array.isArray(legacyCards)) {
    throw new Error("data/cards.json must contain a JSON array.");
  }
  if (legacySettings !== undefined &&
      (!legacySettings || typeof legacySettings !== "object" || Array.isArray(legacySettings))) {
    throw new Error("data/company-settings.json must contain a JSON object.");
  }

  const settings = (legacySettings ?? {}) as Record<string, unknown>;
  const oldCards = (legacyCards ?? []) as Record<string, unknown>[];
  const companyName = typeof settings.companyName === "string" && settings.companyName.trim()
    ? settings.companyName.trim()
    : typeof oldCards[0]?.company === "string" && oldCards[0].company.trim()
      ? oldCards[0].company.trim()
      : DEFAULT_COMPANY;
  const companyId = randomUUID();
  const company: CompanyRecord = {
    id: companyId,
    name: companyName,
    email: "",
    phone: "",
    website: typeof settings.website === "string" ? settings.website : DEFAULT_WEBSITE,
    logoData: typeof settings.logoData === "string" ? settings.logoData : DEFAULT_COMPANY_LOGO,
    address: "",
    city: "",
    state: "",
    country: "",
    description: "",
    status: "active",
    preview: normalizeCompanyPreviewSettings(settings.preview) ?? createDefaultCompanyPreview(companyName),
    theme: DEFAULT_COMPANY_THEME,
    cardAppearance: DEFAULT_CARD_APPEARANCE,
  };
  const employees = new Map<string, JsonEmployee>();
  const ids = new Set<string>();
  const cards = oldCards.map((card): VisitingCard => {
    const id = typeof card.id === "string" && card.id ? card.id : randomUUID();
    if (ids.has(id)) throw new Error(`Duplicate card ID "${id}" in data/cards.json.`);
    ids.add(id);
    const employeeId = typeof card.employeeId === "string" && card.employeeId
      ? card.employeeId
      : randomUUID();
    const employee: JsonEmployee = {
      id: employeeId,
      companyId,
      fullName: typeof card.fullName === "string" ? card.fullName : "",
      designation: typeof card.designation === "string" ? card.designation : "",
      countryCode: typeof card.countryCode === "string" ? card.countryCode : "+91",
      mobile: typeof card.mobile === "string" ? card.mobile : "",
      email: typeof card.email === "string" ? card.email.trim().toLowerCase() : "",
      address: typeof card.address === "string" ? card.address : "",
      linkedin: typeof card.linkedin === "string" ? card.linkedin : "",
      linkedinName: typeof card.linkedinName === "string" ? card.linkedinName : "",
      status: card.isActive === false ? "inactive" : "active",
    };
    employees.set(employeeId, employee);
    return {
      id,
      companyId,
      employeeId,
      fullName: employee.fullName,
      designation: employee.designation,
      company: company.name,
      countryCode: employee.countryCode,
      mobile: employee.mobile,
      email: employee.email,
      address: employee.address,
      website: company.website,
      linkedin: employee.linkedin,
      linkedinName: employee.linkedinName,
      logoData: company.logoData,
      backgroundColor: DEFAULT_CARD_BACKGROUND,
      accentColor: DEFAULT_CARD_ACCENT,
      preview: card.preview as VisitingCard["preview"],
      isActive: card.isActive !== false,
      createdAt: typeof card.createdAt === "string" && !Number.isNaN(Date.parse(card.createdAt))
        ? card.createdAt
        : new Date().toISOString(),
    };
  });

  return {
    version: 3,
    companies: [company],
    branches: [],
    employees: [...employees.values()],
    users: [],
    cards,
    activityLogs: [],
  };
}

function migrateCompanyOwnership(state: JsonPlatformState): boolean {
  const companyIds = new Set<string>();
  for (const company of state.companies) {
    if (!company.id || !company.name?.trim() || companyIds.has(company.id)) {
      throw new Error("Company records in data/platform.json must have unique IDs and names.");
    }
    companyIds.add(company.id);
  }
  const soleCompanyId = state.companies.length === 1 ? state.companies[0].id : undefined;
  let changed = false;
  for (const company of state.companies) {
    const theme = normalizeCompanyTheme(company.theme);
    if (company.theme !== theme) {
      company.theme = theme;
      changed = true;
    }
    const cardAppearance = normalizeCardAppearance(company.cardAppearance);
    if (company.cardAppearance !== cardAppearance) {
      company.cardAppearance = cardAppearance;
      changed = true;
    }
  }

  function resolveCompanyId(
    record: { id?: unknown; companyId?: unknown; company?: unknown },
    linkedCompanyIds: Set<string> = new Set()
  ): string {
    if (typeof record.companyId === "string" && record.companyId && !companyIds.has(record.companyId)) {
      const recordId = typeof record.id === "string" ? record.id : "unknown";
      throw new Error(`Record "${recordId}" references an unknown company. Resolve it in data/platform.json and restart.`);
    }
    const id = typeof record.companyId === "string" && companyIds.has(record.companyId)
      ? record.companyId
      : undefined;
    const linked = linkedCompanyIds.size === 1 ? [...linkedCompanyIds][0] : undefined;
    const companyName = typeof record.company === "string" ? record.company.trim().toLowerCase() : undefined;
    const nameMatches = companyName
      ? state.companies.filter((company) => company.name.trim().toLowerCase() === companyName)
      : [];
    const named = nameMatches.length === 1 ? nameMatches[0].id : undefined;
    if (id && linkedCompanyIds.size === 1 && !linkedCompanyIds.has(id)) {
      const recordId = typeof record.id === "string" ? record.id : "unknown";
      throw new Error(`Record "${recordId}" has conflicting company ownership. Resolve it in data/platform.json and restart.`);
    }
    const resolved = id ?? linked ?? named ?? soleCompanyId;
    if (!resolved) {
      const recordId = typeof record.id === "string" ? record.id : "unknown";
      throw new Error(`Cannot safely assign company ownership to record "${recordId}". Resolve its company in data/platform.json and restart.`);
    }
    if (linkedCompanyIds.size > 1) {
      const recordId = typeof record.id === "string" ? record.id : "unknown";
      throw new Error(`Record "${recordId}" is linked to multiple companies. Resolve its ownership in data/platform.json and restart.`);
    }
    if (record.companyId !== resolved) {
      record.companyId = resolved;
      changed = true;
    }
    return resolved;
  }

  const cardCompaniesByEmployee = new Map<string, Set<string>>();
  const companyByEmployee = new Map<string, string>();
  for (const card of state.cards) {
    const companyId = resolveCompanyId(card);
    if (typeof card.employeeId !== "string" || !card.employeeId) {
      const email = typeof card.email === "string" ? card.email.trim().toLowerCase() : "";
      const matchingEmployees = email
        ? state.employees.filter((employee) =>
            employee.email.trim().toLowerCase() === email &&
            (!employee.companyId || employee.companyId === companyId)
          )
        : [];
      if (matchingEmployees.length > 1) {
        throw new Error(`Card "${card.id}" matches multiple employees. Resolve its employee in data/platform.json and restart.`);
      }
      card.employeeId = matchingEmployees[0]?.id || randomUUID();
      changed = true;
    }
    const linked = cardCompaniesByEmployee.get(card.employeeId) ?? new Set<string>();
    linked.add(companyId);
    cardCompaniesByEmployee.set(card.employeeId, linked);
    companyByEmployee.set(card.employeeId, companyId);
  }

  const knownEmployeeIds = new Set(state.employees.map((employee) => employee.id));
  for (const card of state.cards) {
    if (!card.employeeId || knownEmployeeIds.has(card.employeeId)) continue;
    const companyId = companyByEmployee.get(card.employeeId);
    if (!companyId) throw new Error(`Card "${card.id}" has no company assignment.`);
    state.employees.push({
      id: card.employeeId,
      companyId,
      fullName: card.fullName ?? "",
      designation: card.designation ?? "",
      countryCode: card.countryCode ?? "+91",
      mobile: card.mobile ?? "",
      email: typeof card.email === "string" ? card.email.trim().toLowerCase() : "",
      address: card.address ?? "",
      linkedin: card.linkedin ?? "",
      linkedinName: card.linkedinName ?? "",
      status: card.isActive === false ? "inactive" : "active",
    });
    knownEmployeeIds.add(card.employeeId);
    changed = true;
  }

  const employeeCompanies = new Map<string, string>();
  for (const employee of state.employees) {
    if (!employee.id) throw new Error("Employee records in data/platform.json must have IDs.");
    const linked = cardCompaniesByEmployee.get(employee.id) ?? new Set<string>();
    const companyId = resolveCompanyId(employee, linked);
    employeeCompanies.set(employee.id, companyId);
  }

  for (const user of state.users) {
    const preferences = normalizeUserPreferences(user.preferences);
    if (JSON.stringify(user.preferences) !== JSON.stringify(preferences)) {
      user.preferences = preferences;
      changed = true;
    }
    if (user.role === "SUPER_ADMIN") continue;
    const linked = user.employeeId ? employeeCompanies.get(user.employeeId) : undefined;
    if (user.role === "EMPLOYEE" && !linked) {
      throw new Error(`Employee account "${user.id}" has no matching employee record. Resolve it in data/platform.json and restart.`);
    }
    if (user.role === "COMPANY_ADMIN" && user.employeeId) {
      throw new Error(`Company Admin account "${user.id}" cannot be linked to an employee.`);
    }
    const matchingCompanyIds = new Set<string>();
    if (linked) {
      matchingCompanyIds.add(linked);
    } else if (typeof user.companyId !== "string" || !companyIds.has(user.companyId)) {
      for (const company of state.companies.filter((item) =>
        item.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      )) matchingCompanyIds.add(company.id);
    }
    resolveCompanyId(user, matchingCompanyIds);
  }

  for (const branch of state.branches) resolveCompanyId(branch);
  for (const log of state.activityLogs) resolveCompanyId(log);

  return changed;
}

async function loadState(): Promise<JsonPlatformState> {
  await fs.mkdir(dataDirectory, { recursive: true });
  const existing = await readLegacyFile(platformFile);
  if (existing === undefined) {
    const initialState = await createInitialState();
    await writeState(initialState);
    return initialState;
  }
  if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
    throw new Error("data/platform.json has an unsupported or invalid format.");
  }
  const source = existing as Record<string, unknown>;
  if (![1, 2, 3].includes(Number(source.version)) ||
      !Array.isArray(source.companies) ||
      !Array.isArray(source.employees) ||
      !Array.isArray(source.users) ||
      !Array.isArray(source.cards)) {
    throw new Error("data/platform.json has an unsupported or invalid format.");
  }
  if ((source.branches !== undefined && !Array.isArray(source.branches)) ||
      (source.activityLogs !== undefined && !Array.isArray(source.activityLogs))) {
    throw new Error("data/platform.json has an unsupported or invalid format.");
  }

  const migrated: JsonPlatformState = {
    version: 3,
    companies: source.companies as CompanyRecord[],
    branches: Array.isArray(source.branches) ? source.branches as JsonBranch[] : [],
    employees: source.employees as JsonEmployee[],
    users: source.users as JsonUser[],
    cards: source.cards as VisitingCard[],
    activityLogs: Array.isArray(source.activityLogs) ? source.activityLogs as JsonActivityLog[] : [],
  };
  const ownershipChanged = migrateCompanyOwnership(migrated);
  if (source.version !== 3 || ownershipChanged || !Array.isArray(source.activityLogs)) {
    const backupDirectory = path.join(dataDirectory, "backups");
    const backupFile = path.join(
      backupDirectory,
      `platform-v${String(source.version)}-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.json`
    );
    await fs.mkdir(backupDirectory, { recursive: true });
    await fs.copyFile(platformFile, backupFile);
    await writeState(migrated);
  }
  return migrated;
}

export async function readJsonPlatform(): Promise<JsonPlatformState> {
  return withJsonLock(loadState);
}

export async function updateJsonPlatform<T>(
  update: (state: JsonPlatformState) => T | Promise<T>
): Promise<T> {
  return withJsonLock(async () => {
    const state = await loadState();
    const result = await update(state);
    await writeState(state);
    return result;
  });
}
