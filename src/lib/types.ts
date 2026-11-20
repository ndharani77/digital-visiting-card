import type { CompanyPreviewSettings } from "@/lib/company-content";

export type UserRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "EMPLOYEE";

export type VisitingCard = {
  id: string;
  companyId?: string;
  employeeId?: string;
  branchId?: string;
  branchName?: string;
  fullName: string;
  designation: string;
  company: string;
  countryCode: string;
  mobile: string;
  email: string;
  address: string;
  website: string;
  linkedin: string;
  linkedinName?: string;
  logoData?: string;
  backgroundColor?: string;
  accentColor?: string;
  preview?: CompanyPreviewSettings;
  isActive: boolean;
  createdAt: string;
};
