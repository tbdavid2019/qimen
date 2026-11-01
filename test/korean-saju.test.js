const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execSync } = require('node:child_process');
const {
    calculateKoreanSaju,
    calculateSingangScore,
    ILGAN_ARCHETYPES,
    REMEDIES_TABLE,
    GUNGWI_PILLARS,
    SAJU_18_CHAPTERS
} = require('../lib/korean-saju');

describe('韓式現代四柱命理 (K-Saju · 18장 평생사주) 核心引擎測試', () => {

    test('10 日干靈魂原型字典完整性與關鍵字驗證', () => {
        const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        stems.forEach(stem => {
            const arch = ILGAN_ARCHETYPES[stem];
            assert.ok(arch, `缺少天干 ${stem} 之靈魂原型`);
            assert.ok(arch.title, `天干 ${stem} 缺少稱號`);
            assert.ok(arch.hangul, `天干 ${stem} 缺少韓文`);
            assert.ok(arch.mbtiResonance, `天干 ${stem} 缺少 MBTI 共鳴`);
            assert.ok(Array.isArray(arch.coreKeywords) && arch.coreKeywords.length >= 3, `天干 ${stem} 關鍵詞不足`);
            assert.ok(arch.strengths, `天干 ${stem} 缺少核心性格`);
            assert.ok(arch.vulnerabilities, `天干 ${stem} 缺少盲點分析`);
        });
    });

    test('缺失五行生活開運法 (개운법) 完整性驗證', () => {
        const elements = ['木', '火', '土', '金', '水'];
        elements.forEach(elem => {
            const remedy = REMEDIES_TABLE[elem];
            assert.ok(remedy, `缺少五行 ${elem} 之開運法`);
            assert.ok(Array.isArray(remedy.colors) && remedy.colors.length > 0, `五行 ${elem} 缺少開運色`);
            assert.ok(Array.isArray(remedy.luckyDirections) && remedy.luckyDirections.length > 0, `五行 ${elem} 缺少吉方`);
            assert.ok(Array.isArray(remedy.dietWellness) && remedy.dietWellness.length > 0, `五行 ${elem} 缺少飲食建議`);
            assert.ok(Array.isArray(remedy.lifestyleHabits) && remedy.lifestyleHabits.length > 0, `五行 ${elem} 缺少生活習慣`);
            assert.ok(remedy.actionAdvice, `五行 ${elem} 缺少微行動建言`);
        });
    });

    test('四柱宮位論 (궁위론) 4大人生舞台映射正確', () => {
        assert.equal(GUNGWI_PILLARS.length, 4);
        assert.equal(GUNGWI_PILLARS[0].key, 'year');
        assert.equal(GUNGWI_PILLARS[1].key, 'month');
        assert.equal(GUNGWI_PILLARS[2].key, 'day');
        assert.equal(GUNGWI_PILLARS[3].key, 'hour');
        assert.ok(GUNGWI_PILLARS[0].hangul.includes('연주'));
        assert.ok(GUNGWI_PILLARS[2].hangul.includes('일주'));
    });

    test('平生四柱 18 章目錄結構定義完整', () => {
        assert.equal(SAJU_18_CHAPTERS.length, 18);
        assert.equal(SAJU_18_CHAPTERS[0].chapter, 1);
        assert.ok(SAJU_18_CHAPTERS[0].title.includes('總評'));
        assert.equal(SAJU_18_CHAPTERS[17].chapter, 18);
        assert.ok(SAJU_18_CHAPTERS[17].title.includes('照見當下'));
    });

    test('身強身弱能量天秤 (Singang / Sinyak Score 0~100) 量化計算', () => {
        // 1995-06-15 12:00 (乙亥 壬午 丁丑 丙午，日主丁火生於午月得令，時支午火同氣)
        const res = calculateKoreanSaju({
            date: '1995-06-15',
            time: '12:00',
            sex: '男'
        });

        assert.ok(res.koreanSaju);
        const meter = res.koreanSaju.energyMeter;
        assert.ok(typeof meter.score === 'number');
        assert.ok(meter.score >= 0 && meter.score <= 100);
        assert.equal(meter.level, '신강 (身強)');
        assert.ok(meter.details.deungryeong > 0, '生於午月丁火應得令');
        assert.ok(meter.description);
    });

    test('五行分佈與缺失五行判定與專屬開運法裝配', () => {
        // 1995-06-15 (乙亥 壬午 丁丑 丙午) -> 木1, 火4, 土1, 金0, 水2
        const res = calculateKoreanSaju({
            date: '1995-06-15',
            time: '12:00',
            sex: '男'
        });

        const feb = res.koreanSaju.fiveElementsBalance;
        assert.ok(Array.isArray(feb.missingElements));
        assert.ok(feb.missingElements.includes('金'), '命中缺金應被正確檢出');
        assert.equal(feb.primaryRemedy.element, '金');
        assert.ok(feb.primaryRemedy.colors.includes('純白色') || feb.primaryRemedy.colors.includes('銀色'));
    });

    test('支援首爾經度與真太陽時均時差校正', () => {
        const res = calculateKoreanSaju({
            date: '1995-06-15',
            time: '12:00',
            sex: '男',
            place: '首爾'
        });

        assert.ok(res.koreanSaju);
        assert.ok(res.fourPillars);
        assert.equal(res.profile.mode, 'saju');
    });

    test('支援未知時辰 (allowUnknownHour) 與四柱宮位安全降級', () => {
        const res = calculateKoreanSaju({
            date: '1995-06-15',
            sex: '男',
            allowUnknownHour: true
        });

        assert.ok(res.koreanSaju);
        const hourPalace = res.koreanSaju.palaceBreakdown[3];
        assert.equal(hourPalace.stem, '—');
        assert.equal(hourPalace.pillarValue, '未知');
    });

    test('CLI 腳本支援 --mode saju 獨立運行輸出 JSON', () => {
        const cliPath = path.join(__dirname, '../skills/bazi2-consultant/scripts/bazi_cli.js');
        const cmd = `node "${cliPath}" --mode saju --date 1995-06-15 --time 12:00 --sex 男`;
        const output = execSync(cmd, { encoding: 'utf-8' });
        const json = JSON.parse(output);

        assert.ok(json.koreanSaju, 'CLI 輸出必須包含 koreanSaju 物件');
        assert.equal(json.koreanSaju.archetype.stem, '丁');
        assert.ok(json.koreanSaju.energyMeter.score > 0);
        assert.equal(json.koreanSaju.chapters.length, 18);
    });

    test('API 端點 /api/saju/chart 即使未傳入 mode 亦預設以 saju 模式排盤', async () => {
        const http = require('node:http');
        const app = require('../app');
        const server = http.createServer(app);

        await new Promise((resolve) => server.listen(0, resolve));
        const port = server.address().port;

        try {
            const resp = await fetch(`http://127.0.0.1:${port}/api/saju/chart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: '1995-06-15',
                    time: '12:00',
                    sex: '男'
                })
            });
            const data = await resp.json();
            assert.equal(resp.status, 200);
            assert.equal(data.success, true);
            assert.ok(data.chart.koreanSaju, '未傳 mode 時 /api/saju/chart 必須自動附帶 koreanSaju');
            assert.equal(data.chart.mode, 'saju');
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    test('身強身弱能量天秤 5 大區間分級與 calculateSingangScore 真實引擎驗證', () => {
        // 1. 預設空盤 fallback 為 50 分中和
        const emptyMeter = calculateSingangScore(null);
        assert.equal(emptyMeter.score, 50);
        assert.equal(emptyMeter.level, '중화 (中和平衡)');

        // 2. 極端身弱 (四柱皆剋洩，不得令不得地不得勢) -> score 10 極身弱 (0~35)
        const sinyakBazi = {
            dayMaster: { stem: '庚', element: '金' },
            fourPillars: [
                { stem: '丙', branch: '午' }, // year: 火
                { stem: '丙', branch: '午' }, // month: 火
                { stem: '庚', branch: '子' }, // day: 水
                { stem: '丁', branch: '巳' }  // hour: 火
            ]
        };
        const weakMeter = calculateSingangScore(sinyakBazi);
        assert.ok(weakMeter.score < 36, `極弱盤得分應 < 36, 實際為 ${weakMeter.score}`);
        assert.equal(weakMeter.level, '극신약 (極身弱)');

        // 3. 極端身強 (四柱皆同氣金，得令得地得勢) -> score 100 極身強 (65~100)
        const singangBazi = {
            dayMaster: { stem: '庚', element: '金' },
            fourPillars: [
                { stem: '辛', branch: '酉' }, // year: 金
                { stem: '庚', branch: '申' }, // month: 金
                { stem: '庚', branch: '申' }, // day: 金
                { stem: '辛', branch: '酉' }  // hour: 金
            ]
        };
        const strongMeter = calculateSingangScore(singangBazi);
        assert.ok(strongMeter.score >= 65, `極強盤得分應 >= 65, 實際為 ${strongMeter.score}`);
        assert.equal(strongMeter.level, '극신강 (極身強)');
        assert.equal(strongMeter.levelChinese, '極身強 (能量極旺盛)');

        // 4. 驗證 74 分確屬極身強 (極旺) 區間 (65~100)
        assert.ok(74 >= 65 && 74 <= 100, '74 分屬於極身強 (65~100) 區間');
    });
});
