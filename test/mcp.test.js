const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sourcePath = path.join(__dirname, '..', 'mcp', 'src', 'tools', 'divination.ts');
const distPath = path.join(__dirname, '..', 'mcp', 'dist', 'tools', 'divination.js');
const bridgePath = path.join(__dirname, '..', 'mcp-bridge.js');

test('MCP source 包含新增服務工具與完整欄位', () => {
    const source = fs.readFileSync(sourcePath, 'utf8');
    for (const toolName of ['tarot_divination', 'fengshui_consultation', 'bazi2_analysis', 'ziwei_analysis', 'yinyuan_reading', 'answerbook_reading']) {
        assert.match(source, new RegExp(`registerTool\\(\\s*"${toolName}"`), toolName);
    }
    for (const field of ['spread', 'facing', 'moveInYear', 'residentYear', 'date', 'time', 'sex', 'mode', 'firstYear', 'secondYear']) {
        assert.match(source, new RegExp(`\\b${field}\\b`), field);
    }
    assert.match(source, /tarot-question/);
    assert.match(source, /fengshui-question/);
    assert.match(source, /bazi2-question/);
    assert.match(source, /ziwei-question/);
    assert.match(source, /yinyuan-question/);
    assert.match(source, /answerbook-question/);
    assert.match(source, /direct/);
});

test('MCP 編譯輸出同步存在', () => {
    assert.equal(fs.existsSync(distPath), true);
});

test('零依賴 MCP bridge 也包含八個服務工具', () => {
    const bridge = fs.readFileSync(bridgePath, 'utf8');
    for (const toolName of ['qimen_divination', 'meihua_divination', 'tarot_divination', 'fengshui_consultation', 'bazi2_analysis', 'ziwei_analysis', 'yinyuan_reading', 'answerbook_reading']) {
        assert.match(bridge, new RegExp(`name: ["']${toolName}["']`), toolName);
    }
    for (const endpoint of ['tarot-question', 'fengshui-question', 'bazi2-question', 'ziwei-question', 'yinyuan-question', 'answerbook-question']) {
        assert.match(bridge, new RegExp(endpoint), endpoint);
    }
});

test('WebMCP 官方 MCP source/dist 與 bridge 均宣告確定性風水佈局工具', () => {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const dist = fs.readFileSync(distPath, 'utf8');
    const bridge = fs.readFileSync(bridgePath, 'utf8');
    assert.match(source, /registerTool\(\s*"fengshui_layout_evaluation"/);
    assert.match(source, /FengShuiLayoutEvaluationSchema/);
    assert.match(source, /fengshui\/evaluate-layout/);
    assert.match(dist, /registerTool\("fengshui_layout_evaluation"/);
    assert.match(dist, /fengshui\/evaluate-layout/);
    assert.match(bridge, /name: "fengshui_layout_evaluation"/);
    assert.match(bridge, /fengshui\/evaluate-layout/);
    for (const content of [source, dist, bridge]) {
        assert.match(content, /layoutObjects/);
        assert.match(content, /maxItems: 9|max\(9\)/);
    }
});

test('WebMCP 官方 MCP source/dist 與 bridge 均宣告紫微斗數男生尺寸評估工具', () => {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const dist = fs.readFileSync(distPath, 'utf8');
    const bridge = fs.readFileSync(bridgePath, 'utf8');
    assert.match(source, /registerTool\(\s*"ziwei_male_size"/);
    assert.match(source, /ZiweiMaleSizeInputSchema/);
    assert.match(source, /ziwei\/male-size/);
    assert.match(dist, /registerTool\("ziwei_male_size"/);
    assert.match(dist, /ziwei\/male-size/);
    assert.match(bridge, /name: "ziwei_male_size"/);
    assert.match(bridge, /ziwei\/male-size/);
});

test('MCP source/dist 與 bridge 對齊奇門與梅花真實端點及參數轉發', () => {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const dist = fs.readFileSync(distPath, 'utf8');
    const bridge = fs.readFileSync(bridgePath, 'utf8');

    assert.doesNotMatch(source, /makeApiRequest<QimenResponse>\(\s*["']ask["']/);
    assert.doesNotMatch(dist, /makeApiRequest\(["']ask["']/);
    assert.match(source, /makeApiRequest<QimenResponse>\(\s*"qimen-question"/);
    assert.match(dist, /makeApiRequest\("qimen-question"/);
    assert.match(source, /method:\s*z\.enum\(\["time",\s*"number",\s*"text"\]\)/);

    assert.doesNotMatch(bridge, /enum:\s*\["time",\s*"numbers",\s*"text"\]/);
    assert.match(bridge, /mode:\s*args\.mode\s*\|\|\s*'advanced'/);
    assert.match(bridge, /method:\s*normalizedMethod/);
    assert.match(bridge, /num1:\s*\{/);
});

test('POST /api/qimen-question 與 /api/meihua-question 實際轉發 conversationHistory 給分析服務', async () => {
    const http = require('node:http');
    const axios = require('axios');
    const app = require('../app');

    const capturedPayloads = [];
    const originalPost = axios.post;
    axios.post = async (url, payload) => {
        capturedPayloads.push({ url, payload });
        return {
            data: {
                choices: [{ message: { content: '模擬解讀回覆' }, finish_reason: 'stop' }]
            }
        };
    };

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const base = `http://127.0.0.1:${port}`;
    const history = [
        { role: 'user', content: '上一輪問題' },
        { role: 'assistant', content: '上一輪回覆' }
    ];

    try {
        const qimenRes = await fetch(`${base}/api/qimen-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: '續問奇門',
                datetime: '2026-10-10T10:00:00',
                conversationHistory: history,
                byok: { provider: 'openai', apiKey: 'sk-test-1234', model: 'gpt-4o-mini' }
            })
        });
        assert.equal(qimenRes.status, 200);

        const meihuaRes = await fetch(`${base}/api/meihua-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: '續問梅花',
                method: 'number',
                num1: 3,
                num2: 5,
                conversationHistory: history,
                byok: { provider: 'openai', apiKey: 'sk-test-1234', model: 'gpt-4o-mini' }
            })
        });
        assert.equal(meihuaRes.status, 200);

        assert.equal(capturedPayloads.length, 2);
        for (const call of capturedPayloads) {
            assert.equal(call.url, 'https://api.openai.com/v1/chat/completions');
            const contents = call.payload.messages.map((m) => m.content);
            assert.ok(contents.includes('上一輪問題'), '應將前輪 user 歷史傳入 LLM messages');
            assert.ok(contents.includes('上一輪回覆'), '應將前輪 assistant 歷史傳入 LLM messages');
        }
    } finally {
        axios.post = originalPost;
        await new Promise((resolve) => server.close(resolve));
    }
});
