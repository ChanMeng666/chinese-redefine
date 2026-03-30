import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { cookies, headers } from "next/headers";

export async function GET() {
  const debug: Record<string, unknown> = {};

  // 1. Check env vars (existence only, not values)
  debug.env = {
    NEON_AUTH_BASE_URL: !!process.env.NEON_AUTH_BASE_URL,
    NEON_AUTH_COOKIE_SECRET: !!process.env.NEON_AUTH_COOKIE_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    NEON_AUTH_BASE_URL_preview: process.env.NEON_AUTH_BASE_URL?.slice(0, 30) + "...",
  };

  // 2. Check cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  debug.cookies = allCookies.map((c) => ({
    name: c.name,
    valueLength: c.value?.length || 0,
    valuePreview: c.value?.slice(0, 20) + "...",
  }));

  // 3. Check session
  try {
    const session = await auth.getSession();
    debug.session = {
      hasData: !!session?.data,
      user: session?.data?.user
        ? {
            id: session.data.user.id,
            email: session.data.user.email,
            emailVerified: session.data.user.emailVerified,
            name: session.data.user.name,
          }
        : null,
      error: session?.error || null,
    };
  } catch (e: unknown) {
    debug.session = { error: String(e) };
  }

  // 4. Check headers
  const headersList = await headers();
  debug.headers = {
    host: headersList.get("host"),
    cookie: headersList.get("cookie")?.slice(0, 100) || "(none)",
    origin: headersList.get("origin"),
    referer: headersList.get("referer"),
  };

  return NextResponse.json(debug, {
    headers: { "Cache-Control": "no-store" },
  });
}
