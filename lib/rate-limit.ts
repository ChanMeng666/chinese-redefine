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
