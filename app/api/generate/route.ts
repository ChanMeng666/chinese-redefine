import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { validateWord } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { cards } from "@/lib/db/schema";
import { generateSVGCard } from "@/lib/svgGenerator";
import { checkQuota, recordUsage, findCachedCard } from "@/lib/rate-limit";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const { data: session } = await auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (!session.user.emailVerified) {
      return NextResponse.json(
        { error: "请先验证邮箱" },
        { status: 403 }
      );
    }

    const { word } = await req.json();

    // 3. Validate input
    const validationError = validateWord(word);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const trimmedWord = word.trim();

    // 4. Check duplicate word cache (24h)
    const cached = await findCachedCard(session.user.id, trimmedWord);
    if (cached) {
      const quota = await checkQuota(session.user.id, "free");
      return NextResponse.json({
        id: cached.id,
        result: cached.explanation,
        pinyin: cached.pinyin || "",
        english: cached.english || "",
        japanese: cached.japanese || "",
        svgContent: cached.svgContent,
        cached: true,
        quota: {
          dailyUsed: quota.dailyUsed,
          dailyLimit: quota.dailyLimit,
          monthlyUsed: quota.monthlyUsed,
          monthlyLimit: quota.monthlyLimit,
        },
      });
    }

    // 5. Check quotas
    const quota = await checkQuota(session.user.id, "free");
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: quota.reason,
          quota: {
            dailyUsed: quota.dailyUsed,
            dailyLimit: quota.dailyLimit,
            monthlyUsed: quota.monthlyUsed,
            monthlyLimit: quota.monthlyLimit,
          },
        },
        { status: 429 }
      );
    }

    // 6. Check API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API密钥未配置" },
        { status: 500 }
      );
    }

    // 7. Call OpenAI
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4o-mini",
          temperature: 0.85,
          max_tokens: 500,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `;; 作者: 李继刚
;; 版本: 0.1
;; 用途: 将一个汉语词汇进行全新角度的解释

(defun 新汉语老师 ()
"你是年轻人,批判现实,思考深刻,语言风趣"
  (风格 . ("Oscar Wilde" "鲁迅" "林语堂"))
  (擅长 . 一针见血)
  (表达 . 隐喻)
  (批判 . 讽刺幽默))

(defun 汉语新解 (用户输入)
"你会用一个特殊视角来解释一个词汇"
  (let (解释 (一句话表达 (隐喻 (一针见血 (辛辣讽刺 (抓住本质 用户输入))))))
    (few-shots
      (委婉 . "刺向他人时, 决定在剑刃上撒上止痛药。")
      (自由 . "在笼子里选择待在哪个角落的权利。")
      (成熟 . "学会在刀尖上微笑的过程。")
      (人脉 . "把自己变成一张被人翻来翻去的名片。"))
    (输出 (json
      {"explanation": 解释
       "pinyin": (拼音 用户输入)
       "english": (英译 用户输入)
       "japanese": (日译 用户输入)}))))

(defun start ()
  (let (system-role 新汉语老师)
    (print "说吧, 他们又用哪个词来忽悠你了?")))

;; 运行规则
;; 1. 启动时必须运行 (start) 函数
;; 2. 之后调用主函数 (汉语新解 用户输入)
;; 3. 只输出 JSON，不要输出其他任何内容`,
            },
            { role: "user", content: trimmedWord },
          ],
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 401)
        return NextResponse.json({ error: "API密钥无效" }, { status: 401 });
      if (status === 429)
        return NextResponse.json(
          { error: "API 调用配额已用完，请稍后重试" },
          { status: 429 }
        );
      throw new Error(`OpenAI API returned ${status}`);
    }

    const data = await response.json();

    if (data.choices?.[0]?.finish_reason === "content_filter") {
      return NextResponse.json(
        { error: "抱歉，无法生成该词语的解释，请尝试其他词语" },
        { status: 400 }
      );
    }

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("未收到有效的响应");

    let parsed: {
      explanation: string;
      pinyin: string;
      english: string;
      japanese: string;
    };
    try {
      const cleaned = text
        .replace(/^```json?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { explanation: text, pinyin: "", english: "", japanese: "" };
    }

    // 8. Generate SVG server-side
    const svgContent = generateSVGCard({
      word: trimmedWord,
      explanation: parsed.explanation,
      pinyin: parsed.pinyin,
      english: parsed.english,
      japanese: parsed.japanese,
    });

    // 9. Save card to database
    const db = getDb();
    const cardId = createId();
    await db.insert(cards).values({
      id: cardId,
      userId: session.user.id,
      word: trimmedWord,
      explanation: parsed.explanation,
      pinyin: parsed.pinyin || null,
      english: parsed.english || null,
      japanese: parsed.japanese || null,
      svgContent,
      isPublic: true,
    });

    // 10. Record usage
    await recordUsage(session.user.id);

    // 11. Return result with updated quota
    const updatedQuota = await checkQuota(
      session.user.id,
      "free"
    );

    return NextResponse.json({
      id: cardId,
      result: parsed.explanation,
      pinyin: parsed.pinyin || "",
      english: parsed.english || "",
      japanese: parsed.japanese || "",
      svgContent,
      cached: false,
      quota: {
        dailyUsed: updatedQuota.dailyUsed,
        dailyLimit: updatedQuota.dailyLimit,
        monthlyUsed: updatedQuota.monthlyUsed,
        monthlyLimit: updatedQuota.monthlyLimit,
      },
    });
  } catch (error) {
    console.error("Generate Error:", error);
    return NextResponse.json(
      { error: "生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
