export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number = 500) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export const validateWord = (word: string): string | null => {
    if (!word) {
        return '请输入要解释的词语';
    }

    if (word.length > 10) {
        return '词语长度不能超过10个字符';
    }

    // 验证是否包含汉字
    if (!/[\u4e00-\u9fa5]/.test(word)) {
        return '请输入包含汉字的词语';
    }

    // 验证是否包含特殊字符
    if (/[<>{}[\]\\\/]/.test(word)) {
        return '词语不能包含特殊字符';
    }

    return null;
};

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof ValidationError) {
        return error.message;
    }

    if (error instanceof ApiError) {
        switch (error.status) {
            case 429:
                return '请求过于频繁，请稍后再试';
            case 401:
                return 'API密钥无效，请联系管理员';
            case 503:
                return '服务暂时不可用，请稍后再试';
            default:
                return error.message || '服务器错误，请稍后重试';
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return '发生未知错误';
};
