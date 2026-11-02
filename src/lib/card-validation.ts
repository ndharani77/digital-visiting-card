export type CardField =
  | "fullName"
  | "designation"
  | "company"
  | "countryCode"
  | "mobile"
  | "email"
  | "address"
  | "website"
  | "linkedin"
  | "logoData"
  | "backgroundColor"
  | "accentColor";

export type CardFieldErrors = Partial<Record<CardField, string>>;

const fieldLimits: Partial<Record<CardField, number>> = {
  fullName: 100,
  designation: 100,
  company: 100,
  countryCode: 4,
  mobile: 30,
  email: 254,
  address: 250,
  website: 2048,
  linkedin: 2048,
};

const requiredFields: CardField[] = ["fullName", "designation", "company", "countryCode", "mobile", "email"];

function isValidWebUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function validateCardField(field: CardField, rawValue: unknown): string | undefined {
  if (typeof rawValue !== "string") {
    if (rawValue === undefined && !requiredFields.includes(field)) return undefined;
    if (requiredFields.includes(field)) {
      const labels: Record<string, string> = {
        fullName: "Full name",
        designation: "Designation",
        company: "Company name",
        countryCode: "Country code",
        mobile: "Mobile number",
        email: "Email address",
      };
      return `${labels[field]} is required.`;
    }
    return `${field} must be text.`;
  }

  const value = rawValue.trim();
  if (requiredFields.includes(field) && !value) {
    const labels: Record<string, string> = {
      fullName: "Full name",
      designation: "Designation",
      company: "Company name",
      countryCode: "Country code",
      mobile: "Mobile number",
      email: "Email address",
    };
    return `${labels[field]} is required.`;
  }
  if (!value) return undefined;

  const limit = fieldLimits[field];
  if (limit && value.length > limit) {
    return `${field} must be ${limit} characters or fewer.`;
  }

  switch (field) {
    case "fullName":
      if (!/^[\p{L}\p{M} ]+$/u.test(value)) {
        return "Full name can contain letters and spaces only.";
      }
      if (!/\p{L}/u.test(value)) {
        return "Full name must contain at least one letter.";
      }
      break;
    case "designation":
      if (!/^[\p{L}\p{M}\p{N} &.,()'’/+#!-]+$/u.test(value)) {
        return "Designation can contain letters, numbers, spaces, and common symbols only.";
      }
      break;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Enter a valid email address.";
      }
      break;
    case "countryCode":
      if (!/^\+[1-9]\d{0,2}$/.test(value)) {
        return "Choose a valid country calling code.";
      }
      break;
    case "mobile": {
      if (!/^[0-9]{4,15}$/.test(value)) {
        return "Enter 4 to 15 digits without the country code.";
      }
      break;
    }
    case "website":
      if (!isValidWebUrl(value)) return "Enter a valid website URL beginning with http:// or https://.";
      break;
    case "linkedin":
      if (!isValidWebUrl(value)) return "Enter a valid LinkedIn profile URL beginning with http:// or https://.";
      break;
    case "logoData":
      if (
        value.length > 700_000 ||
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
      ) {
        return "Choose a PNG, JPEG, or WebP logo no larger than 500 KB.";
      }
      break;
    case "backgroundColor":
    case "accentColor":
      if (!/^#[0-9a-fA-F]{6}$/.test(value)) return "Choose a valid six-digit hex colour.";
      break;
  }
}

export function validateCardFields(data: Record<string, unknown>): CardFieldErrors {
  const fields: CardField[] = [
    "fullName",
    "designation",
    "company",
    "countryCode",
    "mobile",
    "email",
    "address",
    "website",
    "linkedin",
    "logoData",
    "backgroundColor",
    "accentColor",
  ];
  const errors: CardFieldErrors = {};

  for (const field of fields) {
    const error = validateCardField(field, data[field]);
    if (error) errors[field] = error;
  }

  return errors;
}
