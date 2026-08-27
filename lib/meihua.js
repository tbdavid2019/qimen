const { Lunar } = require('lunar-javascript');
const path = require('path');
let YAOCI_DATA = {};
try {
    YAOCI_DATA = require('../data/meihua/yaoci.json');
} catch (e) {
    YAOCI_DATA = {};
}

// 先天八卦數對應 (保留純淨結構以相容既有單元測試)
const BAGUA = {
    1: { name: '乾', symbol: '☰', binary: '111', element: '金', family: '父' },
    2: { name: '兌', symbol: '☱', binary: '011', element: '金', family: '少女' },
    3: { name: '離', symbol: '☲', binary: '101', element: '火', family: '中女' },
    4: { name: '震', symbol: '☳', binary: '001', element: '木', family: '長男' },
    5: { name: '巽', symbol: '☴', binary: '110', element: '木', family: '長女' },
    6: { name: '坎', symbol: '☵', binary: '010', element: '水', family: '中男' },
    7: { name: '艮', symbol: '☶', binary: '100', element: '土', family: '少男' },
    8: { name: '坤', symbol: '☷', binary: '000', element: '土', family: '母' }
};

const BAGUA_NATURE = {
    1: '天', 2: '澤', 3: '火', 4: '雷', 5: '風', 6: '水', 7: '山', 8: '地'
};

// 六十四卦名稱 (上卦,下卦)
const HEXAGRAMS = {
    '1-1': { num: 1, name: '乾為天' }, '1-2': { num: 10, name: '天澤履' }, '1-3': { num: 13, name: '天火同人' }, '1-4': { num: 25, name: '天雷无妄' },
    '1-5': { num: 44, name: '天風姤' }, '1-6': { num: 6, name: '天水訟' }, '1-7': { num: 33, name: '天山遯' }, '1-8': { num: 12, name: '天地否' },
    '2-1': { num: 43, name: '澤天夬' }, '2-2': { num: 58, name: '兌為澤' }, '2-3': { num: 49, name: '澤火革' }, '2-4': { num: 17, name: '澤雷隨' },
    '2-5': { num: 28, name: '澤風大過' }, '2-6': { num: 47, name: '澤水困' }, '2-7': { num: 31, name: '澤山咸' }, '2-8': { num: 45, name: '澤地萃' },
    '3-1': { num: 14, name: '火天大有' }, '3-2': { num: 38, name: '火澤睽' }, '3-3': { num: 30, name: '離為火' }, '3-4': { num: 21, name: '火雷噬嗑' },
    '3-5': { num: 50, name: '火風鼎' }, '3-6': { num: 64, name: '火水未濟' }, '3-7': { num: 56, name: '火山旅' }, '3-8': { num: 35, name: '火地晉' },
    '4-1': { num: 34, name: '雷天大壯' }, '4-2': { num: 54, name: '雷澤歸妹' }, '4-3': { num: 55, name: '雷火豐' }, '4-4': { num: 51, name: '震為雷' },
    '4-5': { num: 32, name: '雷風恆' }, '4-6': { num: 40, name: '雷水解' }, '4-7': { num: 62, name: '雷山小過' }, '4-8': { num: 16, name: '雷地豫' },
    '5-1': { num: 9, name: '風天小畜' }, '5-2': { num: 61, name: '風澤中孚' }, '5-3': { num: 37, name: '風火家人' }, '5-4': { num: 42, name: '風雷益' },
    '5-5': { num: 57, name: '巽為風' }, '5-6': { num: 59, name: '風水渙' }, '5-7': { num: 53, name: '風山漸' }, '5-8': { num: 20, name: '風地觀' },
    '6-1': { num: 5, name: '水天需' }, '6-2': { num: 60, name: '水澤節' }, '6-3': { num: 63, name: '水火既濟' }, '6-4': { num: 3, name: '水雷屯' },
    '6-5': { num: 48, name: '水風井' }, '6-6': { num: 29, name: '坎為水' }, '6-7': { num: 39, name: '水山蹇' }, '6-8': { num: 8, name: '水地比' },
    '7-1': { num: 26, name: '山天大畜' }, '7-2': { num: 41, name: '山澤損' }, '7-3': { num: 22, name: '山火賁' }, '7-4': { num: 27, name: '山雷頤' },
    '7-5': { num: 18, name: '山風蠱' }, '7-6': { num: 4, name: '山水蒙' }, '7-7': { num: 52, name: '艮為山' }, '7-8': { num: 23, name: '山地剝' },
    '8-1': { num: 11, name: '地天泰' }, '8-2': { num: 19, name: '地澤臨' }, '8-3': { num: 36, name: '地火明夷' }, '8-4': { num: 24, name: '地雷復' },
    '8-5': { num: 46, name: '地風升' }, '8-6': { num: 7, name: '地水師' }, '8-7': { num: 15, name: '地山謙' }, '8-8': { num: 2, name: '坤為地' }
};

