const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const http = require('node:http');
const app = require('../app');
const {
    fetchProviderModels,
    createByokLlmService,
    resolveLlmService,
    validateBaseURL,
    isPrivateOrReservedIP,
    createSafeLookup
} = require('../lib/byok');
const LLMAnalysisService = require('../lib/llm-analysis');

let server;
let baseUrl;

test.before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
    await new Promise((resolve) => server.close(resolve));
});

test('BYOK: validateBaseURL 嚴格阻擋各類 SSRF 惡意端點 (IPv4/IPv6/環回/保留網段/元數據)', () => {
    const maliciousUrls = [
        'http://localhost:8080/v1',
        'http://localhost.:8080/v1',
        'http://127.0.0.1:8080/v1',
        'http://127.1:8080/v1',
        'http://0.0.0.0:8080/v1',
        'http://[::1]:8080/v1',
        'http://[::]:8080/v1',
        'http://[::ffff:127.0.0.1]:8080/v1',
        'http://[fd00::1]/v1',
        'http://[fe80::1]/v1',
        'http://169.254.169.254/latest/meta-data',
        'http://metadata.google.internal/computeMetadata/v1',
        'http://10.0.0.1/v1',
        'http://192.168.1.100/v1',
        'http://172.16.0.1/v1',
        'http://172.31.255.255/v1',
        'ftp://api.example.com/v1'
    ];

    for (const url of maliciousUrls) {
        assert.throws(
            () => validateBaseURL(url),
            /禁止|端點網址協議僅支援/,
            `網址 ${url} 應被阻擋但未被阻擋`
        );
    }

    // 合法網址應正常通過正規化
    assert.equal(validateBaseURL('https://api.openai.com/v1/'), 'https://api.openai.com/v1');
    assert.equal(validateBaseURL('https://api.groq.com/openai/v1'), 'https://api.groq.com/openai/v1');
    assert.equal(validateBaseURL(''), null);
});

test('BYOK: fetchProviderModels 缺少 API Key 時拋出明確錯誤', async () => {
    await assert.rejects(
        () => fetchProviderModels({ provider: 'groq', apiKey: '' }),
        /請提供 API Key/
    );
});

test('BYOK: fetchProviderModels 不支援的供應商拋錯', async () => {
    await assert.rejects(
        () => fetchProviderModels({ provider: 'unknown-vendor', apiKey: 'test-key' }),
        /不支援的供應商/
    );
});

test('BYOK: fetchProviderModels 支援 OpenAI / Groq 格式模型清單解析', async () => {
    const originalGet = axios.get;
    axios.get = async (url, options) => {
        assert.equal(options.headers.Authorization, 'Bearer mock-key');
        return {
            data: {
                data: [
                    { id: 'model-b' },
                    { id: 'model-a' }
                ]
            }
        };
    };

    try {
        const models = await fetchProviderModels({ provider: 'groq', apiKey: 'mock-key' });
        assert.deepEqual(models, ['model-a', 'model-b']);
    } finally {
        axios.get = originalGet;
    }
});

test('BYOK: fetchProviderModels 支援 Google Gemini 格式模型清單解析 (Header 傳遞憑證)', async () => {
    const originalGet = axios.get;
    axios.get = async (url, options) => {
        assert.ok(url.includes('generativelanguage.googleapis.com'));
        assert.equal(options.headers['x-goog-api-key'], 'mock-gemini-key');
        return {
            data: {
                models: [
                    { name: 'models/gemini-2.5-flash' },
                    { name: 'models/gemini-1.5-pro' },
                    { name: 'models/text-embedding-004' } // 應過濾 embedding
                ]
            }
        };
    };

    try {
        const models = await fetchProviderModels({ provider: 'gemini', apiKey: 'mock-gemini-key' });
        assert.deepEqual(models, ['gemini-1.5-pro', 'gemini-2.5-flash']);
    } finally {
        axios.get = originalGet;
    }
});

test('BYOK: resolveLlmService 在無 BYOK 金鑰時回傳預設服務', () => {
    const defaultService = new LLMAnalysisService({ provider: 'groq', apiKey: 'default' });
    const req = { headers: {}, body: {} };
    const resolved = resolveLlmService(req, defaultService);
    assert.equal(resolved, defaultService);
});

