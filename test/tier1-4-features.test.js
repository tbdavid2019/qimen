const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../app');
const {
    searchAuspiciousTimes,
    evaluateDecisionCombo,
    analyzeCezi,
    calculateYunqiWellness,
    buildFactChecklist,
    verifyAnalysisClaims
} = require('../lib/advanced-wisdom');
const {
    calculateBazi,
    calculateChenggu,
    lookupBaziDates,
    analyzeBaziTimeSensitivity
} = require('../lib/bazi2');
const {
    calculateFengShui,
    evaluateMenZhuZao,
    chooseZeri
} = require('../lib/fengshui');
const {
    baziMatchFull
} = require('../lib/yinyuan');
const {
    LLMAnalysisService
} = require('../lib/llm-analysis');

let server;
let baseUrl;

async function postJson(path, body) {
    return fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    });
}

async function getJson(path) {
    return fetch(`${baseUrl}${path}`);
}

test.before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
});

// ==========================================
// Tier 1A: 吉時獵手・反向條件擇日
// ==========================================
test('Tier 1A - searchAuspiciousTimes 演算法核心計算與時段評分', () => {
    const result = searchAuspiciousTimes({
        startDate: '2026-10-22',
        days: 3,
        direction: '南',
        purpose: '求財',
        minScore: 50
    });

    assert.ok(result.totalEvaluated > 0, '應評估多個時段');
    assert.ok(Array.isArray(result.topSlots), '應返回候選吉時列表');
    assert.ok(result.topSlots.length > 0, '在寬鬆條件下應篩選出吉時');

    const first = result.topSlots[0];
    assert.ok(first.date, '應有日期');
    assert.ok(first.shichen, '應有時辰');
    assert.ok(first.dayGanZhi, '應有日柱干支');
    assert.ok(first.timeGanZhi, '應有時柱干支');
    assert.ok(first.qimenDun, '應有奇門遁局');
    assert.ok(typeof first.score === 'number', '應有評分數值');
    assert.ok(first.score >= 50, '評分應大於等於最低門檻');
    assert.ok(first.grade, '應有評定等級');
    assert.ok(first.reason, '應有擇日說明');
});

test('Tier 1A - chooseZeri 整合奇門吉時獵手', () => {
    const zeri = chooseZeri('入宅/喬遷', 2026, 10);
    assert.ok(zeri.auspiciousDates.length > 0);
    assert.ok(Array.isArray(zeri.qimenGoldenSlots), '風水擇日應內嵌奇門吉時獵手推薦');
    assert.ok(zeri.qimenGoldenSlots.length > 0);
    assert.ok(zeri.qimenGoldenSlots[0].bestDirection);
});

