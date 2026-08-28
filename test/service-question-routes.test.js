const assert = require('node:assert/strict');
const http = require('node:http');
const { after, before, test } = require('node:test');
const axios = require('axios');

const app = require('../app');

let server;
let baseUrl;

async function postJson(path, body) {
    return fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    });
}

before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve) => server.close(resolve));
});

test('一站式服務 API 都拒絕空白問題', async () => {
    for (const endpoint of ['/api/ziwei-question', '/api/tarot-question', '/api/fengshui-question', '/api/bazi2-question', '/api/yinyuan-question']) {
        const response = await postJson(endpoint, {});
        const body = await response.json();

        assert.equal(response.status, 400, endpoint);
        assert.equal(body.success, false, endpoint);
        assert.match(body.message || body.error, /question|問題|必需/i, endpoint);
    }
});

test('紫微斗數一站式 API 拒絕缺少出生日期', async () => {
    const response = await postJson('/api/ziwei-question', { question: '測試' });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message || body.error, /出生日期|date/i);
});

test('塔羅一站式 API 拒絕未知牌陣', async () => {
    const response = await postJson('/api/tarot-question', { question: '測試', spread: 'unknown' });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message || body.error, /牌陣|spread/i);
});

test('風水一站式 API 拒絕未知朝向', async () => {
    const response = await postJson('/api/fengshui-question', { question: '測試', facing: '未知方位' });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message || body.error, /朝向|facing/i);
});

test('生辰八字2一站式 API 拒絕缺少出生日期', async () => {
    const response = await postJson('/api/bazi2-question', { question: '測試' });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message || body.error, /出生日期|date/i);
});

test('姻緣一站式 API 拒絕未知模式', async () => {
    const response = await postJson('/api/yinyuan-question', { question: '測試', mode: 'unknown' });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message || body.error, /模式|mode/i);
});

test('所有一站式服務 API 都能完成計算、AI 回答與統一回應', async () => {
    const originalPost = axios.post;
    axios.post = async (_url, payload) => payload.input
        ? { data: { output: { text: '測試 AI 回答', finish_reason: 'stop' } } }
        : { data: { choices: [{ message: { content: '測試 AI 回答' }, finish_reason: 'stop' }] } };

    const requests = [
        ['/api/ziwei-question', { question: '紫微測試', date: '1990-05-15', time: '12:00', sex: '男' }, 'chart'],
        ['/api/tarot-question', { question: '塔羅測試', spread: 'single', seed: 'route-test' }, 'reading'],
        ['/api/fengshui-question', { question: '風水測試', facing: '南', residentYear: 1990, sex: '女', year: 2026 }, 'report'],
        ['/api/bazi2-question', { question: '八字測試', date: '1990-01-01', time: '12:00', sex: '男' }, 'chart'],
        ['/api/yinyuan-question', { question: '姻緣測試', mode: 'fortune', seed: 'route-test' }, 'result']
    ];

    try {
        for (const [endpoint, payload, resultKey] of requests) {
            const response = await postJson(endpoint, payload);
            const body = await response.json();
            assert.equal(response.status, 200, endpoint);
            assert.equal(body.success, true, endpoint);
            assert.equal(typeof body.answer, 'string', endpoint);
            assert.ok(body[resultKey], `${endpoint} 缺少 ${resultKey}`);
            assert.ok(body.metadata, `${endpoint} 缺少 metadata`);
            assert.ok(body.discord, `${endpoint} 缺少 discord 狀態`);
        }
    } finally {
        axios.post = originalPost;
    }
});

test('新 API 端點 /api/solar-time, /api/fengshui/shaqi-list, /api/fengshui/luantou 正常運作', async () => {
    const resSolar = await fetch(`${baseUrl}/api/solar-time?date=2026-05-15&hour=12&minute=0&place=台北市`);
    const dataSolar = await resSolar.json();
    assert.equal(resSolar.status, 200);
    assert.equal(dataSolar.success, true);
    assert.ok(dataSolar.result.solarTimeFormatted);

    const resShaqiList = await fetch(`${baseUrl}/api/fengshui/shaqi-list`);
    const dataShaqiList = await resShaqiList.json();
    assert.equal(resShaqiList.status, 200);
    assert.equal(dataShaqiList.success, true);
    assert.ok(dataShaqiList.list.length >= 20);

    const resLuantou = await fetch(`${baseUrl}/api/fengshui/luantou?shaList=天斬煞,穿堂煞`);
    const dataLuantou = await resLuantou.json();
    assert.equal(resLuantou.status, 200);
    assert.equal(dataLuantou.success, true);
    assert.equal(dataLuantou.result.totalIssues, 2);
});
