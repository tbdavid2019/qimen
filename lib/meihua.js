const { Lunar } = require('lunar-javascript');

// 先天八卦數對應
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
    { num: 1, name: '子' }, { num: 1, name: '子' }, { num: 2, name: '丑' }, { num: 2, name: '丑' },
    { num: 3, name: '寅' }, { num: 3, name: '寅' }, { num: 4, name: '卯' }, { num: 4, name: '卯' },
    { num: 5, name: '辰' }, { num: 5, name: '辰' }, { num: 6, name: '巳' }, { num: 6, name: '巳' },
    { num: 7, name: '午' }, { num: 7, name: '午' }, { num: 8, name: '未' }, { num: 8, name: '未' },
    { num: 9, name: '申' }, { num: 9, name: '申' }, { num: 10, name: '酉' }, { num: 10, name: '酉' },
    { num: 11, name: '戌' }, { num: 11, name: '戌' }, { num: 12, name: '亥' }, { num: 1, name: '子' }
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

function analyzeWuxing(tiElement, yongElement) {
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

    return {
        relation,
        judgement,
        detail,
        summary: `${relation}（${judgement}）`
    };
}

function getHexagramInfo(upper, lower) {
    return HEXAGRAMS[`${upper}-${lower}`] || { num: 0, name: '未知卦' };
}

function analyzeHexagram(upper, lower, dongYao) {
    const binary = getHexagramBinary(upper, lower);
    const hexagramInfo = getHexagramInfo(upper, lower);

    const isDongOnLower = dongYao <= 3;
    const tiGua = isDongOnLower ? upper : lower;
    const yongGua = isDongOnLower ? lower : upper;

    const bianBinary = applyChange(binary, dongYao);
    const [bianUpper, bianLower] = binaryToGuaPair(bianBinary);
    const bianInfo = getHexagramInfo(bianUpper, bianLower);

    const [huUpper, huLower] = getHuGua(binary);
    const huInfo = getHexagramInfo(huUpper, huLower);

    const wuxing = analyzeWuxing(BAGUA[tiGua].element, BAGUA[yongGua].element);

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
        }
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

function qiguaByTime(lunarYear, lunarMonth, lunarDay, hour) {
    if (![lunarYear, lunarMonth, lunarDay, hour].every((v) => Number.isInteger(v))) {
        throw new Error('時間起卦參數必須為整數');
    }

    // 年數採用農曆年份數字加總（與原 Python 腳本一致）
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
        ...analyzeHexagram(upperGua, lowerGua, dongYao)
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

module.exports = {
    BAGUA,
    HEXAGRAMS,
    numToGua,
    numToYao,
    getHexagramBinary,
    getHuGua,
    qiguaByTime,
    qiguaByGregorianTime,
    qiguaByGregorianComponents,
    qiguaByNumbers,
    getLunarFromDate
};
