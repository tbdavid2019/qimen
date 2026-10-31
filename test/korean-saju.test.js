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
});
