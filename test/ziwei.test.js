const assert = require('node:assert/strict');
const test = require('node:test');
const { execSync } = require('node:child_process');
const path = require('node:path');
const {
    calculateZiweiChart,
    getFiveBureau,
    calcZiweiBranch,
    STAR_BRIGHTNESS,
    SIHUA_TABLE,
    PALACE_NAMES,
    BRANCHES,
    STEMS
} = require('../lib/ziwei');

test('五行局計算正確', () => {
    // 命宮干支甲子(海中金) -> 金四局
    assert.equal(getFiveBureau('甲', '子').name, '金四局');
    assert.equal(getFiveBureau('甲', '子').number, 4);
    // 命宮干支戊午(天上火) -> 火六局
    assert.equal(getFiveBureau('戊', '午').name, '火六局');
    assert.equal(getFiveBureau('戊', '午').number, 6);
    // 命宮干支丙子(澗下水) -> 水二局
    assert.equal(getFiveBureau('丙', '子').name, '水二局');
    assert.equal(getFiveBureau('丙', '子').number, 2);
});

test('安紫微星公式檢驗', () => {
    // 木三局 (bureauNum=3), 初一 (lunarDay=1) -> 辰宮 (4)
    assert.equal(calcZiweiBranch(3, 1), 4);
    // 水二局 (bureauNum=2), 初五 (lunarDay=5) -> 卯宮 (3)
    assert.equal(calcZiweiBranch(2, 5), 3);
});

test('紫微斗數排盤完整性檢驗（1990-05-15 12:00 庚午年 乾造）', () => {
    const chart = calculateZiweiChart({
        date: '1990-05-15',
        time: '12:00',
        sex: '男',
        calendar: 'solar'
    });

    assert.ok(chart, '排盤結果不能為空');
    assert.equal(chart.normalized_input.date, '1990-05-15');
    assert.equal(chart.normalized_input.sex, '男');
    assert.equal(chart.palaces.length, 12, '必須包含完整十二宮');

    // 庚年生年四化：太陽化祿、武曲化權、太陰化科、天同化忌
    assert.equal(chart.sihua.lu, '太陽');
    assert.equal(chart.sihua.quan, '武曲');
    assert.equal(chart.sihua.ke, '太陰');
    assert.equal(chart.sihua.ji, '天同');

    // 檢驗命身宮存在
    const mingPalace = chart.palaces.find((p) => p.isMing);
    const shenPalace = chart.palaces.find((p) => p.isShen);
    assert.ok(mingPalace, '必須標註命宮');
    assert.ok(shenPalace, '必須標註身宮');
    assert.equal(mingPalace.name, '命宮');

    // 檢驗大限起運年齡與五行局數相符
    const bureauNum = chart.bureauNumber;
    assert.ok(mingPalace.dayun.startsWith(String(bureauNum)), `命宮大限必須從 ${bureauNum} 歲起`);

    // 檢驗主星亮度存在
    for (const palace of chart.palaces) {
        for (const star of palace.stars) {
            if (star.type === 'major') {
                assert.ok(star.brightness, `主星 ${star.name} 必須包含亮度`);
            }
        }
    }
});

test('生年十干四化表全覆蓋', () => {
    assert.deepEqual(SIHUA_TABLE['甲'], { 祿: '廉貞', 權: '破軍', 科: '武曲', 忌: '太陽' });
    assert.deepEqual(SIHUA_TABLE['乙'], { 祿: '天機', 權: '天梁', 科: '紫微', 忌: '太陰' });
    assert.deepEqual(SIHUA_TABLE['丙'], { 祿: '天同', 權: '天機', 科: '文昌', 忌: '廉貞' });
    assert.deepEqual(SIHUA_TABLE['丁'], { 祿: '太陰', 權: '天同', 科: '天機', 忌: '巨門' });
    assert.deepEqual(SIHUA_TABLE['戊'], { 祿: '貪狼', 權: '太陰', 科: '右弼', 忌: '天機' });
    assert.deepEqual(SIHUA_TABLE['己'], { 祿: '武曲', 權: '貪狼', 科: '天梁', 忌: '文曲' });
    assert.deepEqual(SIHUA_TABLE['庚'], { 祿: '太陽', 權: '武曲', 科: '太陰', 忌: '天同' });
    assert.deepEqual(SIHUA_TABLE['辛'], { 祿: '巨門', 權: '太陽', 科: '文曲', 忌: '文昌' });
    assert.deepEqual(SIHUA_TABLE['壬'], { 祿: '天梁', 權: '紫微', 科: '左輔', 忌: '武曲' });
    assert.deepEqual(SIHUA_TABLE['癸'], { 祿: '破軍', 權: '巨門', 科: '太陰', 忌: '貪狼' });
});

test('三方四正宮位關聯計算正確', () => {
    const chart = calculateZiweiChart({
        date: '1988-08-08',
        time: '08:30',
        sex: '女'
    });

    const ming = chart.palaces.find((p) => p.isMing);
    assert.ok(ming.aspects.opposite, '命宮必須有對宮（遷移宮）');
    assert.equal(ming.aspects.trine.length, 2, '命宮必須有兩個三合宮位（財帛宮、官祿宮）');
    assert.equal(ming.aspects.neighbors.length, 2, '命宮必須有兩個夾宮（父母宮、兄弟宮）');
});

test('Ziwei CLI 腳本 (skills/ziwei-consultant/scripts/ziwei_cli.js) 獨立運行測試', () => {
    const scriptPath = path.join(__dirname, '..', 'skills', 'ziwei-consultant', 'scripts', 'ziwei_cli.js');
    const stdout = execSync(`node "${scriptPath}"`, {
        encoding: 'utf8'
    });

    const output = JSON.parse(stdout);
    assert.ok(output.palaces, 'CLI 輸出必須包含 palaces');
    assert.equal(output.palaces.length, 12);
    assert.ok(output.sihua);
});

test('Qimen CLI 腳本 (skills/qimen-consultant/scripts/qimen_cli.js) 獨立運行測試', () => {
    const scriptPath = path.join(__dirname, '..', 'skills', 'qimen-consultant', 'scripts', 'qimen_cli.js');
    const stdout = execSync(`node "${scriptPath}"`, {
        encoding: 'utf8'
    });

    const output = JSON.parse(stdout);
    assert.equal(output.schema_version, 'mainline-cn-v1');
    assert.ok(output.chart.palaces, 'CLI 輸出必須包含 chart.palaces');
    assert.equal(output.chart.palaces.length, 9);
});
