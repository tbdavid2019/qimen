const axios = require('axios');

const ANSWERBOOK_API_URL = 'https://answerbook.david888.com/answersOriginal';

function inputError(message, code = 'INVALID_INPUT', field = null) {
    const error = new Error(message);
    error.statusCode = 400;
    error.code = code;
    error.field = field;
    return error;
}

function normalizeAnswerbookInput(body = {}) {
    const source = body && typeof body === 'object' ? body : {};
    const question = typeof source.question === 'string' ? source.question.trim() : '';
    const mode = source.mode || (question ? 'question' : 'direct');
    if (!['direct', 'question'].includes(mode)) {
        throw inputError('解答之書模式必須是 direct 或 question', 'INVALID_MODE', 'mode');
    }
    if (mode === 'question' && !question) {
        throw inputError('問題模式需要提供 question', 'MISSING_QUESTION', 'question');
    }
    const normalized = { ...source, mode };
    if (question) normalized.question = question;
    else delete normalized.question;
    return normalized;
}

class AnswerBookClient {
    constructor({ url = ANSWERBOOK_API_URL, request = null, timeout = 10000 } = {}) {
        this.url = url;
        this.timeout = timeout;
        this.request = request || ((endpoint, config) => axios.get(endpoint, config));
    }

    async getOriginalAnswer() {
        let response;
        try {
            response = await this.request(this.url, {
                timeout: this.timeout,
                headers: { Accept: 'application/json' }
            });
        } catch (cause) {
            const detail = cause?.message || String(cause);
            const error = new Error(`解答之書上游服務無法取得答案：${detail}`);
            error.statusCode = 502;
            error.code = 'ANSWERBOOK_UPSTREAM_ERROR';
            error.cause = cause;
            throw error;
        }

        const raw = response?.data;
        const answer = typeof raw === 'string' ? raw : raw?.answer;
        if (typeof answer !== 'string' || !answer.trim()) {
            const error = new Error('解答之書上游回應缺少 answer');
            error.statusCode = 502;
            error.code = 'ANSWERBOOK_INVALID_RESPONSE';
            throw error;
        }
        return { answer: answer.trim(), raw };
    }
}

function extractAnalysis(analysisResult) {
    if (!analysisResult) return '';
    if (typeof analysisResult === 'string') return analysisResult.trim();
    return String(analysisResult.analysis || analysisResult.fallback || '').trim();
}

function createAnswerbookQuestionHandler({ client, analyze, discord } = {}) {
    if (!client || typeof client.getOriginalAnswer !== 'function') throw new TypeError('client 必須提供 getOriginalAnswer');

    return async function answerbookQuestionHandler(req, res) {
        let input;
        try {
            const payload = { ...(req?.query || {}), ...(req?.body || {}) };
            input = normalizeAnswerbookInput(payload);
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: '參數驗證失敗',
                message: error.message,
                code: error.code,
                field: error.field
            });
        }

        let original;
        try {
            original = await client.getOriginalAnswer();
        } catch (error) {
            const status = error.statusCode === 502 ? 502 : 500;
            return res.status(status).json({
                success: false,
                error: '解答之書上游服務錯誤',
                message: error.message,
                code: error.code || 'ANSWERBOOK_ERROR',
                timestamp: new Date().toISOString()
            });
        }

        const result = {
            mode: input.mode,
            answer: original.answer,
            rawAnswer: original.raw
        };
        let analysisResult = null;
        if (input.mode === 'question' && typeof analyze === 'function') {
            try {
                analysisResult = await analyze(result, {
                    purpose: typeof input.purpose === 'string' && input.purpose.trim() ? input.purpose.trim() : '綜合',
                    userQuestion: input.question,
                    conversationHistory: Array.isArray(input.conversationHistory) ? input.conversationHistory : [],
                    language: input.lang === 'zh-cn' ? 'zh-cn' : 'zh-tw'
                });
            } catch (error) {
                analysisResult = { success: false, error: error.message, fallback: '' };
            }
        }

        const analysis = extractAnalysis(analysisResult) || null;
        let discordResult = { success: false, reason: 'Discord webhook not configured' };
        if (discord && typeof discord.sendDivinationRecord === 'function') {
            try {
                discordResult = await discord.sendDivinationRecord('解答之書', input, result, analysis || '');
            } catch (error) {
                discordResult = { success: false, reason: error.message };
            }
        }

        const language = input.lang === 'zh-cn' ? 'zh-cn' : 'zh-tw';
        const response = {
            success: true,
            mode: input.mode,
            question: input.question || null,
            answer: original.answer,
            rawAnswer: original.raw,
            result,
            analysis,
            analysisSuccess: input.mode === 'direct' ? null : analysisResult?.success !== false,
            metadata: {
                service: 'answerbook',
                provider: analysisResult?.provider || null,
                model: analysisResult?.model || null,
                language,
                apiVersion: '1.0'
            },
            discord: {
                recordSent: !!discordResult.success,
                enabled: !!(discord && typeof discord.isEnabled === 'function' && discord.isEnabled())
            },
            timestamp: new Date().toISOString()
        };
        if (analysisResult?.success === false) response.error = analysisResult.error || 'LLM 分析失敗';
        return res.json(response);
    };
}

module.exports = {
    ANSWERBOOK_API_URL,
    AnswerBookClient,
    createAnswerbookQuestionHandler,
    normalizeAnswerbookInput
};
