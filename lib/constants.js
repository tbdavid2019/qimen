/**
 * 奇门遁甲常量定义
 */

const i18n = require('./i18n');

// 旬首对应
const xunShouMap = {
    '甲子': '戊',
    '甲戌': '己',
    '甲申': '庚',
    '甲午': '辛',
    '甲辰': '壬',
    '甲寅': '癸'
};

// 九宫对应 (根據當前語言返回翻譯)
function getDiPan(langCode = null) {
    return {
        '1': { name: i18n.t('qimen.bagua.kan', langCode), direction: i18n.t('qimen.directions.north', langCode), element: 'shui' },
        '2': { name: i18n.t('qimen.bagua.kun', langCode), direction: i18n.t('qimen.directions.southwest', langCode), element: 'tu' },
        '3': { name: i18n.t('qimen.bagua.zhen', langCode), direction: i18n.t('qimen.directions.east', langCode), element: 'mu' },
        '4': { name: i18n.t('qimen.bagua.xun', langCode), direction: i18n.t('qimen.directions.southeast', langCode), element: 'mu' },
        '5': { name: i18n.t('qimen.bagua.zhong', langCode), direction: i18n.t('qimen.directions.center', langCode), element: 'tu' },
        '6': { name: i18n.t('qimen.bagua.qian', langCode), direction: i18n.t('qimen.directions.northwest', langCode), element: 'jin' },
        '7': { name: i18n.t('qimen.bagua.dui', langCode), direction: i18n.t('qimen.directions.west', langCode), element: 'jin' },
        '8': { name: i18n.t('qimen.bagua.gen', langCode), direction: i18n.t('qimen.directions.northeast', langCode), element: 'tu' },
        '9': { name: i18n.t('qimen.bagua.li', langCode), direction: i18n.t('qimen.directions.south', langCode), element: 'huo' }
    };
}

// 為了向後兼容，保留原始的 diPan 物件
const diPan = getDiPan();

// 八门 (根據當前語言返回翻譯)
function getMen(langCode = null) {
    return {
        '1': i18n.t('qimen.bamen.xiu', langCode),
        '2': i18n.t('qimen.bamen.si', langCode),
        '3': i18n.t('qimen.bamen.shang', langCode),
        '4': i18n.t('qimen.bamen.du', langCode),
        '9': i18n.t('qimen.bamen.jing', langCode),
        '6': i18n.t('qimen.bamen.kai', langCode),
        '7': i18n.t('qimen.bamen.jing2', langCode),
        '8': i18n.t('qimen.bamen.sheng', langCode)
    };
}

// 為了向後兼容，保留原始的 men 物件
const men = getMen();

// 八门对应每宫 (根據當前語言返回翻譯)
function getBaMen(langCode = null) {
    return {
        '1': i18n.t('qimen.bamen.xiu', langCode),
        '2': i18n.t('qimen.bamen.si', langCode),
        '3': i18n.t('qimen.bamen.shang', langCode),
        '4': i18n.t('qimen.bamen.du', langCode),
        '5': '',     // 中宫无门
        '6': i18n.t('qimen.bamen.kai', langCode),
        '7': i18n.t('qimen.bamen.jing2', langCode),
        '8': i18n.t('qimen.bamen.sheng', langCode),
        '9': i18n.t('qimen.bamen.jing', langCode)
    };
}

// 為了向後兼容，保留原始的 baMen 物件
const baMen = getBaMen();

// 九星（对应九宫） (根據當前語言返回翻譯)
function getXing(langCode = null) {
    return {
        '1': i18n.t('qimen.jiuxing.tianpeng', langCode),
        '2': i18n.t('qimen.jiuxing.tianrui', langCode),
        '3': i18n.t('qimen.jiuxing.tianchong', langCode),
        '4': i18n.t('qimen.jiuxing.tianfu', langCode),
        '5': i18n.t('qimen.jiuxing.tianqin', langCode),
        '6': i18n.t('qimen.jiuxing.tianxin', langCode),
        '7': i18n.t('qimen.jiuxing.tianzhu', langCode),
        '8': i18n.t('qimen.jiuxing.tianren', langCode),
        '9': i18n.t('qimen.jiuxing.tianying', langCode)
    };
}

