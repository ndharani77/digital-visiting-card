export const COMPANY_THEMES = ["blue", "teal", "violet", "rose", "amber"] as const;

export type CompanyTheme = (typeof COMPANY_THEMES)[number];

export const DEFAULT_COMPANY_THEME: CompanyTheme = "blue";

export const CARD_APPEARANCES = ["classic", "midnight", "sand"] as const;
export type CardAppearance = (typeof CARD_APPEARANCES)[number];
export const DEFAULT_CARD_APPEARANCE: CardAppearance = "classic";

export const COMPANY_THEME_COLORS: Record<CompanyTheme, string> = {
  blue: "#07518a",
  teal: "#0f766e",
  violet: "#6d28d9",
  rose: "#be123c",
  amber: "#b45309",
};

export const COMPANY_SIDEBAR_COLORS: Record<CompanyTheme, string> = {
  blue: "#101b31",
  teal: "#103a37",
  violet: "#261342",
  rose: "#401426",
  amber: "#3d2b16",
};

export const CARD_APPEARANCE_BACKGROUNDS: Record<CardAppearance, string> = {
  classic: "#ffffff",
  midnight: "#111827",
  sand: "#fff7ed",
};

export function isCardAppearance(value: unknown): value is CardAppearance {
  return typeof value === "string" && CARD_APPEARANCES.includes(value as CardAppearance);
}

export function normalizeCardAppearance(value: unknown): CardAppearance {
  return isCardAppearance(value) ? value : DEFAULT_CARD_APPEARANCE;
}

export function isCompanyTheme(value: unknown): value is CompanyTheme {
  return typeof value === "string" && COMPANY_THEMES.includes(value as CompanyTheme);
}

export function normalizeCompanyTheme(value: unknown): CompanyTheme {
  return isCompanyTheme(value) ? value : DEFAULT_COMPANY_THEME;
}
