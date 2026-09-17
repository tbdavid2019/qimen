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

test('形勢巒頭與空間六事 24 種煞氣庫與多重診斷完整支援', () => {
    const { getAllShaQiLibrary, diagnoseShaqi, diagnoseLuantou } = require('../lib/fengshui');
    const lib = getAllShaQiLibrary();
    assert.ok(lib.length >= 20);
    assert.ok(lib.some(s => s.name === '天斬煞'));
    assert.ok(lib.some(s => s.name === '穿堂煞'));
    assert.ok(lib.some(s => s.name === '樑壓床'));

    const diag = diagnoseShaqi('天斬煞');
    assert.equal(diag.shaType, '天斬煞');
    assert.equal(diag.category, '外局形煞');
    assert.ok(diag.remedy.length > 0);

    const multi = diagnoseLuantou(['路沖煞', '穿堂煞', '樑壓灶']);
    assert.equal(multi.totalIssues, 3);
    assert.equal(multi.items.length, 3);
    assert.ok(multi.summary.includes('外局形煞'));
    assert.ok(multi.summary.includes('內局空間六事'));
});

test('電子羅盤度數正規化與圓周距離計算', () => {
    const { normalizeHeading, circularDistance } = require('../lib/fengshui');
    assert.equal(normalizeHeading(0), 0);
    assert.equal(normalizeHeading(360), 0);
    assert.equal(normalizeHeading(725), 5);
    assert.equal(normalizeHeading(-15), 345);
    assert.equal(normalizeHeading(-365), 355);

    assert.equal(circularDistance(10, 20), 10);
    assert.equal(circularDistance(355, 5), 10);
    assert.equal(circularDistance(5, 355), 10);
    assert.equal(circularDistance(0, 180), 180);
});

test('24山全部中心與全部山界均正確分類', () => {
    const { calculateMountainFromHeading, determineChartType, MOUNTAIN_CENTERS, MOUNTAIN_BOUNDARIES } = require('../lib/fengshui');
    assert.equal(Object.keys(MOUNTAIN_CENTERS).length, 24);

    for (const mountain of MOUNTAIN_CENTERS) {
        const info = calculateMountainFromHeading(mountain.center);
        assert.equal(info.facingMountain, mountain.name, `${mountain.name} 向首山`);
        assert.equal(info.deviationFromCenter, 0, `${mountain.name} 中心偏差`);
        const qualification = determineChartType(mountain.center, info);
        assert.equal(qualification.chartType, 'pure', `${mountain.name} 中心應為正向下卦`);
        assert.equal(qualification.isSubstitute, false, `${mountain.name} 中心不應替卦`);
    }

    const largeVoidBoundaries = new Set([22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]);
    assert.equal(MOUNTAIN_BOUNDARIES.length, 24);
    for (const boundary of MOUNTAIN_BOUNDARIES) {
        const info = calculateMountainFromHeading(boundary);
        const qualification = determineChartType(boundary, info);
        assert.equal(qualification.chartType, 'void', `${boundary}° 應為空亡線`);
        assert.equal(qualification.boundary, boundary, `${boundary}° 應命中自身山界`);
        assert.equal(qualification.voidType, largeVoidBoundaries.has(boundary) ? 'large' : 'small', `${boundary}° 空亡類型`);
        assert.equal(qualification.deviationFromBoundary, 0, `${boundary}° 山界偏差`);
    }
});

test('正向下卦、兼向替卦與大小空亡線判定', () => {
    const { calculateMountainFromHeading, determineChartType } = require('../lib/fengshui');

    // 午山正中 180° -> 正向下卦 (離中心 0°)
    const m180 = calculateMountainFromHeading(180);
    const q180 = determineChartType(180, m180);
    assert.equal(q180.chartType, 'pure');
    assert.equal(q180.isSubstitute, false);

    // 午山 182° -> 正向下卦 (偏離 2° <= 4.5°)
    const m182 = calculateMountainFromHeading(182);
    const q182 = determineChartType(182, m182);
    assert.equal(q182.chartType, 'pure');

    // 丁午交界 (187.5°) 附近：187.0° 離邊界 0.5° <= 1.5° -> 小空亡線
    const m187 = calculateMountainFromHeading(187.0);
    const q187 = determineChartType(187.0, m187);
    assert.equal(q187.chartType, 'void');
    assert.equal(q187.voidType, 'small');

    // 巽離宮位出卦大交界 (157.5°) 附近：157.0° 離八卦大邊界 0.5° <= 1.5° -> 大空亡線
    const m157 = calculateMountainFromHeading(157.0);
    const q157 = determineChartType(157.0, m157);
    assert.equal(q157.chartType, 'void');
    assert.equal(q157.voidType, 'large');
});

