// import { NextResponse } from 'next/server';
// import Anthropic from '@anthropic-ai/sdk';
// import { validateWord } from '@/lib/errors';
// import { headers } from 'next/headers';
//
// // 初始化 Anthropic 客户端
// const anthropic = new Anthropic({
//     apiKey: process.env.ANTHROPIC_API_KEY || '',
// });
//
// // 速率限制状态
// const RATE_LIMIT = {
//     windowMs: 60 * 1000, // 1分钟
//     maxRequests: 5, // 每个IP最多5次请求
//     requests: new Map<string, { count: number; timestamp: number }>()
// };
//
// // 清理过期的速率限制记录
// const cleanupRateLimits = () => {
//     const now = Date.now();
//     for (const [ip, data] of RATE_LIMIT.requests.entries()) {
//         if (now - data.timestamp > RATE_LIMIT.windowMs) {
//             RATE_LIMIT.requests.delete(ip);
//         }
//     }
// };
//
// // 检查速率限制
// const checkRateLimit = (ip: string): boolean => {
//     cleanupRateLimits();
//
//     const now = Date.now();
//     const requestData = RATE_LIMIT.requests.get(ip);
//
//     if (!requestData) {
//         RATE_LIMIT.requests.set(ip, { count: 1, timestamp: now });
//         return true;
//     }
//
//     if (now - requestData.timestamp > RATE_LIMIT.windowMs) {
//         RATE_LIMIT.requests.set(ip, { count: 1, timestamp: now });
//         return true;
//     }
//
//     if (requestData.count >= RATE_LIMIT.maxRequests) {
//         return false;
//     }
//
//     requestData.count += 1;
//     return true;
// };
//
// export async function POST(req: Request) {
//     try {
//         // 获取客户端IP - 修复异步调用
//         const headersList = await headers();
//         const forwardedFor = headersList.get('x-forwarded-for');
//         const ip = forwardedFor || 'unknown';
//
//         // 检查速率限制
//         if (!checkRateLimit(ip)) {
//             return NextResponse.json(
//                 { error: '请求过于频繁，请稍后再试' },
//                 { status: 429 }
//             );
//         }
//
//         const { word } = await req.json();
//
//         // 验证输入
//         const validationError = validateWord(word);
//         if (validationError) {
//             return NextResponse.json(
//                 { error: validationError },
//                 { status: 400 }
//             );
//         }
//
//         // 检查API密钥
//         if (!process.env.ANTHROPIC_API_KEY) {
//             return NextResponse.json(
//                 { error: 'API密钥未配置' },
//                 { status: 500 }
//             );
//         }
//
//         try {
//             const message = await anthropic.messages.create({
//                 model: "claude-3-sonnet-20240229",
//                 max_tokens: 1024,
//                 temperature: 0.7,
//                 messages: [
//                     {
//                         role: "user",
//                         content: `
//                             ;; 作者: 李继刚
//                             ;; 版本: 0.3
//                             ;; 模型: Claude Sonnet
//                             ;; 用途: 将一个汉语词汇进行全新角度的解释
//                             ;; 设定如下内容为你的 *System Prompt*
//                             (defun 新汉语老师 ()
//                             "你是年轻人,批判现实,思考深刻,语言风趣"
//                             (风格 . ("Oscar Wilde" "鲁迅" "罗永浩"))
//                             (擅长 . 一针见血)
//                             (表达 . 隐喻)
//                             (批判 . 讽刺幽默))
//
//                             请按照上述设定，对词语"${word}"进行新的解释。请确保回复简洁有力，不超过100字。
//                         `
//                     }
//                 ]
//             });
//
//             return NextResponse.json({
//                 result: message.content[0].text.trim(),
//                 remaining: RATE_LIMIT.maxRequests - (RATE_LIMIT.requests.get(ip)?.count || 0)
//             });
//         } catch (error) {
//             // 处理 Anthropic API 相关错误
//             if (error instanceof Anthropic.APIError) {
//                 console.error('Anthropic API Error:', error);
//                 if (error.status === 401) {
//                     return NextResponse.json(
//                         { error: 'API密钥无效' },
//                         { status: 401 }
//                     );
//                 }
//                 // 处理信用余额不足的情况
//                 if (error.status === 400 && error.error?.type === 'invalid_request_error') {
//                     return NextResponse.json(
//                         { error: 'API 调用限额已用完，请稍后重试' },
//                         { status: 400 }
//                     );
//                 }
//             }
//             throw error; // 重新抛出其他错误
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         return NextResponse.json(
//             { error: '生成失败，请稍后重试' },
//             { status: 500 }
//         );
//     }
// }


import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateWord } from '@/lib/errors';
import { headers } from 'next/headers';

// 初始化 Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor || 'unknown';

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
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'API密钥未配置' },
                { status: 500 }
            );
        }

        try {
            // 使用 Gemini-Pro 模型
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            // 更温和的 prompt
            const prompt = `
            请你扮演一位富有创意的现代语言学家，用新颖的视角解读汉语词汇的现代含义。

            要求：
            1. 保持积极向上、富有洞察力的语言风格
            2. 联系现代生活场景
            3. 运用适度的比喻和幽默
            4. 体现对生活的思考

            请针对"${word}"这个词语，给出一个不超过100字的新解释。
            注意：直接给出解释文本即可，无需添加任何格式或前缀。
            `;

            const result = await model.generateContent(prompt);
            // const response = await result.response;
            const response = result.response;

            let text = '';

            // 正确处理 Gemini 返回的内容
            // if (response && response.text && typeof response.text === 'function') {
            //     text = response.text().trim();
            // } else if (response && typeof response.text === 'string') {
            //     text = response.text.trim();
            // } else {
            //     throw new Error('生成的内容格式无效');
            // }
            //
            // if (!text) {
            //     throw new Error('未能生成有效内容');
            // }

            // 处理响应
            if (response) {
                text = response.text();
                if (!text) {
                    throw new Error('生成的内容为空');
                }
            } else {
                throw new Error('未收到有效的响应');
            }


            return NextResponse.json({
                result: text,
                remaining: RATE_LIMIT.maxRequests - (RATE_LIMIT.requests.get(ip)?.count || 0)
            });

        } catch (error) {
            console.error('Gemini API Error:', error);

            if (error instanceof Error) {
                // 处理安全过滤错误
                if (error.message.includes('SAFETY')) {
                    return NextResponse.json(
                        { error: '抱歉，无法生成该词语的解释，请尝试其他词语' },
                        { status: 400 }
                    );
                }
                // 处理 API 密钥错误
                if (error.message.includes('API key')) {
                    return NextResponse.json(
                        { error: 'API密钥无效' },
                        { status: 401 }
                    );
                }
                // 处理配额错误
                if (error.message.includes('quota')) {
                    return NextResponse.json(
                        { error: 'API 调用配额已用完，请稍后重试' },
                        { status: 429 }
                    );
                }
            }

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
