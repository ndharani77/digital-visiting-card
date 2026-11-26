import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createCardSlug, createUniqueCardSlug } from "@/lib/card-slug";
import { createDefaultCompanyPreview, type CompanyPreviewSettings } from "@/lib/company-content";
import { DEFAULT_CARD_ACCENT, DEFAULT_CARD_BACKGROUND } from "@/lib/card-defaults";
import {
  CARD_APPEARANCE_BACKGROUNDS,
  DEFAULT_CARD_APPEARANCE,
  DEFAULT_COMPANY_THEME,
  normalizeCardAppearance,
  normalizeCompanyTheme,
  type CardAppearance,
  type CompanyTheme,
} from "@/lib/company-theme";
import {
  canAccessCard,
  canManageCompany,
  canManageCard,
  canViewCompany,
  CompanySelectionRequiredError,
  getActiveCompanyId,
  isBranchAdmin,
  requireCompanyAdmin,
  AuthorizationError,
  type AuthUser,
} from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import {
  readJsonPlatform,
  updateJsonPlatform,
  usesJsonStorage,
  type JsonEmployee,
  type JsonPlatformState,
} from "@/lib/json-store";
import {
  getDefaultCompanyLocations,
  normalizeCompanyLocations,
  type CompanyLocation,
  type CompanySettings,
} from "@/lib/company-settings";
import type { VisitingCard } from "@/lib/types";

type CardRow = {
  id: string;
  company_id: string;
  employee_id: string;
  branch_id: string | null;
  branch_name: string | null;
  card_logo: string;
  full_name: string;
  designation: string;
  country_code: string;
  mobile: string;
  email: string;
  address: string;
  website: string;
  linkedin: string;
  linkedin_name: string;
  is_active: boolean;
  preview: CompanyPreviewSettings | null;
  created_at: Date | string;
  company_name: string;
  company_address: string;
  company_logo: string;
  company_website: string;
  company_preview: CompanyPreviewSettings;
  company_locations?: unknown;
};

export type CompanyRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  logoData: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  status: "active" | "inactive";
  branchEnabled: boolean;
  locations: CompanyLocation[];
  locationsInitialized?: boolean;
  locationsVersion?: number;
  preview: CompanyPreviewSettings;
  theme: CompanyTheme;
  cardAppearance: CardAppearance;
};

export type CompanyInput = Pick<
  CompanyRecord,
  "name" | "email" | "phone" | "website" | "address" | "city" | "state" | "country" | "description" | "status"
> & { logoData?: string; branchEnabled?: boolean; locations?: CompanyLocation[]; locationsInitialized?: boolean; locationsVersion?: number; preview?: CompanyPreviewSettings; theme?: CompanyTheme; cardAppearance?: CardAppearance };

export type BranchRecord = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  website: string;
  logoData: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  status: "active" | "inactive";
  locations?: CompanyLocation[];
  preview: CompanyPreviewSettings;
  theme: CompanyTheme;
  cardAppearance: CardAppearance;
};

export type BranchInput = Pick<
  BranchRecord,
  "name" | "code" | "email" | "phone" | "website" | "logoData" | "address" | "city" | "state" | "country" | "description" | "status"
> & { preview?: CompanyPreviewSettings; theme?: CompanyTheme; cardAppearance?: CardAppearance };

export type BranchStatistics = {
  branchId: string;
  branchName: string;
  branchStatus: "active" | "inactive";
  employees: number;
  cards: number;
  activeCards: number;
};

export type EmployeeOverview = {
  id: string;
  companyId: string;
  companyName: string;
  branchId: string | null;
  branchName: string;
  fullName: string;
  email: string;
  designation: string;
  status: "active" | "inactive";
  cardId: string | null;
};

export type CompanyStatistics = {
  companyId: string;
  companyName: string;
  companyStatus: "active" | "inactive";
  branches: number;
  branchCards: number;
  branchDetails: BranchStatistics[];
  employees: number;
  cards: number;
  activeCards: number;
  inactiveCards: number;
  activeQrCodes: number;
};

export type PlatformStatistics = {
  companies: number;
  activeCompanies: number;
  branches: number;
  branchCards: number;
  employees: number;
  cards: number;
  activeCards: number;
  inactiveCards: number;
  activeQrCodes: number;
  byCompany: CompanyStatistics[];
};

