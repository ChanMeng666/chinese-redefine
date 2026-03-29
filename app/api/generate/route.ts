import { NextResponse } from 'next/server';
import { validateWord } from '@/lib/errors';
import { headers } from 'next/headers';

// 速率限制状态
const RATE_LIMIT = {
    windowMs: 60 * 1000,
    maxRequests: 5,
    requests: new Map<string, { count: number; timestamp: number }>()
};

// 清理过期的速率限制记录
const cleanupRateLimits = () => {
    const now = Date.now();
    for (const [ip, data] of RATE_LIMIT.requests.entries()) {
        if (now - data.timestamp > RATE_LIMIT.windowMs) {
            RATE_LIMIT.requests.delete(ip);
        }
    }
};

// 检查速率限制
const checkRateLimit = (ip: string): boolean => {
    cleanupRateLimits();

    const now = Date.now();
    const requestData = RATE_LIMIT.requests.get(ip);

    if (!requestData) {
        RATE_LIMIT.requests.set(ip, { count: 1, timestamp: now });
        return true;
    }

    if (now - requestData.timestamp > RATE_LIMIT.windowMs) {
        RATE_LIMIT.requests.set(ip, { count: 1, timestamp: now });
        return true;
    }

    if (requestData.count >= RATE_LIMIT.maxRequests) {
        return false;
    }

    requestData.count += 1;
    return true;
};

export async function POST(req: Request) {
    try {
        // 获取客户端IP
        const headersList = await headers();
        const ip = headersList.get('cf-connecting-ip') || headersList.get('x-forwarded-for') || 'unknown';

        // 检查速率限制
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: '请求过于频繁，请稍后再试' },
                { status: 429 }
            );
        }

        const { word } = await req.json();

        // 验证输入
        const validationError = validateWord(word);
        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: 400 }
            );
        }

        // 检查API密钥
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'API密钥未配置' },
                { status: 500 }
            );
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: process.env.AI_MODEL || 'gpt-4o-mini',
                    temperature: 0.85,
                    max_tokens: 500,
                    response_format: { type: 'json_object' },
                    messages: [
                        {
                            role: 'system',
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
;; 3. 只输出 JSON，不要输出其他任何内容`
                        },
                        {
                            role: 'user',
                            content: `${word}`
                        }
                    ]
                }),
            });

            if (!response.ok) {
                const status = response.status;
                if (status === 401) {
                    return NextResponse.json(
                        { error: 'API密钥无效' },
                        { status: 401 }
                    );
                }
                if (status === 429) {
                    return NextResponse.json(
                        { error: 'API 调用配额已用完，请稍后重试' },
                        { status: 429 }
                    );
                }
                throw new Error(`OpenAI API returned ${status}`);
            }

            const data = await response.json();

            // 检查内容过滤
            if (data.choices?.[0]?.finish_reason === 'content_filter') {
                return NextResponse.json(
                    { error: '抱歉，无法生成该词语的解释，请尝试其他词语' },
                    { status: 400 }
                );
            }

            const text = data.choices?.[0]?.message?.content?.trim();

            if (!text) {
                throw new Error('未收到有效的响应');
            }

            // 解析结构化JSON响应
            let parsed: { explanation: string; pinyin: string; english: string; japanese: string };
            try {
                const cleaned = text.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '');
                parsed = JSON.parse(cleaned);
            } catch {
                // fallback: 整段文本作为explanation
                parsed = { explanation: text, pinyin: '', english: '', japanese: '' };
            }

            return NextResponse.json({
                result: parsed.explanation,
                pinyin: parsed.pinyin || '',
                english: parsed.english || '',
                japanese: parsed.japanese || '',
                remaining: RATE_LIMIT.maxRequests - (RATE_LIMIT.requests.get(ip)?.count || 0)
            });

        } catch (error) {
            console.error('OpenAI API Error:', error);
            return NextResponse.json(
                { error: '生成失败，请稍后重试' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: '服务器错误，请稍后重试' },
            { status: 500 }
        );
    }
}