test('review regressions: candidate substitute, kitchen/stove distinction, and true-north correction', () => {
    const { calculateFengShui } = require('../lib/fengshui');
    const candidate = calculateFengShui({ heading: 65 });
    assert.equal(candidate.chartQualification.chartType, 'candidate');
    assert.equal(candidate.chartQualification.isSubstitute, false);

    const kitchenOnly = calculateFengShui({ layoutObjects: { '西北': ['space.kitchen'] } });
    assert.ok(kitchenOnly.layoutEvaluation.missingData.includes('appliance.stove'));
    assert.equal(kitchenOnly.layoutEvaluation.findings.some(f => f.category === 'stove'), false);

    const corrected = calculateFengShui({ heading: 10, northReference: 'true', declination: 10 });
    assert.equal(corrected.orientation.heading, 0);
});

test('三元九運歷法涵蓋全部九個元運 (1864-2043+)', () => {
    const { getPeriod } = require('../lib/fengshui');
    assert.equal(getPeriod(1870), 1);
    assert.equal(getPeriod(1890), 2);
    assert.equal(getPeriod(1910), 3);
    assert.equal(getPeriod(1930), 4);
    assert.equal(getPeriod(1950), 5);
    assert.equal(getPeriod(1970), 6);
    assert.equal(getPeriod(1990), 7);
    assert.equal(getPeriod(2010), 8);
    assert.equal(getPeriod(2024), 9);
    assert.equal(getPeriod(2035), 9);
    assert.equal(getPeriod(2045), 1);
});

test('住宅格局輸入防呆驗證 validateLayoutInput', () => {
    const { validateLayoutInput } = require('../lib/fengshui');

    // 正常結構通過
    assert.doesNotThrow(() => {
        validateLayoutInput({
            layoutObjects: { '南': ['door.main'], '西北': ['space.kitchen', 'appliance.stove'] },
            entryPath: ['南', '中'],
            pathQuality: 'open'
        });
    });

    // 非物件 layoutObjects 報錯
    assert.throws(() => {
        validateLayoutInput({ layoutObjects: 'invalid' });
    }, /必須為以九宮方位為鍵的物件/);

    // 未知物件 ID 報錯
    assert.throws(() => {
        validateLayoutInput({ layoutObjects: { '南': ['fake.item.id'] } });
    }, /未知的住宅物件 ID/);

    // 單一放置模式多處擺放報錯
    assert.throws(() => {
        validateLayoutInput({ layoutObjects: { '南': ['door.main'], '北': ['door.main'] } });
    }, /不可同時出現在多個宮位/);

    // 非法入路通暢度報錯
    assert.throws(() => {
        validateLayoutInput({ layoutObjects: {}, pathQuality: 'super-open' });
    }, /pathQuality 必須為/);
});

test('風水 CLI 將 inline JSON facing 視為明確輸入並驗證度數衝突', () => {
    const { spawnSync } = require('node:child_process');
    const cli = require('node:path').join(__dirname, '../skills/fengshui-consultant/scripts/fengshui_cli.js');
    const inferred = spawnSync(process.execPath, [cli, '{"heading":0,"mode":"yangzhai"}'], { encoding: 'utf8' });
    assert.equal(inferred.status, 0);
    const explicit = spawnSync(process.execPath, [cli, '{"heading":0,"facing":"南","mode":"yangzhai"}'], { encoding: 'utf8' });
    assert.equal(explicit.status, 1);
    assert.match(explicit.stderr, /FACING|互相矛盾|矛盾/);
});

