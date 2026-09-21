const test = require('node:test');
const assert = require('node:assert/strict');
const {
    generateConversationEmailHtml,
    simpleMarkdownToEmailHtml,
    sendConversationEmail
} = require('../lib/email');

test('Email Service: simpleMarkdownToEmailHtml 正確轉換語法並跳脫 HTML', () => {
    const md = '## 結論分析\n**吉凶判斷**：大吉\n> 把握辰時行動\n- 事項一\n- 事項二\n<script>alert("xss")</script>';
    const html = simpleMarkdownToEmailHtml(md);

    assert.ok(html.includes('<h3 style="color:#8c432a;'), '應該轉換 ## 為 h3 標題');
    assert.ok(html.includes('<strong style="color:#2d2a26;'), '應該轉換 ** 為 strong 粗體');
    assert.ok(html.includes('<blockquote'), '應該轉換 > 為 blockquote');
    assert.ok(html.includes('<li'), '應該轉換列表項目');
    assert.ok(!html.includes('<script>'), '必須安全跳脫 script 標籤');
    assert.ok(html.includes('&lt;script&gt;'), 'script 應轉換為實體字元');
});

test('Email Service: markdownToEmailHtml 支援 Markdown 表格與行內樣式渲染', () => {
    const tableMd = '### 盤面分析\n\n| 項目 | 狀態 | 吉凶 |\n| :--- | :---: | ---: |\n| 開門 | 乾宮生旺 | 大吉 |\n| 六合 | 相生相助 | 吉 |';
    const html = simpleMarkdownToEmailHtml(tableMd);

    assert.ok(html.includes('<table style='), '必須包含 table 標籤與行內樣式');
    assert.ok(html.includes('<th style='), '必須包含 th 與行內樣式');
    assert.ok(html.includes('<td style='), '必須包含 td 與行內樣式');
    assert.ok(html.includes('乾宮生旺'), '必須保留儲存格內容');
});

test('Email Service: generateConversationEmailHtml 完整生成含品牌與對話之郵件模板', () => {
    const html = generateConversationEmailHtml({
        serviceName: '奇門遁甲',
        chartSummary: {
            date: '2026-09-21 16:30',
            dun: '陰遁二局',
            zhifu: '天蓬星',
            zhishi: '休門',
            category: '工作事業'
        },
        history: [
            { role: 'user', content: '請問我換工作的時機好嗎？' },
            { role: 'assistant', content: '## 卦象分析\n開門在乾宮生旺，利於主動出擊。' }
        ]
    });

    assert.ok(html.includes('333 一句提醒 · 照見當下'), '應包含品牌標語');
    assert.ok(html.includes('奇門遁甲 命理諮詢對話紀錄'), '應包含服務名稱');
    assert.ok(html.includes('陰遁二局'), '應包含遁局資訊');
    assert.ok(html.includes('天蓬星'), '應包含值符資訊');
    assert.ok(html.includes('請問我換工作的時機好嗎？'), '應包含用戶提問');
    assert.ok(html.includes('開門在乾宮生旺'), '應包含大師解讀內容');
});

test('Email Service: sendConversationEmail 驗證必要參數與未設定 API Key 時的防護', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    try {
        delete process.env.RESEND_API_KEY;

        // 1. 未設定 API Key
        const resultNoKey = await sendConversationEmail({
            to: 'test@example.com',
            history: [{ role: 'user', content: '你好' }]
        });
        assert.equal(resultNoKey.success, false);
        assert.ok(resultNoKey.error.includes('RESEND_API_KEY'), '應明確告知未配置 RESEND_API_KEY');

        // 模擬設置 API Key 進行參數校驗
        process.env.RESEND_API_KEY = 're_mock_test_key_12345';

        // 2. 無效 Email
        const resultBadEmail = await sendConversationEmail({
            to: 'invalid-email-address',
            history: [{ role: 'user', content: '你好' }]
        });
        assert.equal(resultBadEmail.success, false);
        assert.ok(resultBadEmail.error.includes('有效'), '應拒絕無效 Email');

        // 3. 空對話紀錄
        const resultEmptyHistory = await sendConversationEmail({
            to: 'valid@example.com',
            history: []
        });
        assert.equal(resultEmptyHistory.success, false);
        assert.ok(resultEmptyHistory.error.includes('空白'), '應拒絕空白對話');

    } finally {
        if (originalKey !== undefined) {
            process.env.RESEND_API_KEY = originalKey;
        } else {
            delete process.env.RESEND_API_KEY;
        }
    }
});

