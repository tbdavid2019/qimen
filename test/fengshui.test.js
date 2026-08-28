const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFengShui } = require('../lib/fengshui');

test('風水報告提供八宅、九運飛星與流年飛星', () => {
    const report = calculateFengShui({ facing: '南', moveInYear: 2024, residentYear: 1990, sex: '女', year: 2026 });
    assert.equal(report.period, 9);
    assert.equal(report.eightMansions.house, '坎宅');
    assert.equal(Object.keys(report.eightMansions.directions).length, 8);
    assert.equal(Object.keys(report.flyingStars.annual).length, 9);
    assert.equal(report.resident.mingGua.name, '坤');
});

test('八宅遊年星表八宅各具八種星且伏位落在坐山方位', () => {
    const expected = {
        坎宅: ['伏位', '五鬼', '天醫', '生氣', '延年', '絕命', '禍害', '六煞'],
        坤宅: ['絕命', '生氣', '禍害', '五鬼', '六煞', '伏位', '天醫', '延年'],
        震宅: ['天醫', '六煞', '伏位', '延年', '生氣', '禍害', '絕命', '五鬼'],
        巽宅: ['生氣', '絕命', '延年', '伏位', '天醫', '五鬼', '六煞', '禍害'],
        乾宅: ['六煞', '天醫', '五鬼', '禍害', '絕命', '延年', '生氣', '伏位'],
        兌宅: ['禍害', '延年', '絕命', '六煞', '五鬼', '天醫', '伏位', '生氣'],
        艮宅: ['五鬼', '伏位', '六煞', '絕命', '禍害', '生氣', '延年', '天醫'],
        離宅: ['延年', '禍害', '生氣', '天醫', '伏位', '六煞', '五鬼', '絕命']
    };
    const facingByHouse = { 坎宅: '南', 坤宅: '東北', 震宅: '西', 巽宅: '西北', 乾宅: '東南', 兌宅: '東', 艮宅: '西南', 離宅: '北' };
    for (const [house, stars] of Object.entries(expected)) {
        const directions = calculateFengShui({ facing: facingByHouse[house], residentYear: 1990, sex: '女' }).eightMansions.directions;
        assert.deepEqual(Object.values(directions), stars, house);
        assert.equal(new Set(Object.values(directions)).size, 8, house);
    }
});

test('風水 24 山坐向支援與九運飛星格局判定', () => {
    const report1 = calculateFengShui({ facing: '壬山丙向', moveInYear: 2024 });
    assert.equal(report1.pattern, '旺山旺向');
    const report2 = calculateFengShui({ facing: '子山午向', moveInYear: 2024 });
    assert.equal(report2.pattern, '上山下水');
});

test('協紀辨方擇日動態依建除十二神與神煞推選吉日並避開歲破三煞', () => {
    const { chooseZeri } = require('../lib/fengshui');
    const zeri = chooseZeri('入宅/喬遷', 2026, 5);
    assert.equal(zeri.year, 2026);
    assert.equal(zeri.month, 5);
    assert.ok(zeri.suiPoWarning.includes('歲破'));
    assert.ok(zeri.sanShaWarning.includes('三煞'));
    assert.ok(zeri.auspiciousDates.length > 0);
});
