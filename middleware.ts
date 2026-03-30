import { auth } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public and auth routes through
  const publicPatterns = [
    "/gallery",
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
  ];
  if (
    publicPatterns.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  // Check session
  const { data: session } = await auth.getSession();

  // Not logged in -> redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in but email not verified -> redirect to verify-email
  if (!session.user.emailVerified) {
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
