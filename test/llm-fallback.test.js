const assert = require('node:assert/strict');
const test = require('node:test');
const axios = require('axios');
const LLMAnalysisService = require('../lib/llm-analysis');

test('LLM fallback 會依序嘗試模型並回傳實際使用的模型', async () => {
    const originalPost = axios.post;
    const calls = [];

    axios.post = async (url, payload) => {
        calls.push({ url, payload });
        if (payload.model === 'primary-model') {
            throw new Error('primary unavailable');
        }

        return {
            data: {
                choices: [{
                    message: { content: '備援模型回覆' },
                    finish_reason: 'stop'
                }]
            }
        };
    };

    try {
        const service = new LLMAnalysisService({
            provider: 'openai',
            models: 'primary-model, backup-model'
        });
        const response = await service.callLLM('請分析');

        assert.equal(response.content, '備援模型回覆');
        assert.equal(response.model, 'backup-model');
        assert.deepEqual(calls.map(({ payload }) => payload.model), [
            'primary-model',
            'backup-model'
        ]);
    } finally {
        axios.post = originalPost;
    }
});

test('空白回覆也會觸發下一個模型', async () => {
    const originalPost = axios.post;
    const models = [];

    axios.post = async (url, payload) => {
        models.push(payload.model);
        return {
            data: payload.model === 'primary-model'
                ? { choices: [{ message: { content: '   ' } }] }
                : { choices: [{ message: { content: '成功' } }] }
        };
    };

    try {
        const service = new LLMAnalysisService({
            provider: 'openai',
            models: ['primary-model', 'backup-model']
        });
        const response = await service.callLLMWithHistory('請分析');

        assert.equal(response.content, '成功');
        assert.deepEqual(models, ['primary-model', 'backup-model']);
    } finally {
        axios.post = originalPost;
    }
});

test('未設定多模型時仍維持單一 LLM_MODEL 行為', () => {
    const service = new LLMAnalysisService({
        provider: 'openai',
        model: 'legacy-model'
    });

    assert.deepEqual(service.models, ['legacy-model']);
    assert.equal(service.model, 'legacy-model');
});
