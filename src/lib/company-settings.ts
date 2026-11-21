import { promises as fs } from "node:fs";
import path from "node:path";
import {
  DEFAULT_COMPANY,
  DEFAULT_COMPANY_LOGO,
  DEFAULT_WEBSITE,
} from "@/lib/card-defaults";
import {
  DEFAULT_COMPANY_PREVIEW,
  normalizeCompanyPreviewSettings,
  type CompanyPreviewSettings,
} from "@/lib/company-content";
import {
  DEFAULT_CARD_APPEARANCE,
  DEFAULT_COMPANY_THEME,
  normalizeCardAppearance,
  normalizeCompanyTheme,
  type CardAppearance,
  type CompanyTheme,
} from "@/lib/company-theme";

export type { CompanyPreviewSettings } from "@/lib/company-content";

export type CompanySettings = {
  companyName: string;
  website: string;
  logoData: string;
  preview: CompanyPreviewSettings;
  theme: CompanyTheme;
  cardAppearance: CardAppearance;
};

const dataDirectory = path.join(process.cwd(), "data");
const settingsFile = path.join(dataDirectory, "company-settings.json");
const settingsLock = globalThis as typeof globalThis & {
  __companySettingsWriteQueue?: Promise<void>;
};

const defaults: CompanySettings = {
  companyName: DEFAULT_COMPANY,
  website: DEFAULT_WEBSITE,
  logoData: DEFAULT_COMPANY_LOGO,
  preview: DEFAULT_COMPANY_PREVIEW,
  theme: DEFAULT_COMPANY_THEME,
  cardAppearance: DEFAULT_CARD_APPEARANCE,
};

async function withSettingsLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = settingsLock.__companySettingsWriteQueue ?? Promise.resolve();
  let release!: () => void;
  settingsLock.__companySettingsWriteQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

async function ensureSettingsFile() {
  await fs.mkdir(dataDirectory, { recursive: true });
  try {
    await fs.access(settingsFile);
  } catch {
    await fs.writeFile(settingsFile, JSON.stringify(defaults, null, 2), "utf8");
  }
}

export async function getCompanySettings(): Promise<CompanySettings> {
  return withSettingsLock(async () => {
    await ensureSettingsFile();
    const content = await fs.readFile(settingsFile, "utf8");
    const settings = JSON.parse(content) as Partial<CompanySettings>;
    return {
      companyName: typeof settings.companyName === "string" ? settings.companyName : defaults.companyName,
      website: typeof settings.website === "string" ? settings.website : defaults.website,
      logoData: typeof settings.logoData === "string" ? settings.logoData : defaults.logoData,
      preview: normalizeCompanyPreviewSettings(settings.preview) ?? defaults.preview,
      theme: normalizeCompanyTheme(settings.theme),
      cardAppearance: normalizeCardAppearance(settings.cardAppearance),
    };
  });
}

export async function saveCompanySettings(settings: CompanySettings): Promise<CompanySettings> {
  return withSettingsLock(async () => {
    await ensureSettingsFile();
    const temporaryFile = `${settingsFile}.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporaryFile, JSON.stringify(settings, null, 2), "utf8");
      await fs.rename(temporaryFile, settingsFile);
    } finally {
      await fs.rm(temporaryFile, { force: true });
    }
    return settings;
  });
}
