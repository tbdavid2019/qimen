const assert = require('node:assert/strict');
const test = require('node:test');
const axios = require('axios');

const DiscordWebhook = require('../lib/discord-webhook');
const { buildDivinationRecordPayload } = DiscordWebhook;

test('Discord 完整紀錄會以摘要欄位呈現並保留可下載的完整 JSON', () => {
    const built = buildDivinationRecordPayload(
        '解答之書',
        { mode: 'question', question: '我該赴約嗎？', lang: 'zh-tw' },
        { mode: 'question', answer: '準時', rawAnswer: { answer: '準時' } },
        '請準時赴約。',
        new Date('2026-08-26T06:00:00.000Z')
    );

    assert.equal(built.payload.embeds.length, 1);
    const embed = built.payload.embeds[0];
    assert.match(embed.title, /解答之書/);
    assert.match(embed.description, /完整原始資料/);
    assert.deepEqual(built.payload.allowed_mentions, { parse: [] });
    assert.equal(embed.fields.length, 4);
    assert.equal(embed.fields[0].name, '❓ 使用者問題');
    assert.match(embed.fields[0].value, /我該赴約嗎/);
    assert.equal(embed.fields[1].name, '🧾 請求參數');
    assert.match(embed.fields[1].value, /模式：question/);
    assert.equal(embed.fields[2].name, '📊 計算摘要');
    assert.match(embed.fields[2].value, /準時/);
    assert.equal(embed.fields[3].name, '🤖 AI 解讀');
    assert.equal(embed.fields[3].value, '請準時赴約。');

    const fullRecord = JSON.parse(built.json);
    assert.deepEqual(fullRecord.input, { mode: 'question', question: '我該赴約嗎？', lang: 'zh-tw' });
    assert.deepEqual(fullRecord.result.rawAnswer, { answer: '準時' });
    assert.equal(fullRecord.analysis, '請準時赴約。');
    assert.match(built.filename, /\.json$/);
});

test('Discord JSON 附件保留完整生命靈數出生日期、公式、盤面與 AI 解讀', () => {
    const built = buildDivinationRecordPayload(
        '塔羅生命靈數',
        { birthDate: '1981-08-11', question: '長問題'.repeat(800) },
        { birthDate: '1981-08-11', formula: '1981-08-11 ➔ 1+9+8+1+0+8+1+1=29', digitGrid: { counts: { 1: 4 } } },
        '完整 AI 回答'.repeat(600)
    );
    const fullRecord = JSON.parse(built.json);
    assert.equal(fullRecord.input.birthDate, '1981-08-11');
    assert.equal(fullRecord.result.birthDate, '1981-08-11');
    assert.match(fullRecord.result.formula, /1\+9\+8\+1\+0\+8\+1\+1/);
    assert.equal(fullRecord.result.digitGrid.counts[1], 4);
    assert.ok(fullRecord.analysis.length > 1000);
});

test('Discord 摘要會依術數模組整理牌陣與排盤重點', () => {
    const tarot = buildDivinationRecordPayload(
        '塔羅',
        { question: '近期工作？', spread: 'three' },
        { spreadName: 'three', cards: [
            { position: '過去', name: '太陽', orientation: '正位' },
            { position: '現在', name: '隱者', orientation: '逆位' }
        ] },
        ''
    );
    const summary = tarot.payload.embeds[0].fields[2].value;
    assert.match(summary, /過去：太陽（正位）/);
    assert.match(summary, /現在：隱者（逆位）/);
});

test('Discord 完整紀錄使用 multipart JSON 附件而非把資料塞進單一描述', async () => {
    const originalPost = axios.post;
    let request;
    axios.post = async (...args) => {
        request = args;
        return { status: 204 };
    };
    try {
        const webhook = new DiscordWebhook('https://discord.example/webhook');
        const response = await webhook.sendDivinationRecord('塔羅', { question: '測試' }, { cards: [] }, '測試回覆');
        assert.equal(response.success, true);
        assert.equal(request[0], 'https://discord.example/webhook?wait=true');
        assert.match(request[2].headers['content-type'], /^multipart\/form-data; boundary=/);
        assert.equal(typeof request[1].getLengthSync, 'function');
        assert.ok(request[1].getLengthSync() > 0);
    } finally {
        axios.post = originalPost;
    }
});

test('奇門與梅花舊式 webhook 也附上未截斷的問題、盤面、上下文與 AI 回覆', async () => {
    const originalPost = axios.post;
    const requests = [];
    axios.post = async (...args) => {
        requests.push(args);
        return { status: 200, data: { id: `message-${requests.length}` } };
    };
    try {
        const webhook = new DiscordWebhook('https://discord.example/webhook?thread_id=123');
        const question = `完整問題 ${'問'.repeat(4200)}`;
        const chart = { palaces: Array.from({ length: 12 }, (_, index) => ({ palace: index + 1, detail: `宮位資料-${index + 1}` })) };
        const context = { purpose: '事業', conversationHistory: [{ role: 'user', content: '前文完整保留' }] };
        await webhook.sendUserQuestion(question, chart, context);
        const analysis = `完整 AI 解讀 ${'解'.repeat(1500)}`;
        await webhook.sendLLMAnalysis(analysis, chart, question, context);

        assert.equal(requests.length, 2);
        for (const [url, form] of requests) {
            assert.match(url, /[?&]wait=true(?:&|$)/);
            assert.match(form.getHeaders()['content-type'], /^multipart\/form-data; boundary=/);
        }
        const questionAttachment = requests[0][1].getBuffer().toString('utf8');
        assert.ok(questionAttachment.includes(question));
        assert.ok(questionAttachment.includes('宮位資料-12'));
        assert.ok(questionAttachment.includes('前文完整保留'));
        const analysisAttachment = requests[1][1].getBuffer().toString('utf8');
        assert.ok(analysisAttachment.includes(analysis));
        assert.ok(analysisAttachment.includes('宮位資料-12'));
        assert.ok(analysisAttachment.includes('前文完整保留'));
    } finally {
        axios.post = originalPost;
    }
});

test('Discord 紀錄附件略過 Turnstile 驗證權杖但保留完整業務資料', () => {
    const built = buildDivinationRecordPayload(
        '中文姓名驗名',
        { name: '王安', birthData: { birthDate: '1990-01-02' }, turnstileToken: 'secret-token' },
        { candidates: ['王安'], source: 'name-analysis' }
    );
    const fullRecord = JSON.parse(built.json);
    assert.equal(fullRecord.input.name, '王安');
    assert.equal(fullRecord.input.birthData.birthDate, '1990-01-02');
    assert.equal(fullRecord.input.turnstileToken, undefined);
    assert.deepEqual(fullRecord.result.candidates, ['王安']);
});
