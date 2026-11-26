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

export type CompanyLocation = {
  id: string;
  name: string;
  officeLocation: string;
};

export const BRIHASPATI_DEFAULT_LOCATIONS: CompanyLocation[] = [
  { id: "brihaspathi-hyderabad", name: "Hyderabad", officeLocation: "#501, #508-510, Shangrila Plaza, Park View Enclave, Banjara Hills, Hyderabad, Telangana 500034" },
  { id: "brihaspathi-visakhapatnam", name: "Visakhapatnam", officeLocation: "H.NO: 94-6/1/FF, 1st Floor, Santhipuram, Ravindra Nagar, Near Sai Baba Temple, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh - 530016" },
  { id: "brihaspathi-vijayawada", name: "Vijayawada", officeLocation: "D.No: 12-468/1/4, 1st Floor, KSR Park Road, Beside Viceroy Heights, Tadepalle, Ward-2, Guntur, Andhra Pradesh - 522501" },
  { id: "brihaspathi-kurnool", name: "Kurnool", officeLocation: "Survey Number 87/A, Ballary Road, beside Kings Palace Function Hall, opposite Taj Function Hall, Peddapadu Road, Kurnool - 518003" },
  { id: "brihaspathi-bengaluru", name: "Bengaluru", officeLocation: "Sy.No: 19/2 & 20/1, 4th Floor, Sattva Galleria, New Airport Road, Byatarayanapura Village, Yelahanka Hubli, Bangalore - 560092" },
  { id: "brihaspathi-mumbai", name: "Mumbai", officeLocation: "Unit No: 1306, 61 Four, 13th Floor, Central Business District, Near D-Mart, Sector 15, CBD Belapur, Navi Mumbai, Maharashtra - 400614" },
  { id: "brihaspathi-kolkata", name: "Kolkata", officeLocation: "D.No: A-14, 7th Floor, Chatterjee International Centre, Jawaharlal Nehru Road, Park Street Area, Kolkata, West Bengal - 700071" },
  { id: "brihaspathi-patna", name: "Patna", officeLocation: "H.No: 1174/569, C-249, Ground Floor, Ward No: 23, Khesra No: 173, S P Sinha Path, East Boring Canal Road, Kotwali, Patna, Bihar - 800001" },
  { id: "brihaspathi-guwahati", name: "Guwahati", officeLocation: "Flat No: 202, 2nd Floor, Swagata Envision, GS Road, Six Mile, Khanapara, Near Hotel Lily, Guwahati, Assam - 781022" },
  { id: "brihaspathi-bhopal", name: "Bhopal", officeLocation: "LIG-G-01, Ground Floor, Fortune Glory Extension-2, Rohit Nagar, Bawadiya Kala, Bhopal, Madhya Pradesh - 462026" },
  { id: "brihaspathi-chennai", name: "Chennai", officeLocation: "2nd Floor, New Door No. 32, Old Door No. 117, Plot No. C-10, Ravilla Towers, W Block, 3rd Avenue, Anna Nagar, Chennai, Tamil Nadu - 600040" },
  { id: "brihaspathi-shimla", name: "Shimla", officeLocation: "Palampur, Tehsil, near Income Tax Office, behind Toy Store, Palampur Village, Kangra District, Himachal Pradesh - 176061" },
  { id: "brihaspathi-chandigarh", name: "Chandigarh", officeLocation: "WorkYard Coworking Spaces, Phase-2, Plot No. 337, Industrial & Business Park, Chandigarh - 160002" },
  { id: "brihaspathi-delhi", name: "Delhi", officeLocation: "201 A Block, Naurang House, Connaught Lane, K G Marg, New Delhi, Delhi - 110001" },
  { id: "brihaspathi-lucknow", name: "Lucknow", officeLocation: "H No. 554-GA/277, Alambagh Road, Guru Nanak Nagar, Lucknow, Uttar Pradesh" },
];

export function getDefaultCompanyLocations(companyName: string): CompanyLocation[] {
  return ["brihaspathi technologies", "brihaspathi technologies limited"].includes(companyName.trim().toLowerCase())
    ? BRIHASPATI_DEFAULT_LOCATIONS.map((location) => ({ ...location }))
    : [];
}

export function isCompanyLocations(value: unknown): value is CompanyLocation[] {
  return Array.isArray(value) && value.every((location) =>
    Boolean(
      location &&
      typeof location === "object" &&
      "id" in location &&
      typeof location.id === "string" &&
      "name" in location &&
      typeof location.name === "string" &&
      "officeLocation" in location &&
      typeof location.officeLocation === "string"
    )
  );
}

export function normalizeCompanyLocations(value: unknown): CompanyLocation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((location) => {
    if (!location || typeof location !== "object") return [];
    const item = location as Record<string, unknown>;
    if (typeof item.id !== "string" || typeof item.name !== "string" || typeof item.officeLocation !== "string") return [];
    return [{
      id: item.id,
      name: item.name,
      officeLocation: item.officeLocation,
    }];
  });
}

export type CompanySettings = {
  companyName: string;
  address: string;
  website: string;
  logoData: string;
  locations: CompanyLocation[];
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
  address: "",
  website: DEFAULT_WEBSITE,
  logoData: DEFAULT_COMPANY_LOGO,
  locations: [],
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
      address: typeof settings.address === "string" ? settings.address : defaults.address,
      website: typeof settings.website === "string" ? settings.website : defaults.website,
      logoData: typeof settings.logoData === "string" ? settings.logoData : defaults.logoData,
      locations: normalizeCompanyLocations(settings.locations),
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
