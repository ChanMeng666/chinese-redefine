"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const { data: session, isPending } = useSession();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // If already verified, redirect to home
  useEffect(() => {
    if (session?.user?.emailVerified) {
      router.push("/");
    }
  }, [session, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("请输入验证码");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email: session?.user?.email || "",
        otp: code.trim(),
      });
      if (result.error) {
        setError(result.error.message || "验证失败，请检查验证码是否正确");
      } else {
        setSuccess("邮箱验证成功！正在跳转...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      }
    } catch {
      setError("验证失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: session?.user?.email || "",
        type: "email-verification",
      });
      if (result.error) {
        setError(result.error.message || "发送失败，请稍后重试");
      } else {
        setSuccess("验证码已重新发送，请检查邮箱");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("发送失败，请稍后重试");
    } finally {
      setResending(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl">验证邮箱</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-slate-600">
          我们已向{" "}
          <span className="font-medium">
            {session?.user?.email || "你的邮箱"}
          </span>{" "}
          发送了 6 位验证码。
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <Input
            type="text"
            placeholder="输入 6 位验证码"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="text-center text-2xl tracking-[0.5em] font-mono"
            maxLength={6}
            autoFocus
          />
          <Button
            type="submit"
            className="w-full"
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            验证
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
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="text-center">
          <Button
            variant="link"
            onClick={handleResend}
            disabled={resending}
            className="text-sm"
          >
            {resending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            重新发送验证码
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
