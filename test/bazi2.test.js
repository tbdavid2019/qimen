const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateBazi, tenGod } = require('../lib/bazi2');

test('八字二以公曆資料產生四柱、五行與大運', () => {
    const chart = calculateBazi({ calendar: 'solar', date: '1990-05-15', time: '12:00', sex: '男', place: '台北' });
    assert.deepEqual(chart.fourPillars.map((pillar) => pillar.value), ['庚午', '辛巳', '庚辰', '壬午']);
    assert.equal(chart.fiveElements.total, 8);
    assert.ok(chart.luckCycles.length >= 8);
    assert.ok(chart.annualCycles.length >= 3);
});

test('八字二拒絕無效出生日期', () => {
    assert.throws(() => calculateBazi({ calendar: 'solar', date: '1990-02-30', sex: '女' }), /出生日期/);
});

test('十神依天干陰陽區分十種關係', () => {
    assert.equal(tenGod('甲', '甲'), '比肩');
    assert.equal(tenGod('甲', '乙'), '劫財');
    assert.equal(tenGod('甲', '丙'), '食神');
    assert.equal(tenGod('甲', '丁'), '傷官');
    assert.equal(tenGod('甲', '壬'), '偏印');
    assert.equal(tenGod('甲', '癸'), '正印');
    assert.equal(tenGod('甲', '戊'), '偏財');
    assert.equal(tenGod('甲', '己'), '正財');
    assert.equal(tenGod('甲', '庚'), '七殺');
    assert.equal(tenGod('甲', '辛'), '正官');
});

test('八字二缺少出生日期時回傳明確驗證錯誤', () => {
    assert.throws(() => calculateBazi({ calendar: 'solar', sex: '女' }), /請提供出生日期/);
});