test('Email Service: sendConversationEmail 成功調用 Resend API Mock', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFetch = global.fetch;

    try {
        process.env.RESEND_API_KEY = 're_mock_test_key';
        
        let calledUrl = '';
        let calledBody = null;
        let authHeader = '';

        global.fetch = async (url, options) => {
            calledUrl = url;
            calledBody = JSON.parse(options.body);
            authHeader = options.headers['Authorization'];

            return {
                ok: true,
                status: 200,
                json: async () => ({ id: 'email_mock_id_98765' })
            };
        };

        const result = await sendConversationEmail({
            to: 'client@example.com',
            serviceName: '奇門遁甲',
            chartSummary: '陰遁二局 · 直符天蓬',
            history: [
                { role: 'user', content: '近期財運如何？' },
                { role: 'assistant', content: '生門落艮八宮，財源穩健。' }
            ]
        });

        assert.equal(result.success, true);
        assert.equal(result.id, 'email_mock_id_98765');
        assert.equal(calledUrl, 'https://api.resend.com/emails');
        assert.equal(authHeader, 'Bearer re_mock_test_key');
        assert.deepEqual(calledBody.to, ['client@example.com']);
        assert.equal(calledBody.from, '333 一句提醒·照見當下 <onboarding@resend.dev>');
        assert.ok(calledBody.subject.includes('333 一句提醒·照見當下'));
        assert.ok(calledBody.html.includes('生門落艮八宮'));

    } finally {
        global.fetch = originalFetch;
        if (originalKey !== undefined) {
            process.env.RESEND_API_KEY = originalKey;
        } else {
            delete process.env.RESEND_API_KEY;
        }
    }
});

test('HTTP Route: POST /api/conversation/send-email 驗證與處理', async () => {
    const http = require('node:http');
    const app = require('../app');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const originalKey = process.env.RESEND_API_KEY;
    const originalFetch = global.fetch;

    try {
        // 1. 未設置 API KEY 時回傳 400 並帶友善錯誤
        delete process.env.RESEND_API_KEY;
        const resNoKey = await fetch(`${baseUrl}/api/conversation/send-email`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                history: [{ role: 'user', content: 'hello' }]
            })
        });
        assert.equal(resNoKey.status, 400);
        const dataNoKey = await resNoKey.json();
        assert.equal(dataNoKey.success, false);
        assert.ok(dataNoKey.error.includes('RESEND_API_KEY'));

        // 2. 缺少 Email
        process.env.RESEND_API_KEY = 're_test_key_123';
        const resNoEmail = await fetch(`${baseUrl}/api/conversation/send-email`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                history: [{ role: 'user', content: 'hello' }]
            })
        });
        assert.equal(resNoEmail.status, 400);
        const dataNoEmail = await resNoEmail.json();
        assert.equal(dataNoEmail.success, false);

        // 3. 成功寄送 (Mock Fetch)
        global.fetch = async (url, options) => {
            // 若請求為內部 server 測試，放行
            if (typeof url === 'string' && url.includes('127.0.0.1')) {
                return originalFetch(url, options);
            }
            return {
                ok: true,
                status: 200,
                json: async () => ({ id: 're_msg_777' })
            };
        };

        const resSuccess = await originalFetch(`${baseUrl}/api/conversation/send-email`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                email: 'user@example.com',
                service: '奇門遁甲',
                chartSummary: '陰遁二局',
                history: [
                    { role: 'user', content: '今年如何？' },
                    { role: 'assistant', content: '大吉。' }
                ]
            })
        });

        assert.equal(resSuccess.status, 200);
        const dataSuccess = await resSuccess.json();
        assert.equal(dataSuccess.success, true);
        assert.equal(dataSuccess.id, 're_msg_777');

    } finally {
        global.fetch = originalFetch;
        if (originalKey !== undefined) {
            process.env.RESEND_API_KEY = originalKey;
        } else {
            delete process.env.RESEND_API_KEY;
        }
        await new Promise((resolve) => server.close(resolve));
    }
});
