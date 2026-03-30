# Backend, Auth & Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Neon Database persistence, Better Auth authentication (email/password + GitHub/Google OAuth), three-layer usage limits, and a public card gallery to the existing Chinese Redefine project, all running on Cloudflare Workers.

**Architecture:** Next.js 15 App Router on Cloudflare Workers. Drizzle ORM connects to Neon Database via `@neondatabase/serverless` (WebSocket). Better Auth handles authentication with Resend for email verification. Cards are persisted with SVG content. Three-layer rate limiting (user quotas, global circuit breaker, abuse detection) protects the OpenAI API budget.

**Tech Stack:** Next.js 15, Drizzle ORM, Neon Database, Better Auth, Resend, Cloudflare Workers, OpenAI API

---

## File Structure

```
lib/
  db/
    schema.ts          — Drizzle schema (all tables)
    index.ts           — Drizzle client (Neon connection)
    migrate.ts         — Migration helper script
  auth.ts              — Better Auth server config
  auth-client.ts       — Better Auth client config
  rate-limit.ts        — Three-layer rate limiting logic
app/
  api/
    auth/[...all]/route.ts  — Better Auth catch-all
    generate/route.ts       — Refactored card generation (auth + quotas + DB persist)
    cards/[id]/route.ts     — Toggle card visibility
    cards/mine/route.ts     — Get user's cards
    gallery/route.ts        — Public gallery API (paginated + search)
  (auth)/
    login/page.tsx
    register/page.tsx
    verify-email/page.tsx
    forgot-password/page.tsx
  (protected)/
    page.tsx                — Card generator (moved from root)
    account/page.tsx        — Account settings
    account/cards/page.tsx  — My cards management
  gallery/
    page.tsx                — Public gallery
  layout.tsx                — Updated with nav + auth provider
middleware.ts               — Route protection
components/
  Navbar.tsx                — Navigation bar
  GalleryGrid.tsx           — Masonry grid for gallery
  CardThumbnail.tsx         — Single card in gallery
  QuotaDisplay.tsx          — Usage quota indicator
  AuthForm.tsx              — Login/register form
drizzle.config.ts           — Drizzle Kit config
```

---

### Task 1: Install Dependencies & Configure Drizzle

**Files:**
- Modify: `package.json`
- Create: `drizzle.config.ts`
- Create: `lib/db/index.ts`
- Modify: `wrangler.toml`

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install drizzle-orm @neondatabase/serverless better-auth resend
npm install -D drizzle-kit
```

- [ ] **Step 2: Create Drizzle config**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 3: Create database client**

Create `lib/db/index.ts`:
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof getDb>;
```

- [ ] **Step 4: Add environment variables to wrangler.toml**

Add to `wrangler.toml`:
```toml
[vars]
# Non-secret vars go here. Secrets set via: wrangler secret put DATABASE_URL
```

- [ ] **Step 5: Set Cloudflare secrets**

Run:
```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put RESEND_API_KEY
```

- [ ] **Step 6: Create .env.local for local development**

Create `.env.local` (already in .gitignore):
```
DATABASE_URL=postgresql://...your-neon-url...
OPENAI_API_KEY=sk-...
BETTER_AUTH_SECRET=your-random-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=re_...
AI_MODEL=gpt-4o-mini
```

- [ ] **Step 7: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts without errors on http://localhost:3000

- [ ] **Step 8: Commit**

```bash
git add drizzle.config.ts lib/db/index.ts package.json package-lock.json wrangler.toml
git commit -m "feat: add drizzle ORM and Neon database dependencies"
```

---

### Task 2: Define Database Schema

**Files:**
- Create: `lib/db/schema.ts`

- [ ] **Step 1: Create the complete Drizzle schema**

Create `lib/db/schema.ts`:
```typescript
import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  serial,
  date,
  unique,
} from "drizzle-orm/pg-core";

// ========== Better Auth tables ==========

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  tier: text("tier").notNull().default("free"),
  isFlagged: boolean("is_flagged").notNull().default(false),
  signupIp: text("signup_ip"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ========== Business tables ==========

export const cards = pgTable("cards", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  word: text("word").notNull(),
  explanation: text("explanation").notNull(),
  pinyin: text("pinyin"),
  english: text("english"),
  japanese: text("japanese"),
  svgContent: text("svg_content").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userUsage = pgTable(
  "user_usage",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    dailyCount: integer("daily_count").notNull().default(0),
  },
  (table) => [unique("user_usage_unique").on(table.userId, table.date)]
);

export const globalUsage = pgTable("global_usage", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  dailyCount: integer("daily_count").notNull().default(0),
  monthlyCount: integer("monthly_count").notNull().default(0),
});
```

- [ ] **Step 2: Generate migration**

Run:
```bash
npx drizzle-kit generate
```
Expected: Creates `drizzle/0000_*.sql` migration file

