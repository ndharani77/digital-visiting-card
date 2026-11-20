import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "digital_card_session";

function isPublicVisitorRoute(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/public/")) return true;
  const pathSegments = pathname.split("/").filter(Boolean);
  if (pathSegments.length === 2 && pathSegments[0] === "card") {
    return request.nextUrl.searchParams.get("source") === "qr";
  }
  return false;
}

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "development" && process.env.DEV_AUTH_BYPASS === "true") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (/\.[^/]+$/.test(pathname)) return NextResponse.next();
  if (pathname === "/login" || pathname.startsWith("/api/auth/") || isPublicVisitorRoute(request)) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32 || secret.includes("replace-with")) {
    return NextResponse.redirect(new URL("/login?configuration=auth", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    if (payload.mustChangePassword === true && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