export type ActivityLogOverview = {
  id: string;
  companyId: string;
  companyName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export type PublicCardFormSettings = Pick<CompanySettings, "companyName" | "website" | "logoData" | "locations">;
type NewCardInput = Omit<VisitingCard, "id" | "publicSlug" | "createdAt" | "isActive" | "preview" | "branchName" | "branchId"> & {
  branchId?: string | null;
};

export class BranchAssignmentError extends Error {
  constructor(message = "Choose an active branch from this company.") {
    super(message);
    this.name = "BranchAssignmentError";
  }
}

export function recordActivity(
  state: JsonPlatformState,
  user: AuthUser,
  companyId: string,
  action: string,
  entityType: string,
  entityId: string
): void {
  state.activityLogs.push({
    id: randomUUID(),
    companyId,
    actorUserId: user.id,
    action,
    entityType,
    entityId,
    createdAt: new Date().toISOString(),
  });
}

function toVisitingCard(row: CardRow): VisitingCard {
  return {
    id: row.id,
    publicSlug: createCardSlug(row.full_name, row.branch_name ?? row.company_name),
    companyId: row.company_id,
    employeeId: row.employee_id,
    branchId: row.branch_id ?? undefined,
    branchName: row.branch_name ?? undefined,
    fullName: row.full_name,
    designation: row.designation,
    company: row.company_name,
    countryCode: row.country_code,
    mobile: row.mobile,
    email: row.email,
    address: row.address,
    website: row.company_website,
    linkedin: row.linkedin,
    linkedinName: row.linkedin_name,
    logoData: row.card_logo || row.company_logo,
    backgroundColor: DEFAULT_CARD_BACKGROUND,
    accentColor: DEFAULT_CARD_ACCENT,
    preview: row.preview ?? undefined,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function cardProjection(db: ReturnType<typeof getDatabase>) {
  return db`
    c.id, c.company_id, c.employee_id, c.full_name, c.designation,
    c.branch_id, (SELECT b.name FROM branches b WHERE b.id = c.branch_id) AS branch_name,
    c.country_code, c.mobile, c.email, c.address, c.website, c.linkedin,
    c.linkedin_name, c.logo_data AS card_logo, c.is_active, c.preview, c.created_at,
    co.name AS company_name, co.address AS company_address, co.logo_data AS company_logo,
    co.website AS company_website, co.preview AS company_preview
  `;
}

async function getSelectedCompany(user: AuthUser, requestedCompanyId?: string | null): Promise<string> {
  let selected: string | null | undefined;
  if (user.role === "SUPER_ADMIN") {
    const activeCompanyId = await getActiveCompanyId(user);
    if (activeCompanyId && requestedCompanyId && activeCompanyId !== requestedCompanyId) {
      throw new AuthorizationError("The selected company is outside your active workspace.");
    }
    selected = activeCompanyId ?? requestedCompanyId;
  } else {
    if (requestedCompanyId && requestedCompanyId !== user.companyId) {
      throw new AuthorizationError("The selected company is outside your account access.");
    }
    selected = user.companyId;
  }
  if (!selected) {
    throw new CompanySelectionRequiredError();
  }
  const selectedCompanyId: string = selected;
  if (!canViewCompany(user, selectedCompanyId)) {
    throw new AuthorizationError("The selected company is outside your account access.");
  }
  return selectedCompanyId;
}

function getLocalCard(card: VisitingCard, state: Awaited<ReturnType<typeof readJsonPlatform>>): VisitingCard | null {
  const company = state.companies.find((item) => item.id === card.companyId);
  if (!company) return null;
  const branch = state.branches.find((item) => item.id === card.branchId && item.companyId === card.companyId);
  return {
    ...card,
    backgroundColor: CARD_APPEARANCE_BACKGROUNDS[normalizeCardAppearance(branch?.cardAppearance ?? company.cardAppearance)],
    accentColor: card.accentColor ?? DEFAULT_CARD_ACCENT,
    branchName: branch?.name,
    company: branch?.name ?? company.name,
    website: branch?.website || company.website,
    logoData: card.logoData || branch?.logoData || company.logoData,
    preview: card.preview ?? (branch?.preview as VisitingCard["preview"]) ?? company.preview,
  };
}

function refreshCardPublicSlug(
  state: JsonPlatformState,
  card: VisitingCard,
  fullName = card.fullName,
  companyName = card.company
): void {
  const usedSlugs = state.cards
    .filter((item) => item.id !== card.id)
    .map((item) => item.publicSlug)
    .filter((slug): slug is string => Boolean(slug));
  card.publicSlug = createUniqueCardSlug(fullName, companyName, usedSlugs);
}

function toCompany(row: Record<string, unknown>): CompanyRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    website: String(row.website ?? ""),
    logoData: String(row.logo_data ?? ""),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    country: String(row.country ?? ""),
    description: String(row.description ?? ""),
    status: row.status === "inactive" ? "inactive" : "active",
    branchEnabled: row.branch_enabled === true,
    locations: normalizeCompanyLocations(row.locations),
    preview: (row.preview ?? {}) as CompanyPreviewSettings,
    theme: normalizeCompanyTheme(row.theme),
    cardAppearance: normalizeCardAppearance(row.card_appearance),
  };
}

export async function listCompanies(user: AuthUser): Promise<CompanyRecord[]> {
  const activeCompanyId = user.role === "SUPER_ADMIN" ? await getActiveCompanyId(user) : null;
  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    return state.companies
      .filter((company) => user.role === "SUPER_ADMIN"
        ? !activeCompanyId || company.id === activeCompanyId
        : company.id === user.companyId)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  const db = getDatabase();
  if (user.role === "SUPER_ADMIN") {
    if (activeCompanyId) {
      const rows = await db`
        SELECT id, name, email, phone, website, logo_data, address, city, state,
               country, description, status, preview, locations
        FROM companies
        WHERE id = ${activeCompanyId}
      `;
      return rows.map(toCompany);
    }
    const rows = await db`
      SELECT id, name, email, phone, website, logo_data, address, city, state,
             country, description, status, preview, locations
      FROM companies
      ORDER BY lower(name), created_at
    `;
    return rows.map(toCompany);
  }
  if (!user.companyId) return [];
  const rows = await db`
    SELECT id, name, email, phone, website, logo_data, address, city, state,
           country, description, status, preview, locations
    FROM companies WHERE id = ${user.companyId}
  `;
  return rows.map(toCompany);
}

export async function listAllCompaniesForSuperAdmin(user: AuthUser): Promise<CompanyRecord[]> {
  if (user.role !== "SUPER_ADMIN") throw new AuthorizationError();
  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    return [...state.companies].sort((left, right) => left.name.localeCompare(right.name));
  }
  const rows = await getDatabase()`
    SELECT id, name, email, phone, website, logo_data, address, city, state,
           country, description, status, preview, locations
    FROM companies
    ORDER BY lower(name), created_at
  `;
  return rows.map(toCompany);
}

export async function listEmployeesForUser(user: AuthUser): Promise<EmployeeOverview[]> {
  const state = await readJsonPlatform();
  const activeCompanyId = user.role === "SUPER_ADMIN" ? await getActiveCompanyId(user) : user.companyId;
  const visibleCompanies = state.companies.filter((company) =>
    user.role === "SUPER_ADMIN"
      ? !activeCompanyId || company.id === activeCompanyId
      : user.role === "COMPANY_ADMIN"
        ? company.id === user.companyId
        : company.id === user.companyId
  );
  const visibleCompanyIds = new Set(visibleCompanies.map((company) => company.id));
  const companyNames = new Map(visibleCompanies.map((company) => [company.id, company.name]));
  const branchNames = new Map(state.branches.map((branch) => [branch.id, branch.name]));
  const cardsByEmployee = new Map<string, string>();
  for (const card of state.cards) {
    if (card.employeeId && visibleCompanyIds.has(card.companyId ?? "") &&
        (!isBranchAdmin(user) || card.branchId === user.branchId)) {
      cardsByEmployee.set(card.employeeId, card.id);
    }
  }
  return state.employees
    .filter((employee) =>
      visibleCompanyIds.has(employee.companyId) &&
      (!isBranchAdmin(user) || employee.branchId === user.branchId) &&
      (user.role !== "EMPLOYEE" || employee.id === user.employeeId)
    )
    .map((employee) => ({
      id: employee.id,
      companyId: employee.companyId,
      companyName: companyNames.get(employee.companyId) ?? "",
      branchId: employee.branchId ?? null,
      branchName: employee.branchId ? branchNames.get(employee.branchId) ?? "" : "",
      fullName: employee.fullName,
      email: employee.email,
      designation: employee.designation,
      status: employee.status,
      cardId: cardsByEmployee.get(employee.id) ?? null,
    }))
    .sort((left, right) =>
      left.companyName.localeCompare(right.companyName) || left.fullName.localeCompare(right.fullName)
    );
}

export async function getPlatformStatistics(user: AuthUser): Promise<PlatformStatistics> {
  requireCompanyAdmin(user);
  const state = await readJsonPlatform();
  const activeCompanyId = user.role === "SUPER_ADMIN" ? await getActiveCompanyId(user) : user.companyId;
  const companies = state.companies.filter((company) =>
    user.role === "SUPER_ADMIN"
      ? !activeCompanyId || company.id === activeCompanyId
      : company.id === user.companyId
  );
  const byCompany = companies.map((company): CompanyStatistics => {
    const employees = state.employees.filter((employee) =>
      employee.companyId === company.id && (!isBranchAdmin(user) || employee.branchId === user.branchId)
    );
    const cards = state.cards.filter((card) =>
      card.companyId === company.id && (!isBranchAdmin(user) || card.branchId === user.branchId)
    );
    const branchDetails = state.branches
      .filter((branch) =>
        branch.companyId === company.id && (!isBranchAdmin(user) || branch.id === user.branchId)
      )
      .map((branch): BranchStatistics => {
        const branchEmployees = state.employees.filter((employee) =>
          employee.companyId === company.id && employee.branchId === branch.id
        );
        const branchCards = state.cards.filter((card) =>
          card.companyId === company.id && card.branchId === branch.id
        );
        return {
          branchId: branch.id,
          branchName: branch.name,
          branchStatus: branch.status,
          employees: branchEmployees.length,
          cards: branchCards.length,
          activeCards: branchCards.filter((card) => card.isActive).length,
        };
      })
      .sort((left, right) => left.branchName.localeCompare(right.branchName));
    const employeeIds = new Set(employees.filter((employee) => employee.status === "active").map((employee) => employee.id));
    const activeQrCodes = cards.filter((card) =>
      card.isActive && employeeIds.has(card.employeeId ?? "") && company.status === "active"
    ).length;
    return {
      companyId: company.id,
      companyName: company.name,
      companyStatus: company.status,
      branches: company.branchEnabled ? branchDetails.length : 0,
      branchCards: branchDetails.reduce((sum, branch) => sum + branch.cards, 0),
      branchDetails,
      employees: employees.length,
      cards: cards.length,
      activeCards: cards.filter((card) => card.isActive).length,
      inactiveCards: cards.filter((card) => !card.isActive).length,
      activeQrCodes,
    };
  });
  return {
    companies: companies.length,
    activeCompanies: companies.filter((company) => company.status === "active").length,
    branches: byCompany.reduce((sum, company) => sum + company.branches, 0),
    branchCards: byCompany.reduce((sum, company) => sum + company.branchCards, 0),
    employees: byCompany.reduce((sum, company) => sum + company.employees, 0),
    cards: byCompany.reduce((sum, company) => sum + company.cards, 0),
    activeCards: byCompany.reduce((sum, company) => sum + company.activeCards, 0),
    inactiveCards: byCompany.reduce((sum, company) => sum + company.inactiveCards, 0),
    activeQrCodes: byCompany.reduce((sum, company) => sum + company.activeQrCodes, 0),
    byCompany,
  };
}

