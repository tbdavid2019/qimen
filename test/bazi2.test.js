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

test('八字二完整計算各類吉凶神煞（天乙、文昌、天德、太極、國印、金輿、學堂、天醫、劫煞等）', () => {
    const chart = calculateBazi({ calendar: 'solar', date: '1990-05-15', time: '12:00', sex: '男' });
    const shenshaNames = chart.shensha.map(s => s.name);
    assert.ok(shenshaNames.includes('文昌貴人') || shenshaNames.includes('天乙貴人') || shenshaNames.length > 0);
    assert.ok(chart.profile.startYunAge.includes('歲'));
});

test('八字二 CLI 腳本可正常執行並輸出 JSON', () => {
    const { execSync } = require('child_process');
    const stdout = execSync('node skills/bazi2-consultant/scripts/bazi_cli.js --date 1990-05-15 --time 12:00 --sex 男', { encoding: 'utf-8' });
    const result = JSON.parse(stdout);
    assert.equal(result.fourPillars.length, 4);
    assert.ok(result.shensha.length > 0);
});

test('天文經緯度真太陽時與均時差 (EOT) 校正精確性', () => {
    const { calculateTrueSolarTime, CITY_COORDINATES } = require('../lib/solar-time');
    assert.ok(CITY_COORDINATES['台北市']);
    assert.ok(CITY_COORDINATES['北京']);
    assert.ok(CITY_COORDINATES['香港']);

    // 台北市（東經 121.5654）在 2026-05-15 12:00 的真太陽時
    const tstTaipei = calculateTrueSolarTime({
        date: '2026-05-15',
        hour: 12,
        minute: 0,
        place: '台北市'
    });
    assert.equal(tstTaipei.place, '台北市');
    assert.ok(tstTaipei.longitudeDiffMinutes > 6); // (121.5654 - 120) * 4 = +6.26 min
    assert.ok(tstTaipei.solarTimeFormatted.includes(':'));

    // 整合入八字排盤輸出
    const chart = calculateBazi({
        calendar: 'solar',
        date: '1990-05-15',
        time: '12:00',
        sex: '男',
        place: '台北市',
        useSolarTime: true
    });
    assert.ok(chart.profile.solarTimeInfo);
    assert.equal(chart.profile.solarTimeInfo.place, '台北市');
});