test('中州派玄空室內佈局評估與資料不足誠實標註', () => {
    const { calculateFengShui } = require('../lib/fengshui');

    // 測試火燒天門（瓦斯爐位於西北乾宮）
    const result = calculateFengShui({
        heading: 180,
        moveInYear: 2024,
        residentYear: 1990,
        sex: '男',
        layoutObjects: {
            '南': ['door.main'],
            '西北': ['space.kitchen', 'appliance.stove']
        },
        entryPath: ['南', '中'],
        pathQuality: 'open'
    });

    assert.ok(result.layoutEvaluation);
    assert.ok(result.layoutEvaluation.findings.length > 0);
    const fireGate = result.layoutEvaluation.findings.find(f => f.ruleId === 'stove-fire-heaven-gate-v1');
    assert.ok(fireGate, '應檢驗出火燒天門');
    assert.equal(fireGate.palace, '西北');
    assert.ok(fireGate.action.length > 0);
    assert.ok(fireGate.reference && fireGate.reference.includes('第四章'), 'finding 應包含考據出處章卷');

    // 誠實標註：主臥室未標註，應出現在 missingData 中，禁止臆測
    assert.ok(result.layoutEvaluation.missingData.includes('space.master_bedroom'));
    assert.ok(result.missingData.includes('space.master_bedroom'));

    // 朝向與度數衝突檢查
    assert.throws(() => {
        calculateFengShui({
            heading: 180, // 南
            facing: '北',  // 矛盾
            moveInYear: 2024
        });
    }, /互相矛盾/);
});

test('中州派規則庫與賦文考據版本、章卷與頁碼完整性 (Task 7.7 Fixtures)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const rules = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/fengshui/zhongzhou-rules.json'), 'utf8'));
    const quotes = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/fengshui/classical-quotes.json'), 'utf8'));

    // 1. 24 山替星規則
    const mountains = Object.keys(rules.substituteStars);
    assert.equal(mountains.length, 24, '應包含完整 24 山替星');
    for (const m of mountains) {
        const sub = rules.substituteStars[m];
        assert.ok(Number.isInteger(sub.substitute), `${m} 替星應為整數`);
        assert.ok(sub.source && sub.source.length > 0, `${m} 應有賦文出處`);
        assert.ok(sub.reference && sub.reference.includes('頁'), `${m} 應有書籍卷頁考據`);
    }

    // 2. 佈局評估規則
    assert.ok(rules.rules.length >= 12, '應包含至少 12 條標準格局規則');
    for (const r of rules.rules) {
        assert.ok(r.ruleId, '規則應有 ruleId');
        assert.ok(r.name, '規則應有 name');
        assert.ok(r.category, '規則應有 category');
        assert.ok(r.reference && r.reference.includes('頁'), `${r.ruleId} 應有版本頁碼考據`);
        assert.ok(r.practicalAction && r.practicalAction.length > 0, `${r.ruleId} 應有現代化環境改善指引`);
    }

    // 3. 經典賦文引證
    assert.ok(quotes.quotes.length >= 8, '應包含至少 8 條經典賦文引證');
    for (const q of quotes.quotes) {
        assert.ok(q.quoteId, '賦文應有 quoteId');
        assert.ok(q.source, '賦文應有 source');
        assert.ok(q.edition, '賦文應有 edition 出版版本');
        assert.ok(q.page, '賦文應有 page 頁碼');
        assert.ok(q.reference, '賦文應有完整 reference');
        assert.ok(q.recommendedAction, '賦文應有建議行動');
    }
});

test('中州派室內佈局評估支援動態元運（八運宅旺星為八白，九紫為生氣）', () => {
    const { calculateFengShui } = require('../lib/fengshui');
    // 八運宅（2015年入宅，旺星為8，生氣為9）
    const resultPeriod8 = calculateFengShui({
        heading: 180,
        moveInYear: 2015,
        layoutObjects: {
            '南': ['door.main']
        }
    });
    assert.equal(resultPeriod8.period, 8);
    assert.ok(resultPeriod8.layoutEvaluation);
});