- [ ] **Step 3: Push schema to Neon**

Run:
```bash
npx drizzle-kit push
```
Expected: Tables created in Neon database. Verify in Neon dashboard.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat: define database schema for auth, cards, and usage tracking"
```

---

### Task 3: Configure Better Auth

**Files:**
- Create: `lib/auth.ts`
- Create: `lib/auth-client.ts`
- Create: `app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create Better Auth server config**

Create `lib/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "汉语新解 <noreply@yourdomain.com>",
        to: user.email,
        subject: "重置密码",
        html: `<p>点击以下链接重置密码：</p><a href="${url}">${url}</a>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "汉语新解 <noreply@yourdomain.com>",
        to: user.email,
        subject: "验证你的邮箱",
        html: `<p>点击以下链接验证邮箱：</p><a href="${url}">${url}</a>`,
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      tier: { type: "string", defaultValue: "free" },
      isFlagged: { type: "boolean", defaultValue: false },
      signupIp: { type: "string", required: false },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

- [ ] **Step 2: Create Better Auth client config**

Create `lib/auth-client.ts`:
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
```

- [ ] **Step 3: Add NEXT_PUBLIC_BETTER_AUTH_URL to .env.local**

Append to `.env.local`:
```
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

- [ ] **Step 4: Create auth API catch-all route**

Create `app/api/auth/[...all]/route.ts`:
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 5: Verify auth endpoint responds**

Run: `npm run dev`
Then: `curl http://localhost:3000/api/auth/ok`
Expected: Returns `{ "ok": true }` or similar Better Auth health response

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts lib/auth-client.ts app/api/auth/
git commit -m "feat: configure Better Auth with email, GitHub, and Google providers"
```

---

### Task 4: Create Auth Pages (Login, Register, Verify Email, Forgot Password)

**Files:**
- Create: `components/AuthForm.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/(auth)/verify-email/page.tsx`
- Create: `app/(auth)/forgot-password/page.tsx`
- Create: `app/(auth)/layout.tsx`

- [ ] **Step 1: Create auth layout**

Create `app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create AuthForm component**

Create `components/AuthForm.tsx`:
```typescript
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "register") {
        const result = await signUp.email({
          email,
          password,
          name,
        });
        if (result.error) {
          setError(result.error.message || "注册失败");
        } else {
          setSuccess("注册成功！请检查邮箱完成验证。");
        }
      } else {
        const result = await signIn.email({
          email,
          password,
        });
        if (result.error) {
          setError(result.error.message || "登录失败");
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch {
      setError("操作失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "github" | "google") => {
    await signIn.social({
      provider,
      callbackURL: "/",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {mode === "login" ? "登录" : "注册"}
        </CardTitle>
        <p className="text-center text-sm text-slate-500">
          {mode === "login" ? "登录你的账户" : "创建新账户"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSocialLogin("github")}
            type="button"
          >
            GitHub
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSocialLogin("google")}
            type="button"
          >
            Google
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">或</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <Input
              type="text"
              placeholder="用户名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {mode === "login" ? "登录" : "注册"}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-slate-500 space-y-1">
          {mode === "login" ? (
            <>
              <p>
                还没有账户？{" "}
                <Link href="/register" className="text-primary underline">
                  注册
                </Link>
              </p>
              <p>
                <Link
                  href="/forgot-password"
                  className="text-primary underline"
                >
                  忘记密码？
                </Link>
              </p>
            </>
          ) : (
            <p>
              已有账户？{" "}
              <Link href="/login" className="text-primary underline">
                登录
              </Link>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create login page**

Create `app/(auth)/login/page.tsx`:
```typescript
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
```

- [ ] **Step 4: Create register page**

Create `app/(auth)/register/page.tsx`:
```typescript
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
```

- [ ] **Step 5: Create verify-email page**

Create `app/(auth)/verify-email/page.tsx`:
```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { data: session } = useSession();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl">验证邮箱</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-slate-600">
          我们已向{" "}
          <span className="font-medium">{session?.user?.email || "你的邮箱"}</span>{" "}
          发送了验证链接。
        </p>
        <p className="text-sm text-slate-500">
          请检查你的收件箱（包括垃圾邮件），点击链接完成验证。
        </p>
        <div className="pt-4">
          <Button variant="outline" asChild>
            <Link href="/login">返回登录</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: Create forgot-password page**

Create `app/(auth)/forgot-password/page.tsx`:
```typescript
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await authClient.forgetPassword({ email, redirectTo: "/login" });
    setSent(true);
    setLoading(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl">忘记密码</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <Alert>
            <AlertDescription>
              如果该邮箱已注册，你将收到重置密码的邮件。
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="输入你的邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              发送重置链接
            </Button>
          </form>
        )}
        <div className="text-center text-sm">
          <Link href="/login" className="text-primary underline">
            返回登录
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7: Verify auth pages render**

Run: `npm run dev`
Visit: `http://localhost:3000/login`, `/register`, `/verify-email`, `/forgot-password`
Expected: All pages render without errors