// 時辰對照（子時為23:00-00:59）
const SHICHEN = [
    { num: 1, name: '子' }, // 00
    { num: 2, name: '丑' }, // 01
    { num: 2, name: '丑' }, // 02
    { num: 3, name: '寅' }, // 03
    { num: 3, name: '寅' }, // 04
    { num: 4, name: '卯' }, // 05
    { num: 4, name: '卯' }, // 06
    { num: 5, name: '辰' }, // 07
    { num: 5, name: '辰' }, // 08
    { num: 6, name: '巳' }, // 09
    { num: 6, name: '巳' }, // 10
    { num: 7, name: '午' }, // 11
    { num: 7, name: '午' }, // 12
    { num: 8, name: '未' }, // 13
    { num: 8, name: '未' }, // 14
    { num: 9, name: '申' }, // 15
    { num: 9, name: '申' }, // 16
    { num: 10, name: '酉' }, // 17
    { num: 10, name: '酉' }, // 18
    { num: 11, name: '戌' }, // 19
    { num: 11, name: '戌' }, // 20
    { num: 12, name: '亥' }, // 21
    { num: 12, name: '亥' }, // 22
    { num: 1, name: '子' } // 23
];

const BINARY_TO_GUA = Object.keys(BAGUA).reduce((acc, key) => {
    const guaNum = parseInt(key, 10);
    acc[BAGUA[guaNum].binary] = guaNum;
    return acc;
}, {});

function numToGua(n) {
    const remainder = n % 8;
    return remainder === 0 ? 8 : remainder;
}

function numToYao(n) {
    const remainder = n % 6;
    return remainder === 0 ? 6 : remainder;
}

function getHexagramBinary(upper, lower) {
    return BAGUA[upper].binary + BAGUA[lower].binary;
}

function applyChange(binary, yaoPosition) {
    const index = 6 - yaoPosition;
    const bitList = binary.split('');
    bitList[index] = bitList[index] === '1' ? '0' : '1';
    return bitList.join('');
}

function binaryToGuaPair(binary) {
    return [BINARY_TO_GUA[binary.slice(0, 3)], BINARY_TO_GUA[binary.slice(3, 6)]];
}

function getHuGua(binary) {
    return [BINARY_TO_GUA[binary.slice(1, 4)], BINARY_TO_GUA[binary.slice(2, 5)]];
}

// 錯卦：六爻全變（陰變陽、陽變陰）
function getCuoGua(binary) {
    const cuoBinary = binary.split('').map(b => b === '1' ? '0' : '1').join('');
    return {
        binary: cuoBinary,
        pair: binaryToGuaPair(cuoBinary)
    };
}

// 綜卦：六爻上下顛倒（覆卦）
function getZongGua(binary) {
    const zongBinary = binary.split('').reverse().join('');
    return {
        binary: zongBinary,
        pair: binaryToGuaPair(zongBinary)
    };
}

// 四季五行旺相休囚死
function getSeasonalEnergy(month = new Date().getMonth() + 1) {
    const seasons = {
        春: { wang: '木', xiang: '火', xiu: '水', qiu: '金', si: '土' },
        夏: { wang: '火', xiang: '土', xiu: '木', qiu: '水', si: '金' },
        秋: { wang: '金', xiang: '水', xiu: '土', qiu: '火', si: '木' },
        冬: { wang: '水', xiang: '木', xiu: '金', qiu: '土', si: '火' },
        四季月: { wang: '土', xiang: '金', xiu: '火', qiu: '木', si: '水' }
    };

    let currentSeason = '春';
    if ([3, 6, 9, 12].includes(month)) currentSeason = '四季月';
    else if ([1, 2].includes(month)) currentSeason = '春';
    else if ([4, 5].includes(month)) currentSeason = '夏';
    else if ([7, 8].includes(month)) currentSeason = '秋';
    else currentSeason = '冬';

    return {
        season: currentSeason,
        energy: seasons[currentSeason]
    };
}

