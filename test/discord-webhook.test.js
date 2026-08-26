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
        assert.equal(request[0], 'https://discord.example/webhook');
        assert.match(request[2].headers['content-type'], /^multipart\/form-data; boundary=/);
        assert.equal(typeof request[1].getLengthSync, 'function');
        assert.ok(request[1].getLengthSync() > 0);
    } finally {
        axios.post = originalPost;
    }
});
