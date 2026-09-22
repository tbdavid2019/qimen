const test = require('node:test');
const assert = require('node:assert/strict');
const {
    isTurnstileEnabled,
    getSiteKey,
    parseHostnames,
    verifyTurnstile,
    turnstileMiddleware
} = require('../lib/turnstile');

test('Turnstile: parseHostnames parses comma separated and arrays properly', () => {
    const fromString = parseHostnames('qi.david888.com, localhost, 127.0.0.1');
    assert.ok(fromString instanceof Set);
    assert.equal(fromString.has('qi.david888.com'), true);
    assert.equal(fromString.has('localhost'), true);
    assert.equal(fromString.has('127.0.0.1'), true);
    assert.equal(fromString.has('evil.com'), false);

    const fromArray = parseHostnames(['qi.david888.com', 'LOCALHOST']);
    assert.equal(fromArray.has('localhost'), true);
    assert.equal(fromArray.has('qi.david888.com'), true);

    assert.equal(parseHostnames(null), null);
    assert.equal(parseHostnames(''), null);
});

test('Turnstile: default test environment bypasses verification gracefully', async () => {
    // In test environment without TURNSTILE_FORCE_ENABLE, it should return bypassed: true
    const result = await verifyTurnstile({ token: '' });
    assert.equal(result.success, true);
    assert.equal(result.bypassed, true);
});

test('Turnstile: missing or empty token is rejected when forced enabled', async () => {
    process.env.TURNSTILE_FORCE_ENABLE = 'true';
    const originalSecret = process.env.TURNSTILE_SECRET;
    process.env.TURNSTILE_SECRET = '0x4AAAAAA_dummy_secret';

    try {
        const noToken = await verifyTurnstile({ token: '' });
        assert.equal(noToken.success, false);
        assert.equal(noToken.code, 'TURNSTILE_TOKEN_MISSING');
        assert.equal(noToken.status, 403);

        const spaceToken = await verifyTurnstile({ token: '   ' });
        assert.equal(spaceToken.success, false);
        assert.equal(spaceToken.code, 'TURNSTILE_TOKEN_MISSING');

        const hugeToken = await verifyTurnstile({ token: 'a'.repeat(2049) });
        assert.equal(hugeToken.success, false);
        assert.equal(hugeToken.code, 'TURNSTILE_TOKEN_INVALID');
    } finally {
        delete process.env.TURNSTILE_FORCE_ENABLE;
        process.env.TURNSTILE_SECRET = originalSecret;
    }
});

test('Turnstile: bypass token allows authorized automated requests', async () => {
    process.env.TURNSTILE_FORCE_ENABLE = 'true';
    process.env.TURNSTILE_BYPASS_TOKEN = 'secret-bypass-token-123';
    const originalSecret = process.env.TURNSTILE_SECRET;
    process.env.TURNSTILE_SECRET = '0x4AAAAAA_dummy_secret';

    try {
        const res = await verifyTurnstile({
            token: '',
            bypassToken: 'secret-bypass-token-123'
        });
        assert.equal(res.success, true);
        assert.equal(res.bypassed, true);
    } finally {
        delete process.env.TURNSTILE_FORCE_ENABLE;
        delete process.env.TURNSTILE_BYPASS_TOKEN;
        process.env.TURNSTILE_SECRET = originalSecret;
    }
});

