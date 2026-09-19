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

test('風水住宅物件目錄端點回傳權威 63 項 catalog', async () => {
    const response = await fetch(`${baseUrl}/data/fengshui/layout-catalog.json`);
    const catalog = await response.json();
    assert.equal(response.status, 200);
    assert.equal(catalog.version, '1.0.0');
    assert.ok(Array.isArray(catalog.categories));
    assert.ok(Array.isArray(catalog.items));
    assert.equal(catalog.items.length, 63);
    assert.equal(new Set(catalog.items.map(item => item.id)).size, 63);
    assert.ok(catalog.items.some(item => item.id === 'space.entryway'));
    assert.ok(catalog.items.some(item => item.id === 'form.sloped_roof'));
});

test('中州派住宅佈局評估端點 /api/fengshui/evaluate-layout 正常運作且不經由 LLM', async () => {
    const payload = {
        heading: 180,
        moveInYear: 2024,
        layoutObjects: {
            '南': ['door.main'],
            '西北': ['space.kitchen', 'appliance.stove']
        },
        entryPath: ['南', '中'],
        pathQuality: 'open'
    };

    const resPost = await fetch(`${baseUrl}/api/fengshui/evaluate-layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const dataPost = await resPost.json();
    assert.equal(resPost.status, 200);
    assert.equal(dataPost.success, true);
    assert.ok(dataPost.layoutEvaluation);
    assert.ok(dataPost.layoutEvaluation.findings);
    assert.ok(dataPost.missingData.includes('space.master_bedroom'));

    const resGet = await fetch(`${baseUrl}/api/fengshui/evaluate-layout?heading=180&moveInYear=2024&layoutObjects=${encodeURIComponent(JSON.stringify(payload.layoutObjects))}`);
    const dataGet = await resGet.json();
    assert.equal(resGet.status, 200);
    assert.equal(dataGet.success, true);
    assert.ok(dataGet.layoutEvaluation);
    assert.ok(dataGet.layoutEvaluation.findings);
});

test('風水報告 API 端點支援羅盤向首與九宮佈局，並檢測坐向度數矛盾', async () => {
    // 正常帶入 heading 與 layoutObjects
    const resSuccess = await postJson('/api/fengshui/report', {
        heading: 180,
        moveInYear: 2024,
        residentYear: 1990,
        sex: '男',
        year: 2026,
        layoutObjects: {
            '南': ['door.main'],
            '西北': ['appliance.stove']
        }
    });
    assert.equal(resSuccess.status, 200);
    const dataSuccess = await resSuccess.json();
    assert.equal(dataSuccess.success, true);
    assert.ok(dataSuccess.report.orientation);
    assert.equal(dataSuccess.report.orientation.heading, 180);
    assert.ok(dataSuccess.report.layoutEvaluation);

    // 坐向度數衝突：heading=180 (南), facing='北' -> 400
    const resConflict = await postJson('/api/fengshui/report', {
        heading: 180,
        facing: '北',
        moveInYear: 2024,
        residentYear: 1990,
        sex: '男',
        year: 2026
    });
    assert.equal(resConflict.status, 400);
    const dataConflict = await resConflict.json();
    assert.equal(dataConflict.success, false);
    assert.equal(dataConflict.code, 'FACING_HEADING_CONFLICT');
});

test('紫微男生真實尺寸端點 /api/ziwei/male-size 正常運作且不經由 LLM', async () => {
    const res = await postJson('/api/ziwei/male-size', {
        date: '1981-08-11',
        time: '10:00',
        sex: '男'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.tier, '大/中杯');
    assert.equal(body.cmRange, '11 - 13 cm');
    assert.match(body.title, /精鋼|鋒刃/);
    assert.ok(body.advice);
});

test('紫微男生真實尺寸端點嚴格驗證日期並拒絕偽造宮位', async () => {
    // 拒絕無效日期 (2026-02-31)
    const resInvalidDate = await postJson('/api/ziwei/male-size', {
        date: '2026-02-31',
        time: '10:00'
    });
    assert.equal(resInvalidDate.status, 400);
    const dataInvalid = await resInvalidDate.json();
    assert.equal(dataInvalid.success, false);
    assert.equal(dataInvalid.code, 'INVALID_BIRTH_DATE');

    // 拒絕僅提供偽造 palaces 而缺日期的請求
    const resNoDate = await postJson('/api/ziwei/male-size', {
        palaces: [{ branch: '子', name: '疾厄宮', stars: [{ name: '巨門', type: 'major' }] }]
    });
    assert.equal(resNoDate.status, 400);
    const dataNoDate = await resNoDate.json();
    assert.equal(dataNoDate.success, false);
    assert.equal(dataNoDate.code, 'MISSING_BIRTH_DATE');
});

