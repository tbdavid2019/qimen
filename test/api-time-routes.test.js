const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const { after, before, test } = require('node:test');

let serverProcess;
let baseUrl;

function getAvailablePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            server.close((error) => error ? reject(error) : resolve(port));
        });
    });
}

function waitForServer(child) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('測試伺服器啟動逾時')), 10000);
        let stderr = '';

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });
        child.once('exit', (code) => {
            clearTimeout(timeout);
            reject(new Error(`測試伺服器提前結束 (${code}): ${stderr}`));
        });
        child.stdout.on('data', (chunk) => {
            if (chunk.toString().includes('奇門遁甲在運行中')) {
                clearTimeout(timeout);
                resolve();
            }
        });
    });
}

async function postJson(path, body) {
    return fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    });
}

before(async () => {
    const port = await getAvailablePort();
    baseUrl = `http://127.0.0.1:${port}`;
    serverProcess = spawn(process.execPath, ['app.js'], {
        cwd: process.cwd(),
        env: {
            ...process.env,
            PORT: String(port),
            TZ: 'UTC',
            NODE_ENV: 'test',
            LLM_API_KEY: '',
            DISCORD_WEBHOOK_URL: ''
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    await waitForServer(serverProcess);
});

after(async () => {
    if (!serverProcess || serverProcess.exitCode !== null) return;
    serverProcess.kill('SIGTERM');
    await new Promise((resolve) => serverProcess.once('exit', resolve));
});

test('奇門 API 在 UTC server 仍使用請求中的 15 時', async () => {
    const response = await fetch(`${baseUrl}/api/qimen?date=2026-01-20&time=15:00&timePrecisionMode=traditional`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.match(body.basicInfo.date, /15:00:00/);
    assert.equal(Object.keys(body.jiuGongAnalysis).length, 9);
});

test('奇門 API 保留只有 date 時的既有成功 fallback', async () => {
    const response = await fetch(`${baseUrl}/api/qimen?date=2026-01-20`);

    assert.equal(response.status, 200);
});

test('奇門 API 拒絕不可能的日期', async () => {
    const response = await fetch(`${baseUrl}/api/qimen?date=2026-02-30&time=15:00`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.code, 'INVALID_DATETIME');
    assert.equal(body.field, 'datetime');
});

test('梅花起卦 API 回傳統一時間錯誤契約', async () => {
    const response = await postJson('/api/meihua/qigua', {
        method: 'time',
        datetime: '2026-02-30T15:00:00'
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.code, 'INVALID_DATETIME');
    assert.equal(body.field, 'datetime');
});

test('LLM fallback 排盤在呼叫外部服務前拒絕非法時間', async () => {
    const response = await postJson('/api/llm-analysis', { userDateTime: 'not-a-date' });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.code, 'INVALID_DATETIME');
    assert.equal(body.field, 'userDateTime');
    assert.equal(body.fallback, undefined);
});

test('奇門問答 API 回傳統一時間錯誤契約', async () => {
    const response = await postJson('/api/qimen-question', {
        question: '測試',
        datetime: 'not-a-date',
        timezone: '+08:00'
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.code, 'INVALID_DATETIME');
    assert.equal(body.field, 'datetime');
});

test('梅花問答 API 回傳統一時間錯誤契約', async () => {
    const response = await postJson('/api/meihua-question', {
        question: '測試',
        datetime: 'not-a-date',
        timezone: '+08:00'
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.code, 'INVALID_DATETIME');
    assert.equal(body.field, 'datetime');
});

test('GET /api/time/range 解決午夜邊界問題 (9/1 ~ 9/9 涵蓋至 23:59:59.999)', async () => {
    const response = await fetch(`${baseUrl}/api/time/range?startDate=2026-09-01&endDate=2026-09-09`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.range.days, 9);
    assert.equal(body.range.startDate, '2026-09-01');
    assert.equal(body.range.endDate, '2026-09-09');
    assert.equal(body.range.startDateTime, '2026-09-01T00:00:00.000');
    assert.equal(body.range.endDateTimeInclusive, '2026-09-09T23:59:59.999');
    assert.equal(body.range.endDateTimeExclusive, '2026-09-10T00:00:00.000');
    assert.equal(body.range.midnightBoundaryResolved, true);
});

test('POST /api/time/range 支援 JSON payload 與自訂時區', async () => {
    const response = await postJson('/api/time/range', {
        startDate: '2026-09-01',
        endDate: '2026-09-09',
        timezone: '+08:00'
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.range.days, 9);
});

test('GET /api/time/range 在日期倒置時回傳 400 與結構化錯誤', async () => {
    const response = await fetch(`${baseUrl}/api/time/range?startDate=2026-09-10&endDate=2026-09-09`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.code, 'INVALID_DATE_RANGE');
    assert.equal(body.field, 'endDate');
});

test('GET /api/time/boundary 支援校正至當日結束邊界 (23:59:59)', async () => {
    const response = await fetch(`${baseUrl}/api/time/boundary?date=2026-09-09&boundary=end`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.boundary, 'end');
    assert.ok(body.datetime);
});

