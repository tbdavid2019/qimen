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