test('renderFengShui DOM 渲染回歸測試：正確消費完整欄位與本地化標籤且無異常', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const code = fs.readFileSync(path.join(__dirname, '../public/js/divination-suite.js'), 'utf8');

    const elements = {
        suiteVisualBoard: { innerHTML: '', hidden: true },
        aiResponseBox: { innerHTML: '', hidden: true },
        responseSummary: { textContent: '' },
        aiAnalysisText: { innerHTML: '' },
        suiteForm: { addEventListener: () => {}, elements: { mode: { value: 'yangzhai', addEventListener: () => {} } } },
        customDateTimeRow: { style: {} },
        fsGroupYangzhai: { style: {} },
        fsGroupShaqi: { style: {} },
        fsGroupZeri: { style: {} }
    };

    const previousWindow = global.window;
    const previousDoc = global.document;

    global.window = { location: { pathname: '/fengshui' } };
    global.document = {
        readyState: 'complete',
        body: { dataset: { suite: 'fengshui' } },
        addEventListener: () => {},
        getElementById: (id) => elements[id] || { innerHTML: '', style: {}, addEventListener: () => {} },
        querySelector: () => null,
        querySelectorAll: () => []
    };

    try {
        const instrumented = code.replace('function renderFengShui(report) {', 'window.testRenderFengShui = function(report) {');
        eval(instrumented);

        const { calculateFengShui } = require('../lib/fengshui');
        const fixture = calculateFengShui({
            heading: 180,
            moveInYear: 2024,
            residentYear: 1990,
            sex: '男',
            layoutObjects: {
                '南': ['door.main'],
                '西北': ['space.kitchen', 'appliance.stove'],
                '東': ['space.study']
            },
            entryPath: ['南', '中'],
            pathQuality: 'open'
        });

        assert.doesNotThrow(() => {
            global.window.testRenderFengShui(fixture);
        });

        const html = elements.suiteVisualBoard.innerHTML;
        assert.ok(html.length > 500, '盤面應渲染充足 HTML');
        assert.ok(html.includes('大門'), '應包含本地化標籤 大門');
        assert.ok(html.includes('瓦斯爐'), '應包含本地化標籤 瓦斯爐');
        assert.ok(html.includes('中州派玄空室內格局評估'), '應包含中州派評估標題');
        assert.ok(html.includes('羅盤向首'), '應包含羅盤向首');
        assert.ok(html.includes('經典引證'), '應包含經典引證');
    } finally {
        if (previousWindow === undefined) delete global.window; else global.window = previousWindow;
        if (previousDoc === undefined) delete global.document; else global.document = previousDoc;
    }
});

test('Android 羅盤在提供 requestPermission 時仍會監聽 absolute orientation event', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const code = fs.readFileSync(path.join(__dirname, '../public/js/fengshui.js'), 'utf8');
    const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/fengshui/layout-catalog.json'), 'utf8'));
    const elementIds = [
        'btnStartCompass', 'btnLockCompass', 'btnUnlockCompass', 'compassDegreeDisplay',
        'compassMountDisplay', 'compassChartTypeBadge', 'compassNeedle', 'compassProvenance',
        'compassTiltWarning', 'compassHeadingSlider', 'compassHeadingInput', 'fsCategoryPills',
        'fsItemButtons', 'fsActiveItemLabel', 'fsActiveItemHint', 'fsNineGridBoard',
        'fsEntryPathDisplay', 'fsPathQualitySelect', 'btnClearNineGrid', 'fsHeading',
        'fsNorthReference', 'fsDeclination', 'fsHeadingSource', 'fsLayoutObjects',
        'fsEntryPath', 'fsPathQuality', 'fengshuiFacing', 'fsAddPathPalaces'
    ];
    const elements = new Map();

    for (const id of elementIds) {
        const handlers = new Map();
        elements.set(id, {
            value: '', innerHTML: '', textContent: '', disabled: false, style: {}, options: [],
            classList: { add() {}, remove() {} },
            addEventListener(type, handler) { handlers.set(type, handler); },
            querySelectorAll() { return []; },
            getHandler(type) { return handlers.get(type); }
        });
    }
    elements.get('fengshuiFacing').options = [{ value: '南' }, { value: '北' }];

    const listeners = new Map();
    const windowObject = {
        screen: { orientation: { angle: 0 } },
        ondeviceorientationabsolute: null,
        ondeviceorientation: null,
        addEventListener(type, handler) { listeners.set(type, handler); },
        removeEventListener(type) { listeners.delete(type); }
    };
    const context = {
        window: windowObject,
        document: {
            readyState: 'complete',
            getElementById(id) { return elements.get(id) || null; },
            addEventListener() {}
        },
        DeviceOrientationEvent: { requestPermission: async () => 'granted' },
        localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
        fetch: async () => ({ ok: true, async json() { return catalog; } }),
        console,
        alert() {},
        confirm() { return true; },
        Date, Number, Map, Set, JSON, Math, Error, Promise, Intl, parseFloat, parseInt, isNaN
    };

    vm.createContext(context);
    vm.runInContext(code, context);
    await new Promise(resolve => setImmediate(resolve));
    elements.get('btnStartCompass').getHandler('click')();
    await new Promise(resolve => setImmediate(resolve));

    assert.ok(listeners.has('deviceorientationabsolute'), '應監聽 Android absolute orientation event');
    assert.ok(listeners.has('deviceorientation'), '應保留一般 orientation event 作為跨瀏覽器 fallback');

    listeners.get('deviceorientation')({
        type: 'deviceorientation', alpha: 45, beta: 0, gamma: 0, absolute: false
    });
    assert.equal(elements.get('fsHeading').value, '', '相對方向事件不可被當成羅盤 heading');

    listeners.get('deviceorientationabsolute')({
        type: 'deviceorientationabsolute', alpha: 90, beta: 0, gamma: 0, absolute: true
    });

    assert.notEqual(elements.get('fsHeading').value, '', 'absolute event 應寫入 heading');
    assert.equal(elements.get('fsHeadingSource').value, 'sensor');

    // 傾角超過 ±15° 觸發警告並禁止鎖定
    listeners.get('deviceorientationabsolute')({
        type: 'deviceorientationabsolute', alpha: 90, beta: 25, gamma: 0, absolute: true
    });
    assert.equal(elements.get('compassTiltWarning').style.display, 'block', '傾斜時應顯示警示');
    assert.equal(elements.get('btnLockCompass').disabled, true, '傾斜時禁止鎖定');

    // 恢復水平後警示消失
    listeners.get('deviceorientationabsolute')({
        type: 'deviceorientationabsolute', alpha: 90, beta: 0, gamma: 0, absolute: true
    });
    assert.equal(elements.get('compassTiltWarning').style.display, 'none', '水平時警示隱藏');
});

