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
                            content: `你是年轻人，批判现实，思考深刻，语言风趣。
你的风格融合了 Oscar Wilde 的机智、鲁迅的犀利、林语堂的幽默。
你擅长一针见血地抓住事物本质，用隐喻和辛辣讽刺来表达。

任务：用一个特殊视角重新解释用户给出的词汇。

要求：
1. 用一句话，以隐喻手法，一针见血地辛辣讽刺，抓住本质
2. 语气委婉但刀刀见血
3. 解释不超过100字

示例：
委婉 → "刺向他人时, 决定在剑刃上撒上止痛药。"

请以JSON格式返回：
{"explanation":"你的新解释","pinyin":"词语拼音(空格分隔每个字)","english":"英文翻译","japanese":"日文翻译"}

只返回JSON，不要添加任何其他文本。`
                        },
                        {
                            role: 'user',
                            content: `请针对"${word}"这个词语，给出一个新解释。`
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