// 為了向後兼容，保留原始的 xing 物件
const xing = getXing();

// 九星对应每宫 (根據當前語言返回翻譯)
function getTianPanJiuXing(langCode = null) {
    return {
        '1': i18n.t('qimen.jiuxing.tianpeng', langCode),
        '2': i18n.t('qimen.jiuxing.tianrui', langCode),
        '3': i18n.t('qimen.jiuxing.tianchong', langCode),
        '4': i18n.t('qimen.jiuxing.tianfu', langCode),
        '5': i18n.t('qimen.jiuxing.tianqin', langCode),
        '6': i18n.t('qimen.jiuxing.tianxin', langCode),
        '7': i18n.t('qimen.jiuxing.tianzhu', langCode),
        '8': i18n.t('qimen.jiuxing.tianren', langCode),
        '9': i18n.t('qimen.jiuxing.tianying', langCode)
    };
}

// 為了向後兼容，保留原始的 tianPanJiuXing 物件
const tianPanJiuXing = getTianPanJiuXing();

// 八星顺序（不含天禽） (根據當前語言返回翻譯)
function getXingList(langCode = null) {
    return [
        i18n.t('qimen.jiuxing.tianpeng', langCode),
        i18n.t('qimen.jiuxing.tianren', langCode),
        i18n.t('qimen.jiuxing.tianchong', langCode),
        i18n.t('qimen.jiuxing.tianfu', langCode),
        i18n.t('qimen.jiuxing.tianying', langCode),
        i18n.t('qimen.jiuxing.tianrui', langCode),
        i18n.t('qimen.jiuxing.tianzhu', langCode),
        i18n.t('qimen.jiuxing.tianxin', langCode)
    ];
}

// 為了向後兼容，保留原始的 xingList 陣列
const xingList = getXingList();

// 地盘天干顺序
const diPanDiZhiList = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];

// 奇门遁甲九星别名 (根據當前語言返回翻譯)
function getXingAlias(langCode = null) {
    return {
        [i18n.t('qimen.jiuxing.tianpeng', langCode)]: i18n.t('qimen.jiuxingAlias.tianpeng', langCode),
        [i18n.t('qimen.jiuxing.tianren', langCode)]: i18n.t('qimen.jiuxingAlias.tianren', langCode),
        [i18n.t('qimen.jiuxing.tianchong', langCode)]: i18n.t('qimen.jiuxingAlias.tianchong', langCode),
        [i18n.t('qimen.jiuxing.tianfu', langCode)]: i18n.t('qimen.jiuxingAlias.tianfu', langCode),
        [i18n.t('qimen.jiuxing.tianying', langCode)]: i18n.t('qimen.jiuxingAlias.tianying', langCode),
        [i18n.t('qimen.jiuxing.tianrui', langCode)]: i18n.t('qimen.jiuxingAlias.tianrui', langCode),
        [i18n.t('qimen.jiuxing.tianzhu', langCode)]: i18n.t('qimen.jiuxingAlias.tianzhu', langCode),
        [i18n.t('qimen.jiuxing.tianxin', langCode)]: i18n.t('qimen.jiuxingAlias.tianxin', langCode),
        [i18n.t('qimen.jiuxing.tianqin', langCode)]: i18n.t('qimen.jiuxingAlias.tianqin', langCode)
    };
}

// 為了向後兼容，保留原始的 xingAlias 物件
const xingAlias = getXingAlias();

