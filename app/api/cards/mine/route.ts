import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { data: session } = await auth.getSession();
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