export async function getActivityLogsForUser(user: AuthUser): Promise<ActivityLogOverview[]> {
  requireCompanyAdmin(user);
  const state = await readJsonPlatform();
  const activeCompanyId = user.role === "SUPER_ADMIN" ? await getActiveCompanyId(user) : user.companyId;
  const visibleCompanies = new Map(state.companies
    .filter((company) =>
      user.role === "SUPER_ADMIN"
        ? !activeCompanyId || company.id === activeCompanyId
        : company.id === user.companyId
    )
    .map((company) => [company.id, company.name]));
  const branchEntityIds = isBranchAdmin(user)
    ? new Set([
        ...state.employees
          .filter((employee) => employee.companyId === user.companyId && employee.branchId === user.branchId)
          .map((employee) => `employee:${employee.id}`),
        ...state.cards
          .filter((card) => card.companyId === user.companyId && card.branchId === user.branchId)
          .map((card) => `card:${card.id}`),
      ])
    : null;
  const accountEmails = new Map(state.users.map((account) => [account.id, account.email]));
  return state.activityLogs
    .filter((log) =>
      visibleCompanies.has(log.companyId) &&
      (!branchEntityIds || (
        log.entityType === "branch"
          ? log.entityId === user.branchId
          : branchEntityIds.has(`${log.entityType}:${log.entityId}`)
      ))
    )
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .map((log) => ({
      ...log,
      companyName: visibleCompanies.get(log.companyId) ?? "",
      actorEmail: accountEmails.get(log.actorUserId) ?? "System",
    }));
}

function toBranch(row: Record<string, unknown>): BranchRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    code: String(row.code ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    website: String(row.website ?? ""),
    logoData: String(row.logo_data ?? ""),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    country: String(row.country ?? ""),
    description: String(row.description ?? ""),
    status: row.status === "inactive" ? "inactive" : "active",
    preview: (row.preview ?? {}) as CompanyPreviewSettings,
    theme: normalizeCompanyTheme(row.theme),
    cardAppearance: normalizeCardAppearance(row.card_appearance),
  };
}

export async function listBranches(user: AuthUser, companyId: string): Promise<BranchRecord[]> {
  requireCompanyAdmin(user);
  if (!canViewCompany(user, companyId)) {
    throw new AuthorizationError("You cannot view branches for this company.");
  }
  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    const company = state.companies.find((item) => item.id === companyId);
    if (!company?.branchEnabled) return [];
    return state.branches
      .filter((branch) =>
        branch.companyId === companyId && (!isBranchAdmin(user) || branch.id === user.branchId)
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }
  const rows = await getDatabase()`
    SELECT id, company_id, name, code, address, city, state, country, status
    FROM branches
    WHERE company_id = ${companyId}
    ORDER BY lower(name)
  `;
  return rows.map(toBranch);
}

export async function createBranch(
  user: AuthUser,
  companyId: string,
  input: BranchInput,
  admin: { email: string; passwordHash: string; status?: "active" | "inactive" }
): Promise<BranchRecord> {
  requireCompanyAdmin(user);
  if (!canManageCompany(user, companyId)) {
    throw new AuthorizationError("You cannot create branches for this company.");
  }
  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      const company = state.companies.find((item) => item.id === companyId);
      if (!company) {
        throw new Error("Company not found.");
      }
      if (!company.branchEnabled) {
        throw new Error("Branch management is not enabled for this company.");
      }
      if (state.users.some((account) => account.email.toLowerCase() === admin.email.toLowerCase())) {
        throw new Error("An account with this Branch Admin email already exists.");
      }
      if (state.branches.some((branch) =>
        branch.companyId === companyId && branch.name.toLowerCase() === input.name.toLowerCase()
      )) {
        throw new Error("A branch with this name already exists in this company.");
      }
      const branch = {
        id: randomUUID(),
        companyId,
        ...input,
        code: input.code ?? "",
        email: input.email ?? "",
        phone: input.phone ?? "",
        website: input.website ?? company.website,
        logoData: input.logoData ?? company.logoData,
        address: input.address ?? "",
        city: input.city ?? "",
        state: input.state ?? "",
        country: input.country ?? "",
        description: input.description ?? "",
        status: input.status ?? "active" as const,
        preview: input.preview ?? company.preview,
        theme: input.theme ?? company.theme,
        cardAppearance: input.cardAppearance ?? company.cardAppearance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.branches.push(branch);
      state.users.push({
        id: randomUUID(),
        email: admin.email.trim().toLowerCase(),
        passwordHash: admin.passwordHash,
        role: "COMPANY_ADMIN",
        companyId,
        branchId: branch.id,
        employeeId: null,
        status: admin.status ?? "active",
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
      });
      recordActivity(state, user, companyId, "created", "branch", branch.id);
      return branch;
    });
  }
  const rows = await getDatabase()`
    INSERT INTO branches (id, company_id, name, code, address, city, state, country)
    VALUES (
      ${randomUUID()}, ${companyId}, ${input.name}, ${input.code}, ${input.address},
      ${input.city}, ${input.state}, ${input.country}
    )
    RETURNING id, company_id, name, code, address, city, state, country, status
  `;
  return toBranch(rows[0]);
}

