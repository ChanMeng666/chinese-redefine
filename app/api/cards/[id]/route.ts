import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const { isPublic } = await req.json();
  const db = getDb();

  const [card] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, id), eq(cards.userId, session.user.id)));

  if (!card) {
    return NextResponse.json({ error: "卡片不存在" }, { status: 404 });
  }

  await db
    .update(cards)
    .set({ isPublic: Boolean(isPublic), updatedAt: new Date() })
    .where(eq(cards.id, id));

  return NextResponse.json({ success: true, isPublic: Boolean(isPublic) });
}
