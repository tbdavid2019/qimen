const assert = require('node:assert/strict');
const test = require('node:test');

const { createServiceQuestionHandler } = require('../lib/service-question');

function makeResponse() {
    return {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        }
    };
}

test('共用一站式流程會保存完整結果並回傳 AI 回答', async () => {
    const calls = [];
    const handler = createServiceQuestionHandler({
        moduleName: '測試服務',
        resultKey: 'result',
        validate: (body) => ({ ...body, normalized: true }),
        calculate: (body) => ({ value: body.normalized }),
        analyze: async (result, options) => {
            calls.push({ result, options });
            return { success: true, analysis: '測試 AI 回答', provider: 'test', model: 'test-model' };
        },
        discord: {
            isEnabled: () => true,
            sendDivinationRecord: async (...args) => {
                calls.push({ discord: args });
                return { success: true, status: 204 };
            }
        }
    });
    const res = makeResponse();

    await handler({ body: { question: '請分析', lang: 'zh-tw', conversationHistory: [] } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.success, true);
    assert.deepEqual(res.payload.result, { value: true });
    assert.equal(res.payload.answer, '測試 AI 回答');
    assert.equal(res.payload.metadata.model, 'test-model');
    assert.equal(res.payload.discord.recordSent, true);
    assert.equal(calls.filter((call) => call.discord).length, 1);
});

test('共用一站式流程在問題空白時不會呼叫計算或外部服務', async () => {
    let calculateCalls = 0;
    const handler = createServiceQuestionHandler({
        moduleName: '測試服務',
        resultKey: 'result',
        calculate: () => { calculateCalls += 1; return {}; },
        analyze: async () => ({ success: true, analysis: '不應被呼叫' }),
        discord: { isEnabled: () => false }
    });
    const res = makeResponse();

    await handler({ body: { question: '   ' } }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.payload.success, false);
    assert.equal(calculateCalls, 0);
});

test('共用一站式流程在 LLM 失敗時保留計算結果與 fallback', async () => {
    const handler = createServiceQuestionHandler({
        moduleName: '測試服務',
        resultKey: 'result',
        calculate: () => ({ value: 1 }),
        analyze: async () => ({ success: false, error: 'LLM unavailable', fallback: '安全備用說明' }),
        discord: {
            isEnabled: () => false,
            sendDivinationRecord: async () => ({ success: false })
        }
    });
    const res = makeResponse();

    await handler({ body: { question: '請分析' } }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.payload.success, false);
    assert.deepEqual(res.payload.result, { value: 1 });
    assert.equal(res.payload.answer, '安全備用說明');
    assert.equal(res.payload.error, 'LLM unavailable');
});