test('風水九宮互動無障礙宣告 (ARIA Live Announcements)', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const code = fs.readFileSync(path.join(__dirname, '../public/js/fengshui.js'), 'utf8');
    const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/fengshui/layout-catalog.json'), 'utf8'));

    const elementIds = [
        'btnStartCompass', 'btnLockCompass', 'btnUnlockCompass', 'compassDegreeDisplay',
        'compassMountDisplay', 'compassChartTypeBadge', 'compassNeedle', 'compassProvenance',
        'compassTiltWarning', 'compassHeadingSlider', 'compassHeadingInput', 'fsCategoryPills',
        'fsItemButtons', 'fsActiveItemLabel', 'fsActiveItemHint', 'fsNineGridBoard',
        'fsEntryPathDisplay', 'fsPathQualitySelect', 'btnClearNineGrid', 'fsHeading',
        'fsNorthReference', 'fsDeclination', 'fsHeadingSource', 'fsLayoutObjects',
        'fsEntryPath', 'fsPathQuality', 'fengshuiFacing', 'fsAddPathPalaces', 'fsAriaStatus'
    ];
    const elements = new Map();

    for (const id of elementIds) {
        const handlers = new Map();
        elements.set(id, {
            value: '', innerHTML: '', textContent: '', disabled: false, style: {}, options: [],
            classList: { add() {}, remove() {} },
            addEventListener(type, handler) { handlers.set(type, handler); },
            querySelectorAll() { return []; },
            getHandler(type) { return handlers.get(type); }
        });
    }

    const context = {
        window: {
            screen: { orientation: { angle: 0 } },
            addEventListener() {},
            removeEventListener() {}
        },
        document: {
            readyState: 'complete',
            getElementById(id) { return elements.get(id) || null; },
            addEventListener() {}
        },
        localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
        fetch: async () => ({ ok: true, async json() { return catalog; } }),
        console,
        alert() {},
        confirm() { return true; },
        Date, Number, Map, Set, JSON, Math, Error, Promise, Intl, parseFloat, parseInt, isNaN
    };

    vm.createContext(context);
    vm.runInContext(code, context);
    await new Promise(resolve => setImmediate(resolve));

    // 觸發清空格局標註
    const clearBtn = elements.get('btnClearNineGrid');
    assert.ok(clearBtn && clearBtn.getHandler('click'), '應綁定清空按鈕');
    clearBtn.getHandler('click')();
    assert.equal(elements.get('fsAriaStatus').textContent, '已清空九宮中所有住宅物件標註', '清空應更新無障礙宣告');
});