- [ ] **Step 8: Commit**

```bash
git add components/AuthForm.tsx "app/(auth)/"
git commit -m "feat: add login, register, verify-email, and forgot-password pages"
```

---

### Task 5: Add Middleware for Route Protection

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware**

Create `middleware.ts` (project root):
```typescript
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
```

- [ ] **Step 2: Verify middleware redirects**

Run: `npm run dev`
Visit: `http://localhost:3000/` (without being logged in)
Expected: Redirected to `/login`

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware for auth route protection"
```

---

### Task 6: Add Navigation Bar & Update Layout

**Files:**
- Create: `components/Navbar.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx` → move to `app/(protected)/page.tsx`

- [ ] **Step 1: Create Navbar component**

Create `components/Navbar.tsx`:
```typescript
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut, User, ImageIcon } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg">
            汉语新解
          </Link>
          <Link
            href="/gallery"
            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <ImageIcon className="h-4 w-4" />
            画廊
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href="/account/cards"
                className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <User className="h-4 w-4" />
                {session.user.name}
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">登录</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Update root layout**

Replace `app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "汉语新解卡片生成器",
  description: "用现代视角重新诠释汉语词汇",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Move home page to protected route group**

Move `app/page.tsx` to `app/(protected)/page.tsx` with the same content:
```typescript
import HanyuCardGenerator from "@/components/CardGenerator";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <HanyuCardGenerator />
    </main>
  );
}
```

Delete the original `app/page.tsx`.

- [ ] **Step 4: Verify navbar renders and routing works**

Run: `npm run dev`
Expected: Navbar visible on all pages. Unauthenticated users see "登录" button. Protected routes redirect to login.

- [ ] **Step 5: Commit**

```bash
git add components/Navbar.tsx app/layout.tsx "app/(protected)/page.tsx"
git rm app/page.tsx
git commit -m "feat: add navbar, update layout, move generator to protected route"
```

---

### Task 7: Implement Rate Limiting Logic

**Files:**
- Create: `lib/rate-limit.ts`

- [ ] **Step 1: Create the three-layer rate limit module**

Create `lib/rate-limit.ts`:
```typescript
import { getDb } from "@/lib/db";
import { cards, userUsage, globalUsage } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

const LIMITS = {
  free: { perMinute: 1, perDay: 3, perMonth: 30 },
  pro: { perMinute: 5, perDay: 30, perMonth: 300 },
} as const;

const GLOBAL_LIMITS = { perDay: 150, perMonth: 1500 };

type TierKey = keyof typeof LIMITS;

interface QuotaResult {
  allowed: boolean;
  reason?: string;
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
}

