"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const { data: session, isPending } = useSession();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Get email from session or URL params
  const email = session?.user?.email || searchParams.get("email") || "";

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
    if (!email) {
      setError("无法获取邮箱地址，请返回注册页重试");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp: code.trim(),
      });
      if (result.error) {
        setError(result.error.message || "验证失败，请检查验证码是否正确");
      } else {
        setSuccess("verified");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`验证失败: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("无法获取邮箱地址");
      return;
    }
    setResending(true);
    setError("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
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

  if (success === "verified") {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-10 space-y-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">邮箱验证成功！</h2>
            <p className="text-slate-500 mt-2">
              你的邮箱 <span className="font-medium text-slate-700">{email}</span> 已通过验证。
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-500">请使用注册时的邮箱和密码登录</p>
            <Button
              className="w-full"
              onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)}
            >
              前往登录
            </Button>
          </div>
        </CardContent>
      </Card>
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
          <span className="font-medium">{email || "你的邮箱"}</span>{" "}
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
