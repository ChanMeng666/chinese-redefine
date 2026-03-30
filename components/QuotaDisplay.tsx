"use client";

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
  const dailyRemaining = dailyLimit - dailyUsed;
  const isLow = dailyRemaining <= 1 && dailyRemaining > 0;
  const isExhausted = dailyRemaining <= 0 || monthlyUsed >= monthlyLimit;

  if (isExhausted) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          {monthlyUsed >= monthlyLimit
            ? "本月配额已用完，下月再来吧！"
            : "今日配额已用完，明天再来吧！"}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLow) {
    return (
      <div className="space-y-3">
        <div className="text-center text-xs text-ink-light">
          今日 {dailyUsed}/{dailyLimit} · 本月 {monthlyUsed}/{monthlyLimit}
        </div>
        <Alert className="border-l-2 border-l-vermillion/40">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            今日剩余 {dailyRemaining} 次生成机会
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="text-center text-xs text-ink-light/60">
      今日 {dailyUsed}/{dailyLimit} · 本月 {monthlyUsed}/{monthlyLimit}
    </div>
  );
}