// 六十花甲子组合
const liushi花甲子组合 = [
    '甲子', '乙丑', '丙寅', '丁卯', '戊辰',
    '己巳', '庚午', '辛未', '壬申', '癸酉',
    '甲戌', '乙亥', '丙子', '丁丑', '戊寅',
    '己卯', '庚辰', '辛巳', '壬午', '癸未',
    '甲申', '乙酉', '丙戌', '丁亥', '戊子',
    '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
    '甲午', '乙未', '丙申', '丁酉', '戊戌',
    '己亥', '庚子', '辛丑', '壬寅', '癸卯',
    '甲辰', '乙巳', '丙午', '丁未', '戊申',
    '己酉', '庚戌', '辛亥', '壬子', '癸丑',
    '甲寅', '乙卯', '丙辰', '丁巳', '戊午',
    '己未', '庚申', '辛酉', '壬戌', '癸亥'
];

// 五行属性 (根據當前語言返回翻譯)
function getWuXingType(langCode = null) {
    return {
        // 九星五行
        [i18n.t('qimen.jiuxing.tianxin', langCode)]: 'jin',   // 金
        [i18n.t('qimen.jiuxing.tianpeng', langCode)]: 'shui',  // 水
        [i18n.t('qimen.jiuxing.tianren', langCode)]: 'tu',    // 土
        [i18n.t('qimen.jiuxing.tianchong', langCode)]: 'mu',    // 木
        [i18n.t('qimen.jiuxing.tianfu', langCode)]: 'mu',    // 木
        [i18n.t('qimen.jiuxing.tianying', langCode)]: 'huo',   // 火
        [i18n.t('qimen.jiuxing.tianrui', langCode)]: 'tu',    // 土
        [i18n.t('qimen.jiuxing.tianzhu', langCode)]: 'jin',   // 金
        [i18n.t('qimen.jiuxing.tianqin', langCode)]: 'tu',    // 土
        
        // 天干五行
        '戊': 'tu',      // 土
        '己': 'tu',      // 土
        '庚': 'jin',     // 金
        '辛': 'jin',     // 金
        '壬': 'shui',    // 水
        '癸': 'shui',    // 水
        '丁': 'huo',     // 火
        '丙': 'huo',     // 火
        '乙': 'mu',      // 木
        '甲': 'mu',      // 木
        
        // 八门五行
        [i18n.t('qimen.bamen.kai', langCode)]: 'jin',   // 金
        [i18n.t('qimen.bamen.xiu', langCode)]: 'shui',  // 水
        [i18n.t('qimen.bamen.sheng', langCode)]: 'mu',    // 木
        [i18n.t('qimen.bamen.shang', langCode)]: 'mu',    // 木
        [i18n.t('qimen.bamen.du', langCode)]: 'tu',    // 土
        [i18n.t('qimen.bamen.jing', langCode)]: 'huo',   // 火
        [i18n.t('qimen.bamen.si', langCode)]: 'tu',    // 土
        [i18n.t('qimen.bamen.jing2', langCode)]: 'jin'    // 金
    };
}

// 為了向後兼容，保留原始的 wuXingType 物件
const wuXingType = getWuXingType();

// 九宫方位 (根據當前語言返回翻譯)
function getDirections(langCode = null) {
    return {
        '1': i18n.t('qimen.directions.north', langCode),
        '2': i18n.t('qimen.directions.southwest', langCode),
        '3': i18n.t('qimen.directions.east', langCode),
        '4': i18n.t('qimen.directions.southeast', langCode),
        '5': i18n.t('qimen.directions.center', langCode),
        '6': i18n.t('qimen.directions.northwest', langCode),
        '7': i18n.t('qimen.directions.west', langCode),
        '8': i18n.t('qimen.directions.northeast', langCode),
        '9': i18n.t('qimen.directions.south', langCode)
    };
}

// 為了向後兼容，保留原始的 directions 物件
const directions = getDirections();

module.exports = {
    xunShouMap,
    diPan,
    getDiPan,
    men,
    getMen,
    baMen,
    getBaMen,
    xing,
    getXing,
    tianPanJiuXing,
    getTianPanJiuXing,
    xingList,
    getXingList,
    diPanDiZhiList,
    xingAlias,
    getXingAlias,
    liushi花甲子组合,
    wuXingType,
    getWuXingType,
    directions,
    getDirections,
    i18n
};