test('Turnstile: handles siteverify responses and checks hostname/action', async () => {
    process.env.TURNSTILE_FORCE_ENABLE = 'true';
    const originalSecret = process.env.TURNSTILE_SECRET;
    const originalFetch = global.fetch;
    process.env.TURNSTILE_SECRET = '0x4AAAAAA_dummy_secret';

    try {
        // Mock 1: siteverify returns success: false with duplicate code
        global.fetch = async () => ({
            ok: true,
            json: async () => ({
                success: false,
                'error-codes': ['timeout-or-duplicate']
            })
        });

        const replayRes = await verifyTurnstile({ token: 'mock-token' });
        assert.equal(replayRes.success, false);
        assert.equal(replayRes.code, 'TURNSTILE_EXPIRED');

        // Mock 2: siteverify returns success with hostname mismatch
        global.fetch = async () => ({
            ok: true,
            json: async () => ({
                success: true,
                hostname: 'attacker.example.com',
                action: 'qimen_analysis'
            })
        });

        const hostMismatch = await verifyTurnstile({
            token: 'mock-token',
            expectedHostnames: 'qi.david888.com,localhost'
        });
        assert.equal(hostMismatch.success, false);
        assert.equal(hostMismatch.code, 'TURNSTILE_HOSTNAME_MISMATCH');

        // Mock 3: siteverify returns success with action mismatch
        global.fetch = async () => ({
            ok: true,
            json: async () => ({
                success: true,
                hostname: 'qi.david888.com',
                action: 'send_email'
            })
        });

        const actionMismatch = await verifyTurnstile({
            token: 'mock-token',
            expectedAction: 'qimen_analysis',
            expectedHostnames: 'qi.david888.com'
        });
        assert.equal(actionMismatch.success, false);
        assert.equal(actionMismatch.code, 'TURNSTILE_ACTION_MISMATCH');

        // Mock 3b: siteverify returns success but missing hostname when allowlist required (fail closed)
        global.fetch = async () => ({
            ok: true,
            json: async () => ({
                success: true,
                action: 'send_email'
            })
        });

        const missingHost = await verifyTurnstile({
            token: 'mock-token',
            expectedHostnames: 'qi.david888.com'
        });
        assert.equal(missingHost.success, false);
        assert.equal(missingHost.code, 'TURNSTILE_HOSTNAME_MISMATCH');

        // Mock 3c: siteverify returns success but missing action when expectedAction required (fail closed)
        global.fetch = async () => ({
            ok: true,
            json: async () => ({
                success: true,
                hostname: 'qi.david888.com'
            })
        });

        const missingAction = await verifyTurnstile({
            token: 'mock-token',
            expectedAction: 'send_email'
        });
        assert.equal(missingAction.success, false);
        assert.equal(missingAction.code, 'TURNSTILE_ACTION_MISMATCH');

        // Mock 4: everything matches
        global.fetch = async () => ({
            ok: true,
            json: async () => ({
                success: true,
                hostname: 'qi.david888.com',
                action: 'send_email'
            })
        });

        const allPass = await verifyTurnstile({
            token: 'mock-token',
            expectedAction: 'send_email',
            expectedHostnames: 'qi.david888.com'
        });
        assert.equal(allPass.success, true);
        assert.equal(allPass.data.action, 'send_email');
    } finally {
        delete process.env.TURNSTILE_FORCE_ENABLE;
        process.env.TURNSTILE_SECRET = originalSecret;
        global.fetch = originalFetch;
    }
});

test('Turnstile: isTurnstileEnabled 需要同時具備 secret 與 siteKey', () => {
    const origSecret = process.env.TURNSTILE_SECRET;
    const origSiteKey = process.env.TURNSTILE_SITE_KEY;
    const origForce = process.env.TURNSTILE_FORCE_ENABLE;
    delete process.env.TURNSTILE_FORCE_ENABLE;

    try {
        // 缺少 site key 不得啟用
        process.env.TURNSTILE_SECRET = 'secret_123';
        delete process.env.TURNSTILE_SITE_KEY;
        assert.equal(isTurnstileEnabled(), false);

        // 缺少 secret 不得啟用
        delete process.env.TURNSTILE_SECRET;
        process.env.TURNSTILE_SITE_KEY = 'sitekey_123';
        assert.equal(isTurnstileEnabled(), false);

        // 包含 xxxxxxxx 範例佔位字串不得啟用，防止 .env.example 誤觸發
        process.env.TURNSTILE_SECRET = '0x4AAAAAAxxxxxxxxxxxxxx';
        process.env.TURNSTILE_SITE_KEY = '0x4AAAAAAxxxxxxxxxxxxxx';
        assert.equal(isTurnstileEnabled(), false);

        // 兩者皆備在非測試環境方可啟用
        process.env.TURNSTILE_FORCE_ENABLE = 'true';
        process.env.TURNSTILE_SECRET = 'secret_123';
        process.env.TURNSTILE_SITE_KEY = 'sitekey_123';
        assert.equal(isTurnstileEnabled(), true);
    } finally {
        if (origSecret) process.env.TURNSTILE_SECRET = origSecret; else delete process.env.TURNSTILE_SECRET;
        if (origSiteKey) process.env.TURNSTILE_SITE_KEY = origSiteKey; else delete process.env.TURNSTILE_SITE_KEY;
        if (origForce) process.env.TURNSTILE_FORCE_ENABLE = origForce; else delete process.env.TURNSTILE_FORCE_ENABLE;
    }
});