export async function checkQuota(
  userId: string,
  tier: string
): Promise<QuotaResult> {
  const db = getDb();
  const tierKey: TierKey = tier === "pro" ? "pro" : "free";
  const limits = LIMITS[tierKey];
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";

  // Layer 2: Global circuit breaker
  const [globalRow] = await db
    .select()
    .from(globalUsage)
    .where(eq(globalUsage.date, today));

  if (globalRow) {
    if (globalRow.dailyCount >= GLOBAL_LIMITS.perDay) {
      return {
        allowed: false,
        reason: "今日生成次数已达上限，服务将于明天恢复",
        dailyUsed: limits.perDay,
        dailyLimit: limits.perDay,
        monthlyUsed: limits.perMonth,
        monthlyLimit: limits.perMonth,
      };
    }
    if (globalRow.monthlyCount >= GLOBAL_LIMITS.perMonth) {
      return {
        allowed: false,
        reason: "本月生成次数已达上限，服务将于下月恢复",
        dailyUsed: limits.perDay,
        dailyLimit: limits.perDay,
        monthlyUsed: limits.perMonth,
        monthlyLimit: limits.perMonth,
      };
    }
  }

  // Layer 1a: Per-minute burst check (using cards table createdAt)
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const recentCards = await db
    .select({ count: sql<number>`count(*)` })
    .from(cards)
    .where(
      and(eq(cards.userId, userId), gte(cards.createdAt, oneMinuteAgo))
    );

  if ((recentCards[0]?.count ?? 0) >= limits.perMinute) {
    const [todayUsage] = await db
      .select()
      .from(userUsage)
      .where(and(eq(userUsage.userId, userId), eq(userUsage.date, today)));
    const monthlyRows = await db
      .select({ total: sql<number>`coalesce(sum(daily_count), 0)` })
      .from(userUsage)
      .where(
        and(eq(userUsage.userId, userId), gte(userUsage.date, monthStart))
      );

    return {
      allowed: false,
      reason: "请求过于频繁，请稍后再试",
      dailyUsed: todayUsage?.dailyCount ?? 0,
      dailyLimit: limits.perDay,
      monthlyUsed: Number(monthlyRows[0]?.total ?? 0),
      monthlyLimit: limits.perMonth,
    };
  }

  // Layer 1b: Daily quota
  const [todayUsage] = await db
    .select()
    .from(userUsage)
    .where(and(eq(userUsage.userId, userId), eq(userUsage.date, today)));

  const dailyUsed = todayUsage?.dailyCount ?? 0;
  if (dailyUsed >= limits.perDay) {
    const monthlyRows = await db
      .select({ total: sql<number>`coalesce(sum(daily_count), 0)` })
      .from(userUsage)
      .where(
        and(eq(userUsage.userId, userId), gte(userUsage.date, monthStart))
      );
    return {
      allowed: false,
      reason: "今日配额已用完，明天再来吧！",
      dailyUsed,
      dailyLimit: limits.perDay,
      monthlyUsed: Number(monthlyRows[0]?.total ?? 0),
      monthlyLimit: limits.perMonth,
    };
  }

  // Layer 1c: Monthly quota
  const monthlyRows = await db
    .select({ total: sql<number>`coalesce(sum(daily_count), 0)` })
    .from(userUsage)
    .where(
      and(eq(userUsage.userId, userId), gte(userUsage.date, monthStart))
    );
  const monthlyUsed = Number(monthlyRows[0]?.total ?? 0);

  if (monthlyUsed >= limits.perMonth) {
    return {
      allowed: false,
      reason: "本月配额已用完，下月再来吧！",
      dailyUsed,
      dailyLimit: limits.perDay,
      monthlyUsed,
      monthlyLimit: limits.perMonth,
    };
  }

  return {
    allowed: true,
    dailyUsed,
    dailyLimit: limits.perDay,
    monthlyUsed,
    monthlyLimit: limits.perMonth,
  };
}

export async function recordUsage(userId: string): Promise<void> {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  // Update user_usage (upsert)
  await db
    .insert(userUsage)
    .values({ userId, date: today, dailyCount: 1 })
    .onConflictDoUpdate({
      target: [userUsage.userId, userUsage.date],
      set: { dailyCount: sql`${userUsage.dailyCount} + 1` },
    });

  // Update global_usage (upsert)
  await db
    .insert(globalUsage)
    .values({ date: today, dailyCount: 1, monthlyCount: 1 })
    .onConflictDoUpdate({
      target: globalUsage.date,
      set: {
        dailyCount: sql`${globalUsage.dailyCount} + 1`,
        monthlyCount: sql`${globalUsage.monthlyCount} + 1`,
      },
    });
}

