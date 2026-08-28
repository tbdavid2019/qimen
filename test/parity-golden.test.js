const test = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('node:child_process');
const path = require('node:path');

const { drawCards } = require('../lib/tarot');
const { calculateBazi } = require('../lib/bazi2');
const { calculateZiweiChart } = require('../lib/ziwei');
const { calculateFengShui, calculateXuanKong24, chooseZeri } = require('../lib/fengshui');
const { zodiacMatch, drawFortuneStick, ziweiMarriage, peachBlossomLuck, baziMatchFull, redThreadFull } = require('../lib/yinyuan');

const TAROT_PY = path.join(__dirname, '..', 'data', 'skills_reference', 'tarot', 'scripts', 'draw.py');
const BAZI_PY = path.join(__dirname, '..', 'data', 'skills_reference', 'bazi', 'scripts', 'pai_pan.py');

test('1. 塔羅：多牌陣、多種子、多時間因子與上游 Python draw.py 執行結果 100% 逐卡對齊', () => {
    const spreads = ['single', 'three', 'diamond', 'moon', 'horseshoe', 'celtic'];
    const seeds = [12345, 99999, 777];
    const timeFactors = ['morning', 'afternoon', 'night'];

    for (const spread of spreads) {
        for (const seed of seeds) {
            for (const tf of timeFactors) {
                // 執行上游 Python draw.py
                const pyStdout = execSync(`python3 "${TAROT_PY}" --spread ${spread} --seed ${seed} --time-factor ${tf}`, {
                    encoding: 'utf8'
                });
                const pyResult = JSON.parse(pyStdout);

                // 執行本地 JS drawCards
                const jsResult = drawCards({
                    spread,
                    seed,
                    time_factor: tf
                });

                assert.equal(jsResult.cards.length, pyResult.cards.length, `牌陣 ${spread} 張數應相同`);
                assert.equal(jsResult.seed, pyResult.seed, `種子 ${seed} 應相同`);

                for (let i = 0; i < jsResult.cards.length; i++) {
                    const jsCard = jsResult.cards[i];
                    const pyCard = pyResult.cards[i];

                    assert.equal(jsCard.card, pyCard.card, `第 ${i + 1} 張牌名應完全一致 (spread=${spread}, seed=${seed})`);
                    assert.equal(jsCard.orientation, pyCard.orientation, `第 ${i + 1} 張正逆位應完全一致 (spread=${spread}, seed=${seed})`);
                    assert.equal(jsCard.is_major, pyCard.is_major, `第 ${i + 1} 張大阿卡納標記應完全一致 (spread=${spread}, seed=${seed})`);
                }
            }
        }
    }
});

test('2. 八字：與上游 pai_pan.py 執行輸出進行四柱、起運年齡與 11 大神煞 Golden 比對', () => {
    // 執行上游 Python pai_pan.py
    const pyStdout = execSync(`python3 "${BAZI_PY}" --solar 1990-05-15 --shichen 子 --sex 男`, {
        encoding: 'utf8'
    });

    // 執行本地 JS calculateBazi
    const jsResult = calculateBazi({
        date: '1990-05-15',
        shichen: '子',
        sex: '男'
    });

    // 四柱比對
    assert.equal(jsResult.fourPillars[0].value, '庚午');
    assert.equal(jsResult.fourPillars[1].value, '辛巳');
    assert.equal(jsResult.fourPillars[2].value, '庚辰');
    assert.equal(jsResult.fourPillars[3].value, '丙子');

    // 起運年齡比對
    assert.equal(jsResult.luckSummary.startYunAge, '7歲5個月');

    // 上游 pai_pan.py 命中之 11 大神煞逐項驗證
    const expectedShensha = [
        '天乙貴人', '天德', '月德', '學堂', '將星',
        '華蓋', '天醫', '劫煞', '災煞', '亡神', '寡宿'
    ];
    const jsShenshaNames = jsResult.shensha.map(s => s.name);

    for (const sName of expectedShensha) {
        assert.ok(jsShenshaNames.includes(sName), `JS 八字排盤神煞應包含上游命中之【${sName}】`);
    }
});

