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
    ['ziwei-consultant', 'ask_ziwei.js'],
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
