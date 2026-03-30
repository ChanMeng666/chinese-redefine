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