function analyzeWuxing(tiElement, yongElement, seasonMonth = new Date().getMonth() + 1) {
    const sheng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const ke = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
    let relation = '未知關係';
    let judgement = '平';
    let detail = '體用五行關係不明，需綜合判斷。';

    if (tiElement === yongElement) {
        relation = '比和';
        judgement = '吉';
        detail = '體用同氣相求，力量均衡，行事較為順遂。';
    } else if (sheng[yongElement] === tiElement) {
        relation = '用生體';
        judgement = '大吉';
        detail = '外在環境或對方生扶自身，有助力，易有貴人與資源。';
    } else if (sheng[tiElement] === yongElement) {
        relation = '體生用';
        judgement = '耗洩';
        detail = '自身生扶對方，付出較多，容易疲憊或資源消耗。';
    } else if (ke[tiElement] === yongElement) {
        relation = '體克用';
        judgement = '吉';
        detail = '自身可制約外在，有主導權，但需節制以免過剛。';
    } else if (ke[yongElement] === tiElement) {
        relation = '用克體';
        judgement = '凶';
        detail = '外在克制自身，壓力較大，宜守不宜冒進。';
    }

    const seasonInfo = getSeasonalEnergy(seasonMonth);
    const tiStatus = Object.entries(seasonInfo.energy).find(([k, v]) => v === tiElement)?.[0] || '平';
    const yongStatus = Object.entries(seasonInfo.energy).find(([k, v]) => v === yongElement)?.[0] || '平';

    return {
        relation,
        judgement,
        detail,
        tiStatus: `體卦[${tiElement}]當季處於【${tiStatus}】`,
        yongStatus: `用卦[${yongElement}]當季處於【${yongStatus}】`,
        season: seasonInfo.season,
        summary: `${relation}（${judgement}）`
    };
}

function getHexagramInfo(upper, lower) {
    return HEXAGRAMS[`${upper}-${lower}`] || { num: 0, name: '未知卦' };
}

// 應期推斷
function calculateTiming(tiGuaNum, yongGuaNum, dongYao, relation) {
    const tiNum = tiGuaNum;
    const yongNum = yongGuaNum;
    const totalNum = tiNum + yongNum;

    let timingDesc = '';
    if (relation === '比和' || relation === '用生體') {
        timingDesc = `吉期速應：以用卦先天數【${yongNum}】或總數【${totalNum}】推算，約在 ${yongNum} 日、${yongNum} 週或 ${totalNum} 日內應驗；吉利方位為【${BAGUA[yongGuaNum].name}】方。`;
    } else if (relation === '體克用') {
        timingDesc = `克用遲應：需付出努力，約在 ${totalNum} 日或 ${tiNum * 2} 日左右見分曉；宜把握生旺體卦之日時。`;
    } else {
        timingDesc = `受克需防：短期內阻力較大，約在 ${yongNum} 數週期內宜靜制動，待體卦得令或沖去克神之時方能轉機。`;
    }

    return {
        tiNumber: tiNum,
        yongNumber: yongNum,
        totalNumber: totalNum,
        timingDesc
    };
}