test('Turnstile: Express middleware blocks invalid requests and passes valid ones', async () => {
    process.env.TURNSTILE_FORCE_ENABLE = 'true';
    const originalSecret = process.env.TURNSTILE_SECRET;
    const originalSiteKey = process.env.TURNSTILE_SITE_KEY;
    process.env.TURNSTILE_SECRET = '0x4AAAAAA_dummy_secret';
    process.env.TURNSTILE_SITE_KEY = '0x4AAAAAA_dummy_sitekey';

    try {
        const middleware = turnstileMiddleware({ action: 'test_action' });

        // Test 1: missing token should send 403
        let statusSent = null;
        let jsonSent = null;
        const fakeReq1 = {
            body: {},
            headers: {},
            socket: { remoteAddress: '127.0.0.1' }
        };
        const fakeRes1 = {
            status: (s) => {
                statusSent = s;
                return {
                    json: (j) => {
                        jsonSent = j;
                    }
                };
            }
        };
        let nextCalled = false;
        await middleware(fakeReq1, fakeRes1, () => { nextCalled = true; });

        assert.equal(statusSent, 403);
        assert.equal(jsonSent.code, 'TURNSTILE_TOKEN_MISSING');
        assert.equal(nextCalled, false);

        // Test 2: bypass token calls next
        let nextCalled2 = false;
        process.env.TURNSTILE_BYPASS_TOKEN = 'secret-bypass-456';
        const fakeReq2 = {
            body: {},
            headers: { 'x-turnstile-bypass': 'secret-bypass-456' },
            socket: { remoteAddress: '127.0.0.1' }
        };
        await middleware(fakeReq2, {}, () => { nextCalled2 = true; });
        assert.equal(nextCalled2, true);
    } finally {
        delete process.env.TURNSTILE_FORCE_ENABLE;
        delete process.env.TURNSTILE_BYPASS_TOKEN;
        if (originalSecret) process.env.TURNSTILE_SECRET = originalSecret; else delete process.env.TURNSTILE_SECRET;
        if (originalSiteKey) process.env.TURNSTILE_SITE_KEY = originalSiteKey; else delete process.env.TURNSTILE_SITE_KEY;
    }
});

test('Turnstile: 部分設定/遺漏 siteKey 時，中介層嚴格執行 Fail-Closed 拒絕連線 (503)', async () => {
    process.env.TURNSTILE_FORCE_ENABLE = 'true';
    const origSecret = process.env.TURNSTILE_SECRET;
    const origSiteKey = process.env.TURNSTILE_SITE_KEY;

    try {
        process.env.TURNSTILE_SECRET = '0x4AAAAAA_dummy_secret';
        delete process.env.TURNSTILE_SITE_KEY;

        const middleware = turnstileMiddleware({ action: 'test_action' });
        let statusSent = null;
        let jsonSent = null;
        const fakeReq = {
            body: { 'cf-turnstile-response': 'valid-token' },
            headers: {},
            socket: { remoteAddress: '127.0.0.1' }
        };
        const fakeRes = {
            status: (s) => {
                statusSent = s;
                return { json: (j) => { jsonSent = j; } };
            }
        };
        let nextCalled = false;
        await middleware(fakeReq, fakeRes, () => { nextCalled = true; });

        assert.equal(statusSent, 503);
        assert.equal(jsonSent.code, 'TURNSTILE_CONFIG_INCOMPLETE');
        assert.equal(nextCalled, false);
    } finally {
        delete process.env.TURNSTILE_FORCE_ENABLE;
        if (origSecret) process.env.TURNSTILE_SECRET = origSecret; else delete process.env.TURNSTILE_SECRET;
        if (origSiteKey) process.env.TURNSTILE_SITE_KEY = origSiteKey; else delete process.env.TURNSTILE_SITE_KEY;
    }
});

