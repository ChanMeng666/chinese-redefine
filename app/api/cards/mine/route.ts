import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const db = getDb();
  const userCards = await db
    .select({
      id: cards.id,
      word: cards.word,
      explanation: cards.explanation,
      pinyin: cards.pinyin,
      svgContent: cards.svgContent,
      isPublic: cards.isPublic,
      createdAt: cards.createdAt,
    })
    .from(cards)
    .where(eq(cards.userId, session.user.id))
    .orderBy(desc(cards.createdAt));

  return NextResponse.json({ cards: userCards });
}