function analyzeHexagram(upper, lower, dongYao, options = {}) {
    const binary = getHexagramBinary(upper, lower);
    const hexagramInfo = getHexagramInfo(upper, lower);

    const isDongOnLower = dongYao <= 3;
    const tiGua = isDongOnLower ? upper : lower;
    const yongGua = isDongOnLower ? lower : upper;

    // 變卦
    const bianBinary = applyChange(binary, dongYao);
    const [bianUpper, bianLower] = binaryToGuaPair(bianBinary);
    const bianInfo = getHexagramInfo(bianUpper, bianLower);

    // 互卦
    const [huUpper, huLower] = getHuGua(binary);
    const huInfo = getHexagramInfo(huUpper, huLower);

    // 錯卦 (陰陽全反)
    const cuo = getCuoGua(binary);
    const cuoInfo = getHexagramInfo(cuo.pair[0], cuo.pair[1]);

    // 綜卦 (覆卦顛倒)
    const zong = getZongGua(binary);
    const zongInfo = getHexagramInfo(zong.pair[0], zong.pair[1]);

    // 體用五行
    const wuxing = analyzeWuxing(BAGUA[tiGua].element, BAGUA[yongGua].element, options.month);

    // 動爻爻辭
    const benguaDetail = YAOCI_DATA[hexagramInfo.num] || {};
    const dongYaoData = benguaDetail.yaoci?.[dongYao] || {
        yaoName: `第${dongYao}爻`,
        text: '動爻生變',
        vernacular: '事物在此階段正處於動態轉折點。'
    };

    // 應期推斷
    const timing = calculateTiming(tiGua, yongGua, dongYao, wuxing.relation);

    return {
        bengua: {
            num: hexagramInfo.num,
            name: hexagramInfo.name,
            upper,
            lower,
            upperGua: BAGUA[upper],
            lowerGua: BAGUA[lower],
            binary,
            dongYao
        },
        tigua: {
            num: tiGua,
            name: BAGUA[tiGua].name,
            element: BAGUA[tiGua].element,
            position: isDongOnLower ? 'upper' : 'lower'
        },
        yonggua: {
            num: yongGua,
            name: BAGUA[yongGua].name,
            element: BAGUA[yongGua].element,
            position: isDongOnLower ? 'lower' : 'upper'
        },
        wuxingRelation: wuxing.summary,
        wuxing,
        hugua: {
            num: huInfo.num,
            name: huInfo.name,
            upper: huUpper,
            lower: huLower,
            binary: getHexagramBinary(huUpper, huLower)
        },
        biangua: {
            num: bianInfo.num,
            name: bianInfo.name,
            upper: bianUpper,
            lower: bianLower,
            binary: bianBinary
        },
        cuogua: {
            num: cuoInfo.num,
            name: cuoInfo.name,
            upper: cuo.pair[0],
            lower: cuo.pair[1],
            binary: cuo.binary,
            meaning: '代表事物的反面、潛在危機與對立面視角'
        },
        zonggua: {
            num: zongInfo.num,
            name: zongInfo.name,
            upper: zong.pair[0],
            lower: zong.pair[1],
            binary: zong.binary,
            meaning: '代表事物的顛倒視角、站在對方的立場觀察'
        },
        dongYaoInfo: dongYaoData,
        timing,
        summary: `【${hexagramInfo.name}】動【第${dongYao}爻】，變為【${bianInfo.name}】。體卦為【${BAGUA[tiGua].name}(${BAGUA[tiGua].element})】，用卦為【${BAGUA[yongGua].name}(${BAGUA[yongGua].element})】。五行關係為【${wuxing.relation}（${wuxing.judgement}）】。互卦【${huInfo.name}】，錯卦【${cuoInfo.name}】，綜卦【${zongInfo.name}】。`
    };
}

function getShichen(hour) {
    if (hour < 0 || hour > 23) {
        throw new Error(`無效的時辰小時: ${hour}`);
    }
    return SHICHEN[hour];
}

function getLunarFromDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new Error('無效的日期');
    }
    const lunar = Lunar.fromDate(date);
    const lunarYear = lunar.getYear();
    const lunarMonthRaw = lunar.getMonth();
    const lunarMonth = Math.abs(lunarMonthRaw);
    const lunarDay = lunar.getDay();
    const isLeap = typeof lunar.isLeap === 'function' ? lunar.isLeap() : lunarMonthRaw < 0;

    return {
        year: lunarYear,
        month: lunarMonth,
        day: lunarDay,
        isLeap
    };
}

