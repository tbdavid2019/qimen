'use strict';

/**
 * 紫微斗數本命三組十二神煞（將前十二神、歲前十二神、博士十二神）。
 * 演算法來源與溯源依據：
 * - 原始開源庫：https://github.com/Renhuai123/ziwei-doushu (MIT License)
 * - 上游模組：lib/ziwei/shier-shen.ts
 * - 典籍依據：將前自三合帝旺起將星、歲前自生年支起歲建、博士自生年祿存起
 * 所有公開函式使用 0-11 地支索引：子=0、丑=1、…、亥=11。
 */

const JIANG_QIAN_NAMES = [
    '將星', '攀鞍', '歲驛', '息神', '華蓋', '劫煞',
    '災煞', '天煞', '指背', '咸池', '月煞', '亡神'
];

const SUI_QIAN_NAMES = [
    '歲建', '晦氣', '喪門', '貫索', '官符', '小耗',
    '歲破', '龍德', '白虎', '天德', '吊客', '病符'
];

const BOSHI_NAMES = [
    '博士', '力士', '青龍', '小耗', '將軍', '奏書',
    '飛廉', '喜神', '病符', '大耗', '伏兵', '官府'
];

function normalizeIndex(value) {
    const index = Number(value);
    return Number.isFinite(index) ? ((index % 12) + 12) % 12 : 0;
}

/** 將前十二神：三合局帝旺位起將星，順行。 */
function jiangXingBranch(yearBranchIndex) {
    const branch = normalizeIndex(yearBranchIndex);
    // 申子辰→子、巳酉丑→酉、寅午戌→午、亥卯未→卯。
    return [0, 9, 6, 3][branch % 4];
}

function getJiangQianShen(yearBranchIndex) {
    const result = Array(12);
    const start = jiangXingBranch(yearBranchIndex);
    for (let i = 0; i < 12; i++) result[(start + i) % 12] = JIANG_QIAN_NAMES[i];
    return result;
}

/** 歲前十二神：歲建落生年支，順行。 */
function getSuiQianShen(yearBranchIndex) {
    const result = Array(12);
    const start = normalizeIndex(yearBranchIndex);
    for (let i = 0; i < 12; i++) result[(start + i) % 12] = SUI_QIAN_NAMES[i];
    return result;
}

/**
 * 博士十二神：祿存起博士。
 * isYangManOrYinWoman 可接受布林值，也接受 gender/sex 字串，true 表示順行。
 */
function getBoshiShen(lucunBranchIndex, isYangManOrYinWoman) {
    const result = Array(12);
    const start = normalizeIndex(lucunBranchIndex);
    const forward = typeof isYangManOrYinWoman === 'boolean'
        ? isYangManOrYinWoman
        : Boolean(isYangManOrYinWoman && (
            isYangManOrYinWoman === '男' || isYangManOrYinWoman === 'male' ||
            isYangManOrYinWoman === '陽男' || isYangManOrYinWoman === '陰女' ||
            isYangManOrYinWoman === 'yang_male' || isYangManOrYinWoman === 'yin_female'
        ));
    for (let i = 0; i < 12; i++) {
        const branch = forward ? (start + i) % 12 : (start - i + 12) % 12;
        result[branch] = BOSHI_NAMES[i];
    }
    return result;
}

function getBoshiShenByStem(yearStemIndex, sex, lucunBranchIndex) {
    const yangStem = normalizeIndex(yearStemIndex) % 2 === 0;
    const isYangManOrYinWoman = (yangStem && (sex === '男' || sex === 'male')) ||
        (!yangStem && (sex === '女' || sex === 'female'));
    return getBoshiShen(lucunBranchIndex, isYangManOrYinWoman);
}

module.exports = {
    JIANG_QIAN_NAMES,
    SUI_QIAN_NAMES,
    BOSHI_NAMES,
    jiangXingBranch,
    getJiangQianShen,
    getSuiQianShen,
    getBoshiShen,
    getBoshiShenByStem,
    normalizeIndex
};
