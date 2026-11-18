const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const http = require('node:http');

const root = path.join(__dirname, '..');
const skills = [
    ['qimen-consultant', 'ask_qimen.js'],
    ['meihua-consultant', 'ask_meihua.js'],
    ['tarot-consultant', 'ask_tarot.js'],
    ['fengshui-consultant', 'ask_fengshui.js'],
    ['bazi2-consultant', 'ask_bazi2.js'],
    ['ziwei-consultant', 'ask_ziwei.js'],
    ['yinyuan-consultant', 'ask_yinyuan.js'],
    ['answerbook-consultant', 'ask_answerbook.js'],
    ['liuyao-consultant', 'ask_liuyao.js'],
    ['name-analysis-consultant', 'ask_name_analysis.js']
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
        assert.match(content, /npx -y 888qi-fortune@latest update --if-stale/, `${skillName} SKILL.md 缺少 update --if-stale 指引`);
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

test('共用 Skill CLI 輸入解析器支援 JSON、旗標與位置參數', async () => {
    const { readCliInput } = require('../skills/_shared/cli-input');
    assert.deepEqual(
        await readCliInput(['{"question":"測試","date":"1990-05-15"}'], [], {}),
        { question: '測試', date: '1990-05-15' }
    );
    assert.deepEqual(
        await readCliInput(['--mode', 'zeri', '--zeri-year', '2026', '--allow-unknown-hour'], [], {}),
        { mode: 'zeri', zeriYear: '2026', allowUnknownHour: true }
    );
    assert.deepEqual(
        await readCliInput(['問題', 'number', '事業'], ['question', 'method', 'purpose'], {}),
        { question: '問題', method: 'number', purpose: '事業' }
    );
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

    const lyLocalStdout = execSync('node skills/liuyao-consultant/scripts/liuyao_cli.js --lines 789687 --question 測試', { encoding: 'utf-8' });
    const lyLocalRes = JSON.parse(lyLocalStdout);
    assert.equal(lyLocalRes.benGua.name, '山火賁');
    assert.equal(lyLocalRes.zhuxiRule.movingCount, 2);

    const bzWellnessStdout = execSync('node skills/bazi2-consultant/scripts/bazi_cli.js --mode wellness --date 1990-05-15', { encoding: 'utf-8' });
    const bzWellnessRes = JSON.parse(bzWellnessStdout);
    assert.ok(bzWellnessRes.annualYunqi);
    assert.ok(bzWellnessRes.meridianClock);

    const ceziStdout = execSync('node skills/name-analysis-consultant/scripts/name_analysis_cli.js --cezi --char 安 --question 轉職', { encoding: 'utf-8' });
    const ceziRes = JSON.parse(ceziStdout);
    assert.equal(ceziRes.success, true);
    assert.equal(ceziRes.result.char, '安');

    const lyStdout = execSync('node skills/liuyao-consultant/scripts/ask_liuyao.js --lines 789687 --question 測試', { encoding: 'utf-8' });
    const lyRes = JSON.parse(lyStdout);
    assert.equal(lyRes.result.benGua.name, '山火賁');
});

test('風水 Skill evaluate-layout 模式路由本地 API 且不要求 question', async () => {
    const requests = [];
    const server = http.createServer((req, res) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            requests.push({ method: req.method, url: req.url, body: JSON.parse(body) });
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ success: true, layoutEvaluation: { findings: [] } }));
        });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const { execFile } = require('node:child_process');
    const { promisify } = require('node:util');
    const run = promisify(execFile);
    try {
        const baseUrl = `http://127.0.0.1:${server.address().port}`;
        await run(process.execPath, [
            path.join(root, 'skills/fengshui-consultant/scripts/ask_fengshui.js'),
            JSON.stringify({ mode: 'evaluate-layout', layoutObjects: { '南': ['door.main'] } })
        ], { env: { ...process.env, QIMEN_API_BASE_URL: baseUrl } });
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].url, '/api/fengshui/evaluate-layout');
    assert.equal(requests[0].body.mode, 'evaluate-layout');
    assert.equal(requests[0].body.question, undefined);
    assert.deepEqual(requests[0].body.layoutObjects, { '南': ['door.main'] });
});