test('Tier 1A - API POST /api/zeri/search', async () => {
    const res = await postJson('/api/zeri/search', {
        startDate: '2026-10-22',
        days: 3,
        purpose: '求財'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.topSlots.length > 0);
    assert.ok(body.summary);
});

// ==========================================
// Tier 1B: 八字四柱反查西曆生辰
// ==========================================
test('Tier 1B - lookupBaziDates 反查西曆生辰演算法', () => {
    // 測試已知八字組合：庚午 辛巳 庚辰 壬午 (1990年05月15日)
    const result = lookupBaziDates({
        yearPillar: '庚午',
        monthPillar: '辛巳',
        dayPillar: '庚辰',
        hourPillar: '壬午',
        startYear: 1980,
        endYear: 2030
    });

    assert.equal(result.pillars.yearPillar, '庚午');
    assert.equal(result.pillars.monthPillar, '辛巳');
    assert.equal(result.pillars.dayPillar, '庚辰');
    assert.equal(result.pillars.hourPillar, '壬午');
    assert.ok(Array.isArray(result.matches));
    assert.ok(result.matches.length > 0, '1990年應有精確吻合的西曆公曆生辰');

    const match = result.matches[0];
    assert.equal(match.year, 1990);
    assert.ok(match.solarDate.startsWith('1990-'));
    assert.ok(match.lunarText);
});

test('Tier 1B - lookupBaziDates 驗證無效干支拋出或返回錯誤', () => {
    assert.throws(() => {
        lookupBaziDates({
            yearPillar: '甲丑', // 甲丑不存在，六十甲子中甲必配子、戌、申、午、辰、寅
            monthPillar: '丙寅',
            dayPillar: '戊辰',
            hourPillar: '庚申'
        });
    }, /六十甲子/);
});

test('Tier 1B - API POST /api/bazi2/inverse-lookup', async () => {
    const res = await postJson('/api/bazi2/inverse-lookup', {
        yearPillar: '庚午',
        monthPillar: '辛巳',
        dayPillar: '庚辰',
        hourPillar: '壬午',
        startYear: 1980,
        endYear: 2030
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.matches.length > 0);
});

// ==========================================
// Tier 1C: 稱骨算命 & 時辰敏感度分析
// ==========================================
test('Tier 1C - calculateChenggu 袁天罡稱骨算命精準計算', () => {
    // 1990年（庚午年 9錢），農曆五月（5錢），初六日（1兩5錢），辰時（9錢）
    // 總重 = 0.9 + 0.5 + 1.5 + 0.9 = 3.8 兩 (三兩八錢)
    const result = calculateChenggu('庚午', 5, 6, '辰');
    assert.equal(result.totalWeight, 3.8);
    assert.equal(result.weightText, '三兩八錢');
    assert.ok(result.poem, '應有經典稱骨歌訣');
    assert.ok(result.meaning, '應有白話解意');
    assert.ok(result.level, '應有格局評等');
});

test('Tier 1C - analyzeBaziTimeSensitivity 十二時辰敏感度分析', () => {
    const sensitivity = analyzeBaziTimeSensitivity({ date: '1990-05-15', hour: '08:30' });
    assert.equal(sensitivity.birthDate, '1990-05-15');
    assert.equal(sensitivity.baseHour, '08:30');
    assert.ok(sensitivity.dayMaster, '應有日主');
    assert.ok(sensitivity.currentPattern, '應有當前格局');
    assert.ok(Array.isArray(sensitivity.allShichenPatterns), '應掃描 12 個時辰');
    assert.equal(sensitivity.allShichenPatterns.length, 12);
    assert.ok(typeof sensitivity.stabilityScore === 'number');
    assert.ok(sensitivity.stabilityLevel);
    assert.ok(sensitivity.recommendation);
});

test('Tier 1C - calculateBazi 包含稱骨算命與五運六氣', () => {
    const bazi = calculateBazi({ calendar: 'solar', date: '1990-05-15', time: '08:30', sex: '男' });
    assert.ok(bazi.chenggu, '八字報告應內嵌稱骨算命');
    assert.ok(bazi.chenggu.weightText);
    assert.ok(bazi.chenggu.poem);
    assert.ok(bazi.yunqiWellness, '八字報告應內嵌五運六氣');
    assert.ok(bazi.yunqiWellness.suiYun);
});

test('Tier 1C - API POST /api/bazi2/time-sensitivity', async () => {
    const res = await postJson('/api/bazi2/time-sensitivity', {
        date: '1990-05-15',
        hour: '08:30'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.allShichenPatterns.length, 12);
    assert.ok(body.stabilityScore >= 0);
});

// ==========================================
// Tier 1D: 《陽宅三要》門・主・灶吉凶配星斷訣
// ==========================================
test('Tier 1D - evaluateMenZhuZao 東四命純清相生大吉格', () => {
    // 門: 震東, 主: 坎北, 灶: 巽東南
    const result = evaluateMenZhuZao({
        gateDir: '東',
        masterDir: '北',
        stoveDir: '東南'
    });
    assert.equal(result.provided, true);
    assert.equal(result.groupConsistency, '純清相生（同一宅系）');
    assert.ok(result.grade.includes('吉'));
    assert.equal(result.warnings.length, 0);
    assert.ok(result.remedies.length > 0);
    assert.ok(result.classicQuote);
});

test('Tier 1D - evaluateMenZhuZao 火燒天門與門沖灶凶象檢驗', () => {
    // 門: 離南, 灶: 乾西北（火燒天門），且門南灶北沖（門沖灶）
    const result = evaluateMenZhuZao({
        gateDir: '南',
        masterDir: '西',
        stoveDir: '西北'
    });
    assert.equal(result.provided, true);
    const hasFireHeaven = result.warnings.some(w => w.includes('火燒天門'));
    assert.ok(hasFireHeaven, '灶居西北乾宮應觸發火燒天門警示');
    assert.ok(result.remedies.some(r => r.includes('火燒天門') || r.includes('五行') || r.includes('土')));
});

test('Tier 1D - calculateFengShui 整合門主灶評估', () => {
    const fengshui = calculateFengShui({
        facing: '南',
        gateDir: '東',
        masterDir: '北',
        stoveDir: '東南'
    });
    assert.ok(fengshui.menZhuZao, '風水計算應包含門主灶分析');
    assert.equal(fengshui.menZhuZao.provided, true);
    assert.ok(fengshui.menZhuZao.patternName);
});

test('Tier 1D - API POST /api/fengshui/men-zhu-zao', async () => {
    const res = await postJson('/api/fengshui/men-zhu-zao', {
        gateDir: '東',
        masterDir: '北',
        stoveDir: '東南'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.grade.includes('吉'));
});

// ==========================================
// Tier 2A: 雙人深度合婚・合夥・職場搭檔全息合參
// ==========================================
test('Tier 2A - baziMatchFull 支援婚姻、合夥與職場場景', () => {
    const personA = { date: '1990-05-15', time: '08:30', sex: '男' };
    const personB = { date: '1992-08-20', time: '14:20', sex: '女' };

    // 婚姻場景
    const marriageMatch = baziMatchFull(personA, personB, { scene: 'marriage' });
    assert.equal(marriageMatch.scene, 'marriage');
    assert.ok(marriageMatch.pillarScan, '應提供四柱交叉比對');
    assert.ok(marriageMatch.mingGuaMatch, '應提供命卦合參');
    assert.ok(marriageMatch.sceneAdvice, '應提供婚姻專屬建議');
    assert.ok(marriageMatch.score >= 0 && marriageMatch.score <= 100);

    // 合夥創業場景
    const partnerMatch = baziMatchFull(personA, personB, { scene: 'partnership' });
    assert.equal(partnerMatch.scene, 'partnership');
    assert.ok(partnerMatch.sceneAdvice.focus.includes('合夥') || partnerMatch.sceneAdvice.focus.includes('財務'));

    // 職場搭檔場景
    const colleagueMatch = baziMatchFull(personA, personB, { scene: 'colleague' });
    assert.equal(colleagueMatch.scene, 'colleague');
    assert.ok(colleagueMatch.sceneAdvice.focus.includes('職場') || colleagueMatch.sceneAdvice.focus.includes('分工'));
});

test('Tier 2A - API POST /api/combo/marriage 與 POST /api/yinyuan/match', async () => {
    const payload = {
        first: { date: '1990-05-15', time: '08:30', sex: '男' },
        second: { date: '1992-08-20', time: '14:20', sex: '女' },
        scene: 'partnership'
    };

    const res1 = await postJson('/api/combo/marriage', payload);
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.success, true);
    assert.equal(body1.match.scene, 'partnership');
    assert.ok(body1.match.mingGuaMatch);

    const res2 = await postJson('/api/yinyuan/match', {
        first: payload.first,
        second: payload.second,
        scene: 'colleague'
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.success, true);
    assert.equal(body2.match.scene, 'colleague');
});

// ==========================================
// Tier 2B: 重大決策「奇門 × 六爻 × 梅花」三卜合參引擎
// ==========================================
test('Tier 2B - evaluateDecisionCombo 演算法與綜合裁決', () => {
    const result = evaluateDecisionCombo({
        question: '是否應該在今年下半年辭職創業建立新品牌？',
        matter: '事業創業',
        date: '2026-10-22',
        time: '14:30'
    });

    assert.equal(result.question, '是否應該在今年下半年辭職創業建立新品牌？');
    assert.ok(result.qimen, '應有奇門遁甲研判');
    assert.ok(result.meihua, '應有梅花易數研判');
    assert.ok(result.liuyao, '應有六爻神卦研判');
    assert.ok(result.synthesis, '應有三法全息合參');
    assert.ok(typeof result.synthesis.synthesisScore === 'number');
    assert.ok(result.synthesis.verdict, '應有吉凶結論');
    assert.ok(result.synthesis.strategy, '應有具體決策行動策略');
    assert.ok(result.synthesis.timingGuide, '應有時機指引');
});

test('Tier 2B - API POST /api/combo/decision 驗證', async () => {
    const res = await postJson('/api/combo/decision', {
        question: '今年是否適合購置第二套房產以作長期資產配置？',
        category: '購屋置產'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.combo.synthesis.synthesisScore >= 0);
    assert.ok(body.combo.qimen.door);
    assert.ok(body.combo.meihua.bengua);
    assert.ok(body.combo.liuyao.hexagram);
});

// ==========================================
// Tier 3A: 測字占事
// ==========================================
test('Tier 3A - analyzeCezi 中文字拆字、筆畫、五行與卦象對應', () => {
    const testChar = '明';
    const result = analyzeCezi({
        character: testChar,
        question: '下半年投資前景如何？',
        category: '財運'
    });

    assert.equal(result.character, '明');
    assert.equal(result.strokeCount, 8); // 日(4) + 月(4) = 8
    assert.ok(result.fiveElement, '應判定五行歸屬');
    assert.ok(result.radicalStructure, '應有字形結構解構');
    assert.ok(result.glyphDeconstruction, '應有拆字字理意象');
    assert.ok(result.yijingHexagram, '應對應易經八卦');
    assert.ok(result.categoryAnalysis, '應有分類占斷');
    assert.ok(result.advice, '應有行動叮嚀');
});

test('Tier 3A - API POST /api/name-analysis/cezi 驗證', async () => {
    const res = await postJson('/api/name-analysis/cezi', {
        char: '泰',
        question: '新產品發布時機是否恰當？',
        category: '事業'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.result.character, '泰');
    assert.ok(body.result.strokeCount > 0);
    assert.ok(body.result.yijingHexagram);
});

// ==========================================
// Tier 3B: 五運六氣 × 二十四節氣 × 十二時辰子午流注養生
// ==========================================
test('Tier 3B - calculateYunqiWellness 五運六氣與子午流注精算', () => {
    const result = calculateYunqiWellness('2026-10-22', '10:00');

    assert.equal(result.date, '2026-10-22');
    assert.equal(result.yearGanZhi, '丙午');
    assert.ok(result.suiYun, '應有歲運（大運中運）');
    assert.ok(result.siTian, '應有司天');
    assert.ok(result.zaiQuan, '應有在泉');
    assert.ok(result.solarTerm, '應有當令節氣');
    assert.ok(result.meridianFlow, '應有子午流注當令經絡');
    assert.ok(result.wellnessAdvice.diet, '應有飲食調養指南');
    assert.ok(result.wellnessAdvice.acupuncturePoints.length > 0, '應推薦穴位保健');
    assert.ok(result.wellnessAdvice.taboo, '應有時令忌諱');
});

test('Tier 3B - API POST /api/bazi2/yunqi-wellness 驗證', async () => {
    const res = await postJson('/api/bazi2/yunqi-wellness', {
        date: '2026-10-22',
        time: '14:30'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.suiYun);
    assert.ok(body.meridianFlow.meridian);
});

// ==========================================
// Tier 4A: 確定性事實鎖定清單與防幻覺核驗機制
// ==========================================
test('Tier 4A - buildFactChecklist 生成八字排盤事實清單', () => {
    const baziData = calculateBazi({ calendar: 'solar', date: '1990-05-15', time: '08:30', sex: '男' });
    const checklist = buildFactChecklist('bazi2', baziData);

    assert.equal(checklist.serviceKey, 'bazi2');
    assert.ok(checklist.facts['日主 (日元)']);
    assert.ok(checklist.facts['年柱']);
    assert.ok(checklist.facts['月柱']);
    assert.ok(checklist.facts['日柱']);
    assert.ok(checklist.facts['時柱']);
    assert.ok(checklist.facts['稱骨重量']);
    assert.ok(Array.isArray(checklist.keyRules));
    assert.ok(checklist.keyRules.length > 0);
});

test('Tier 4A - verifyAnalysisClaims 偵測 AI 回答中對確定事實的篡改或矛盾', () => {
    const checklist = {
        service: 'bazi2',
        facts: {
            '日主 (日元)': '庚金',
            '年柱': '庚午',
            '月柱': '辛巳',
            '日柱': '庚辰',
            '時柱': '庚辰'
        }
    };

    // 含有矛盾的假想文字（宣稱日元為甲木）
    const contradictoryText = '你的八字日主為甲木，性格仁慈，生於巳月木氣凋零...';
    const report1 = verifyAnalysisClaims(contradictoryText, checklist);
    assert.equal(report1.passed, false);
    assert.ok(report1.contradictions.length > 0);
    assert.ok(report1.contradictions[0].includes('日主'));

    // 忠實於事實清單的文字
    const consistentText = '你的日主是庚金，生於巳月，庚午年造，金氣肅殺剛毅...';
    const report2 = verifyAnalysisClaims(consistentText, checklist);
    assert.equal(report2.passed, true);
    assert.equal(report2.contradictions.length, 0);
});

test('Tier 4A - formatServiceForLLM 自動注入確定性事實防幻覺防線', () => {
    const baziData = calculateBazi({ calendar: 'solar', date: '1990-05-15', time: '08:30', sex: '男' });
    const formatted = LLMAnalysisService.formatServiceForLLM('bazi2', baziData, '綜合', '分析事業與財運');
    const prompt = typeof formatted === 'string' ? formatted : formatted.prompt;

    assert.ok(prompt.includes('確定性事實鎖定清單'), 'Prompt 中必須注入事實清單標題');
    assert.ok(prompt.includes('唯一依據'), 'Prompt 中必須注入防幻覺嚴格約束');
    assert.ok(prompt.includes('日主元神'));
});

test('Dual-Review Fix - POST /api/name-analysis-question 支援 mode=cezi 多輪追問不拋 INVALID_NAME', async () => {
    const res = await postJson('/api/name-analysis-question', {
        mode: 'cezi',
        character: '安',
        question: '這個字對轉職有什麼具體建議？',
        birthDate: '1990-05-15'
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.result.char, '安');
    assert.ok(body.result.stroke > 0);
});

test('Dual-Review Fix - analyzeCezi 支援 text 與 matter 參數別名並阻擋未收錄生僻字', () => {
    const res = analyzeCezi({ text: '安', matter: '事業升遷', sex: '男' });
    assert.equal(res.char, '安');
    assert.equal(res.question, '事業升遷');
    assert.throws(() => analyzeCezi({ text: '𪚥', matter: '測試未收錄字' }), /康熙字典庫中未收錄/);
});

test('Dual-Review Fix - POST /api/fengshui/zeri-search 別名路由與八卦卦名門主灶相容', async () => {
    const res = await postJson('/api/fengshui/zeri-search', {
        purpose: '入宅',
        startDate: '2026-10-22',
        days: 2
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.topSlots));

    const mzz = evaluateMenZhuZao({ gateDir: '巽', masterDir: '離', stoveDir: '乾' });
    assert.equal(mzz.gateDir, '東南');
    assert.equal(mzz.masterDir, '南');
    assert.equal(mzz.stoveDir, '西北');
    assert.ok(mzz.warnings.some(w => w.includes('火燒天門')));
});