test('Turnstile: FORCE_ENABLE 且無任何金鑰時，verifyTurnstile 與中介層嚴格執行 Fail-Closed (503)', async () => {
    process.env.TURNSTILE_FORCE_ENABLE = 'true';
    const origSecret = process.env.TURNSTILE_SECRET;
    const origSiteKey = process.env.TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET;
    delete process.env.TURNSTILE_SITE_KEY;

    try {
        // 1. verifyTurnstile 必須拒絕並回傳 503 Fail-Closed
        const verifyRes = await verifyTurnstile({ token: 'mock-token' });
        assert.equal(verifyRes.success, false);
        assert.equal(verifyRes.status, 503);
        assert.equal(verifyRes.code, 'TURNSTILE_CONFIG_INCOMPLETE');

        // 2. 中介層必須回傳 503 Fail-Closed
        const middleware = turnstileMiddleware({ action: 'test_action' });
        let statusSent = null;
        let jsonSent = null;
        const fakeReq = {
            body: { 'cf-turnstile-response': 'mock-token' },
            headers: {},
            socket: { remoteAddress: '127.0.0.1' }
        };
        const fakeRes = {
            status: (s) => {
                statusSent = s;
                return { json: (j) => { jsonSent = j; } };
            }
        };
        let nextCalled = false;
        await middleware(fakeReq, fakeRes, () => { nextCalled = true; });

        assert.equal(statusSent, 503);
        assert.equal(jsonSent.code, 'TURNSTILE_CONFIG_INCOMPLETE');
        assert.equal(nextCalled, false);
    } finally {
        delete process.env.TURNSTILE_FORCE_ENABLE;
        if (origSecret) process.env.TURNSTILE_SECRET = origSecret; else delete process.env.TURNSTILE_SECRET;
        if (origSiteKey) process.env.TURNSTILE_SITE_KEY = origSiteKey; else delete process.env.TURNSTILE_SITE_KEY;
    }
});

test('Turnstile: FORCE_ENABLE 與 TURNSTILE_ENABLED=false 衝突時，優先以 FORCE_ENABLE 嚴格執行 Fail-Closed (503)', async () => {
    process.env.TURNSTILE_FORCE_ENABLE = 'true';
    process.env.TURNSTILE_ENABLED = 'false';
    const origSecret = process.env.TURNSTILE_SECRET;
    const origSiteKey = process.env.TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET;
    delete process.env.TURNSTILE_SITE_KEY;

    try {
        const verifyRes = await verifyTurnstile({ token: 'mock-token' });
        assert.equal(verifyRes.success, false);
        assert.equal(verifyRes.status, 503);
        assert.equal(verifyRes.code, 'TURNSTILE_CONFIG_INCOMPLETE');

        const middleware = turnstileMiddleware({ action: 'test_action' });
        let statusSent = null;
        let jsonSent = null;
        const fakeReq = {
            body: { 'cf-turnstile-response': 'mock-token' },
            headers: {},
            socket: { remoteAddress: '127.0.0.1' }
        };
        const fakeRes = {
            status: (s) => {
                statusSent = s;
                return { json: (j) => { jsonSent = j; } };
            }
        };
        let nextCalled = false;
        await middleware(fakeReq, fakeRes, () => { nextCalled = true; });

        assert.equal(statusSent, 503);
        assert.equal(jsonSent.code, 'TURNSTILE_CONFIG_INCOMPLETE');
        assert.equal(nextCalled, false);
    } finally {
        delete process.env.TURNSTILE_FORCE_ENABLE;
        delete process.env.TURNSTILE_ENABLED;
        if (origSecret) process.env.TURNSTILE_SECRET = origSecret; else delete process.env.TURNSTILE_SECRET;
        if (origSiteKey) process.env.TURNSTILE_SITE_KEY = origSiteKey; else delete process.env.TURNSTILE_SITE_KEY;
    }
});