export async function findCachedCard(userId: string, word: string) {
  const db = getDb();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [cached] = await db
    .select()
    .from(cards)
    .where(
      and(
        eq(cards.userId, userId),
        eq(cards.word, word),
        gte(cards.createdAt, oneDayAgo)
      )
    )
    .limit(1);

  return cached ?? null;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/rate-limit.ts
git commit -m "feat: implement three-layer rate limiting (user quotas, global breaker, burst protection)"
```

---

### Task 8: Refactor Card Generation API Route

**Files:**
- Modify: `app/api/generate/route.ts`

- [ ] **Step 1: Rewrite the generate route with auth, quotas, and DB persistence**

Replace `app/api/generate/route.ts` entirely:
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { validateWord } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { generateSVGCard } from "@/lib/svgGenerator";
import { checkQuota, recordUsage, findCachedCard } from "@/lib/rate-limit";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (!session.user.emailVerified) {
      return NextResponse.json(
        { error: "请先验证邮箱" },
        { status: 403 }
      );
    }

    // 2. Check if user is flagged
    if (session.user.isFlagged) {
      return NextResponse.json(
        { error: "账户已被限制，请联系管理员" },
        { status: 403 }
      );
    }

    const { word } = await req.json();

    // 3. Validate input
    const validationError = validateWord(word);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const trimmedWord = word.trim();

    // 4. Check duplicate word cache (24h)
    const cached = await findCachedCard(session.user.id, trimmedWord);
    if (cached) {
      const quota = await checkQuota(session.user.id, session.user.tier ?? "free");
      return NextResponse.json({
        id: cached.id,
        result: cached.explanation,
        pinyin: cached.pinyin || "",
        english: cached.english || "",
        japanese: cached.japanese || "",
        svgContent: cached.svgContent,
        cached: true,
        quota: {
          dailyUsed: quota.dailyUsed,
          dailyLimit: quota.dailyLimit,
          monthlyUsed: quota.monthlyUsed,
          monthlyLimit: quota.monthlyLimit,
        },
      });
    }

    // 5. Check quotas
    const quota = await checkQuota(session.user.id, session.user.tier ?? "free");
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: quota.reason,
          quota: {
            dailyUsed: quota.dailyUsed,
            dailyLimit: quota.dailyLimit,
            monthlyUsed: quota.monthlyUsed,
            monthlyLimit: quota.monthlyLimit,
          },
        },
        { status: 429 }
      );
    }

    // 6. Check API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API密钥未配置" },
        { status: 500 }
      );
    }

    // 7. Call OpenAI
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4o-mini",
          temperature: 0.85,
          max_tokens: 500,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `;; 作者: 李继刚
;; 版本: 0.1
;; 用途: 将一个汉语词汇进行全新角度的解释

(defun 新汉语老师 ()
"你是年轻人,批判现实,思考深刻,语言风趣"
  (风格 . ("Oscar Wilde" "鲁迅" "林语堂"))
  (擅长 . 一针见血)
  (表达 . 隐喻)
  (批判 . 讽刺幽默))

(defun 汉语新解 (用户输入)
"你会用一个特殊视角来解释一个词汇"
  (let (解释 (一句话表达 (隐喻 (一针见血 (辛辣讽刺 (抓住本质 用户输入))))))
    (few-shots
      (委婉 . "刺向他人时, 决定在剑刃上撒上止痛药。")
      (自由 . "在笼子里选择待在哪个角落的权利。")
      (成熟 . "学会在刀尖上微笑的过程。")
      (人脉 . "把自己变成一张被人翻来翻去的名片。"))
    (输出 (json
      {"explanation": 解释
       "pinyin": (拼音 用户输入)
       "english": (英译 用户输入)
       "japanese": (日译 用户输入)}))))

(defun start ()
  (let (system-role 新汉语老师)
    (print "说吧, 他们又用哪个词来忽悠你了?")))

;; 运行规则
;; 1. 启动时必须运行 (start) 函数
;; 2. 之后调用主函数 (汉语新解 用户输入)
;; 3. 只输出 JSON，不要输出其他任何内容`,
            },
            { role: "user", content: trimmedWord },
          ],
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 401)
        return NextResponse.json({ error: "API密钥无效" }, { status: 401 });
      if (status === 429)
        return NextResponse.json(
          { error: "API 调用配额已用完，请稍后重试" },
          { status: 429 }
        );
      throw new Error(`OpenAI API returned ${status}`);
    }

    const data = await response.json();

    if (data.choices?.[0]?.finish_reason === "content_filter") {
      return NextResponse.json(
        { error: "抱歉，无法生成该词语的解释，请尝试其他词语" },
        { status: 400 }
      );
    }

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("未收到有效的响应");

    let parsed: {
      explanation: string;
      pinyin: string;
      english: string;
      japanese: string;
    };
    try {
      const cleaned = text
        .replace(/^```json?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { explanation: text, pinyin: "", english: "", japanese: "" };
    }

    // 8. Generate SVG server-side
    const svgContent = generateSVGCard({
      word: trimmedWord,
      explanation: parsed.explanation,
      pinyin: parsed.pinyin,
      english: parsed.english,
      japanese: parsed.japanese,
    });

    // 9. Save card to database
    const db = getDb();
    const cardId = createId();
    await db.insert(cards).values({
      id: cardId,
      userId: session.user.id,
      word: trimmedWord,
      explanation: parsed.explanation,
      pinyin: parsed.pinyin || null,
      english: parsed.english || null,
      japanese: parsed.japanese || null,
      svgContent,
      isPublic: true,
    });

    // 10. Record usage
    await recordUsage(session.user.id);

    // 11. Return result with updated quota
    const updatedQuota = await checkQuota(
      session.user.id,
      session.user.tier ?? "free"
    );

    return NextResponse.json({
      id: cardId,
      result: parsed.explanation,
      pinyin: parsed.pinyin || "",
      english: parsed.english || "",
      japanese: parsed.japanese || "",
      svgContent,
      cached: false,
      quota: {
        dailyUsed: updatedQuota.dailyUsed,
        dailyLimit: updatedQuota.dailyLimit,
        monthlyUsed: updatedQuota.monthlyUsed,
        monthlyLimit: updatedQuota.monthlyLimit,
      },
    });
  } catch (error) {
    console.error("Generate Error:", error);
    return NextResponse.json(
      { error: "生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Install cuid2**

Run: `npm install @paralleldrive/cuid2`

- [ ] **Step 3: Commit**

```bash
git add app/api/generate/route.ts package.json package-lock.json
git commit -m "feat: refactor generate API with auth, quotas, DB persistence, and server-side SVG"
```

---

### Task 9: Create Card Management API Routes

**Files:**
- Create: `app/api/cards/[id]/route.ts`
- Create: `app/api/cards/mine/route.ts`
- Create: `app/api/gallery/route.ts`

- [ ] **Step 1: Create toggle card visibility endpoint**

Create `app/api/cards/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const { isPublic } = await req.json();
  const db = getDb();

  const [card] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, id), eq(cards.userId, session.user.id)));

  if (!card) {
    return NextResponse.json({ error: "卡片不存在" }, { status: 404 });
  }

  await db
    .update(cards)
    .set({ isPublic: Boolean(isPublic), updatedAt: new Date() })
    .where(eq(cards.id, id));

  return NextResponse.json({ success: true, isPublic: Boolean(isPublic) });
}
```

- [ ] **Step 2: Create my-cards endpoint**

Create `app/api/cards/mine/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getDb();
  const userCards = await db
    .select({
      id: cards.id,
      word: cards.word,
      explanation: cards.explanation,
      pinyin: cards.pinyin,
      svgContent: cards.svgContent,
      isPublic: cards.isPublic,
      createdAt: cards.createdAt,
    })
    .from(cards)
    .where(eq(cards.userId, session.user.id))
    .orderBy(desc(cards.createdAt));

  return NextResponse.json({ cards: userCards });
}
```

- [ ] **Step 3: Create gallery endpoint**

Create `app/api/gallery/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cards, users } from "@/lib/db/schema";
import { eq, desc, like, and, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const db = getDb();

  const conditions = [eq(cards.isPublic, true)];
  if (q) {
    conditions.push(like(cards.word, `%${q}%`));
  }

  const [countResult] = await db
    .select({ total: sql<number>`count(*)` })
    .from(cards)
    .where(and(...conditions));

  const results = await db
    .select({
      id: cards.id,
      word: cards.word,
      explanation: cards.explanation,
      pinyin: cards.pinyin,
      svgContent: cards.svgContent,
      createdAt: cards.createdAt,
      authorName: users.name,
    })
    .from(cards)
    .innerJoin(users, eq(cards.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(cards.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    cards: results,
    total: Number(countResult?.total ?? 0),
    page,
    totalPages: Math.ceil(Number(countResult?.total ?? 0) / limit),
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/api/cards/" "app/api/gallery/"
git commit -m "feat: add card management and gallery API routes"
```

---

### Task 10: Update CardGenerator with Quota Display

**Files:**
- Create: `components/QuotaDisplay.tsx`
- Modify: `components/CardGenerator.tsx`

- [ ] **Step 1: Create QuotaDisplay component**

Create `components/QuotaDisplay.tsx`:
```typescript
"use client";

import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface QuotaDisplayProps {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
}

export default function QuotaDisplay({
  dailyUsed,
  dailyLimit,
  monthlyUsed,
  monthlyLimit,
}: QuotaDisplayProps) {
  const dailyProgress = (dailyUsed / dailyLimit) * 100;
  const monthlyProgress = (monthlyUsed / monthlyLimit) * 100;
  const dailyRemaining = dailyLimit - dailyUsed;
  const isLow = dailyRemaining <= 1 && dailyRemaining > 0;
  const isExhausted = dailyRemaining <= 0 || monthlyUsed >= monthlyLimit;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500">
          <span>今日</span>
          <span>
            {dailyUsed}/{dailyLimit}
          </span>
        </div>
        <Progress value={dailyProgress} className="h-1.5" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500">
          <span>本月</span>
          <span>
            {monthlyUsed}/{monthlyLimit}
          </span>
        </div>
        <Progress value={monthlyProgress} className="h-1.5" />
      </div>
      {isLow && !isExhausted && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            今日剩余 {dailyRemaining} 次生成机会
          </AlertDescription>
        </Alert>
      )}
      {isExhausted && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {monthlyUsed >= monthlyLimit
              ? "本月配额已用完，下月再来吧！"
              : "今日配额已用完，明天再来吧！"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update CardGenerator to use quota and handle new API response**

Replace `components/CardGenerator.tsx`:
```typescript
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ResultCard from "./ResultCard";
import QuotaDisplay from "./QuotaDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { getErrorMessage, validateWord } from "@/lib/errors";
import {
  cardVariants,
  formVariants,
  buttonHoverVariants,
} from "@/lib/animations";
import DeveloperSection from "./DeveloperSection";

interface QuotaInfo {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
}

const HanyuCardGenerator = () => {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    explanation: string;
    pinyin: string;
    english: string;
    japanese: string;
    svgContent: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [quota, setQuota] = useState<QuotaInfo>({
    dailyUsed: 0,
    dailyLimit: 3,
    monthlyUsed: 0,
    monthlyLimit: 30,
  });

  const isExhausted =
    quota.dailyUsed >= quota.dailyLimit ||
    quota.monthlyUsed >= quota.monthlyLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateWord(word);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.quota) setQuota(data.quota);
        throw new Error(data.error || "生成失败，请稍后重试");
      }

      setResult({
        id: data.id,
        explanation: data.result,
        pinyin: data.pinyin || "",
        english: data.english || "",
        japanese: data.japanese || "",
        svgContent: data.svgContent || "",
      });
      if (data.quota) setQuota(data.quota);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:py-12 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="shadow-lg">
            <CardHeader className="space-y-2 px-4 sm:px-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardTitle className="text-center text-2xl sm:text-3xl font-bold break-words">
                  汉语新解卡片生成器
                </CardTitle>
                <p className="text-center text-sm text-slate-500 mt-2">
                  用现代视角重新诠释汉语词汇
                </p>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6">
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-4"
                variants={formVariants}
              >
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="输入想要重新诠释的汉语词汇..."
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    className="w-full py-4 sm:py-6 text-base sm:text-lg"
                    maxLength={10}
                    disabled={loading}
                  />
                  <AnimatePresence>
                    {word.length > 0 && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm text-slate-400"
                      >
                        {word.length}/10
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  variants={buttonHoverVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    type="submit"
                    className="w-full py-4 sm:py-6 text-base sm:text-lg"
                    disabled={loading || !word.trim() || isExhausted}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        正在生成新解...
                      </>
                    ) : isExhausted ? (
                      "配额已用完"
                    ) : (
                      "生成新解卡片"
                    )}
                  </Button>
                </motion.div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <QuotaDisplay
                  dailyUsed={quota.dailyUsed}
                  dailyLimit={quota.dailyLimit}
                  monthlyUsed={quota.monthlyUsed}
                  monthlyLimit={quota.monthlyLimit}
                />
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert variant="destructive" className="text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {result !== null && (
                  <motion.div
                    key="result"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={cardVariants}
                  >
                    <ResultCard
                      word={word}
                      explanation={result.explanation}
                      pinyin={result.pinyin}
                      english={result.english}
                      japanese={result.japanese}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <DeveloperSection />
        </motion.div>
      </div>
    </div>
  );
};