export async function updateBranch(
  user: AuthUser,
  companyId: string,
  branchId: string,
  input: Partial<BranchInput> & { status?: "active" | "inactive" },
  admin?: { email?: string; passwordHash?: string; status?: "active" | "inactive" }
): Promise<BranchRecord | null> {
  requireCompanyAdmin(user);
  if (!canManageCompany(user, companyId)) {
    throw new AuthorizationError("You cannot update branches for this company.");
  }
  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      const company = state.companies.find((item) => item.id === companyId);
      if (!company?.branchEnabled) return null;
      const branch = state.branches.find((item) => item.id === branchId && item.companyId === companyId);
      if (!branch) return null;
      if (input.name && state.branches.some((item) =>
        item.companyId === companyId && item.id !== branchId && item.name.toLowerCase() === input.name!.toLowerCase()
      )) {
        throw new Error("A branch with this name already exists in this company.");
      }
      const adminAccount = state.users.find((item) =>
        item.role === "COMPANY_ADMIN" && item.companyId === companyId && item.branchId === branchId
      );
      if (admin?.email && state.users.some((item) =>
        item.id !== adminAccount?.id && item.email.toLowerCase() === admin.email!.toLowerCase()
      )) {
        throw new Error("An account with this Branch Admin email already exists.");
      }
      if (admin && adminAccount) {
        if (admin.email !== undefined) adminAccount.email = admin.email.toLowerCase();
        if (admin.passwordHash) adminAccount.passwordHash = admin.passwordHash;
        if (admin.status) adminAccount.status = admin.status;
      } else if (admin?.email && admin.passwordHash) {
        state.users.push({
          id: randomUUID(),
          email: admin.email.toLowerCase(),
          passwordHash: admin.passwordHash,
          role: "COMPANY_ADMIN",
          companyId,
          branchId,
          employeeId: null,
          status: admin.status ?? "active",
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
        });
      } else if (admin?.email || admin?.passwordHash) {
        throw new Error("A new Branch Admin account requires an email and password.");
      }
      Object.assign(branch, input, { updatedAt: new Date().toISOString() });
      if (input.name) {
        for (const card of state.cards) {
          if (card.companyId === companyId && card.branchId === branchId) {
            refreshCardPublicSlug(state, card, card.fullName, branch.name);
          }
        }
      }
      recordActivity(state, user, companyId, "updated", "branch", branch.id);
      return branch;
    });
  }
  const db = getDatabase();
  const rows = await db`
    UPDATE branches SET
      name = coalesce(${input.name ?? null}, name),
      code = coalesce(${input.code ?? null}, code),
      address = coalesce(${input.address ?? null}, address),
      city = coalesce(${input.city ?? null}, city),
      state = coalesce(${input.state ?? null}, state),
      country = coalesce(${input.country ?? null}, country),
      status = coalesce(${input.status ?? null}, status),
      updated_at = now()
    WHERE id = ${branchId} AND company_id = ${companyId}
    RETURNING id, company_id, name, code, address, city, state, country, status
  `;
  return rows[0] ? toBranch(rows[0]) : null;
}