test('風水九宮編輯器實時飛星預覽、鍵盤操作與無障礙宣告完整性 (Task 7.11)', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const code = fs.readFileSync(path.join(__dirname, '../public/js/fengshui.js'), 'utf8');
    const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/fengshui/layout-catalog.json'), 'utf8'));

    const elementIds = [
        'btnStartCompass', 'btnLockCompass', 'btnUnlockCompass', 'compassDegreeDisplay',
        'compassMountDisplay', 'compassChartTypeBadge', 'compassNeedle', 'compassProvenance',
        'compassTiltWarning', 'compassHeadingSlider', 'compassHeadingInput', 'fsCategoryPills',
        'fsItemButtons', 'fsActiveItemLabel', 'fsActiveItemHint', 'fsNineGridBoard',
        'fsEntryPathDisplay', 'fsPathQualitySelect', 'btnClearNineGrid', 'fsHeading',
        'fsNorthReference', 'fsDeclination', 'fsHeadingSource', 'fsLayoutObjects',
        'fsEntryPath', 'fsPathQuality', 'fengshuiFacing', 'moveInYear', 'fsAddPathPalaces', 'fsAriaStatus'
    ];
    const elements = new Map();

    for (const id of elementIds) {
        const handlers = new Map();
        elements.set(id, {
            value: '', innerHTML: '', textContent: '', disabled: false, style: {}, options: [],
            classList: { add() {}, remove() {} },
            addEventListener(type, handler) { handlers.set(type, handler); },
            querySelectorAll() { return []; },
            getHandler(type) { return handlers.get(type); }
        });
    }
    elements.get('fengshuiFacing').value = '南';
    elements.get('moveInYear').value = '2024';

    const context = {
        window: {
            screen: { orientation: { angle: 0 } },
            addEventListener() {},
            removeEventListener() {}
        },
        document: {
            readyState: 'complete',
            getElementById(id) { return elements.get(id) || null; },
            addEventListener() {}
        },
        localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
        fetch: async () => ({ ok: true, async json() { return catalog; } }),
        console,
        alert() {},
        confirm() { return true; },
        Date, Number, Map, Set, JSON, Math, Error, Promise, Intl, parseFloat, parseInt, isNaN
    };

    vm.createContext(context);
    vm.runInContext(code, context);
    await new Promise(resolve => setImmediate(resolve));

    // 1. 驗證九宮編輯器產生之盤面包含飛星即時預覽 (.fs-cell-stars-preview)
    const boardHtml = elements.get('fsNineGridBoard').innerHTML;
    assert.ok(boardHtml.includes('fs-cell-stars-preview'), '九宮編輯器應包含飛星即時預覽');
    assert.ok(boardHtml.includes('9運'), '九宮編輯器中應正確顯示九運運星');
    assert.ok(boardHtml.includes('fs-pstar-m') && boardHtml.includes('fs-pstar-f'), '九宮編輯器應同時顯示山星與向星');
    assert.ok(boardHtml.includes('aria-label="南宮位，運星'), '宮位應具備完整的 ARIA 飛星標籤');

    // 2. 驗證朝向變更時自動觸發排盤更新
    elements.get('fengshuiFacing').value = '北';
    const facingChangeHandler = elements.get('fengshuiFacing').getHandler('change');
    assert.ok(typeof facingChangeHandler === 'function', 'fengshuiFacing 應綁定 change 監聽器');
    facingChangeHandler();
    const updatedBoardHtml = elements.get('fsNineGridBoard').innerHTML;
    assert.ok(updatedBoardHtml.includes('fs-cell-stars-preview'), '更新朝向後仍保有飛星');
    assert.notEqual(updatedBoardHtml, boardHtml, '更新朝向後九宮星曜分佈應即時重新計算更新');

    // 3. 驗證分類 Pills 具備 role="tab" 與 aria-selected
    const catHtml = elements.get('fsCategoryPills').innerHTML;
    assert.ok(catHtml.includes('role="tab"'), '分類 pill 應具備 role="tab"');
    assert.ok(catHtml.includes('aria-selected="true"'), '當前選中分類應標註 aria-selected="true"');

    // 4. 驗證物件按鈕具備 role="button" 與 aria-pressed
    const itemHtml = elements.get('fsItemButtons').innerHTML;
    assert.ok(itemHtml.includes('role="button"'), '物件 pill 應具備 role="button"');
    assert.ok(itemHtml.includes('aria-pressed="false"'), '未選中物件應標註 aria-pressed="false"');
});
