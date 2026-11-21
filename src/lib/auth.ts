import "server-only";
import { compare } from "bcryptjs";
import { errors as joseErrors, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "@/lib/db";
import { readJsonPlatform, usesJsonStorage } from "@/lib/json-store";
import { DEFAULT_USER_PREFERENCES, normalizeUserPreferences, type AppLocale } from "@/lib/user-preferences";
import type { UserRole } from "@/lib/types";

export const SESSION_COOKIE = "digital_card_session";
export const ACTIVE_COMPANY_COOKIE = "digital_card_active_company";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type { UserRole } from "@/lib/types";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  employeeId: string | null;
  mustChangePassword: boolean;
  locale: AppLocale;
};

export class AuthenticationError extends Error {
  constructor(message = "Authentication is required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class PasswordChangeRequiredError extends Error {
  constructor() {
    super("Change your temporary password before continuing.");
    this.name = "PasswordChangeRequiredError";
  }
}

export class CompanySelectionRequiredError extends Error {
  constructor() {
    super("Select a company before continuing.");
    this.name = "CompanySelectionRequiredError";
  }
}

function getSigningKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32 || secret.includes("replace-with")) {
    throw new Error("AUTH_SECRET must be set to a unique value with at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSigningKey());
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    const account = state.users.find((item) =>
      item.email.toLowerCase() === email.trim().toLowerCase() &&
      item.status === "active" &&
      (!item.companyId || state.companies.some((company) => company.id === item.companyId && company.status === "active"))
    );
    if (!account || !(await compare(password, account.passwordHash))) return null;
    return {
      id: account.id,
      email: account.email,
      role: account.role,
      companyId: account.companyId,
      employeeId: account.employeeId,
      mustChangePassword: account.mustChangePassword,
      locale: normalizeUserPreferences(account.preferences).locale,
    };
  }

  const db = getDatabase();
  const [record] = await db`
    SELECT id, email, password_hash, role, company_id, employee_id,
           must_change_password
    FROM users
    WHERE lower(email) = ${email.trim().toLowerCase()} AND status = 'active'
      AND (
        company_id IS NULL OR EXISTS (
          SELECT 1 FROM companies WHERE companies.id = users.company_id AND companies.status = 'active'
        )
      )
  `;
  if (!record || !(await compare(password, record.password_hash))) return null;
  return {
    id: record.id,
    email: record.email,
    role: record.role,
    companyId: record.company_id,
    employeeId: record.employee_id,
    mustChangePassword: record.must_change_password,
    locale: DEFAULT_USER_PREFERENCES.locale,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (process.env.NODE_ENV === "development" && process.env.DEV_AUTH_BYPASS === "true") {
    return {
      id: "local-development-super-admin",
      email: "developer@localhost",
      role: "SUPER_ADMIN",
      companyId: null,
      employeeId: null,
      mustChangePassword: false,
      locale: DEFAULT_USER_PREFERENCES.locale,
    };
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let subject: string;
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    subject = payload.sub;
  } catch (error) {
    if (error instanceof joseErrors.JOSEError) return null;
    throw error;
  }

  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    const account = state.users.find((item) =>
      item.id === subject &&
      item.status === "active" &&
      (!item.companyId || state.companies.some((company) => company.id === item.companyId && company.status === "active"))
    );
    if (!account) return null;
    return {
      id: account.id,
      email: account.email,
      role: account.role,
      companyId: account.companyId,
      employeeId: account.employeeId,
      mustChangePassword: account.mustChangePassword,
      locale: normalizeUserPreferences(account.preferences).locale,
    };
  }

  const db = getDatabase();
  const [record] = await db`
    SELECT id, email, role, company_id, employee_id, must_change_password
    FROM users
    WHERE id = ${subject} AND status = 'active'
      AND (
        company_id IS NULL OR EXISTS (
          SELECT 1 FROM companies WHERE companies.id = users.company_id AND companies.status = 'active'
        )
      )
  `;
  if (!record) return null;
  return {
    id: record.id,
    email: record.email,
    role: record.role,
    companyId: record.company_id,
    employeeId: record.employee_id,
    mustChangePassword: record.must_change_password,
    locale: DEFAULT_USER_PREFERENCES.locale,
  };
}

export async function requireUser(options: { allowPasswordChange?: boolean } = {}): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();
  if (user.mustChangePassword && !options.allowPasswordChange) {
    throw new PasswordChangeRequiredError();
  }
  return user;
}

export async function requirePageUser(returnTo = "/"): Promise<AuthUser> {
  try {
    return await requireUser();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect(`/login?next=${encodeURIComponent(returnTo)}`);
    }
    throw error;
  }
}

export async function getActiveCompanyId(user: AuthUser): Promise<string | null> {
  if (user.role !== "SUPER_ADMIN") return user.companyId;
  return (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value ?? null;
}

export function canManageCompany(user: AuthUser, companyId: string): boolean {
  return user.role === "SUPER_ADMIN" || (
    user.role === "COMPANY_ADMIN" && user.companyId === companyId
  );
}

export function canViewCompany(user: AuthUser, companyId: string): boolean {
  return user.role === "SUPER_ADMIN" || user.companyId === companyId;
}

export async function canAccessActiveCompany(user: AuthUser, companyId: string): Promise<boolean> {
  if (user.role !== "SUPER_ADMIN") return canViewCompany(user, companyId);
  const activeCompanyId = await getActiveCompanyId(user);
  return !activeCompanyId || activeCompanyId === companyId;
}

export function canManageCard(user: AuthUser, companyId: string, employeeId: string): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  if (user.companyId !== companyId) return false;
  return user.role === "COMPANY_ADMIN" || user.employeeId === employeeId;
}

export function canAccessCard(user: AuthUser, companyId: string, employeeId: string): boolean {
  return canManageCard(user, companyId, employeeId);
}

export function requireCompanyAdmin(user: AuthUser): void {
  if (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_ADMIN") {
    throw new AuthorizationError();
  }
}