test('BYOK: resolveLlmService 正確解析 body-only 設定並先取值再刪除', () => {
    const defaultService = new LLMAnalysisService({ provider: 'groq', apiKey: 'default' });
    const req = {
        headers: {},
        body: {
            question: '測試問題',
            byok: {
                provider: 'gemini',
                apiKey: 'body-gemini-key',
                model: 'gemini-2.5-pro'
            }
        }
    };
    const resolved = resolveLlmService(req, defaultService);
    assert.notEqual(resolved, defaultService);
    assert.equal(resolved.provider, 'gemini');
    assert.equal(resolved.apiKey, 'body-gemini-key');
    assert.equal(resolved.model, 'gemini-2.5-pro');
    // 零持久化防護：req.body.byok 必須被安全清除
    assert.equal(req.body.byok, undefined);
});

test('BYOK: resolveLlmService 解析 headers 中的自備金鑰並落實無痕防護', () => {
    const defaultService = new LLMAnalysisService({ provider: 'groq', apiKey: 'default' });
    const req = {
        headers: {
            'x-byok-provider': 'gemini',
            'x-byok-key': 'user-secret-key-123',
            'x-byok-model': 'custom-model-x'
        },
        body: {
            question: '測試問題',
            byok: { apiKey: 'user-secret-key-123' }
        }
    };
    const resolved = resolveLlmService(req, defaultService);
    assert.notEqual(resolved, defaultService);
    assert.equal(resolved.provider, 'gemini');
    assert.equal(resolved.apiKey, 'user-secret-key-123');
    assert.equal(resolved.model, 'custom-model-x');
    // 零持久化防護：req.body.byok 必須被安全清除
    assert.equal(req.body.byok, undefined);
});

test('BYOK API: POST /api/byok/models 驗證缺少 API Key 回傳 400', async () => {
    const res = await fetch(`${baseUrl}/api/byok/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'groq', apiKey: '' })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /API Key/);
});

test('BYOK API: POST /api/byok/test 驗證連線失敗回傳 400 錯誤結構 (Mock 隔離)', async () => {
    const originalPost = axios.post;
    axios.post = async () => {
        const error = new Error('Request failed with status code 401');
        error.response = { status: 401, data: { error: { message: 'Invalid API Key' } } };
        throw error;
    };

    try {
        const res = await fetch(`${baseUrl}/api/byok/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: 'groq', apiKey: 'invalid-key-xyz' })
        });
        assert.equal(res.status, 400);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.ok(data.error);
    } finally {
        axios.post = originalPost;
    }
});

test('BYOK: 覆蓋 qwen、custom/ollama 強制驗證 BaseURL、SSRF DNS 防護與前端白名單對齊', async () => {
    const fs = require('node:fs');
    const path = require('node:path');

    await assert.rejects(() => fetchProviderModels({ provider: 'custom', apiKey: 'k' }), /Base URL/);
    await assert.rejects(() => fetchProviderModels({ provider: 'ollama', apiKey: 'k' }), /Base URL/);

    const originalEnvBaseUrl = process.env.LLM_BASE_URL;
    const originalGet = axios.get;
    let capturedGetCall = null;
    axios.get = async (url, config) => {
        capturedGetCall = { url, config };
        return { data: { data: [{ id: 'qwen-max' }, { id: 'qwen-plus' }] } };
    };
    process.env.LLM_BASE_URL = 'https://internal-gateway.invalid/v1';

    try {
        const models = await fetchProviderModels({ provider: 'qwen', apiKey: 'qwen-secret-key' });
        assert.deepEqual(models, ['qwen-max', 'qwen-plus']);
        assert.equal(capturedGetCall.url, 'https://dashscope.aliyuncs.com/compatible-mode/v1/models');
        assert.equal(capturedGetCall.config.headers.Authorization, 'Bearer qwen-secret-key');
        assert.equal(capturedGetCall.config.maxRedirects, 0);
        assert.ok(capturedGetCall.config.httpsAgent);

        const groqLlm = resolveLlmService({
            headers: {},
            body: { byok: { provider: 'groq', apiKey: 'gsk-user-key' } }
        }, null);
        assert.equal(groqLlm.baseURL, 'https://api.groq.com/openai/v1');
        assert.ok(groqLlm.httpsAgent);

        const openaiLlm = resolveLlmService({
            headers: {},
            body: { byok: { provider: 'openai', apiKey: 'sk-user-key' } }
        }, null);
        assert.equal(openaiLlm.baseURL, 'https://api.openai.com/v1');

        assert.throws(
            () => createByokLlmService({ provider: 'custom', apiKey: 'k' }),
            (err) => err.statusCode === 400 && /Base URL/.test(err.message)
        );
        assert.throws(
            () => createByokLlmService({ provider: 'ollama', apiKey: 'k' }),
            (err) => err.statusCode === 400 && /Base URL/.test(err.message)
        );
    } finally {
        axios.get = originalGet;
        if (originalEnvBaseUrl === undefined) delete process.env.LLM_BASE_URL;
        else process.env.LLM_BASE_URL = originalEnvBaseUrl;
    }

    assert.equal(isPrivateOrReservedIP('127.0.0.1'), true);
    assert.equal(isPrivateOrReservedIP('169.254.169.254'), true);
    assert.equal(isPrivateOrReservedIP('::ffff:127.0.0.1'), true);
    assert.equal(isPrivateOrReservedIP('100.64.0.1'), true);
    assert.equal(isPrivateOrReservedIP('8.8.8.8'), false);

    const blockedLookup = createSafeLookup((_host, _opts, cb) => cb(null, [{ address: '169.254.169.254', family: 4 }]));
    await new Promise((resolve, reject) => {
        blockedLookup('rebind.example.com', {}, (err) => {
            try {
                assert.ok(err);
                assert.equal(err.code, 'BYOK_SSRF_BLOCKED');
                resolve();
            } catch (assertErr) {
                reject(assertErr);
            }
        });
    });

    const byokClient = fs.readFileSync(path.join(__dirname, '..', 'public/js/byok.js'), 'utf8');
    for (const route of ['/api/ziwei-question', '/api/tarot-question', '/api/fengshui-question', '/api/bazi2-question', '/api/saju-question', '/api/name-analysis-question', '/api/wellness-question', '/api/ziwei/domain', '/api/liuyao', '/api/liuyao/reading']) {
        assert.ok(byokClient.includes(route), `public/js/byok.js 應涵蓋 ${route}`);
    }

    const llmSource = fs.readFileSync(path.join(__dirname, '..', 'lib/llm-analysis.js'), 'utf8');
    assert.match(llmSource, /maxRedirects:\s*0/);
});

