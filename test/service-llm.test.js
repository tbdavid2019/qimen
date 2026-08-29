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
    const response = await service.analyzeAnswerbook({ mode: 'question', answer: '準時\nBE ON TIME' }, {
        userQuestion: '我該準時赴約嗎？',
        language: 'zh-tw'
    });
    assert.equal(response.success, true);
    assert.equal(response.analysis, '解答之書專用分析');
    assert.match(captured.systemMessage, /解答之書/);
    assert.match(captured.prompt, /準時/);
    assert.match(captured.prompt, /準時赴約/);
});

test('紫微斗數 LLM 分析使用專用角色與命身宮位', async () => {
    const service = new LLMAnalysisService({ provider: 'openai', model: 'test-model' });
    let captured;
    service.callLLMWithHistory = async (prompt, history, systemMessage) => {
        captured = { prompt, history, systemMessage };
        return { content: '紫微斗數深度解析', model: 'test-model' };
    };
    const response = await service.analyzeZiwei({ bureau: '水二局', mingPalaceBranch: '辰', shenPalaceBranch: '戌' }, {
        userQuestion: '我的事業發展如何？',
        language: 'zh-tw'
    });
    assert.equal(response.success, true);
    assert.equal(response.analysis, '紫微斗數深度解析');
    assert.match(captured.systemMessage, /紫微/);
    assert.match(captured.prompt, /水二局/);
    assert.match(captured.prompt, /事業發展/);
    assert.match(captured.prompt, /直面解答 · 一句提醒/);
});

test('全模組 LLM 提示詞均包含【直面解答 · 一句提醒】與白話結論要求', () => {
    const service = new LLMAnalysisService({ provider: 'openai', model: 'test-model' });
    const question = '我該不該接受新職位？';

    // 奇門
    const qimenPrompt = service.formatQimenForLLM({
        basicInfo: { date: '2026-08-29', time: '08:00', lunarDate: '七月十七' },
        juShu: { fullName: '陽遁七局' }
    }, '事業', question);
    assert.match(qimenPrompt, /直面解答 · 一句提醒/);
    assert.match(qimenPrompt, /正面回答提問/);
    assert.match(qimenPrompt, new RegExp(question));

    // 梅花
    const meihuaPrompt = service.formatMeihuaForLLM({
        method: 'time',
        bengua: { num: 1, name: '乾為天', dongYao: 1, upperGua: { name: '乾' }, lowerGua: { name: '乾' } },
        tigua: { name: '乾', element: '金', nature: '天' },
        yonggua: { name: '乾', element: '金', nature: '天' },
        wuxing: { relation: '體用比和', judgement: '大吉' }
    }, '事業', question);
    assert.match(meihuaPrompt, /直面解答 · 一句提醒/);
    assert.match(meihuaPrompt, /正面回答提問/);
    assert.match(meihuaPrompt, new RegExp(question));

    // 紫微
    const ziwei = service.formatZiweiPrompt({ bureau: '水二局' }, question);
    assert.match(ziwei.prompt, /直面解答 · 一句提醒/);
    assert.match(ziwei.prompt, /正面回答求測者提問/);
    assert.match(ziwei.systemMessage, /正面回答/);

    // 八字2
    const bazi = service.formatBazi2Prompt({ fourPillars: [] }, question);
    assert.match(bazi.prompt, /直面解答 · 一句提醒/);
    assert.match(bazi.prompt, /正面回答求測者提問/);
    assert.match(bazi.systemMessage, /正面回答/);

    // 風水
    const fengshui = service.formatFengShuiPrompt({ facing: '南' }, question);
    assert.match(fengshui.prompt, /直面解答 · 一句提醒/);
    assert.match(fengshui.prompt, /正面回答求測者提問/);
    assert.match(fengshui.systemMessage, /正面回答/);

    // 塔羅
    const tarot = service.formatTarotPrompt({ spread: 'three' }, question);
    assert.match(tarot.prompt, /直面解答 · 一句提醒/);
    assert.match(tarot.prompt, /正面回答求測者問題/);
    assert.match(tarot.systemMessage, /正面回答/);

    // 姻緣
    const yinyuan = service.formatYinyuanPrompt({ mode: 'fortune' }, question);
    assert.match(yinyuan.prompt, /直面解答 · 一句提醒/);
    assert.match(yinyuan.prompt, /正面回答使用者提問/);
    assert.match(yinyuan.systemMessage, /正面回答/);

    // 解答之書
    const answerbook = service.formatAnswerbookPrompt({ answer: '勇往直前' }, question);
    assert.match(answerbook.prompt, /直面解答 · 一句提醒/);
    assert.match(answerbook.prompt, /正面回答求測者提問/);
    assert.match(answerbook.systemMessage, /正面回答/);
});
