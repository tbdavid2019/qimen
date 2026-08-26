/**
 * Shared one-shot flow for non-Qimen divination services.
 *
 * A service definition validates user input, calculates a deterministic result,
 * asks the shared LLM service for an interpretation, and stores one complete
 * record in Discord. The helper is intentionally dependency-injected so route
 * behavior can be tested without network calls.
 */

function validationError(message, code = 'INVALID_INPUT', field = null) {
    const error = new Error(message);
    error.statusCode = 400;
    error.code = code;
    error.field = field;
    return error;
}

function normalizeQuestion(body) {
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!question) throw validationError('question 參數是必需的且不能為空', 'MISSING_QUESTION', 'question');
    return question;
}

function getAnalysisText(analysisResult) {
    if (!analysisResult) return '';
    if (typeof analysisResult === 'string') return analysisResult.trim();
    return String(analysisResult.analysis || analysisResult.fallback || '').trim();
}

function makeErrorResponse(error, fallback = undefined) {
    const statusCode = error?.statusCode === 400 ? 400 : 500;
    const response = {
        success: false,
        error: statusCode === 400 ? '參數驗證失敗' : '服務處理失敗',
        message: error?.message || '服務處理失敗',
        code: error?.code,
        field: error?.field
    };
    if (fallback !== undefined) response.fallback = fallback;
    return { statusCode, response };
}

function createServiceQuestionHandler({
    moduleName,
    resultKey = 'result',
    validate = (body) => body,
    calculate,
    analyze,
    discord
} = {}) {
    if (typeof calculate !== 'function') throw new TypeError('calculate 必須是函式');
    if (typeof analyze !== 'function') throw new TypeError('analyze 必須是函式');

    return async function serviceQuestionHandler(req, res) {
        const body = req?.body && typeof req.body === 'object' ? req.body : {};
        let question;
        let result;

        try {
            question = normalizeQuestion(body);
            const input = validate(body);
            result = await calculate(input);
        } catch (error) {
            const { statusCode, response } = makeErrorResponse(error);
            return res.status(statusCode).json(response);
        }

        let analysisResult;
        try {
            analysisResult = await analyze(result, {
                purpose: typeof body.purpose === 'string' && body.purpose.trim() ? body.purpose.trim() : '綜合',
                userQuestion: question,
                conversationHistory: Array.isArray(body.conversationHistory) ? body.conversationHistory : [],
                language: body.lang === 'zh-cn' ? 'zh-cn' : 'zh-tw'
            });
        } catch (error) {
            analysisResult = { success: false, error: error.message, fallback: '' };
        }

        const answer = getAnalysisText(analysisResult) || '抱歉，暫時無法提供分析';
        let discordResult = { success: false, reason: 'Discord webhook not configured' };
        if (discord && typeof discord.sendDivinationRecord === 'function') {
            try {
                discordResult = await discord.sendDivinationRecord(moduleName, body, result, answer);
            } catch (error) {
                discordResult = { success: false, reason: error.message };
            }
        }

        const response = {
            success: analysisResult?.success !== false,
            question,
            answer,
            result,
            [resultKey]: result,
            metadata: {
                provider: analysisResult?.provider || null,
                model: analysisResult?.model || null,
                language: body.lang === 'zh-cn' ? 'zh-cn' : 'zh-tw',
                apiVersion: '1.0'
            },
            discord: {
                recordSent: !!discordResult.success,
                enabled: !!(discord && typeof discord.isEnabled === 'function' && discord.isEnabled())
            },
            timestamp: new Date().toISOString()
        };

        if (analysisResult?.success === false) {
            response.error = analysisResult.error || 'LLM 分析失敗';
            return res.status(500).json(response);
        }

        return res.json(response);
    };
}

module.exports = {
    createServiceQuestionHandler,
    normalizeQuestion,
    validationError
};
