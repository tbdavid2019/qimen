const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const skills = [
    ['qimen-consultant', 'ask_qimen.js'],
    ['meihua-consultant', 'ask_meihua.js'],
    ['tarot-consultant', 'ask_tarot.js'],
    ['fengshui-consultant', 'ask_fengshui.js'],
    ['bazi2-consultant', 'ask_bazi2.js'],
    ['yinyuan-consultant', 'ask_yinyuan.js'],
    ['answerbook-consultant', 'ask_answerbook.js']
];

test('新增服務都有 JavaScript Skill 與獨立腳本', () => {
    for (const [skillName, scriptName] of skills) {
        const skillPath = path.join(root, 'skills', skillName, 'SKILL.md');
        const scriptPath = path.join(root, 'skills', skillName, 'scripts', scriptName);
        assert.equal(fs.existsSync(skillPath), true, `${skillName} 缺少 SKILL.md`);
        assert.equal(fs.existsSync(scriptPath), true, `${skillName} 缺少 ${scriptName}`);
        const content = fs.readFileSync(skillPath, 'utf8');
        assert.match(content, new RegExp(`name:\\s*${skillName}`));
        assert.match(content, /description:\s*.+/);
        assert.match(content, /POST\s+\/api\//);
    }
});

test('Skill 腳本只使用 Node.js JavaScript，不依賴 Python', () => {
    for (const [skillName, scriptName] of skills) {
        const scriptPath = path.join(root, 'skills', skillName, 'scripts', scriptName);
        if (!fs.existsSync(scriptPath)) continue;
        const content = fs.readFileSync(scriptPath, 'utf8');
        assert.doesNotMatch(content, /python|\.py\b/i, skillName);
        assert.match(content, /fetch\(/, skillName);
    }
});

test('API /api/skills 回傳完整的 7 大 Skills 清單與協議端點', async () => {
    const http = require('node:http');
    const app = require('../app');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    try {
        const res = await fetch(`http://127.0.0.1:${port}/api/skills`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(data.hub);
        assert.equal(data.skills.length, 7);
        const names = data.skills.map(s => s.name);
        for (const [skillName] of skills) {
            assert.ok(names.includes(skillName), `缺少 skill: ${skillName}`);
        }
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('全站頁面 Footer 均提供 Skills 總體與 7 大獨立功能導覽卡片', () => {
    const footerHtml = fs.readFileSync(path.join(root, 'views', 'partials', 'site-footer.html'), 'utf8');
    assert.match(footerHtml, /site-footer-skills-hub/);
    assert.match(footerHtml, /Skills 總體倉庫/);
    for (const [skillName] of skills) {
        assert.match(footerHtml, new RegExp(skillName));
    }
});
