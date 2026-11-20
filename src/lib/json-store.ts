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

export type JsonPlatformState = {
  version: 2;
  companies: CompanyRecord[];
  branches: JsonBranch[];
  employees: JsonEmployee[];
  users: JsonUser[];
  cards: VisitingCard[];
};

const dataDirectory = path.join(process.cwd(), "data");
const platformFile = path.join(dataDirectory, "platform.json");
const legacyCardsFile = path.join(dataDirectory, "cards.json");
const legacySettingsFile = path.join(dataDirectory, "company-settings.json");
const writeQueue = globalThis as typeof globalThis & { __jsonPlatformWriteQueue?: Promise<void> };

export function usesJsonStorage(): boolean {
  return process.env.NODE_ENV === "development" && process.env.STORAGE_DRIVER === "json";
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

function isPlatformState(value: unknown): value is JsonPlatformState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  return state.version === 2 &&
    Array.isArray(state.companies) &&
    Array.isArray(state.branches) &&
    Array.isArray(state.employees) &&
    Array.isArray(state.users) &&
    Array.isArray(state.cards);
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
    version: 2,
    companies: [company],
    branches: [],
    employees: [...employees.values()],
    users: [],
    cards,
  };
}

async function loadState(): Promise<JsonPlatformState> {
  await fs.mkdir(dataDirectory, { recursive: true });
  const existing = await readLegacyFile(platformFile);
  if (existing === undefined) {
    const initialState = await createInitialState();
    await writeState(initialState);
    return initialState;
  }
  if (
    existing &&
    typeof existing === "object" &&
    !Array.isArray(existing) &&
    (existing as Record<string, unknown>).version === 1 &&
    Array.isArray((existing as Record<string, unknown>).companies) &&
    Array.isArray((existing as Record<string, unknown>).employees) &&
    Array.isArray((existing as Record<string, unknown>).users) &&
    Array.isArray((existing as Record<string, unknown>).cards)
  ) {
    const legacy = existing as Omit<JsonPlatformState, "version" | "branches">;
    const upgraded: JsonPlatformState = {
      ...legacy,
      version: 2,
      branches: [],
    };
    await writeState(upgraded);
    return upgraded;
  }
  if (!isPlatformState(existing)) {
    throw new Error("data/platform.json has an unsupported or invalid format.");
  }
  return existing;
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