test('888qi-fortune CLI 支援同步打包、安裝至外部目錄並以共享計算核心離線執行', () => {
    const os = require('node:os');
    const { execSync } = require('node:child_process');
    const { syncBundle } = require('../scripts/sync-fortune-package');

    const bundleDir = syncBundle();
    assert.equal(fs.existsSync(path.join(bundleDir, 'lib/qimen.js')), true);
    assert.equal(fs.existsSync(path.join(bundleDir, 'skills/_shared/runtime.js')), true);

    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), '888qi-fortune-test-'));
    const fortuneHome = path.join(tmpRoot, '.888qi-fortune');
    const agentSkillsDir = path.join(tmpRoot, 'agent-skills');
    const cliBin = path.join(root, 'packages/888qi-fortune/bin/888qi-fortune.js');
    const env = { ...process.env, QIMEN_FORTUNE_HOME: fortuneHome };

    try {
        const installOut = execSync(
            `node "${cliBin}" install --dir "${agentSkillsDir}" --yes`,
            { encoding: 'utf-8', env, cwd: os.tmpdir() }
        );
        assert.match(installOut, /安裝完成/);
        assert.equal(fs.existsSync(path.join(agentSkillsDir, '_shared')), false, 'Agent skills 目錄不應污染 _shared 資料夾');
        assert.equal(fs.existsSync(path.join(agentSkillsDir, 'qimen-consultant/SKILL.md')), true);
        assert.equal(fs.existsSync(path.join(fortuneHome, 'engine/node_modules/lunar-javascript/package.json')), true);

        // 完全脫離 repo 工作目錄執行安裝後的離線算盤腳本
        const qimenOut = execSync(
            `node "${path.join(agentSkillsDir, 'qimen-consultant/scripts/qimen_cli.js')}" --time-input "2026-08-28 15:00:00"`,
            { encoding: 'utf-8', env, cwd: os.tmpdir() }
        );
        const qimenJson = JSON.parse(qimenOut);
        assert.equal(qimenJson.schema_version, 'mainline-cn-v1');

        const ziweiOut = execSync(
            `node "${path.join(agentSkillsDir, 'ziwei-consultant/scripts/ziwei_cli.js')}" --date 1990-05-15 --time 12:00`,
            { encoding: 'utf-8', env, cwd: os.tmpdir() }
        );
        const ziweiJson = JSON.parse(ziweiOut);
        assert.equal(ziweiJson.bureau, '土五局');

        const ceziOut = execSync(
            `node "${path.join(agentSkillsDir, 'name-analysis-consultant/scripts/name_analysis_cli.js')}" --cezi --char 安 --question 轉職`,
            { encoding: 'utf-8', env, cwd: os.tmpdir() }
        );
        assert.equal(JSON.parse(ceziOut).result.char, '安');

        // 24 小時內再次執行 --if-stale 應秒速略過
        const staleOut = execSync(
            `node "${cliBin}" update --if-stale`,
            { encoding: 'utf-8', env, cwd: os.tmpdir() }
        );
        assert.match(staleOut, /已為最新狀態/);

        const statusOut = execSync(`node "${cliBin}" status`, { encoding: 'utf-8', env, cwd: os.tmpdir() });
        assert.match(statusOut, /曆法核心 \(lunar-javascript\): OK/);

        execSync(`node "${cliBin}" uninstall`, { encoding: 'utf-8', env, cwd: os.tmpdir() });
        assert.equal(fs.existsSync(path.join(agentSkillsDir, 'qimen-consultant')), false);
        assert.equal(fs.existsSync(fortuneHome), false);
    } finally {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
});
