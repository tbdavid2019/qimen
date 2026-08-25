const { Solar, Lunar } = require('lunar-javascript');

const STEM_ELEMENT = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const BRANCH_ELEMENT = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
const HIDDEN = { 子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'], 辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'], 午: ['丁', '己'], 未: ['己', '丁', '乙'], 申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲'] };
const SHICHEN = { 子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };
const CONTROL = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const GENERATE = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬']);

function tenGod(dayStem, stem) {
    const self = STEM_ELEMENT[dayStem]; const other = STEM_ELEMENT[stem];
    const samePolarity = YANG_STEMS.has(dayStem) === YANG_STEMS.has(stem);
    if (self === other) return samePolarity ? '比肩' : '劫財';
    if (GENERATE[self] === other) return samePolarity ? '食神' : '傷官';
    if (GENERATE[other] === self) return samePolarity ? '偏印' : '正印';
    if (CONTROL[self] === other) return samePolarity ? '偏財' : '正財';
    if (CONTROL[other] === self) return samePolarity ? '七殺' : '正官';
    return '比肩';
}
function parseLunar(input) {
    if (!input?.date) throw new Error('請提供出生日期');
    const [year, month, day] = input.date.split('-').map(Number); const hour = input.time ? Number(input.time.split(':')[0]) : SHICHEN[input.shichen] || 12;
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) throw new Error('出生日期格式錯誤');
    if (input.calendar !== 'lunar') {
        const check = new Date(Date.UTC(year, month - 1, day));
        if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new Error('出生日期無效');
    }
    try { return input.calendar === 'lunar' ? Lunar.fromYmd(year, input.leap ? -month : month, day).getSolar().getLunar() : Solar.fromYmdHms(year, month, day, hour, input.time ? Number(input.time.split(':')[1]) : 0, 0).getLunar(); } catch { throw new Error('出生日期無效'); }
}
function calculateBazi(input = {}) {
    if (!['男', '女'].includes(input.sex)) throw new Error('請選擇性別');
    const lunar = parseLunar(input); const eight = lunar.getEightChar(); const values = [eight.getYear(), eight.getMonth(), eight.getDay(), eight.getTime()]; const labels = ['年柱', '月柱', '日柱', '時柱']; const dayStem = eight.getDayGan();
    const fourPillars = values.map((value, index) => ({ label: labels[index], value, stem: value[0], branch: value[1], element: STEM_ELEMENT[value[0]], tenGod: tenGod(dayStem, value[0]), hiddenStems: HIDDEN[value[1]].map((stem) => ({ stem, element: STEM_ELEMENT[stem], tenGod: tenGod(dayStem, stem) })) }));
    const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }; fourPillars.forEach((pillar) => { counts[pillar.element] += 1; counts[BRANCH_ELEMENT[pillar.branch]] += 1; });
    const yun = eight.getYun(input.sex === '男' ? 1 : 0); const luckCycles = yun.getDaYun().slice(1, 9).map((cycle) => ({ ganzhi: cycle.getGanZhi(), startYear: cycle.getStartYear(), endYear: cycle.getEndYear(), startAge: cycle.getStartAge(), endAge: cycle.getEndAge() }));
    const annualCycles = luckCycles.flatMap((cycle) => Array.from({ length: 10 }, (_, index) => ({ year: cycle.startYear + index, luckCycle: cycle.ganzhi }))).slice(0, 80);
    const shensha = [{ name: '天乙貴人', value: '以日干查命局，作為輔助參考' }, { name: '桃花', value: '以年支與日支查命局，作為輔助參考' }];
    return { profile: { ...input, lunar: lunar.toString() }, fourPillars, dayMaster: { stem: dayStem, element: STEM_ELEMENT[dayStem] }, fiveElements: { counts, total: Object.values(counts).reduce((a, b) => a + b, 0) }, shensha, luckCycles, annualCycles };
}
module.exports = { calculateBazi, STEM_ELEMENT, tenGod };