export async function deleteBranch(
  user: AuthUser,
  companyId: string,
  branchId: string
): Promise<boolean> {
  requireCompanyAdmin(user);
  if (!canManageCompany(user, companyId)) {
    throw new AuthorizationError("You cannot delete branches for this company.");
  }
  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      const company = state.companies.find((item) => item.id === companyId);
      if (!company?.branchEnabled) return false;
      const index = state.branches.findIndex((item) => item.id === branchId && item.companyId === companyId);
      if (index < 0) return false;
      state.branches.splice(index, 1);
      state.users = state.users.filter((item) => item.branchId !== branchId);
      for (const employee of state.employees) {
        if (employee.companyId === companyId && employee.branchId === branchId) delete employee.branchId;
      }
      for (const card of state.cards) {
        if (card.companyId === companyId && card.branchId === branchId) {
          delete card.branchId;
          delete card.branchName;
        }
      }
      recordActivity(state, user, companyId, "deleted", "branch", branchId);
      return true;
    });
  }
  const db = getDatabase();
  const rows = await db`
    DELETE FROM branches WHERE id = ${branchId} AND company_id = ${companyId}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function getCompany(user: AuthUser, companyId?: string | null): Promise<CompanyRecord | null> {
  const id = await getSelectedCompany(user, companyId);
  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    if (isBranchAdmin(user)) {
      const branch = state.branches.find((item) =>
        item.id === user.branchId && item.companyId === id
      );
      if (!branch) return null;
      return {
        id,
        name: branch.name,
        email: branch.email,
        phone: branch.phone,
        website: branch.website,
        logoData: branch.logoData,
        address: branch.address,
        city: branch.city,
        state: branch.state,
        country: branch.country,
        description: branch.description,
        status: branch.status,
        branchEnabled: false,
        locations: branch?.locations ?? company.locations ?? [],
        preview: branch.preview,
        theme: branch.theme,
        cardAppearance: branch.cardAppearance,
      };
    }
    return state.companies.find((company) => company.id === id) ?? null;
  }

  const rows = await getDatabase()`
    SELECT id, name, email, phone, website, logo_data, address, city, state,
           country, description, status, preview, locations
    FROM companies WHERE id = ${id}
  `;
  return rows[0] ? toCompany(rows[0]) : null;
}

export async function createCompany(user: AuthUser, input: CompanyInput): Promise<CompanyRecord> {
  if (usesJsonStorage()) {
    const company: CompanyRecord = {
      id: randomUUID(),
      ...input,
      logoData: input.logoData ?? "",
      branchEnabled: input.branchEnabled ?? false,
      locations: input.locations ?? getDefaultCompanyLocations(input.name),
      locationsInitialized: true,
      locationsVersion: 1,
      preview: input.preview ?? createDefaultCompanyPreview(input.name),
      theme: input.theme ?? DEFAULT_COMPANY_THEME,
      cardAppearance: input.cardAppearance ?? DEFAULT_CARD_APPEARANCE,
    };
    await updateJsonPlatform((state) => {
      state.companies.push(company);
      recordActivity(state, user, company.id, "created", "company", company.id);
    });
    return company;
  }

  const id = randomUUID();
  const rows = await getDatabase()`
    INSERT INTO companies (
      id, name, email, phone, website, logo_data, address, city, state,
      country, description, status, preview, locations
    ) VALUES (
      ${id}, ${input.name}, ${input.email}, ${input.phone}, ${input.website},
      ${input.logoData ?? ""}, ${input.address}, ${input.city}, ${input.state},
      ${input.country}, ${input.description}, ${input.status},
      ${JSON.stringify(input.preview ?? createDefaultCompanyPreview(input.name))}::jsonb,
      ${JSON.stringify(input.locations ?? [])}::jsonb
    )
    RETURNING id, name, email, phone, website, logo_data, address, city, state,
              country, description, status, preview, locations
  `;
  return toCompany(rows[0]);
}

export async function createCompanyWithAdmin(
  user: AuthUser,
  input: CompanyInput,
  admin: { email: string; passwordHash: string }
): Promise<{ kind: "created"; company: CompanyRecord } | { kind: "duplicate-admin" }> {
  if (user.role !== "SUPER_ADMIN") throw new AuthorizationError("Only Super Admins can create companies.");
  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      if (state.users.some((account) => account.email.toLowerCase() === admin.email)) {
        return { kind: "duplicate-admin" as const };
      }
      const company: CompanyRecord = {
        id: randomUUID(),
        ...input,
        logoData: input.logoData ?? "",
        branchEnabled: input.branchEnabled ?? false,
        locations: input.locations ?? getDefaultCompanyLocations(input.name),
        locationsInitialized: true,
        locationsVersion: 1,
        preview: input.preview ?? createDefaultCompanyPreview(input.name),
        theme: input.theme ?? DEFAULT_COMPANY_THEME,
        cardAppearance: input.cardAppearance ?? DEFAULT_CARD_APPEARANCE,
      };
      const account = {
        id: randomUUID(),
        email: admin.email,
        passwordHash: admin.passwordHash,
        role: "COMPANY_ADMIN" as const,
        companyId: company.id,
        employeeId: null,
        status: "active" as const,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
      };
      state.companies.push(company);
      state.users.push(account);
      recordActivity(state, user, company.id, "created", "company", company.id);
      recordActivity(state, user, company.id, "created", "company-admin", account.id);
      return { kind: "created" as const, company };
    });
  }

  const db = getDatabase();
  return db.begin(async (transaction) => {
    const [existingAdmin] = await transaction`
      SELECT id FROM users WHERE lower(email) = ${admin.email}
    `;
    if (existingAdmin) return { kind: "duplicate-admin" as const };

    const companyId = randomUUID();
    const adminId = randomUUID();
    const rows = await transaction`
      INSERT INTO companies (
        id, name, email, phone, website, logo_data, address, city, state,
        country, description, status, preview, locations
      ) VALUES (
        ${companyId}, ${input.name}, ${input.email}, ${input.phone}, ${input.website},
        ${input.logoData ?? ""}, ${input.address}, ${input.city}, ${input.state},
        ${input.country}, ${input.description}, ${input.status},
        ${JSON.stringify(input.preview ?? createDefaultCompanyPreview(input.name))}::jsonb,
        ${JSON.stringify(input.locations ?? [])}::jsonb
      )
      RETURNING id, name, email, phone, website, logo_data, address, city, state,
                country, description, status, preview, locations
    `;
    await transaction`
      INSERT INTO users (
        id, email, password_hash, role, company_id, employee_id, status, must_change_password
      ) VALUES (
        ${adminId}, ${admin.email}, ${admin.passwordHash}, 'COMPANY_ADMIN',
        ${companyId}, NULL, 'active', false
      )
    `;
    return { kind: "created" as const, company: toCompany(rows[0]) };
  });
}

export async function updateCompany(
  user: AuthUser,
  companyId: string,
  input: Partial<CompanyInput>
): Promise<CompanyRecord | null> {
  if (!canManageCompany(user, companyId)) return null;
  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      const company = state.companies.find((item) => item.id === companyId);
      if (!company) return null;
      const previousStatus = company.status;
      if (input.logoData !== undefined) {
        for (const card of state.cards) {
          if (card.companyId === companyId && !card.logoData) {
            card.logoData = company.logoData;
          }
        }
      }
      Object.assign(company, input);
      for (const card of state.cards) {
        if (card.companyId === companyId) {
          card.company = company.name;
          card.website = company.website;
          if (!card.branchId) refreshCardPublicSlug(state, card, card.fullName, company.name);
        }
      }
      const action = input.status && input.status !== previousStatus
        ? input.status === "active" ? "activated" : "deactivated"
        : "updated";
      recordActivity(state, user, companyId, action, "company", companyId);
      return company;
    });
  }

  const db = getDatabase();
  const rows = await db`
    UPDATE companies SET
      name = coalesce(${input.name ?? null}, name),
      email = coalesce(${input.email ?? null}, email),
      phone = coalesce(${input.phone ?? null}, phone),
      website = coalesce(${input.website ?? null}, website),
      logo_data = coalesce(${input.logoData ?? null}, logo_data),
      address = coalesce(${input.address ?? null}, address),
      city = coalesce(${input.city ?? null}, city),
      state = coalesce(${input.state ?? null}, state),
      country = coalesce(${input.country ?? null}, country),
      description = coalesce(${input.description ?? null}, description),
      status = coalesce(${input.status ?? null}, status),
      preview = coalesce(${input.preview ? JSON.stringify(input.preview) : null}::jsonb, preview),
      locations = coalesce(${input.locations ? JSON.stringify(input.locations) : null}::jsonb, locations),
      updated_at = now()
    WHERE id = ${companyId}
    RETURNING id, name, email, phone, website, logo_data, address, city, state,
              country, description, status, preview, locations
  `;
  return rows[0] ? toCompany(rows[0]) : null;
}

export async function getCompanySettings(user: AuthUser, companyId?: string | null): Promise<CompanySettings> {
  const company = await getCompany(user, companyId);
  if (!company) throw new Error("Company not found.");
  return {
    companyName: company.name,
    address: company.address,
    website: company.website,
    logoData: company.logoData,
    locations: company.locations ?? [],
    preview: company.preview,
    theme: normalizeCompanyTheme(company.theme),
    cardAppearance: normalizeCardAppearance(company.cardAppearance),
  };
}

export async function getOrCreatePublicCardFormIdentifier(user: AuthUser): Promise<string> {
  requireCompanyAdmin(user);
  const companyId = await getSelectedCompany(user);
  if (!canManageCompany(user, companyId)) throw new AuthorizationError("You cannot manage this company.");

  if (usesJsonStorage()) {
    const identifier = await updateJsonPlatform((state) => {
      const company = state.companies.find((item) => item.id === companyId && item.status === "active");
      if (!company) return "";
      const currentIdentifier = state.publicCardFormIds?.[companyId];
      if (
        currentIdentifier &&
        /^[A-Za-z0-9_-]{16}$/.test(currentIdentifier) &&
        state.publicCardFormTokenHashes?.[companyId] === createHash("sha256").update(currentIdentifier).digest("hex")
      ) {
        return currentIdentifier;
      }
      const newIdentifier = randomBytes(12).toString("base64url");
      state.publicCardFormTokenHashes ??= {};
      state.publicCardFormTokenHashes[companyId] = createHash("sha256").update(newIdentifier).digest("hex");
      state.publicCardFormIds ??= {};
      state.publicCardFormIds[companyId] = newIdentifier;
      return newIdentifier;
    });
    if (!identifier) throw new Error("Company not found or inactive.");
    return identifier;
  }

  const identifier = randomBytes(12).toString("base64url");
  const tokenHash = createHash("sha256").update(identifier).digest("hex");
  const rows = await getDatabase()`
    UPDATE companies
    SET public_card_form_id = CASE
          WHEN public_card_form_id IS NULL OR public_card_form_token_hash IS NULL THEN ${identifier}
          ELSE public_card_form_id
        END,
        public_card_form_token_hash = CASE
          WHEN public_card_form_id IS NULL OR public_card_form_token_hash IS NULL THEN ${tokenHash}
          ELSE public_card_form_token_hash
        END,
        updated_at = now()
    WHERE id = ${companyId} AND status = 'active'
    RETURNING public_card_form_id
  `;
  if (!rows[0]) throw new Error("Company not found or inactive.");
  return String(rows[0].public_card_form_id);
}

async function findPublicCardFormCompany(identifier: string): Promise<{
  id: string;
  name: string;
  website: string;
  logoData: string;
  locations: CompanyLocation[];
} | null> {
  if (!/^(?:[a-f0-9]{64}|[A-Za-z0-9_-]{16})$/i.test(identifier)) return null;
  const tokenHash = createHash("sha256").update(identifier).digest("hex");
  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    const company = state.companies.find((item) =>
      item.status === "active" && state.publicCardFormTokenHashes?.[item.id] === tokenHash
    );
    return company ? {
      id: company.id,
      name: company.name,
      website: company.website,
      logoData: company.logoData,
      locations: company.locations ?? [],
    } : null;
  }

  const [company] = await getDatabase()`
    SELECT id, name, website, logo_data, locations
    FROM companies
    WHERE public_card_form_token_hash = ${tokenHash} AND status = 'active'
  `;
  return company ? {
    id: String(company.id),
    name: String(company.name),
    website: String(company.website ?? ""),
    logoData: String(company.logo_data ?? ""),
    locations: normalizeCompanyLocations(company.locations),
  } : null;
}

export async function getPublicCardFormSettings(identifier: string): Promise<PublicCardFormSettings | null> {
  const company = await findPublicCardFormCompany(identifier);
  if (!company) return null;
  return {
    companyName: company.name,
    website: company.website,
    logoData: company.logoData,
    locations: company.locations,
  };
}

export async function saveCompanySettings(
  user: AuthUser,
  settings: CompanySettings
): Promise<CompanySettings> {
  const companyId = await getSelectedCompany(user);
  if (isBranchAdmin(user)) {
    if (!usesJsonStorage()) {
      throw new AuthorizationError("Branch branding is only available in JSON storage.");
    }
    const updated = await updateJsonPlatform((state) => {
      const branch = state.branches.find((item) =>
        item.id === user.branchId && item.companyId === companyId
      );
      if (!branch) return null;
      Object.assign(branch, {
        name: settings.companyName,
        address: settings.address,
        website: settings.website,
        logoData: settings.logoData,
        locations: settings.locations,
        locationsInitialized: true,
        locationsVersion: 1,
        preview: settings.preview,
        theme: settings.theme,
        cardAppearance: settings.cardAppearance,
        updatedAt: new Date().toISOString(),
      });
      recordActivity(state, user, companyId, "updated", "branch", branch.id);
      return branch;
    });
    if (!updated) throw new Error("Branch not found.");
    return settings;
  }
  const updated = await updateCompany(user, companyId, {
    name: settings.companyName,
    address: settings.address,
    website: settings.website,
    logoData: settings.logoData,
    locations: settings.locations,
    preview: settings.preview,
    theme: settings.theme,
    cardAppearance: settings.cardAppearance,
  });
  if (!updated) throw new Error("Company not found.");
  return settings;
}

export async function getCardsForUser(user: AuthUser): Promise<VisitingCard[]> {
  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    const activeCompanyId = user.role === "SUPER_ADMIN" ? await getActiveCompanyId(user) : user.companyId;
    if (user.role === "SUPER_ADMIN" && activeCompanyId && !canManageCompany(user, activeCompanyId)) return [];
    return state.cards
      .filter((card) => {
        if (user.role === "SUPER_ADMIN") return !activeCompanyId || card.companyId === activeCompanyId;
        if (user.role === "COMPANY_ADMIN") {
          return card.companyId === user.companyId && (!user.branchId || card.branchId === user.branchId);
        }
        return card.companyId === user.companyId && card.employeeId === user.employeeId;
      })
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .map((card) => getLocalCard(card, state))
      .filter((card): card is VisitingCard => card !== null);
  }

  const db = getDatabase();
  const projection = cardProjection(db);
  if (user.role === "EMPLOYEE") {
    const rows = await db`
      SELECT ${projection}
      FROM cards c
      JOIN companies co ON co.id = c.company_id
      WHERE c.company_id = ${user.companyId} AND c.employee_id = ${user.employeeId}
      ORDER BY c.created_at DESC
    `;
    return rows.map((row) => toVisitingCard(row as unknown as CardRow));
  }

  const companyId = await getActiveCompanyId(user);
  if (companyId) {
    if (!canManageCompany(user, companyId)) return [];
    const rows = await db`
      SELECT ${projection}
      FROM cards c
      JOIN companies co ON co.id = c.company_id
      WHERE c.company_id = ${companyId}
      ORDER BY c.created_at DESC
    `;
    return rows.map((row) => toVisitingCard(row as unknown as CardRow));
  }

  const rows = await db`
    SELECT ${projection}
    FROM cards c
    JOIN companies co ON co.id = c.company_id
    ORDER BY c.created_at DESC
  `;
  return rows.map((row) => toVisitingCard(row as unknown as CardRow));
}

export async function getAllCardsForSuperAdmin(user: AuthUser): Promise<VisitingCard[]> {
  if (user.role !== "SUPER_ADMIN") throw new AuthorizationError();
  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    return [...state.cards]
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .map((card) => getLocalCard(card, state))
      .filter((card): card is VisitingCard => card !== null);
  }
  const db = getDatabase();
  const rows = await db`
    SELECT ${cardProjection(db)}, co.locations AS company_locations
    FROM cards c
    JOIN companies co ON co.id = c.company_id
    ORDER BY c.created_at DESC
  ` as unknown as CardRow[];
  return rows.map(toVisitingCard);
}

export async function getCardForUser(user: AuthUser, id: string): Promise<VisitingCard | null> {
  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    const card = state.cards.find((item) => item.id === id);
    if (!card) return null;
    if (user.role === "COMPANY_ADMIN" && card.companyId !== user.companyId) return null;
    if (user.branchId && card.branchId !== user.branchId) return null;
    if (user.role === "EMPLOYEE" &&
        (card.companyId !== user.companyId || card.employeeId !== user.employeeId)) return null;
    if (user.role === "SUPER_ADMIN") {
      const activeCompanyId = await getActiveCompanyId(user);
      if (activeCompanyId && card.companyId !== activeCompanyId) return null;
    }
    return getLocalCard(card, state);
  }

  const db = getDatabase();
  const projection = cardProjection(db);
  let rows: CardRow[];
  if (user.role === "SUPER_ADMIN") {
    const activeCompanyId = await getActiveCompanyId(user);
    rows = activeCompanyId
      ? await db`
          SELECT ${projection}
          FROM cards c JOIN companies co ON co.id = c.company_id
          WHERE c.id = ${id} AND c.company_id = ${activeCompanyId}
        ` as unknown as CardRow[]
      : await db`
          SELECT ${projection}
          FROM cards c JOIN companies co ON co.id = c.company_id
          WHERE c.id = ${id}
        ` as unknown as CardRow[];
  } else if (user.role === "COMPANY_ADMIN") {
    rows = await db`
      SELECT ${projection}
      FROM cards c JOIN companies co ON co.id = c.company_id
      WHERE c.id = ${id} AND c.company_id = ${user.companyId}
    ` as unknown as CardRow[];
  } else {
    rows = await db`
      SELECT ${projection}
      FROM cards c JOIN companies co ON co.id = c.company_id
      WHERE c.id = ${id} AND c.company_id = ${user.companyId}
        AND c.employee_id = ${user.employeeId}
    ` as unknown as CardRow[];
  }
  return rows[0] ? toVisitingCard(rows[0]) : null;
}

export async function getPublicCard(id: string): Promise<{ card: VisitingCard; company: CompanySettings } | null> {
  if (usesJsonStorage()) {
    const state = await readJsonPlatform();
    const storedCard = state.cards.find((item) =>
      (item.id === id || item.publicSlug === id) && item.isActive
    );
    if (!storedCard) return null;
    const company = state.companies.find((item) => item.id === storedCard.companyId && item.status === "active");
    const employee = state.employees.find((item) => item.id === storedCard.employeeId && item.companyId === storedCard.companyId);
    if (!company || !employee || employee.status !== "active") return null;
    const branch = state.branches.find((item) => item.id === storedCard.branchId && item.companyId === storedCard.companyId);
    if (branch && branch.status !== "active") return null;
    const card = getLocalCard(storedCard, state);
    if (!card) return null;
    delete card.companyId;
    delete card.employeeId;
    delete card.branchId;
    delete card.branchName;
    return {
      card,
      company: {
        companyName: branch?.name ?? company.name,
        address: branch?.address || company.address,
        website: branch?.website || company.website,
        logoData: branch?.logoData || company.logoData,
        locations: branch?.locations ?? company.locations ?? [],
        preview: branch?.preview ?? company.preview,
        theme: normalizeCompanyTheme(branch?.theme ?? company.theme),
        cardAppearance: normalizeCardAppearance(branch?.cardAppearance ?? company.cardAppearance),
      },
    };
  }

  const db = getDatabase();
  const rows = await db`
    SELECT ${cardProjection(db)}
    FROM cards c
    JOIN companies co ON co.id = c.company_id
    JOIN employees e ON e.id = c.employee_id AND e.company_id = c.company_id
    WHERE c.id = ${id} AND c.is_active = true
      AND co.status = 'active' AND e.status = 'active'
  ` as unknown as CardRow[];
  if (!rows[0]) return null;
  const row = rows[0];
  const card = toVisitingCard(row);
  delete card.companyId;
  delete card.employeeId;
  delete card.branchId;
  delete card.branchName;
  return {
    card,
    company: {
      companyName: row.company_name,
      address: row.company_address,
      website: row.company_website,
      logoData: row.company_logo,
      locations: normalizeCompanyLocations(row.company_locations),
      preview: row.company_preview,
      theme: DEFAULT_COMPANY_THEME,
      cardAppearance: DEFAULT_CARD_APPEARANCE,
    },
  };
}

export async function createCardForUser(
  user: AuthUser,
  input: NewCardInput,
  logActivity = true
): Promise<VisitingCard> {
  requireCompanyAdmin(user);
  const companyId = await getSelectedCompany(user);
  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      const company = state.companies.find((item) => item.id === companyId && item.status === "active");
      if (!company) throw new Error("Company not found or inactive.");
      const branchId = user.branchId || input.branchId || undefined;
      const branch = branchId
        ? state.branches.find((item) => item.id === branchId && item.companyId === companyId && item.status === "active")
        : undefined;
      if (branchId && !branch) throw new BranchAssignmentError();
      const email = input.email.trim().toLowerCase();
      if (state.employees.some((item) => item.companyId === companyId && item.email === email)) {
        throw new Error("An employee already exists with this email address in the selected company.");
      }
      const employeeId = randomUUID();
      const employee: JsonEmployee = {
        id: employeeId,
        companyId,
        ...(branchId ? { branchId } : {}),
        fullName: input.fullName,
        designation: input.designation,
        countryCode: input.countryCode,
        mobile: input.mobile,
        email,
        address: input.address,
        linkedin: input.linkedin,
        linkedinName: input.linkedinName ?? "",
        status: "active",
      };
      const card: VisitingCard = {
        ...input,
        id: randomUUID(),
        companyId,
        employeeId,
        branchId,
        branchName: branch?.name,
        company: branch?.name ?? company.name,
        website: branch?.website || company.website,
        logoData: input.logoData || branch?.logoData || company.logoData,
        backgroundColor: DEFAULT_CARD_BACKGROUND,
        accentColor: DEFAULT_CARD_ACCENT,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      refreshCardPublicSlug(state, card, card.fullName, branch?.name ?? company.name);
      state.employees.push(employee);
      state.cards.unshift(card);
      if (logActivity) {
        recordActivity(state, user, companyId, "created", "employee", employeeId);
        recordActivity(state, user, companyId, "created", "card", card.id);
      }
      return card;
    });
  }

  const employeeId = randomUUID();
  const cardId = randomUUID();
  const db = getDatabase();
  await db.begin(async (transaction) => {
    if (input.branchId) {
      const [branch] = await transaction`
        SELECT id FROM branches
        WHERE id = ${input.branchId} AND company_id = ${companyId} AND status = 'active'
      `;
      if (!branch) throw new BranchAssignmentError();
    }
    await transaction`
      INSERT INTO employees (
        id, company_id, full_name, designation, country_code, mobile, email,
        address, linkedin, linkedin_name
      ) VALUES (
        ${employeeId}, ${companyId}, ${input.fullName}, ${input.designation},
        ${input.countryCode}, ${input.mobile}, ${input.email.trim().toLowerCase()},
        ${input.address}, ${input.linkedin}, ${input.linkedinName ?? ""}
      )
    `;
    await transaction`
      INSERT INTO cards (
        id, company_id, employee_id, full_name, designation, country_code,
        mobile, email, address, website, linkedin, linkedin_name, logo_data, branch_id
      ) VALUES (
        ${cardId}, ${companyId}, ${employeeId}, ${input.fullName},
        ${input.designation}, ${input.countryCode}, ${input.mobile},
        ${input.email.trim().toLowerCase()}, ${input.address}, ${input.website},
        ${input.linkedin}, ${input.linkedinName ?? ""}, ${input.logoData ?? ""},
        ${input.branchId ?? null}
      )
    `;
  });
  const card = await getCardForUser(user, cardId);
  if (!card) throw new Error("Created card could not be loaded.");
  return card;
}

export async function createCardFromPublicForm(
  identifier: string,
  input: NewCardInput
): Promise<VisitingCard | null> {
  const company = await findPublicCardFormCompany(identifier);
  if (!company) return null;

  const publicFormUser: AuthUser = {
    id: "public-card-form",
    email: "public-card-form",
    role: "COMPANY_ADMIN",
    companyId: company.id,
    branchId: null,
    employeeId: null,
    mustChangePassword: false,
    locale: "en",
  };
  return createCardForUser(publicFormUser, {
    ...input,
    company: company.name,
    website: company.website,
    logoData: input.logoData || company.logoData,
    branchId: null,
  }, false);
}

export async function updateCardForUser(
  user: AuthUser,
  id: string,
  input: Pick<VisitingCard, "fullName" | "designation" | "countryCode" | "mobile" | "email" | "address" | "linkedin" | "linkedinName"> & {
    logoData: string;
    branchId?: string | null;
  }
): Promise<VisitingCard | null> {
  const current = await getCardForUser(user, id);
  if (!current) return null;
  const companyId = current.companyId;
  const employeeId = current.employeeId;
  if (!companyId || !employeeId || !canAccessCard(user, companyId, employeeId, current.branchId)) return null;
  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      const card = state.cards.find((item) =>
        item.id === id && item.companyId === companyId && item.employeeId === employeeId
      );
      const employee = state.employees.find((item) =>
        item.id === employeeId && item.companyId === companyId
      );
      if (!card || !employee) return null;
      const branchId = user.branchId ?? input.branchId;
      if (user.branchId || input.branchId !== undefined) {
        const branch = branchId
          ? state.branches.find((item) =>
              item.id === branchId &&
              item.companyId === companyId &&
              (item.status === "active" || item.id === card.branchId)
            )
          : undefined;
        if (branchId && !branch) throw new BranchAssignmentError();
        card.branchId = branchId ?? undefined;
        card.branchName = branch?.name;
        if (branchId) employee.branchId = branchId;
        else delete employee.branchId;
      }
      const email = input.email.trim().toLowerCase();
      if (state.employees.some((item) =>
        item.companyId === companyId && item.id !== employeeId && item.email === email
      )) {
        throw new Error("An employee already exists with this email address in the selected company.");
      }
      const updatedFields = {
        fullName: input.fullName,
        designation: input.designation,
        countryCode: input.countryCode,
        mobile: input.mobile,
        email,
        address: input.address,
        linkedin: input.linkedin,
        linkedinName: input.linkedinName ?? "",
      };
      Object.assign(card, updatedFields, { logoData: input.logoData });
      const currentCompany = state.companies.find((item) => item.id === card.companyId);
      const currentBranch = state.branches.find((item) => item.id === card.branchId && item.companyId === card.companyId);
      refreshCardPublicSlug(state, card, card.fullName, currentBranch?.name ?? currentCompany?.name ?? card.company);
      Object.assign(employee, updatedFields);
      recordActivity(state, user, companyId, "updated", "employee", employeeId);
      recordActivity(state, user, companyId, "updated", "card", id);
      return getLocalCard(card, state);
    });
  }

  const db = getDatabase();
  if (input.branchId !== undefined && input.branchId !== null) {
    const [branch] = await db`
      SELECT id FROM branches
      WHERE id = ${input.branchId} AND company_id = ${companyId}
        AND (status = 'active' OR id = ${current.branchId ?? null})
    `;
    if (!branch) throw new BranchAssignmentError();
  }
  await db.begin(async (transaction) => {
    await transaction`
      UPDATE employees SET
        full_name = ${input.fullName}, designation = ${input.designation},
        country_code = ${input.countryCode}, mobile = ${input.mobile},
        email = ${input.email.trim().toLowerCase()}, address = ${input.address},
        linkedin = ${input.linkedin}, linkedin_name = ${input.linkedinName ?? ""},
        updated_at = now()
      WHERE id = ${employeeId} AND company_id = ${companyId}
    `;
    await transaction`
      UPDATE cards SET
        full_name = ${input.fullName}, designation = ${input.designation},
        country_code = ${input.countryCode}, mobile = ${input.mobile},
        email = ${input.email.trim().toLowerCase()}, address = ${input.address},
        linkedin = ${input.linkedin}, linkedin_name = ${input.linkedinName ?? ""},
        logo_data = ${input.logoData},
        branch_id = CASE WHEN ${input.branchId !== undefined} THEN ${input.branchId ?? null} ELSE branch_id END
      WHERE id = ${id} AND company_id = ${companyId}
        AND employee_id = ${employeeId}
    `;
  });
  return getCardForUser(user, id);
}

export async function setCardActiveForUser(
  user: AuthUser,
  id: string,
  isActive: boolean
): Promise<VisitingCard | null> {
  const current = await getCardForUser(user, id);
  if (!current || !canManageCard(user, current.companyId ?? "", current.employeeId ?? "", current.branchId)) return null;
  const companyId = current.companyId;
  const employeeId = current.employeeId;
  if (!companyId || !employeeId) return null;
  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      const card = state.cards.find((item) =>
        item.id === id && item.companyId === companyId && item.employeeId === employeeId
      );
      const employee = state.employees.find((item) =>
        item.id === employeeId && item.companyId === companyId
      );
      if (!card || !employee) return null;
      card.isActive = isActive;
      employee.status = isActive ? "active" : "inactive";
      recordActivity(state, user, companyId, isActive ? "activated" : "deactivated", "card", id);
      return getLocalCard(card, state);
    });
  }

  const db = getDatabase();
  await db.begin(async (transaction) => {
    await transaction`
      UPDATE cards SET is_active = ${isActive}
      WHERE id = ${id} AND company_id = ${companyId}
        AND employee_id = ${employeeId}
    `;
    await transaction`
      UPDATE employees SET status = ${isActive ? "active" : "inactive"}, updated_at = now()
      WHERE id = ${employeeId} AND company_id = ${companyId}
    `;
  });
  return getCardForUser(user, id);
}

export async function setCardPreviewForUser(
  user: AuthUser,
  id: string,
  preview: CompanyPreviewSettings | undefined
): Promise<VisitingCard | null> {
  const current = await getCardForUser(user, id);
  if (!current || !canManageCard(user, current.companyId ?? "", current.employeeId ?? "", current.branchId)) return null;
  const companyId = current.companyId;
  const employeeId = current.employeeId;
  if (!companyId || !employeeId) return null;
  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      const card = state.cards.find((item) =>
        item.id === id && item.companyId === companyId && item.employeeId === employeeId
      );
      if (!card) return null;
      if (preview) card.preview = preview;
      else delete card.preview;
      recordActivity(state, user, companyId, "updated-preview", "card", id);
      return getLocalCard(card, state);
    });
  }

  await getDatabase()`
    UPDATE cards SET preview = ${preview ? JSON.stringify(preview) : null}::jsonb
    WHERE id = ${id} AND company_id = ${companyId}
      AND employee_id = ${employeeId}
  `;
  return getCardForUser(user, id);
}

export async function applyCompanyPreviewToCards(user: AuthUser): Promise<number> {
  requireCompanyAdmin(user);
  if (user.branchId) {
    throw new AuthorizationError("Only Company Admins can apply preview settings to all company cards.");
  }
  const companyId = await getSelectedCompany(user);
  if (!canManageCompany(user, companyId)) {
    throw new AuthorizationError("You cannot manage this company.");
  }

  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      const company = state.companies.find((item) => item.id === companyId);
      if (!company) throw new Error("Company not found.");
      const cards = state.cards.filter((card) => card.companyId === companyId);
      for (const card of cards) card.preview = company.preview;
      if (cards.length > 0) {
        recordActivity(state, user, companyId, "applied-preview-to-cards", "company", companyId);
      }
      return cards.length;
    });
  }

  const db = getDatabase();
  const [company] = await db`SELECT id FROM companies WHERE id = ${companyId}`;
  if (!company) throw new Error("Company not found.");
  const cards = await db`
    UPDATE cards
    SET preview = companies.preview
    FROM companies
    WHERE cards.company_id = companies.id AND companies.id = ${companyId}
    RETURNING cards.id
  `;
  return cards.length;
}

export async function deleteCardForUser(user: AuthUser, id: string): Promise<boolean> {
  requireCompanyAdmin(user);
  const current = await getCardForUser(user, id);
  if (!current) return false;
  const companyId = current.companyId;
  if (!companyId) return false;
  if (usesJsonStorage()) {
    return updateJsonPlatform((state) => {
      const cardIndex = state.cards.findIndex((item) => item.id === id && item.companyId === companyId);
      if (cardIndex === -1) return false;
      const employeeId = state.cards[cardIndex].employeeId;
      state.cards.splice(cardIndex, 1);
      recordActivity(state, user, companyId, "deleted", "card", id);
      if (employeeId && !state.cards.some((item) => item.employeeId === employeeId && item.companyId === companyId)) {
        recordActivity(state, user, companyId, "deleted", "employee", employeeId);
        state.employees = state.employees.filter((item) => item.id !== employeeId || item.companyId !== companyId);
        state.users = state.users.filter((item) => item.employeeId !== employeeId || item.companyId !== companyId);
      }
      return true;
    });
  }

  const db = getDatabase();
  return db.begin(async (transaction) => {
    const [deletedCard] = await transaction`
      DELETE FROM cards
      WHERE id = ${id} AND company_id = ${companyId}
      RETURNING employee_id
    `;
    if (!deletedCard) return false;
    await transaction`
      DELETE FROM employees e
      WHERE e.id = ${deletedCard.employee_id}
        AND e.company_id = ${companyId}
        AND NOT EXISTS (
          SELECT 1 FROM cards c
          WHERE c.employee_id = e.id AND c.company_id = e.company_id
        )
    `;
    return true;
  });
}
