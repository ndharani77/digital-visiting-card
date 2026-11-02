export const DEFAULT_COMPANY = "Brihaspathi Technologies";
export const DEFAULT_WEBSITE = "https://www.brihaspathi.com/";
export const DEFAULT_COMPANY_LOGO = "/brihaspathi-logo.png";
export const DEFAULT_CARD_BACKGROUND = "#dbeafe";
export const DEFAULT_CARD_ACCENT = "#07518a";

export function getCardTextColors(backgroundColor?: string) {
  const hex = backgroundColor && /^#[\da-f]{6}$/i.test(backgroundColor) ? backgroundColor : DEFAULT_CARD_BACKGROUND;
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const luminance = channels
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);

  return luminance > 0.45
    ? { foreground: "#0f172a", secondary: "#334155", divider: "rgba(15, 23, 42, 0.2)" }
    : { foreground: "#ffffff", secondary: "#cbd5e1", divider: "rgba(255, 255, 255, 0.25)" };
}
