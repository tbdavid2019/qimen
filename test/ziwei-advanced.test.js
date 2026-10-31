const assert = require('node:assert/strict');
const test = require('node:test');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { calculateZiweiChart, STAR_BRIGHTNESS } = require('../lib/ziwei');
const { getJiangQianShen, getSuiQianShen, getBoshiShen } = require('../lib/ziwei-shensha');
const { detectAllPatterns } = require('../lib/ziwei-patterns');
const { evaluateZiweiMatch } = require('../lib/ziwei-match');

test('善本亮度校訂：太陰、天機與天府關鍵宮位', () => {
    assert.equal(STAR_BRIGHTNESS.太陰[6], '陷');
    assert.equal(STAR_BRIGHTNESS.太陰[9], '旺');
    assert.equal(STAR_BRIGHTNESS.太陰[11], '廟');
    assert.equal(STAR_BRIGHTNESS.太陰[0], '廟');
    assert.equal(STAR_BRIGHTNESS.天機[4], '廟');
    assert.equal(STAR_BRIGHTNESS.天機[10], '廟');
    assert.equal(STAR_BRIGHTNESS.天府[4], '旺');
    assert.equal(STAR_BRIGHTNESS.天府[10], '旺');
});

test('將前、歲前、博士三組十二神煞各覆蓋十二宮', () => {
    const jiang = getJiangQianShen(0);
    const sui = getSuiQianShen(0);
    const boshi = getBoshiShen(2, true);
    assert.equal(jiang.length, 12);
    assert.equal(sui.length, 12);
    assert.equal(boshi.length, 12);
    assert.deepEqual(jiang.slice(0, 3), ['將星', '攀鞍', '歲驛']);
    assert.deepEqual(sui.slice(0, 3), ['歲建', '晦氣', '喪門']);
    assert.equal(boshi[2], '博士');
    assert.equal(boshi[3], '力士');
    assert.equal(boshi[4], '青龍');
    const chart = calculateZiweiChart({ date: '1990-05-15', time: '12:00', sex: '男' });
    for (const palace of chart.palaces) {
        assert.deepEqual(Object.keys(palace.shensha).sort(), ['boshi', 'jiangQian', 'suiQian']);
        assert.ok(palace.shensha.jiangQian && palace.shensha.suiQian && palace.shensha.boshi);
    }
});

test('古籍格局結果包含條件分層與破格警示', () => {
    const synthetic = {
        mingGongBranch: 0,
        palaces: [
            { name: '命宮', branch: '子', isMing: true, stars: [{ name: '紫微', type: 'major' }] },
            { name: '兄弟宮', branch: '丑', stars: [{ name: '太陰', type: 'major' }, { name: '火星', type: 'bad' }] },
            { name: '夫妻宮', branch: '寅', stars: [] },
            { name: '父母宮', branch: '亥', stars: [{ name: '鈴星', type: 'bad' }, { name: '太陽', type: 'major', brightness: '陷' }] },
            { name: '財帛宮', branch: '卯', stars: [] },
            { name: '官祿宮', branch: '辰', stars: [{ name: '右弼', type: 'lucky' }] },
            { name: '遷移宮', branch: '午', stars: [] },
            { name: '疾厄宮', branch: '未', stars: [] },
            { name: '僕役宮', branch: '申', stars: [{ name: '左輔', type: 'lucky' }] },
            { name: '田宅宮', branch: '酉', stars: [] },
            { name: '福德宮', branch: '戌', stars: [] },
            { name: '子女宮', branch: '巳', stars: [] }
        ]
    };
    const patterns = detectAllPatterns(synthetic);
    const names = patterns.map((pattern) => pattern.name);
    assert.ok(names.includes('君臣慶會'));
    assert.ok(names.includes('日月夾命'));
    assert.ok(patterns.every((pattern) => pattern.conditions && Array.isArray(pattern.conditions.required)));
    assert.ok(patterns.some((pattern) => pattern.conditions.breaking.length > 0));
});

test('雙人合盤輸出四項分析與 0-100 分數', () => {
    const result = evaluateZiweiMatch({
        first: { date: '1990-05-15', time: '12:00', sex: '男' },
        second: { date: '1992-08-20', time: '10:00', sex: '女' }
    });
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.ok(result.firstChart.palaces.length === 12);
    assert.ok(result.secondChart.palaces.length === 12);
    assert.equal(Object.keys(result.synastryAnalysis).sort().join(','), 'fuqiProjection,mingCompatibility,shaClash,sihuaInteraction');
    assert.ok(result.firstSpouseAnalysis.appearance);
    assert.ok(result.secondSpouseAnalysis.personality);
    assert.ok(result.advice);
});

test('CLI 支援 --match 與 --patterns', () => {
    const cli = path.join(__dirname, '../skills/ziwei-consultant/scripts/ziwei_cli.js');
    const match = JSON.parse(execFileSync(process.execPath, [cli, '--match', '--first', '{"date":"1990-05-15","sex":"男"}', '--second', '{"date":"1992-08-20","sex":"女"}'], { encoding: 'utf8' }));
    assert.equal(typeof match.score, 'number');
    const patterns = JSON.parse(execFileSync(process.execPath, [cli, '--date', '1990-05-15', '--patterns'], { encoding: 'utf8' }));
    assert.ok(Array.isArray(patterns.patterns));
});

test('API chart 與 match 端點回傳進階結構', async () => {
    const app = require('../app');
    const server = await new Promise((resolve) => {
        const listener = app.listen(0, () => resolve(listener));
    });
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const chartResponse = await fetch(`${base}/api/ziwei/chart`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: '1990-05-15', time: '12:00', sex: '男', skipRecord: true }) });
        const chart = await chartResponse.json();
        assert.equal(chart.success, true);
        assert.ok(chart.chart.patterns[0].conditions);
        assert.ok(chart.chart.palaces[0].shensha);
        const matchResponse = await fetch(`${base}/api/ziwei/match`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ first: { date: '1990-05-15', sex: '男', palaces: ['fake'] }, second: { date: '1992-08-20', sex: '女', palaces: ['fake'] } }) });
        const match = await matchResponse.json();
        assert.equal(match.success, true);
        assert.equal(typeof match.match.score, 'number');
        assert.equal(match.match.firstChart.palaces.length, 12, '必須由伺服器真實排盤，而非採用假 palaces');

        const pageResponse = await fetch(`${base}/ziwei/match`);
        assert.equal(pageResponse.status, 200);
        const html = await pageResponse.text();
        assert.ok(html.includes('雙人紫微合盤'));
        assert.ok(html.includes('https://qi.david888.com/ziwei/match'));
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
