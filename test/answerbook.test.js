const assert = require('node:assert/strict');
const http = require('node:http');
const { after, before, test } = require('node:test');
const axios = require('axios');

const app = require('../app');
const { AnswerBookClient, createAnswerbookQuestionHandler, normalizeAnswerbookInput } = require('../lib/answerbook');

function makeResponse() {
    return {
        statusCode: 200,
        payload: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.payload = payload; return this; }
    };
}

test('解答之書 client 會解析上游 answer', async () => {
    const client = new AnswerBookClient({ request: async () => ({ data: { answer: '準時\nBE ON TIME' } }) });
    const result = await client.getOriginalAnswer();
    assert.equal(result.answer, '準時\nBE ON TIME');
    assert.deepEqual(result.raw, { answer: '準時\nBE ON TIME' });
});

test('解答之書 client 在上游缺少答案時回傳 502 錯誤', async () => {
    const client = new AnswerBookClient({ request: async () => ({ data: {} }) });
    await assert.rejects(() => client.getOriginalAnswer(), (error) => {
        assert.equal(error.statusCode, 502);
        assert.match(error.message, /答案|answer/i);
        return true;
    });
});

test('解答之書 handler 會把輸入、原始答案與 AI 回應完整交給 Discord', async () => {
    let record;
    const handler = createAnswerbookQuestionHandler({
        client: { getOriginalAnswer: async () => ({ answer: '準時', raw: { answer: '準時' } }) },
        analyze: async () => ({ success: true, analysis: '請準時赴約。', provider: 'test', model: 'test-model' }),
        discord: {
            isEnabled: () => true,
            sendDivinationRecord: async (...args) => { record = args; return { success: true }; }
        }
    });
    const res = makeResponse();
    await handler({ body: { mode: 'question', question: '我該赴約嗎？' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(record[0], '解答之書');
    assert.equal(record[1].question, '我該赴約嗎？');
    assert.equal(record[1].mode, 'question');
    assert.deepEqual(record[2].rawAnswer, { answer: '準時' });
    assert.equal(record[3], '請準時赴約。');
});

test('解答之書輸入會依問題自動判斷 direct/question 模式', () => {
    assert.equal(normalizeAnswerbookInput({}).mode, 'direct');
    assert.deepEqual(normalizeAnswerbookInput({ question: '  要轉職嗎？  ' }), {
        question: '要轉職嗎？',
        mode: 'question'
    });
    assert.throws(() => normalizeAnswerbookInput({ mode: 'question' }), /問題|question/i);
    assert.throws(() => normalizeAnswerbookInput({ mode: 'unknown' }), /模式|mode/i);
});

let server;
let baseUrl;

before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve) => server.close(resolve));
});

test('解答之書頁面提供既有 suite 導覽與 WebMCP 表單', async () => {
    const response = await fetch(`${baseUrl}/answerbook`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<h1>解答之書<\/h1>/);
    assert.match(html, /href="\/answerbook"/);
    assert.match(html, /toolname="answerbook_reading"/);
    assert.match(html, /data-mode="direct"/);
    assert.match(html, /data-mode="question"/);
});

test('API docs 列出解答之書端點', async () => {
    const response = await fetch(`${baseUrl}/api/docs`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.endpoints.answerbookQuestion.path, '/api/answerbook-question');
    assert.deepEqual(body.endpoints.answerbookQuestion.parameters.mode.enum, ['direct', 'question']);
});

test('解答之書 API 支援直接默念並保留原始答案', async () => {
    const originalGet = axios.get;
    axios.get = async () => ({ data: { answer: '準時\nBE ON TIME' } });
    try {
        const response = await fetch(`${baseUrl}/api/answerbook-question`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({})
        });
        const body = await response.json();
        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.equal(body.mode, 'direct');
        assert.equal(body.answer, '準時\nBE ON TIME');
        assert.equal(body.analysis, null);
        assert.equal(body.analysisSuccess, null);
    } finally {
        axios.get = originalGet;
    }
});

test('解答之書 API 在輸入問題時取得答案並交給共用 LLM', async () => {
    const originalGet = axios.get;
    const originalPost = axios.post;
    axios.get = async () => ({ data: { answer: '先觀察\nOBSERVE FIRST' } });
    axios.post = async () => ({ data: { choices: [{ message: { content: '請先蒐集資訊再行動。' }, finish_reason: 'stop' }] } });
    try {
        const response = await fetch(`${baseUrl}/api/answerbook-question`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ question: '我現在適合轉職嗎？', lang: 'zh-tw' })
        });
        const body = await response.json();
        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.equal(body.mode, 'question');
        assert.equal(body.answer, '先觀察\nOBSERVE FIRST');
        assert.equal(body.analysis, '請先蒐集資訊再行動。');
        assert.equal(body.analysisSuccess, true);
        assert.equal(body.metadata.service, 'answerbook');
    } finally {
        axios.get = originalGet;
        axios.post = originalPost;
    }
});

test('解答之書 API 在上游失敗時回傳 502', async () => {
    const originalGet = axios.get;
    axios.get = async () => { const error = new Error('upstream unavailable'); error.response = { status: 503 }; throw error; };
    try {
        const response = await fetch(`${baseUrl}/api/answerbook-question`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({})
        });
        const body = await response.json();
        assert.equal(response.status, 502);
        assert.equal(body.success, false);
        assert.match(body.error, /解答之書|上游|answer/i);
    } finally {
        axios.get = originalGet;
    }
});
