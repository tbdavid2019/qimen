const assert = require('node:assert/strict');
const test = require('node:test');

const LLMAnalysisService = require('../lib/llm-analysis');

test('共用服務 LLM 分析會使用模組專用提示詞與對話歷史', async () => {
    const service = new LLMAnalysisService({ provider: 'openai', model: 'test-model' });
    let captured;
    service.callLLMWithHistory = async (prompt, history, systemMessage) => {
        captured = { prompt, history, systemMessage };
        return { content: '專用分析', model: 'test-model', finishReason: 'stop' };
    };

    const response = await service.analyzeService('tarot', { spread: 'three', cards: [] }, {
        purpose: '事業',
        userQuestion: '要不要轉職？',
        conversationHistory: [{ role: 'user', content: '前一題' }],
        language: 'zh-tw'
    });

    assert.equal(response.success, true);
    assert.equal(response.analysis, '專用分析');
    assert.match(captured.systemMessage, /塔羅/);
    assert.match(captured.prompt, /要不要轉職/);
    assert.deepEqual(captured.history, [{ role: 'user', content: '前一題' }]);
});

test('解答之書 LLM 分析使用專用角色與原始答案', async () => {
    const service = new LLMAnalysisService({ provider: 'openai', model: 'test-model' });
    let captured;
    service.callLLMWithHistory = async (prompt, history, systemMessage) => {
        captured = { prompt, history, systemMessage };
        return { content: '解答之書專用分析', model: 'test-model' };
    };
    const response = await service.analyzeAnswerbook({ mode: 'question', answer: '準時\\nBE ON TIME' }, {
        userQuestion: '我該準時赴約嗎？',
        language: 'zh-tw'
    });
    assert.equal(response.success, true);
    assert.equal(response.analysis, '解答之書專用分析');
    assert.match(captured.systemMessage, /解答之書/);
    assert.match(captured.prompt, /準時/);
    assert.match(captured.prompt, /準時赴約/);
});
