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
