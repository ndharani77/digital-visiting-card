export const APP_LOCALES = ["en", "hi", "te"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const DISPLAY_DENSITIES = ["comfortable", "compact"] as const;
export type DisplayDensity = (typeof DISPLAY_DENSITIES)[number];

export type NotificationPreferences = {
  enabled: boolean;
  cards: boolean;
  company: boolean;
  account: boolean;
  lastReadAt: string;
};

export type UserPreferences = {
  locale: AppLocale;
  displayDensity: DisplayDensity;
  notifications: NotificationPreferences;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  locale: "en",
  displayDensity: "comfortable",
  notifications: {
    enabled: true,
    cards: true,
    company: true,
    account: true,
    lastReadAt: "",
  },
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && APP_LOCALES.includes(value as AppLocale);
}

export function isDisplayDensity(value: unknown): value is DisplayDensity {
  return typeof value === "string" && DISPLAY_DENSITIES.includes(value as DisplayDensity);
}

export function normalizeUserPreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_USER_PREFERENCES;
  const preferences = value as Partial<UserPreferences>;
  const notifications = preferences.notifications;
  return {
    locale: isAppLocale(preferences.locale) ? preferences.locale : DEFAULT_USER_PREFERENCES.locale,
    displayDensity: isDisplayDensity(preferences.displayDensity)
      ? preferences.displayDensity
      : DEFAULT_USER_PREFERENCES.displayDensity,
    notifications: {
      enabled: typeof notifications?.enabled === "boolean" ? notifications.enabled : true,
      cards: typeof notifications?.cards === "boolean" ? notifications.cards : true,
      company: typeof notifications?.company === "boolean" ? notifications.company : true,
      account: typeof notifications?.account === "boolean" ? notifications.account : true,
      lastReadAt: typeof notifications?.lastReadAt === "string" ? notifications.lastReadAt : "",
    },
  };
}
