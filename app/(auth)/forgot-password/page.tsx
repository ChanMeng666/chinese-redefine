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
