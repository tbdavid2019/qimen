const assert = require('node:assert/strict');
const test = require('node:test');
const { execSync } = require('node:child_process');
const path = require('node:path');
const {
    calculateZiweiChart,
    evaluateMaleSize,
    evaluateFutureSpouse,
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

test('紫微斗數男生真實尺寸雙核評估（子位＋疾厄宮合參）', () => {
    // 1981-08-11 巳時 (10:00) 乾造：子位天同太陰、疾厄戌宮獨坐擎羊 -> 命中 11-13cm 鋒刃精鋼型
    const siResult = evaluateMaleSize({ date: '1981-08-11', time: '10:00', sex: '男' });
    assert.equal(siResult.tier, '大/中杯');
    assert.equal(siResult.cmRange, '11 - 13 cm');
    assert.match(siResult.title, /精鋼|鋒刃/);
    assert.match(siResult.physique, /擎羊/);

    // 1981-08-11 辰時 (07:00) 乾造：子位巨門祿（虛標>16）、疾厄亥宮坐廉貪天馬 -> 雙核校正為 12-15cm 實戰永動機
    const chenResult = evaluateMaleSize({ date: '1981-08-11', time: '07:00', sex: '男' });
    assert.equal(chenResult.tier, '大/中杯');
    assert.equal(chenResult.cmRange, '12 - 15 cm');
    assert.match(chenResult.title, /永動機|長青/);

    // 1981-08-11 卯時 (06:00) 乾造：子疾同宮巨門祿 -> 真·特大杯
    const maoResult = evaluateMaleSize({ date: '1981-08-11', time: '06:00', sex: '男' });
    assert.equal(maoResult.tier, '特大杯');
    assert.equal(maoResult.cmRange, '＞16 cm');
    assert.match(maoResult.title, /深潛重砲/);
});

test('紫微斗數女性命盤不附帶男生尺寸且 evaluateMaleSize 標註不適用', () => {
    const femaleChart = calculateZiweiChart({ date: '1981-08-11', time: '10:00', sex: '女' });
    assert.equal(femaleChart.maleSize, null, '女性全盤不得附帶 maleSize');

    const femaleResult = evaluateMaleSize({ date: '1981-08-11', time: '10:00', sex: '女' });
    assert.equal(femaleResult.isApplicable, false, '女性 evaluateMaleSize 必須標註 isApplicable: false');
    assert.equal(femaleResult.tier, '不適用');
    assert.equal(femaleResult.title, '女性命盤不適用');
    assert.match(femaleResult.summary, /僅適用於男性命盤/);
});

test('紫微斗數支援 birthDate 別名且真太陽時正常推算不崩潰', () => {
    const chart = calculateZiweiChart({ birthDate: '1981-08-11', time: '10:00', place: '台北', sex: '男' });
    assert.ok(chart.solarTimeInfo, '真太陽時必須成功計算');
    assert.ok(chart.maleSize, '男性盤必須附帶 maleSize');
    assert.equal(chart.maleSize.tier, '大/中杯');
});

test('紫微斗數正確回傳耐力評分 enduranceScore 與文化趣味免責聲明', () => {
    const res = evaluateMaleSize({ date: '1981-08-11', time: '10:00', sex: '男' });
    assert.equal(typeof res.enduranceScore, 'number');
    assert.ok(res.enduranceScore >= 50 && res.enduranceScore <= 95);
    assert.ok(res.disclaimer, '必須包含 disclaimer 免責說明');
});

test('紫微斗數農曆閏月字串參數 (leap="false") 正確標準化不拋錯', () => {
    // 2023-02-22 農曆 (2023年有閏二月，leap="false" 代表非閏月)
    const chart = calculateZiweiChart({ date: '2023-02-22', calendar: 'lunar', leap: 'false', sex: '男' });
    assert.equal(chart.lunar.month, 2);
    assert.equal(chart.lunar.isLeap, false);
});

test('紫微斗數當輸入 shichen 且帶預設 time 時，normalized_input.time 一致同步為時辰代表時間', () => {
    const chart = calculateZiweiChart({ date: '1981-08-11', shichen: '巳', time: '12:00', sex: '男' });
    assert.equal(chart.normalized_input.time, '10:00');
});

test('紫微斗數未來另一半評估（evaluateFutureSpouse）完整解析夫妻宮正緣畫像', () => {
    // 巳時 (09:00) 乾造：夫妻宮武曲貪狼同宮
    const spouseSi = evaluateFutureSpouse({ date: '1981-08-11', time: '09:00', sex: '男' });
    assert.ok(spouseSi, '必須回傳未來另一半評估結果');
    assert.equal(spouseSi.palace, '丑');
    assert.equal(spouseSi.ganzhi, '辛丑');
    assert.deepEqual(spouseSi.majorStars, ['武曲(廟)', '貪狼(廟)']);
    assert.equal(spouseSi.ageGap.tier, '同齡或差距不大 (上下 1-3 歲以內)');
    assert.match(spouseSi.ageGap.desc, /武曲金與貪狼木同宮/);
    assert.equal(spouseSi.ageGap.psychologicalAge, '精明能幹 · 情調平衡型');
    assert.equal(spouseSi.appearance.style, '明艷迷人 · 電眼桃花');
    assert.ok(spouseSi.personality.tags.includes('務實幹練'));
    assert.ok(spouseSi.personality.tags.includes('八面玲瓏'));
    assert.ok(spouseSi.meetingScenario.places.length > 0);
    assert.match(spouseSi.summary, /辛丑宮/);

    // 辰時 (08:50) 乾造：夫妻宮天同天梁同宮
    const spouseChen = evaluateFutureSpouse({ date: '1981-08-11', time: '08:50', sex: '男' });
    assert.equal(spouseChen.palace, '寅');
    assert.equal(spouseChen.ganzhi, '庚寅');
    assert.deepEqual(spouseChen.majorStars, ['天同(利)', '天梁(廟)']);
    assert.equal(spouseChen.ageGap.tier, '顯著年齡差距 (多大 3-6 歲以上，或小 2-4 歲)');
    assert.match(spouseChen.ageGap.desc, /天同天梁同宮/);
});

test('紫微斗數全盤排盤 calculateZiweiChart 自動附帶 futureSpouse 正緣評估', () => {
    const chart = calculateZiweiChart({ date: '1981-08-11', time: '09:00', sex: '男' });
    assert.ok(chart.futureSpouse, '全盤排盤結果必須包含 futureSpouse');
    assert.equal(chart.futureSpouse.palace, '丑');
    assert.equal(chart.futureSpouse.ageGap.tier, '同齡或差距不大 (上下 1-3 歲以內)');
});

test('紫微斗數 CLI 支援 --spouse 模式獨立輸出未來另一半 JSON', () => {
    const cliPath = path.join(__dirname, '../skills/ziwei-consultant/scripts/ziwei_cli.js');
    const stdout = execSync(`node "${cliPath}" --date 1981-08-11 --time 09:00 --sex 男 --spouse`, { encoding: 'utf-8' });
    const parsed = JSON.parse(stdout);
    assert.ok(parsed.ageGap, 'CLI 輸出必須包含 ageGap');
    assert.equal(parsed.ganzhi, '辛丑');
    assert.equal(parsed.ageGap.tier, '同齡或差距不大 (上下 1-3 歲以內)');
});

test('紫微斗數未來另一半支援 female 性別別名且判定為女性命盤看丈夫', () => {
    const spouseFemale = evaluateFutureSpouse({ date: '1981-08-11', time: '09:00', sex: 'female' });
    assert.equal(spouseFemale.targetGender, '男性伴侶（丈夫）');
    assert.match(spouseFemale.summary, /男性伴侶（丈夫）/);
});