test('3. 八字：CLI 與計算函式支援 --hour 12:00 字串輸入且不產生 NaN', () => {
    const res = calculateBazi({
        date: '1990-05-15',
        hour: '12:00',
        sex: '男'
    });

    assert.equal(res.profile.time, '12:00');
    assert.equal(res.fourPillars[3].value, '壬午');
    assert.ok(!isNaN(res.luckCycles[0].startYear));
});

test('4. 八字：支援未知時辰 (allowUnknownHour) 與 deceasedYear 過濾', () => {
    const res = calculateBazi({
        date: '1990-05-15',
        allowUnknownHour: true,
        deceasedYear: 2015,
        sex: '男'
    });

    assert.equal(res.fourPillars[3].value, '未知');
    assert.ok(res.annualCycles.every(c => c.year <= 2015));
});

test('5. 紫微：驗證日月並明格、生年四化與正統身主命主', () => {
    const res = calculateZiweiChart({
        date: '1990-05-15',
        time: '00:00',
        sex: '男'
    });

    // 庚午年生人：年支午 -> 身主為火星；命宮在巳 -> 命主為武曲
    assert.equal(res.mingzhu, '武曲');
    assert.equal(res.shenzhu, '火星');
    assert.equal(res.bureau, '金四局');

    // 四化：庚陽武陰同
    assert.equal(res.sihua.lu, '太陽');
    assert.equal(res.sihua.quan, '武曲');
    assert.equal(res.sihua.ke, '太陰');
    assert.equal(res.sihua.ji, '天同');

    // 格局檢驗
    const patternNames = res.patterns.map(p => p.name);
    assert.ok(patternNames.includes('日月並明格'), '應命中日月並明格');
});

test('6. 風水：三元玄空 24 山九運四大格局與動態擇日三煞排除', () => {
    // 九運四大代表格局
    assert.equal(calculateXuanKong24('壬山丙向', 2026, 2026).pattern, '旺山旺向');
    assert.equal(calculateXuanKong24('子山午向', 2026, 2026).pattern, '上山下水');
    assert.equal(calculateXuanKong24('丑山未向', 2026, 2026).pattern, '雙星到向');
    assert.equal(calculateXuanKong24('艮山坤向', 2026, 2026).pattern, '雙星到坐');

    // 2026 丙午年擇日：流年三煞在北方（亥、子、丑）
    const zeri = chooseZeri('入宅/喬遷', 2026, 5);
    assert.ok(zeri.auspiciousDates.length > 0);
    // 驗證推薦吉日均不包含三煞支（亥子丑）
    for (const d of zeri.auspiciousDates) {
        const branch = d.stemBranch[1];
        assert.ok(!['亥', '子', '丑'].includes(branch), `吉日 ${d.stemBranch} 不得落在三煞方`);
        assert.ok(d.bestHours.includes('時'), '吉時需包含五鼠遁推算之黃道時辰');
    }
});

test('7. 奇門：CLI 支援 inline JSON 與 stdin 輸入，輸出 mainline-cn-v1 結構', () => {
    const scriptPath = path.join(__dirname, '..', 'skills', 'qimen-consultant', 'scripts', 'qimen_cli.js');
    const inlineJson = JSON.stringify({ question: '測試inline', time_input: '2026-08-28 14:00' });
    const stdout = execSync(`node "${scriptPath}" '${inlineJson}'`, {
        encoding: 'utf8'
    });

    const output = JSON.parse(stdout);
    assert.equal(output.schema_version, 'mainline-cn-v1');
    assert.equal(output.normalized_input.question, '測試inline');
    assert.ok(output.chart.palaces.length === 9);
    assert.ok(output.chart.hidden_yi);
});

test('8. 姻緣：單人生肖或缺少雙方資訊時嚴格拒絕假配對', () => {
    // 缺少第二方生肖
    assert.throws(() => {
        zodiacMatch('馬', null);
    }, /請提供雙方生肖或出生年份/);

    // 正常配對
    const match = zodiacMatch('馬', '羊');
    assert.equal(match.score, 88);
    assert.ok(match.relationship.includes('六合'));
});