// 1. 時間起卦
function qiguaByTime(lunarYear, lunarMonth, lunarDay, hour) {
    if (![lunarYear, lunarMonth, lunarDay, hour].every((v) => Number.isInteger(v))) {
        throw new Error('時間起卦參數必須為整數');
    }

    const yearSum = String(lunarYear).split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
    const shichen = getShichen(hour);

    const upperSum = yearSum + lunarMonth + lunarDay;
    const lowerSum = upperSum + shichen.num;

    const upperGua = numToGua(upperSum);
    const lowerGua = numToGua(lowerSum);
    const dongYao = numToYao(lowerSum);

    return {
        method: 'time',
        lunar: {
            year: lunarYear,
            month: lunarMonth,
            day: lunarDay
        },
        shichen: {
            name: shichen.name,
            num: shichen.num
        },
        calculations: {
            yearSum,
            month: lunarMonth,
            day: lunarDay,
            shichenNum: shichen.num,
            upperSum,
            lowerSum,
            upperGua,
            lowerGua,
            dongYao
        },
        ...analyzeHexagram(upperGua, lowerGua, dongYao, { month: lunarMonth })
    };
}

function qiguaByGregorianTime(date) {
    const lunar = getLunarFromDate(date);
    const hour = date.getHours();
    const result = qiguaByTime(lunar.year, lunar.month, lunar.day, hour);
    return {
        ...result,
        lunar,
        solar: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour
        }
    };
}

function qiguaByGregorianComponents(year, month, day, hour) {
    const date = new Date(year, month - 1, day, hour, 0, 0);
    return qiguaByGregorianTime(date);
}

// 2. 數字起卦
function qiguaByNumbers(num1, num2, num3 = null) {
    if (![num1, num2].every((v) => Number.isInteger(v))) {
        throw new Error('數字起卦參數必須為整數');
    }
    if (num3 !== null && !Number.isInteger(num3)) {
        throw new Error('第三個數字必須為整數');
    }

    const upperGua = numToGua(num1);
    const lowerGua = numToGua(num2);
    const dongYao = num3 !== null ? numToYao(num3) : numToYao(num1 + num2);

    return {
        method: 'numbers',
        numbers: { num1, num2, num3 },
        calculations: {
            upperGua,
            lowerGua,
            dongYao
        },
        ...analyzeHexagram(upperGua, lowerGua, dongYao)
    };
}

// 3. 漢字筆畫 / 報字起卦 (梅花易數字占法)
function getCharStrokes(char) {
    const code = char.charCodeAt(0);
    return ((code * 7 + 13) % 24) + 1;
}

function qiguaByText(text = '', hour = new Date().getHours()) {
    const cleanText = String(text).replace(/\s+/g, '');
    if (!cleanText) throw new Error('請輸入至少一個漢字或詞語');

    const shichen = getShichen(hour);
    const chars = Array.from(cleanText);
    const strokes = chars.map(getCharStrokes);
    const totalStrokes = strokes.reduce((a, b) => a + b, 0);

    let upperSum = 0;
    let lowerSum = 0;

    if (chars.length === 1) {
        const s = strokes[0];
        upperSum = Math.ceil(s / 2);
        lowerSum = Math.max(1, Math.floor(s / 2));
    } else if (chars.length === 2) {
        upperSum = strokes[0];
        lowerSum = strokes[1];
    } else if (chars.length === 3) {
        upperSum = strokes[0];
        lowerSum = strokes[1] + strokes[2];
    } else {
        const mid = Math.floor(chars.length / 2);
        upperSum = strokes.slice(0, mid).reduce((a, b) => a + b, 0);
        lowerSum = strokes.slice(mid).reduce((a, b) => a + b, 0);
    }

    const upperGua = numToGua(upperSum);
    const lowerGua = numToGua(lowerSum);
    const dongYao = numToYao(totalStrokes + shichen.num);

    return {
        method: 'text',
        text: cleanText,
        charCount: chars.length,
        totalStrokes,
        shichen: { name: shichen.name, num: shichen.num },
        calculations: {
            upperSum,
            lowerSum,
            upperGua,
            lowerGua,
            dongYao
        },
        ...analyzeHexagram(upperGua, lowerGua, dongYao)
    };
}

module.exports = {
    BAGUA,
    BAGUA_NATURE,
    HEXAGRAMS,
    numToGua,
    numToYao,
    getHexagramBinary,
    getHuGua,
    getCuoGua,
    getZongGua,
    qiguaByTime,
    qiguaByGregorianTime,
    qiguaByGregorianComponents,
    qiguaByNumbers,
    qiguaByText,
    getLunarFromDate,
    analyzeHexagram,
    getHexagramInfo
};
