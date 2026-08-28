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

test('所有獨立 CLI 腳本（bazi, qimen, ziwei, fengshui, yinyuan, tarot）均可正常獨立執行', () => {
    const { execSync } = require('child_process');

    const fsStdout = execSync('node skills/fengshui-consultant/scripts/fengshui_cli.js --mode yangzhai --facing 南', { encoding: 'utf-8' });
    const fsRes = JSON.parse(fsStdout);
    assert.equal(fsRes.eightMansions.house, '坎宅');

    const yyStdout = execSync('node skills/yinyuan-consultant/scripts/yinyuan_cli.js --mode fortune --seed 12345', { encoding: 'utf-8' });
    const yyRes = JSON.parse(yyStdout);
    assert.ok(yyRes.poem);

    const zwStdout = execSync('node skills/ziwei-consultant/scripts/ziwei_cli.js --date 1990-05-15 --time 12:00', { encoding: 'utf-8' });
    const zwRes = JSON.parse(zwStdout);
    assert.equal(zwRes.bureau, '土五局');

    const bzStdout = execSync('node skills/bazi2-consultant/scripts/bazi_cli.js --date 1990-05-15 --time 12:00', { encoding: 'utf-8' });
    const bzRes = JSON.parse(bzStdout);
    assert.equal(bzRes.fourPillars.length, 4);

    const qmStdout = execSync('node skills/qimen-consultant/scripts/qimen_cli.js --time-input "2026-08-28 15:00:00"', { encoding: 'utf-8' });
    const qmRes = JSON.parse(qmStdout);
    assert.equal(qmRes.schema_version, 'mainline-cn-v1');
    assert.ok(qmRes.chart.palaces.length === 9);

    const trStdout = execSync('node skills/tarot-consultant/scripts/tarot_cli.js --spread three --seed 999', { encoding: 'utf-8' });
    const trRes = JSON.parse(trStdout);
    assert.equal(trRes.cards.length, 3);
});
