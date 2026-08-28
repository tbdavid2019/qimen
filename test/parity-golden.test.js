const test = require('node:test');
const assert = require('node:assert/strict');

const { drawCards } = require('../lib/tarot');
const { calculateBazi } = require('../lib/bazi2');
const { calculateZiweiChart } = require('../lib/ziwei');
const { calculateFengShui, calculateXuanKong24, chooseZeri } = require('../lib/fengshui');
const { zodiacMatch, drawFortuneStick, ziweiMarriage, peachBlossomLuck, baziMatchFull, redThreadFull } = require('../lib/yinyuan');

test('1. 塔羅抽牌與上游 Python draw.py 達到 100% 相同輸出', () => {
    // 條件：spread=three, seed=12345, time_factor=night, question="測試"
    // 上游 draw.py golden output: 權杖十 (正位), 寶劍十 (正位), 權杖五 (正位)
    const res = drawCards({
        spread: 'three',
        seed: 12345,
        time_factor: 'night',
        question: '測試'
    });

    assert.equal(res.cards.length, 3);
    assert.equal(res.cards[0].position, '過去');
    assert.equal(res.cards[0].name, '權杖十');
    assert.equal(res.cards[0].orientation, '正位');

    assert.equal(res.cards[1].position, '現在');
    assert.equal(res.cards[1].name, '寶劍十');
    assert.equal(res.cards[1].orientation, '正位');

    assert.equal(res.cards[2].position, '未來');
    assert.equal(res.cards[2].name, '權杖五');
    assert.equal(res.cards[2].orientation, '正位');
});

test('2. 八字命理：--shichen 子時正確排定時柱為丙子，不被 12:00 覆蓋', () => {
    const res = calculateBazi({
        date: '1990-05-15',
        shichen: '子',
        sex: '男'
    });

    assert.equal(res.profile.time, '00:00');
    assert.equal(res.fourPillars[0].value, '庚午');
    assert.equal(res.fourPillars[1].value, '辛巳');
    assert.equal(res.fourPillars[2].value, '庚辰');
    assert.equal(res.fourPillars[3].value, '丙子'); // 五鼠遁：乙庚丙作初
});

test('3. 八字命理：完整神煞體系包含天乙貴人、天德、月德、學堂、天醫、詞館、血刃等', () => {
    const res1 = calculateBazi({
        date: '1990-05-15',
        shichen: '子',
        sex: '男'
    });

    const shenshaNames1 = res1.shensha.map(s => s.name);
    assert.ok(shenshaNames1.includes('天乙貴人'), '應包含天乙貴人');
    assert.ok(shenshaNames1.includes('天德'), '應包含天德');
    assert.ok(shenshaNames1.includes('月德'), '應包含月德');
    assert.ok(shenshaNames1.includes('學堂'), '應包含學堂');
    assert.ok(shenshaNames1.includes('將星'), '應包含將星');
    assert.ok(shenshaNames1.includes('天醫'), '應包含天醫');

    const res2 = calculateBazi({
        date: '1984-03-01',
        shichen: '寅',
        sex: '男'
    });

    const shenshaNames2 = res2.shensha.map(s => s.name);
    assert.ok(shenshaNames2.includes('詞館'), '應包含詞館');
    assert.ok(shenshaNames2.includes('祿神'), '應包含祿神');
    assert.ok(shenshaNames2.includes('血刃'), '應包含血刃');
});

test('4. 八字命理：支援未知時辰 (只排六字)', () => {
    const res = calculateBazi({
        date: '1990-05-15',
        allowUnknownHour: true,
        sex: '男'
    });

    assert.equal(res.fourPillars[3].value, '未知');
    assert.equal(res.fourPillars[3].stem, '—');
    assert.equal(res.fourPillars[3].branch, '—');
});

test('5. 八字命理：支援 deceasedYear 過濾大運與流年上限', () => {
    const res = calculateBazi({
        date: '1990-05-15',
        shichen: '午',
        sex: '男',
        deceasedYear: 2010
    });

    assert.ok(res.annualCycles.every(c => c.year <= 2010));
});

test('6. 紫微斗數：完整 18 種經典格局檢測與四化', () => {
    const res = calculateZiweiChart({
        date: '1990-05-15',
        time: '12:00',
        sex: '男'
    });

    assert.ok(Array.isArray(res.patterns));
    assert.ok(res.palaces.length === 12);
    assert.ok(res.sihua.lu);
    assert.ok(res.sihua.quan);
    assert.ok(res.sihua.ke);
    assert.ok(res.sihua.ji);
});

test('7. 風水玄空飛星：九運 24 山動態排盤與格局判定', () => {
    // 九運 壬山丙向 -> 旺山旺向
    const renshan = calculateXuanKong24('壬山丙向', 2026, 2026);
    assert.equal(renshan.period, 9);
    assert.equal(renshan.pattern, '旺山旺向');

    // 九運 子山午向 -> 上山下水
    const zishan = calculateXuanKong24('子山午向', 2026, 2026);
    assert.equal(zishan.pattern, '上山下水');

    // 九運 丑山未向 -> 雙星到向
    const choushan = calculateXuanKong24('丑山未向', 2026, 2026);
    assert.equal(choushan.pattern, '雙星到向');

    // 九運 艮山坤向 -> 雙星到坐
    const genshan = calculateXuanKong24('艮山坤向', 2026, 2026);
    assert.equal(genshan.pattern, '雙星到坐');
});

test('8. 風水協紀辨方擇日：動態計算 2026 丙午年歲破與三煞', () => {
    const zeri = chooseZeri('入宅/喬遷', 2026, 5);
    assert.ok(zeri.suiPoWarning.includes('正北 (子位)'));
    assert.ok(zeri.sanShaWarning.includes('北方 (亥子丑)'));
    assert.ok(zeri.auspiciousDates.length > 0);
});

test('9. 月老姻緣：紫微夫妻宮缺少出生日期時嚴格拋出錯誤', () => {
    assert.throws(() => {
        ziweiMarriage({});
    }, /請提供出生日期/);
});
