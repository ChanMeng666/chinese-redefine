import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const protectedRoutes = ["/", "/account", "/account/cards"];
const authRoutes = ["/login", "/register", "/forgot-password"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Logged-in users visiting auth pages → redirect to home
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Not logged in → redirect to login
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in but email not verified → redirect to verify page
  if (isProtectedRoute && session && !session.user.emailVerified) {
    if (pathname !== "/verify-email") {
      return NextResponse.redirect(new URL("/verify-email", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|gallery|verify-email).*)",
  ],
};