test('Turnstile: currentHost 綁定檢驗 - 當目前主機為 qi.david888.com 時，即使 allowlist 含 localhost，於 localhost 解出的 token 仍被拒絕', async () => {
    process.env.TURNSTILE_FORCE_ENABLE = 'true';
    const originalSecret = process.env.TURNSTILE_SECRET;
    const originalFetch = global.fetch;
    process.env.TURNSTILE_SECRET = '0x4AAAAAA_dummy_secret';

    try {
        global.fetch = async () => ({
            ok: true,
            json: async () => ({
                success: true,
                hostname: 'localhost',
                action: 'send_email'
            })
        });

        const replayRes = await verifyTurnstile({
            token: 'mock-token',
            currentHost: 'qi.david888.com',
            expectedHostnames: 'qi.david888.com,localhost',
            expectedAction: 'send_email'
        });

        assert.equal(replayRes.success, false);
        assert.equal(replayRes.status, 403);
        assert.equal(replayRes.code, 'TURNSTILE_HOSTNAME_MISMATCH');
        assert.match(replayRes.error, /與目前部署網域/);

        const passRes = await verifyTurnstile({
            token: 'mock-token',
            currentHost: 'localhost:3000',
            expectedHostnames: 'qi.david888.com,localhost',
            expectedAction: 'send_email'
        });
        assert.equal(passRes.success, true);
        assert.equal(passRes.data.hostname, 'localhost');
    } finally {
        delete process.env.TURNSTILE_FORCE_ENABLE;
        process.env.TURNSTILE_SECRET = originalSecret;
        global.fetch = originalFetch;
    }
});

test('Turnstile (方案A): 占卜問答 API 端點維持純淨開放，Telegram / OpenClaw 不受任何 Turnstile 阻擋', async (t) => {
    const http = require('node:http');
    const app = require('../app');
    const server = http.createServer(app);
    let baseUrl;
    try {
        await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, '127.0.0.1', resolve);
        });
        baseUrl = `http://127.0.0.1:${server.address().port}`;
    } catch (err) {
        if (err.code === 'EPERM' || err.code === 'EACCES') {
            if (t && typeof t.skip === 'function') {
                t.skip(`Skipping HTTP listen test: environment restricts local binding (${err.code})`);
            }
            return;
        }
        throw err;
    }

    const originalSiteKey = process.env.TURNSTILE_SITE_KEY;
    const originalSecret = process.env.TURNSTILE_SECRET;

    try {
        // 即便環境強制啟用 Turnstile，*-question 也不得阻擋外部 API 調用（如 Telegram / OpenClaw）
        process.env.TURNSTILE_FORCE_ENABLE = 'true';
        process.env.TURNSTILE_SECRET = '0x4AAAAAA_dummy_secret';
        process.env.TURNSTILE_SITE_KEY = '0x4AAAAAA_dummy_sitekey';

        // 1. 驗證 /api/turnstile/config 端點在啟用時正常回傳 siteKey
        const configRes = await fetch(`${baseUrl}/api/turnstile/config`);
        assert.equal(configRes.status, 200);
        const configData = await configRes.json();
        assert.equal(configData.success, true);
        assert.equal(configData.enabled, true);
        assert.equal(typeof configData.siteKey, 'string');

        // 1b. 驗證 /api/turnstile/config 在停用時回傳 enabled: false 且 siteKey 為 null
        delete process.env.TURNSTILE_FORCE_ENABLE;
        const configDisabledRes = await fetch(`${baseUrl}/api/turnstile/config`);
        const configDisabledData = await configDisabledRes.json();
        assert.equal(configDisabledData.enabled, false);
        assert.equal(configDisabledData.siteKey, null);
        process.env.TURNSTILE_FORCE_ENABLE = 'true';

        // 2. 測試 /api/qimen-question 在不提供任何 Turnstile token 的情況下直接呼叫
        // 應進入正常業務驗證（如缺少 question 參數回傳 400），而絕對不能被 403 Turnstile 擋下
        const qimenRes = await fetch(`${baseUrl}/api/qimen-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        assert.notEqual(qimenRes.status, 403, '不得因缺少 Turnstile token 而回傳 403');
        assert.equal(qimenRes.status, 400, '應正常回傳業務參數驗證 400');
        const qimenData = await qimenRes.json();
        assert.notEqual(qimenData.code, 'TURNSTILE_TOKEN_MISSING');
    } finally {
        delete process.env.TURNSTILE_FORCE_ENABLE;
        if (originalSiteKey !== undefined) {
            process.env.TURNSTILE_SITE_KEY = originalSiteKey;
        } else {
            delete process.env.TURNSTILE_SITE_KEY;
        }
        if (originalSecret !== undefined) {
            process.env.TURNSTILE_SECRET = originalSecret;
        } else {
            delete process.env.TURNSTILE_SECRET;
        }
        await new Promise((resolve) => server.close(resolve));
    }
});