export default HanyuCardGenerator;
```

- [ ] **Step 3: Commit**

```bash
git add components/QuotaDisplay.tsx components/CardGenerator.tsx
git commit -m "feat: update CardGenerator with quota display and new API response format"
```

---

### Task 11: Build Gallery Page

**Files:**
- Create: `components/CardThumbnail.tsx`
- Create: `components/GalleryGrid.tsx`
- Create: `app/gallery/page.tsx`

- [ ] **Step 1: Create CardThumbnail component**

Create `components/CardThumbnail.tsx`:
```typescript
"use client";

import { motion } from "framer-motion";

interface CardThumbnailProps {
  word: string;
  explanation: string;
  svgContent: string;
  authorName: string;
  createdAt: string;
}

export default function CardThumbnail({
  word,
  explanation,
  svgContent,
  authorName,
  createdAt,
}: CardThumbnailProps) {
  return (
    <motion.div
      className="break-inside-avoid mb-4 bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div
        className="w-full"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      <div className="p-3">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>{authorName}</span>
          <span>{new Date(createdAt).toLocaleDateString("zh-CN")}</span>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create GalleryGrid component**

Create `components/GalleryGrid.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import CardThumbnail from "./CardThumbnail";

interface GalleryCard {
  id: string;
  word: string;
  explanation: string;
  svgContent: string;
  authorName: string;
  createdAt: string;
}

export default function GalleryGrid() {
  const [cards, setCards] = useState<GalleryCard[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCards = async (q: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));

    const res = await fetch(`/api/gallery?${params}`);
    const data = await res.json();
    setCards(p === 1 ? data.cards : [...cards, ...data.cards]);
    setTotalPages(data.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    fetchCards("", 1);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCards(search, 1);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchCards(search, next);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="搜索词语..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          搜索
        </Button>
      </form>

      {loading && cards.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          暂无卡片
        </div>
      ) : (
        <>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {cards.map((card) => (
              <CardThumbnail
                key={card.id}
                word={card.word}
                explanation={card.explanation}
                svgContent={card.svgContent}
                authorName={card.authorName}
                createdAt={card.createdAt}
              />
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                加载更多
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create gallery page**

Create `app/gallery/page.tsx`:
```typescript
import GalleryGrid from "@/components/GalleryGrid";

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">卡片画廊</h1>
          <p className="text-center text-slate-500 mb-8">
            探索大家创作的汉语新解卡片
          </p>
          <GalleryGrid />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/CardThumbnail.tsx components/GalleryGrid.tsx app/gallery/
git commit -m "feat: add public gallery with masonry grid and search"
```

---

### Task 12: Build User Account & My Cards Pages

**Files:**
- Create: `app/(protected)/account/page.tsx`
- Create: `app/(protected)/account/cards/page.tsx`

- [ ] **Step 1: Create account settings page**

Create `app/(protected)/account/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession, authClient } from "@/lib/auth-client";
import { Loader2, CheckCircle } from "lucide-react";

export default function AccountPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    await authClient.updateUser({ name });
    setSuccess("用户名已更新");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto space-y-6">
          <h1 className="text-2xl font-bold">账户设置</h1>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">个人信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-500">邮箱</label>
                <div className="flex items-center gap-2">
                  <Input value={session?.user?.email || ""} disabled />
                  {session?.user?.emailVerified && (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  )}
                </div>
              </div>
              <form onSubmit={handleUpdateName} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm text-slate-500">用户名</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} size="sm">
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  保存
                </Button>
              </form>
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">修改密码</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (session?.user?.email) {
                    await authClient.forgetPassword({
                      email: session.user.email,
                      redirectTo: "/login",
                    });
                    setSuccess("密码重置邮件已发送，请检查邮箱");
                  }
                }}
              >
                发送密码重置邮件
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create my cards management page**

