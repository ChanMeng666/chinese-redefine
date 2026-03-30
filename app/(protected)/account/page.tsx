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
    <main className="min-h-screen bg-paper">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto space-y-6">
          <h1 className="font-display text-2xl text-ink tracking-wide">
            账户设置
          </h1>

          <Card>
            <CardHeader>
              <CardTitle className="font-cn-serif text-lg text-ink">
                个人信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-ink-light">邮箱</label>
                <div className="flex items-center gap-2">
                  <Input value={session?.user?.email || ""} disabled />
                  {session?.user?.emailVerified && (
                    <CheckCircle className="h-5 w-5 text-jade shrink-0" />
                  )}
                </div>
              </div>
              <form onSubmit={handleUpdateName} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm text-ink-light">用户名</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} size="sm">
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  保存
                </Button>
              </form>
              {success && (
                <Alert className="border-jade/30 bg-jade/5 text-jade">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-cn-serif text-lg text-ink">
                修改密码
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (session?.user?.email) {
                    await authClient.requestPasswordReset({
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