test('BYOK: /api/name-analysis-question 攜帶 BYOK 時在未設定伺服器 LLM 與啟用 Turnstile 下仍免 token 放行', async () => {
    const originalPost = axios.post;
    const originalForce = process.env.TURNSTILE_FORCE_ENABLE;
    const originalSecret = process.env.TURNSTILE_SECRET;
    const originalSiteKey = process.env.TURNSTILE_SITE_KEY;

    process.env.TURNSTILE_FORCE_ENABLE = 'true';
    process.env.TURNSTILE_SECRET = '0x4AAAAAA_dummy_secret';
    process.env.TURNSTILE_SITE_KEY = '0x4AAAAAA_dummy_sitekey';
    axios.post = async () => ({
        data: { choices: [{ message: { content: 'BYOK 測字解析完成' }, finish_reason: 'stop' }] }
    });

    try {
        const res = await fetch(`${baseUrl}/api/name-analysis-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'cezi',
                character: '安',
                question: '事業方向',
                byok: { provider: 'openai', apiKey: 'sk-byok-test', model: 'gpt-4o-mini' }
            })
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.analysis, 'BYOK 測字解析完成');
    } finally {
        axios.post = originalPost;
        if (originalForce === undefined) delete process.env.TURNSTILE_FORCE_ENABLE;
        else process.env.TURNSTILE_FORCE_ENABLE = originalForce;
        if (originalSecret === undefined) delete process.env.TURNSTILE_SECRET;
        else process.env.TURNSTILE_SECRET = originalSecret;
        if (originalSiteKey === undefined) delete process.env.TURNSTILE_SITE_KEY;
        else process.env.TURNSTILE_SITE_KEY = originalSiteKey;
    }
});

test('BYOK: removeVerificationTokens 與 service-question 不傳送 byok 金鑰給 Discord', async () => {
    const { createServiceQuestionHandler } = require('../lib/service-question');
    const sentInputs = [];
    const handler = createServiceQuestionHandler({
        moduleName: '測試模組',
        calculate: () => ({ ok: true }),
        analyze: async () => ({ success: true, analysis: '測試結果', provider: 'openai', model: 'gpt-4o-mini' }),
        discord: {
            isEnabled: () => true,
            sendDivinationRecord: async (_mod, input) => {
                sentInputs.push(input);
                return { success: true };
            }
        }
    });

    const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.payload = payload; return this; }
    };
    await handler({
        query: {},
        body: { question: '測試', byok: { provider: 'openai', apiKey: 'sk-secret-do-not-leak' } }
    }, res);

    assert.equal(sentInputs.length, 1);
    assert.equal(sentInputs[0].byok, undefined);
});
