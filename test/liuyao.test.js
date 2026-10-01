/**
 * test/liuyao.test.js
 * 
 * 六爻神卦 (京房納甲筮法) 核心單元測試
 * 涵蓋：
 * 1. 64 卦八宮歸屬、世應定位、五行
 * 2. 納甲天干地支與六親生剋
 * 3. 伏神 (首宮八純卦對照與飛伏生剋)
 * 4. 日干起六神 (六獸)
 * 5. 朱熹《易學啟蒙》0~6 爻動考變占斷法
 * 6. 多種起卦法 (大衍筮法、三枚銅錢、年月日時、手動爻值)
 * 7. 智能用神自動識別
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    calculateLiuyao,
    parseLines,
    castByCoins,
    castByDayan,
    castByDatetime,
    tossThreeCoins,
    resolveYongShen,
    evaluateZhuXiRule,
    resolveFuShen,
    getLiuqin,
    EIGHT_PALACES,
    HEXAGRAM_LOOKUP,
    LIUSHEN_MAP
} = require('../lib/liuyao');

describe('六爻神卦核心演算法測試 (Liuyao Divination Core Tests)', () => {

    it('64 卦八宮完整性：應具備 8 宮、每宮 8 卦，共計 64 卦', () => {
        const palaceKeys = Object.keys(EIGHT_PALACES);
        assert.equal(palaceKeys.length, 8, '應有 8 個宮');
        let totalCount = 0;
        for (const [palace, data] of Object.entries(EIGHT_PALACES)) {
            assert.equal(data.hexagrams.length, 8, `${palace}宮應包含 8 個卦`);
            totalCount += data.hexagrams.length;
        }
        assert.equal(totalCount, 64, '總卦數應為 64 卦');
        assert.equal(Object.keys(HEXAGRAM_LOOKUP).length, 64, 'HEXAGRAM_LOOKUP 應映射 64 卦');
    });

    it('世應定位檢驗：八純卦世六應三、一世卦世一應四、三世卦世三應六', () => {
        // 乾為天 (八純)
        const qian = HEXAGRAM_LOOKUP['乾-乾'];
        assert.equal(qian.name, '乾為天');
        assert.equal(qian.shi, 6);
        assert.equal(qian.ying, 3);
        assert.equal(qian.palace, '乾');
        assert.equal(qian.palaceElement, '金');

        // 天風姤 (一世)
        const gou = HEXAGRAM_LOOKUP['乾-巽'];
        assert.equal(gou.name, '天風姤');
        assert.equal(gou.shi, 1);
        assert.equal(gou.ying, 4);

        // 天地否 (三世)
        const pi = HEXAGRAM_LOOKUP['乾-坤'];
        assert.equal(pi.name, '天地否');
        assert.equal(pi.shi, 3);
        assert.equal(pi.ying, 6);

        // 火天大有 (歸魂)
        const dayou = HEXAGRAM_LOOKUP['離-乾'];
        assert.equal(dayou.name, '火天大有');
        assert.equal(dayou.shi, 3);
        assert.equal(dayou.ying, 6);
    });

    it('六親生剋檢驗：乾金宮生剋關係', () => {
        assert.equal(getLiuqin('金', '金'), '兄弟'); // 同我者
        assert.equal(getLiuqin('金', '土'), '父母'); // 生我者
        assert.equal(getLiuqin('金', '水'), '子孫'); // 我生者
        assert.equal(getLiuqin('金', '火'), '官鬼'); // 剋我者
        assert.equal(getLiuqin('金', '木'), '妻財'); // 我剋者
    });

    it('乾為天納甲干支與六親排盤正確性', () => {
        // 乾為天：初爻子水(子孫)、二爻寅木(妻財)、三爻辰土(父母)、四爻午火(官鬼)、五爻申金(兄弟)、六爻戌土(父母)
        const result = calculateLiuyao({
            method: 'manual',
            lines: '777777', // 全陽靜爻
            datetime: '2026-10-01T12:00:00Z'
        });

        assert.equal(result.benGua.name, '乾為天');
        assert.equal(result.benGua.palace, '乾');
        assert.equal(result.benGua.palaceElement, '金');
        assert.equal(result.benGua.lines.length, 6);

        const lines = result.benGua.lines;
        assert.equal(lines[0].stem, '甲');
        assert.equal(lines[0].branch, '子');
        assert.equal(lines[0].liuqin, '子孫');

        assert.equal(lines[1].stem, '甲');
        assert.equal(lines[1].branch, '寅');
        assert.equal(lines[1].liuqin, '妻財');

        assert.equal(lines[2].stem, '甲');
        assert.equal(lines[2].branch, '辰');
        assert.equal(lines[2].liuqin, '父母');

        assert.equal(lines[3].stem, '壬');
        assert.equal(lines[3].branch, '午');
        assert.equal(lines[3].liuqin, '官鬼');

        assert.equal(lines[4].stem, '壬');
        assert.equal(lines[4].branch, '申');
        assert.equal(lines[4].liuqin, '兄弟');

        assert.equal(lines[5].stem, '壬');
        assert.equal(lines[5].branch, '戌');
        assert.equal(lines[5].liuqin, '父母');
    });

    it('伏神檢驗：澤山咸 (兌宮) 缺少父母，應從首卦兌為澤查出父母伏神', () => {
        // 澤山咸：上兌下艮 -> lines = 001 011 (初陰, 二陰, 三陽, 四陽, 五陽, 六陰) -> '887778'
        const result = calculateLiuyao({
            method: 'manual',
            lines: '887778',
            datetime: '2026-10-01T12:00:00Z'
        });

        assert.equal(result.benGua.name, '澤山咸');
        assert.equal(result.benGua.palace, '兌');
        assert.equal(result.benGua.palaceElement, '金');

        // 咸卦本卦六親應無妻財 (木)
        const benLiuqin = result.benGua.lines.map(l => l.liuqin);
        assert.ok(!benLiuqin.includes('妻財'), '澤山咸本卦應不現妻財爻');

        // 應查得伏神
        const fushen = result.fushen;
        const wealthFu = Object.values(fushen).find(f => f.liuqin === '妻財');
        assert.ok(wealthFu, '應在伏神中尋獲妻財爻');
        assert.equal(wealthFu.branch, '卯', '兌為澤二爻丁卯木為妻財伏神');
        assert.equal(wealthFu.position, 2, '伏神應伏於第二爻');
    });

    it('日干起六獸檢驗：甲乙日起青龍，庚辛日起白虎', () => {
        assert.equal(LIUSHEN_MAP['甲'][0], '青龍');
        assert.equal(LIUSHEN_MAP['乙'][0], '青龍');
        assert.equal(LIUSHEN_MAP['丙'][0], '朱雀');
        assert.equal(LIUSHEN_MAP['丁'][0], '朱雀');
        assert.equal(LIUSHEN_MAP['戊'][0], '勾陳');
        assert.equal(LIUSHEN_MAP['己'][0], '螣蛇');
        assert.equal(LIUSHEN_MAP['庚'][0], '白虎');
        assert.equal(LIUSHEN_MAP['辛'][0], '白虎');
        assert.equal(LIUSHEN_MAP['壬'][0], '玄武');
        assert.equal(LIUSHEN_MAP['癸'][0], '玄武');
    });

    it('朱熹《易學啟蒙》0~6 爻動斷法規則檢驗', () => {
        // 0 動爻
        const r0 = evaluateZhuXiRule('乾為天', '乾為天', []);
        assert.match(r0.mainRule, /彖辭/);

        // 1 動爻 (第 2 爻動)
        const r1 = evaluateZhuXiRule('天風姤', '天山遯', [2]);
        assert.equal(r1.primaryYaoIndex, 2);
        assert.match(r1.mainRule, /第2爻/);

        // 2 動爻 (第 1, 4 爻動，以上爻第 4 爻為主)
        const r2 = evaluateZhuXiRule('乾為天', '澤天夬', [1, 4]);
        assert.equal(r2.primaryYaoIndex, 4);
        assert.match(r2.mainRule, /第4爻/);

        // 3 動爻
        const r3 = evaluateZhuXiRule('乾為天', '坤為地', [1, 2, 3]);
        assert.match(r3.mainRule, /彖辭/);

        // 4 動爻 (動 1, 2, 3, 4，靜爻為 5, 6，以下爻第 5 爻為主)
        const r4 = evaluateZhuXiRule('乾為天', '地山謙', [1, 2, 3, 4]);
        assert.equal(r4.primaryYaoIndex, 5);

        // 5 動爻 (動 1, 2, 3, 4, 5，靜爻為 6)
        const r5 = evaluateZhuXiRule('乾為天', '坤為地', [1, 2, 3, 4, 5]);
        assert.equal(r5.primaryYaoIndex, 6);

        // 6 動爻 (乾卦用九)
        const r6Qian = evaluateZhuXiRule('乾為天', '坤為地', [1, 2, 3, 4, 5, 6]);
        assert.match(r6Qian.mainRule, /用九/);

        // 6 動爻 (坤卦用六)
        const r6Kun = evaluateZhuXiRule('坤為地', '乾為天', [1, 2, 3, 4, 5, 6]);
        assert.match(r6Kun.mainRule, /用六/);
    });

    it('起卦方式測試：大衍之數、銅錢、時間起卦皆能產生合法 6 爻盤', () => {
        // 大衍之數
        const dayanResult = calculateLiuyao({ method: 'dayan' });
        assert.equal(dayanResult.linesInput.length, 6);
        assert.ok(['6', '7', '8', '9'].includes(dayanResult.linesInput[0]));

        // 銅錢
        const coinsResult = calculateLiuyao({ method: 'coins' });
        assert.equal(coinsResult.linesInput.length, 6);

        // 時間起卦
        const dtResult = calculateLiuyao({ method: 'datetime', datetime: new Date('2026-10-01T12:00:00Z') });
        assert.equal(dtResult.linesInput.length, 6);
        assert.ok(dtResult.zhuxiRule.movingCount >= 1, '時間起卦必有動爻');
    });

    it('手動輸入校驗：非 6 位或非法數字應拋出錯誤', () => {
        assert.throws(() => parseLines('123456'), /無效的爻值/);
        assert.throws(() => parseLines('78967'), /長度必須為 6 位/);
        assert.throws(() => parseLines('7896789'), /長度必須為 6 位/);
    });

    it('用神自動辨識：求財對應妻財，事業對應官鬼，學業對應父母，問病對應子孫', () => {
        assert.equal(resolveYongShen('這筆投資會賺錢嗎？').target, '妻財');
        assert.equal(resolveYongShen('今年工作能升遷嗎？').target, '官鬼');
        assert.equal(resolveYongShen('高考能否錄取？').target, '父母');
        assert.equal(resolveYongShen('身體不舒服問病吉凶').target, '子孫');
        assert.equal(resolveYongShen('女生問姻緣', '女').target, '官鬼');
        assert.equal(resolveYongShen('男生問桃花', '男').target, '妻財');
    });

    it('LLM 提示詞建構與 Fallback 解讀完整性', () => {
        const LLMAnalysisService = require('../lib/llm-analysis');
        const llm = new LLMAnalysisService();
        const liuyaoData = calculateLiuyao({ method: 'manual', lines: '789687', question: '問財運' });
        
        const { prompt, systemMessage } = llm.formatLiuyaoPrompt(liuyaoData, '今年投資運勢');
        assert.ok(prompt.includes('六爻神卦深度排盤解析請求'));
        assert.ok(prompt.includes('今年投資運勢'));
        assert.ok(prompt.includes('本卦排盤'));
        assert.ok(systemMessage.includes('易學宗師'));

        const fallback = llm.getLiuyaoFallbackAnalysis(liuyaoData);
        assert.ok(fallback.includes('【六爻卦象】'));
        assert.ok(fallback.includes('【一句提醒】'));
    });

});
