import { NextResponse } from "next/server";
import {
  AuthenticationError,
  AuthorizationError,
  CompanySelectionRequiredError,
  PasswordChangeRequiredError,
} from "@/lib/auth";

export function authFailureResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ message: error.message }, { status: 401 });
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ message: error.message }, { status: 403 });
  }
  if (error instanceof PasswordChangeRequiredError) {
    return NextResponse.json({ message: error.message, code: "PASSWORD_CHANGE_REQUIRED" }, { status: 403 });
  }
  if (error instanceof CompanySelectionRequiredError) {
    return NextResponse.json({ message: error.message, code: "COMPANY_SELECTION_REQUIRED" }, { status: 409 });
  }
  return null;
}
