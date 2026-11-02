import type { VisitingCard } from "@/lib/types";

type ContactDetails = Pick<
  VisitingCard,
  "fullName" | "designation" | "company" | "countryCode" | "mobile" | "email" | "address" | "website" | "linkedin"
>;

function escapeVCardValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function createVCard(contact: ContactDetails) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCardValue(contact.fullName)}`,
    `N:${escapeVCardValue(contact.fullName)};;;;`,
    `ORG:${escapeVCardValue(contact.company)}`,
    `TITLE:${escapeVCardValue(contact.designation)}`,
    `TEL;TYPE=CELL:${escapeVCardValue(`${contact.countryCode || "+91"}${contact.mobile}`)}`,
    `EMAIL:${escapeVCardValue(contact.email)}`,
    contact.address ? `ADR;TYPE=WORK:;;${escapeVCardValue(contact.address)};;;;` : "",
    contact.website ? `URL:${escapeVCardValue(contact.website)}` : "",
    contact.linkedin ? `X-SOCIALPROFILE;TYPE=linkedin:${escapeVCardValue(contact.linkedin)}` : "",
    "END:VCARD",
  ].filter(Boolean).join("\r\n");
}