Create `app/(protected)/account/cards/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff, Download } from "lucide-react";

interface UserCard {
  id: string;
  word: string;
  explanation: string;
  pinyin: string | null;
  svgContent: string;
  isPublic: boolean;
  createdAt: string;
}

export default function MyCardsPage() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cards/mine")
      .then((res) => res.json())
      .then((data) => {
        setCards(data.cards);
        setLoading(false);
      });
  }, []);

  const toggleVisibility = async (id: string, isPublic: boolean) => {
    setTogglingId(id);
    const res = await fetch(`/api/cards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    const data = await res.json();
    if (data.success) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, isPublic: data.isPublic } : c
        )
      );
    }
    setTogglingId(null);
  };

  const downloadSvg = (card: UserCard) => {
    const blob = new Blob([card.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.word}-汉语新解.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">我的卡片</h1>

          {cards.length === 0 ? (
            <p className="text-center text-slate-400 py-20">
              还没有生成过卡片
            </p>
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <Card key={card.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-lg">{card.word}</div>
                      <div className="text-sm text-slate-500 truncate">
                        {card.explanation}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(card.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleVisibility(card.id, card.isPublic)
                        }
                        disabled={togglingId === card.id}
                        title={card.isPublic ? "设为隐藏" : "设为公开"}
                      >
                        {togglingId === card.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : card.isPublic ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadSvg(card)}
                        title="下载 SVG"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/account/"
git commit -m "feat: add account settings and my cards management pages"
```

---

### Task 13: Update Cloudflare Workers Config for Compatibility

**Files:**
- Modify: `open-next.config.ts`
- Modify: `wrangler.toml`
- Modify: `next.config.ts`

- [ ] **Step 1: Update open-next config to support Better Auth**

Replace `open-next.config.ts`:
```typescript
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto", "node:buffer"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
```

- [ ] **Step 2: Update wrangler.toml with compatibility flags**

Replace `wrangler.toml`:
```toml
account_id = "c87dca24333f7ed5d643f731f6308fec"
name = "chinese-redefine"
main = ".open-next/worker.js"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

assets = { directory = ".open-next/assets", binding = "ASSETS" }

[vars]
BETTER_AUTH_URL = "https://your-production-domain.com"
NEXT_PUBLIC_BETTER_AUTH_URL = "https://your-production-domain.com"
```

- [ ] **Step 3: Update next.config.ts for serverless compatibility**

Replace `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@neondatabase/serverless"],
};

export default nextConfig;
```

- [ ] **Step 4: Verify build succeeds**

Run: `npm run build`
Expected: Build completes without errors

- [ ] **Step 5: Commit**

```bash
git add open-next.config.ts wrangler.toml next.config.ts
git commit -m "feat: update Cloudflare Workers config for Better Auth and Neon compatibility"
```

---

### Task 14: End-to-End Verification

- [ ] **Step 1: Start dev server and verify full flow**

Run: `npm run dev`

Test checklist:
1. Visit `/` → should redirect to `/login`
2. Visit `/gallery` → should load (public, no auth)
3. Register a new account at `/register` → check email from Resend
4. Click verify link → redirected to `/`
5. Generate a card → see result + quota display "1/3 today"
6. Visit `/gallery` → new card appears
7. Visit `/account/cards` → card listed with visibility toggle
8. Toggle card to hidden → disappears from gallery
9. Generate 2 more cards → button shows "配额已用完"
10. Visit `/account` → name/email displayed, can update name

- [ ] **Step 2: Test social login**

1. Click "GitHub" on login page → redirected to GitHub OAuth
2. Authorize → redirected back, logged in
3. Email auto-verified → can generate cards

- [ ] **Step 3: Test Cloudflare Workers build**

Run: `npm run build:worker`
Expected: Build completes. Check `.open-next/` directory exists.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete backend, auth, quotas, and gallery implementation"
```
