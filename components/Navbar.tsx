"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut, User, ImageIcon, AlertCircle } from "lucide-react";

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
              {!session.user.emailVerified && (
                <Link
                  href="/verify-email"
                  className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  验证邮箱
                </Link>
              )}
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
