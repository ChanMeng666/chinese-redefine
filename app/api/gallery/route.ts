import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq, desc, like, and, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const db = getDb();

  const conditions = [eq(cards.isPublic, true)];
  if (q) {
    conditions.push(like(cards.word, `%${q}%`));
  }

  const [countResult] = await db
    .select({ total: sql<number>`count(*)` })
    .from(cards)
    .where(and(...conditions));

  const results = await db
    .select({
      id: cards.id,
      word: cards.word,
      explanation: cards.explanation,
      pinyin: cards.pinyin,
      svgContent: cards.svgContent,
      createdAt: cards.createdAt,
    })
    .from(cards)
    .where(and(...conditions))
    .orderBy(desc(cards.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    cards: results,
    total: Number(countResult?.total ?? 0),
    page,
    totalPages: Math.ceil(Number(countResult?.total ?? 0) / limit),
  });
}
