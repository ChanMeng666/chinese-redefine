"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, ImageIcon, AlertCircle } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-border/50 bg-[hsl(var(--paper))]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-display text-xl tracking-wider text-ink hover:text-ink/80 transition-colors"
          >
            汉语新解
          </Link>
          <Link
            href="/gallery"
            className={`text-sm flex items-center gap-1.5 transition-colors relative ${
              isActive("/gallery")
                ? "text-ink"
                : "text-ink-light hover:text-ink"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            画廊
            {isActive("/gallery") && (
              <span className="absolute -bottom-[1.19rem] left-0 right-0 h-px bg-vermillion" />
            )}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              {!session.user.emailVerified && (
                <Link
                  href="/verify-email"
                  className="text-xs text-vermillion hover:text-vermillion/80 flex items-center gap-1 transition-colors"
                >
                  <AlertCircle className="h-3 w-3" />
                  验证邮箱
                </Link>
              )}
              <Link
                href="/account/cards"
                className={`text-sm flex items-center gap-1.5 transition-colors ${
                  pathname.startsWith("/account")
                    ? "text-ink"
                    : "text-ink-light hover:text-ink"
                }`}
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
