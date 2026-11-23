import type { VisitingCard } from "@/lib/types";

export function createCardSlug(fullName: string, companyName: string): string {
  const slugPart = (value: string) => value
    .normalize("NFC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
  return [slugPart(fullName), slugPart(companyName)].filter(Boolean).join("-") || "visiting-card";
}

export function createUniqueCardSlug(
  fullName: string,
  companyName: string,
  usedSlugs: Iterable<string>
): string {
  const baseSlug = createCardSlug(fullName, companyName);
  const used = new Set(usedSlugs);
  if (!used.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (used.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

export function getCardQrPath(card: Pick<VisitingCard, "id" | "publicSlug" | "fullName" | "company">): string {
  const slug = card.publicSlug || createCardSlug(card.fullName, card.company);
  return `/card/${encodeURIComponent(slug)}?source=qr`;
}

export function getCardQrViewerPath(card: Pick<VisitingCard, "id" | "publicSlug" | "fullName" | "company">): string {
  const slug = card.publicSlug || createCardSlug(card.fullName, card.company);
  return `/card/${encodeURIComponent(slug)}/view`;
}
