/**
 * lib/liuyao.js
 * 
 * 六爻神卦 (京房納甲筮法) 核心計算引擎
 * 完整實現：
 * 1. 京房八宮六十四卦、世應、宮位五行
 * 2. 納甲干支與爻位五行 (天干地支)
 * 3. 六親系統 (父母、官鬼、妻財、子孫、兄弟)
 * 4. 伏神/飛神解析 (首宮八純卦對照)
 * 5. 日干起六獸 (青龍、朱雀、勾陳、螣蛇、白虎、玄武)
 * 6. 旬空、月建、日辰、月令旺衰 (旺相休囚死)、月破、日衝
 * 7. 朱熹《易學啟蒙》考變占 7 爻變斷法 (0~6 動爻主客爻辭判定)
 * 8. 四大多元起卦模式：三枚銅錢搖卦、大衍筮法 (49 策三變成爻)、年月日時起卦、手動爻值
 * 9. 智能用神自動映射 (求財/事業/考試/感情/健康等)
 * 
 * 遵從 AGENTS.md: 純 Node.js，零 Python 依賴，100% 完整無閹割。
 */

const { Solar, Lunar } = require('lunar-javascript');
const { getSolarTimeInfo } = require('./solar-time');

// 八卦基礎定義 (二進位由下至上：初、二、三爻，0=陰，1=陽)
const TRIGRAMS = {
    '111': { name: '乾', nature: '天', element: '金', index: 1, palace: '乾' },
    '110': { name: '兌', nature: '澤', element: '金', index: 2, palace: '兌' },
    '101': { name: '離', nature: '火', element: '火', index: 3, palace: '離' },
    '100': { name: '震', nature: '雷', element: '木', index: 4, palace: '震' },
    '011': { name: '巽', nature: '風', element: '木', index: 5, palace: '巽' },
    '010': { name: '坎', nature: '水', element: '水', index: 6, palace: '坎' },
    '001': { name: '艮', nature: '山', element: '土', index: 7, palace: '艮' },
    '000': { name: '坤', nature: '地', element: '土', index: 8, palace: '坤' }
};

// 先天八卦數字索引 (1乾, 2兌, 3離, 4震, 5巽, 6坎, 7艮, 8坤)
const INDEX_TO_TRIGRAM = {
    1: '111', 2: '110', 3: '101', 4: '100',
    5: '011', 6: '010', 7: '001', 8: '000'
};

const TRIGRAM_BY_NAME = {
    '乾': '111', '兌': '110', '離': '101', '震': '100',
    '巽': '011', '坎': '010', '艮': '001', '坤': '000'
};

// 地支五行
const BRANCH_ELEMENTS = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木',
    '辰': '土', '巳': '火', '午': '火', '未': '土',
    '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 五行生剋
const ELEMENT_GEN = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const ELEMENT_RESTRICT = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

// 京房納甲干支表：各卦內卦 (初二三爻) 與外卦 (四五六爻)
// 乾內甲子寅辰，外壬午申戌；坤內乙未巳卯，外癸丑亥酉；
// 震內庚子寅辰，外庚午申戌；巽內辛丑亥酉，外辛未巳卯；
// 坎內戊寅辰午，外戊申戌子；離內己卯丑亥，外己酉未巳；
// 艮內丙辰午申，外丙戌子寅；兌內丁巳卯丑，外丁亥酉未。
const NAJIA_TABLE = {
    '乾': {
        inner: [ { stem: '甲', branch: '子' }, { stem: '甲', branch: '寅' }, { stem: '甲', branch: '辰' } ],
        outer: [ { stem: '壬', branch: '午' }, { stem: '壬', branch: '申' }, { stem: '壬', branch: '戌' } ]
    },
    '坤': {
        inner: [ { stem: '乙', branch: '未' }, { stem: '乙', branch: '巳' }, { stem: '乙', branch: '卯' } ],
        outer: [ { stem: '癸', branch: '丑' }, { stem: '癸', branch: '亥' }, { stem: '癸', branch: '酉' } ]
    },
    '震': {
        inner: [ { stem: '庚', branch: '子' }, { stem: '庚', branch: '寅' }, { stem: '庚', branch: '辰' } ],
        outer: [ { stem: '庚', branch: '午' }, { stem: '庚', branch: '申' }, { stem: '庚', branch: '戌' } ]
    },
    '巽': {
        inner: [ { stem: '辛', branch: '丑' }, { stem: '辛', branch: '亥' }, { stem: '辛', branch: '酉' } ],
        outer: [ { stem: '辛', branch: '未' }, { stem: '辛', branch: '巳' }, { stem: '辛', branch: '卯' } ]
    },
    '坎': {
        inner: [ { stem: '戊', branch: '寅' }, { stem: '戊', branch: '辰' }, { stem: '戊', branch: '午' } ],
        outer: [ { stem: '戊', branch: '申' }, { stem: '戊', branch: '戌' }, { stem: '戊', branch: '子' } ]
    },
    '離': {
        inner: [ { stem: '己', branch: '卯' }, { stem: '己', branch: '丑' }, { stem: '己', branch: '亥' } ],
        outer: [ { stem: '己', branch: '酉' }, { stem: '己', branch: '未' }, { stem: '己', branch: '巳' } ]
    },
    '艮': {
        inner: [ { stem: '丙', branch: '辰' }, { stem: '丙', branch: '午' }, { stem: '丙', branch: '申' } ],
        outer: [ { stem: '丙', branch: '戌' }, { stem: '丙', branch: '子' }, { stem: '丙', branch: '寅' } ]
    },
    '兌': {
        inner: [ { stem: '丁', branch: '巳' }, { stem: '丁', branch: '卯' }, { stem: '丁', branch: '丑' } ],
        outer: [ { stem: '丁', branch: '亥' }, { stem: '丁', branch: '酉' }, { stem: '丁', branch: '未' } ]
    }
};

// 京房八宮六十四卦體系
// 每個宮有 8 卦：本宮八純(世6應3)、一世(世1應4)、二世(世2應5)、三世(世3應6)、
// 四世(世4應1)、五世(世5應2)、遊魂(世4應1)、歸魂(世3應6)。
const EIGHT_PALACES = {
    '乾': {
        element: '金',
        hexagrams: [
            { name: '乾為天', type: '本宮卦', shi: 6, ying: 3, upper: '乾', lower: '乾' },
            { name: '天風姤', type: '一世卦', shi: 1, ying: 4, upper: '乾', lower: '巽' },
            { name: '天山遯', type: '二世卦', shi: 2, ying: 5, upper: '乾', lower: '艮' },
            { name: '天地否', type: '三世卦', shi: 3, ying: 6, upper: '乾', lower: '坤' },
            { name: '風地觀', type: '四世卦', shi: 4, ying: 1, upper: '巽', lower: '坤' },
            { name: '山地剝', type: '五世卦', shi: 5, ying: 2, upper: '艮', lower: '坤' },
            { name: '火地晉', type: '遊魂卦', shi: 4, ying: 1, upper: '離', lower: '坤' },
            { name: '火天大有', type: '歸魂卦', shi: 3, ying: 6, upper: '離', lower: '乾' }
        ]
    },
    '坎': {
        element: '水',
        hexagrams: [
            { name: '坎為水', type: '本宮卦', shi: 6, ying: 3, upper: '坎', lower: '坎' },
            { name: '水澤節', type: '一世卦', shi: 1, ying: 4, upper: '坎', lower: '兌' },
            { name: '水雷屯', type: '二世卦', shi: 2, ying: 5, upper: '坎', lower: '震' },
            { name: '水火既濟', type: '三世卦', shi: 3, ying: 6, upper: '坎', lower: '離' },
            { name: '澤火革', type: '四世卦', shi: 4, ying: 1, upper: '兌', lower: '離' },
            { name: '雷火豐', type: '五世卦', shi: 5, ying: 2, upper: '震', lower: '離' },
            { name: '地火明夷', type: '遊魂卦', shi: 4, ying: 1, upper: '坤', lower: '離' },
            { name: '地水師', type: '歸魂卦', shi: 3, ying: 6, upper: '坤', lower: '坎' }
        ]
    },
    '艮': {
        element: '土',
        hexagrams: [
            { name: '艮為山', type: '本宮卦', shi: 6, ying: 3, upper: '艮', lower: '艮' },
            { name: '山火賁', type: '一世卦', shi: 1, ying: 4, upper: '艮', lower: '離' },
            { name: '山天大畜', type: '二世卦', shi: 2, ying: 5, upper: '艮', lower: '乾' },
            { name: '山澤損', type: '三世卦', shi: 3, ying: 6, upper: '艮', lower: '兌' },
            { name: '火澤睽', type: '四世卦', shi: 4, ying: 1, upper: '離', lower: '兌' },
            { name: '天澤履', type: '五世卦', shi: 5, ying: 2, upper: '乾', lower: '兌' },
            { name: '風澤中孚', type: '遊魂卦', shi: 4, ying: 1, upper: '巽', lower: '兌' },
            { name: '風山漸', type: '歸魂卦', shi: 3, ying: 6, upper: '巽', lower: '艮' }
        ]
    },
    '震': {
        element: '木',
        hexagrams: [
            { name: '震為雷', type: '本宮卦', shi: 6, ying: 3, upper: '震', lower: '震' },
            { name: '雷地豫', type: '一世卦', shi: 1, ying: 4, upper: '震', lower: '坤' },
            { name: '雷水解', type: '二世卦', shi: 2, ying: 5, upper: '震', lower: '坎' },
            { name: '雷風恆', type: '三世卦', shi: 3, ying: 6, upper: '震', lower: '巽' },
            { name: '地風升', type: '四世卦', shi: 4, ying: 1, upper: '坤', lower: '巽' },
            { name: '水風井', type: '五世卦', shi: 5, ying: 2, upper: '坎', lower: '巽' },
            { name: '澤風大過', type: '遊魂卦', shi: 4, ying: 1, upper: '兌', lower: '巽' },
            { name: '澤雷隨', type: '歸魂卦', shi: 3, ying: 6, upper: '兌', lower: '震' }
        ]
    },
    '巽': {
        element: '木',
        hexagrams: [
            { name: '巽為風', type: '本宮卦', shi: 6, ying: 3, upper: '巽', lower: '巽' },
            { name: '風天小畜', type: '一世卦', shi: 1, ying: 4, upper: '巽', lower: '乾' },
            { name: '風火家人', type: '二世卦', shi: 2, ying: 5, upper: '巽', lower: '離' },
            { name: '風雷益', type: '三世卦', shi: 3, ying: 6, upper: '巽', lower: '震' },
            { name: '天雷无妄', type: '四世卦', shi: 4, ying: 1, upper: '乾', lower: '震' },
            { name: '火雷噬嗑', type: '五世卦', shi: 5, ying: 2, upper: '離', lower: '震' },
            { name: '山雷頤', type: '遊魂卦', shi: 4, ying: 1, upper: '艮', lower: '震' },
            { name: '山風蠱', type: '歸魂卦', shi: 3, ying: 6, upper: '艮', lower: '巽' }
        ]
    },
    '離': {
        element: '火',
        hexagrams: [
            { name: '離為火', type: '本宮卦', shi: 6, ying: 3, upper: '離', lower: '離' },
            { name: '火山旅', type: '一世卦', shi: 1, ying: 4, upper: '離', lower: '艮' },
            { name: '火風鼎', type: '二世卦', shi: 2, ying: 5, upper: '離', lower: '巽' },
            { name: '火水未濟', type: '三世卦', shi: 3, ying: 6, upper: '離', lower: '坎' },
            { name: '山水蒙', type: '四世卦', shi: 4, ying: 1, upper: '艮', lower: '坎' },
            { name: '風水渙', type: '五世卦', shi: 5, ying: 2, upper: '巽', lower: '坎' },
            { name: '天水訟', type: '遊魂卦', shi: 4, ying: 1, upper: '乾', lower: '坎' },
            { name: '天火同人', type: '歸魂卦', shi: 3, ying: 6, upper: '乾', lower: '離' }
        ]
    },
    '坤': {
        element: '土',
        hexagrams: [
            { name: '坤為地', type: '本宮卦', shi: 6, ying: 3, upper: '坤', lower: '坤' },
            { name: '地雷復', type: '一世卦', shi: 1, ying: 4, upper: '坤', lower: '震' },
            { name: '地澤臨', type: '二世卦', shi: 2, ying: 5, upper: '坤', lower: '兌' },
            { name: '地天泰', type: '三世卦', shi: 3, ying: 6, upper: '坤', lower: '乾' },
            { name: '雷天大壯', type: '四世卦', shi: 4, ying: 1, upper: '震', lower: '乾' },
            { name: '澤天夬', type: '五世卦', shi: 5, ying: 2, upper: '兌', lower: '乾' },
            { name: '水天需', type: '遊魂卦', shi: 4, ying: 1, upper: '坎', lower: '乾' },
            { name: '水地比', type: '歸魂卦', shi: 3, ying: 6, upper: '坎', lower: '坤' }
        ]
    },
    '兌': {
        element: '金',
        hexagrams: [
            { name: '兌為澤', type: '本宮卦', shi: 6, ying: 3, upper: '兌', lower: '兌' },
            { name: '澤水困', type: '一世卦', shi: 1, ying: 4, upper: '兌', lower: '坎' },
            { name: '澤地萃', type: '二世卦', shi: 2, ying: 5, upper: '兌', lower: '坤' },
            { name: '澤山咸', type: '三世卦', shi: 3, ying: 6, upper: '兌', lower: '艮' },
            { name: '水山蹇', type: '四世卦', shi: 4, ying: 1, upper: '坎', lower: '艮' },
            { name: '地山謙', type: '五世卦', shi: 5, ying: 2, upper: '坤', lower: '艮' },
            { name: '雷山小過', type: '遊魂卦', shi: 4, ying: 1, upper: '震', lower: '艮' },
            { name: '雷澤歸妹', type: '歸魂卦', shi: 3, ying: 6, upper: '震', lower: '兌' }
        ]
    }
};

// 建立 64 卦二進位或 (上卦-下卦) 到宮位資料的快速映射
const HEXAGRAM_LOOKUP = {};
for (const [palaceName, palaceData] of Object.entries(EIGHT_PALACES)) {
    for (const h of palaceData.hexagrams) {
        const key = `${h.upper}-${h.lower}`;
        HEXAGRAM_LOOKUP[key] = {
            ...h,
            palace: palaceName,
            palaceElement: palaceData.element
        };
    }
}

// 六神 (六獸) 對照 (日干起六獸)
const LIUSHEN_MAP = {
    '甲': ['青龍', '朱雀', '勾陳', '螣蛇', '白虎', '玄武'],
    '乙': ['青龍', '朱雀', '勾陳', '螣蛇', '白虎', '玄武'],
    '丙': ['朱雀', '勾陳', '螣蛇', '白虎', '玄武', '青龍'],
    '丁': ['朱雀', '勾陳', '螣蛇', '白虎', '玄武', '青龍'],
    '戊': ['勾陳', '螣蛇', '白虎', '玄武', '青龍', '朱雀'],
    '己': ['螣蛇', '白虎', '玄武', '青龍', '朱雀', '勾陳'],
    '庚': ['白虎', '玄武', '青龍', '朱雀', '勾陳', '螣蛇'],
    '辛': ['白虎', '玄武', '青龍', '朱雀', '勾陳', '螣蛇'],
    '壬': ['玄武', '青龍', '朱雀', '勾陳', '螣蛇', '白虎'],
    '癸': ['玄武', '青龍', '朱雀', '勾陳', '螣蛇', '白虎']
};

// 旬空對照 (日柱干支查空亡)
const XUNKONG_MAP = {
    '甲子': '戌亥', '乙丑': '戌亥', '丙寅': '戌亥', '丁卯': '戌亥', '戊辰': '戌亥', '己巳': '戌亥', '庚午': '戌亥', '辛未': '戌亥', '壬申': '戌亥', '癸酉': '戌亥',
    '甲戌': '申酉', '乙亥': '申酉', '丙子': '申酉', '丁丑': '申酉', '戊寅': '申酉', '己卯': '申酉', '庚辰': '申酉', '辛巳': '申酉', '壬午': '申酉', '癸未': '申酉',
    '甲申': '午未', '乙酉': '午未', '丙戌': '午未', '丁亥': '午未', '戊子': '午未', '己丑': '午未', '庚寅': '午未', '辛卯': '午未', '壬辰': '午未', '癸巳': '午未',
    '甲午': '辰巳', '乙未': '辰巳', '丙申': '辰巳', '丁酉': '辰巳', '戊戌': '辰巳', '己亥': '辰巳', '庚子': '辰巳', '辛丑': '辰巳', '壬寅': '辰巳', '癸卯': '辰巳',
    '甲辰': '寅卯', '乙巳': '寅卯', '丙午': '寅卯', '丁未': '寅卯', '戊申': '寅卯', '己酉': '寅卯', '庚戌': '寅卯', '辛亥': '寅卯', '壬子': '寅卯', '癸丑': '寅卯',
    '甲寅': '子丑', '乙卯': '子丑', '丙辰': '子丑', '丁巳': '子丑', '戊午': '子丑', '己未': '子丑', '庚申': '子丑', '辛酉': '子丑', '壬戌': '子丑', '癸亥': '子丑'
};

// 地支六衝 (用於判斷月破、日衝)
const BRANCH_CHONG = {
    '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥',
    '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳'
};

// 爻辭文本快取
let YAOCI_DATA = {};
try {
    YAOCI_DATA = require('../data/meihua/yaoci.json');
} catch (e) {
    YAOCI_DATA = {};
}

/**
 * 計算六親關係
 * @param {string} palaceElement 宮位五行 (我)
 * @param {string} lineElement 爻支五行
 * @returns {string} 父母、官鬼、妻財、子孫、兄弟
 */
function getLiuqin(palaceElement, lineElement) {
    if (lineElement === palaceElement) return '兄弟';
    if (ELEMENT_GEN[lineElement] === palaceElement) return '父母'; // 生我者
    if (ELEMENT_GEN[palaceElement] === lineElement) return '子孫'; // 我生者
    if (ELEMENT_RESTRICT[lineElement] === palaceElement) return '官鬼'; // 剋我者
    if (ELEMENT_RESTRICT[palaceElement] === lineElement) return '妻財'; // 我剋者
    return '兄弟';
}

/**
 * 計算月令旺衰 (旺相休囚死)
 * @param {string} monthBranch 月建地支
 * @param {string} lineElement 爻五行
 * @returns {string} 旺/相/休/囚/死
 */
function getSeasonalStrength(monthBranch, lineElement) {
    const monthElement = BRANCH_ELEMENTS[monthBranch] || '土';
    if (lineElement === monthElement) return '旺';
    if (ELEMENT_GEN[monthElement] === lineElement) return '相'; // 月生爻
    if (ELEMENT_GEN[lineElement] === monthElement) return '休'; // 爻生月
    if (ELEMENT_RESTRICT[lineElement] === monthElement) return '囚'; // 爻剋月
    if (ELEMENT_RESTRICT[monthElement] === lineElement) return '死'; // 月剋爻
    return '平';
}

/**
 * 將 6 位爻值 ('789687'，從初爻至上爻) 解析為本卦與之卦上下卦
 * 6: 老陰 (陰變陽)
 * 7: 少陽 (陽靜)
 * 8: 少陰 (陰靜)
 * 9: 老陽 (陽變陰)
 */
function parseLines(lineStr) {
    if (!lineStr || typeof lineStr !== 'string' || lineStr.length !== 6) {
        throw new Error('爻值字串長度必須為 6 位（如 "789687"）');
    }
    const digits = lineStr.split('').map(c => parseInt(c, 10));
    for (const d of digits) {
        if (![6, 7, 8, 9].includes(d)) {
            throw new Error(`無效的爻值：${d}，必須為 6, 7, 8 或 9`);
        }
    }

    // 初、二、三爻 -> 下卦 (內卦)
    // 四、五、六爻 -> 上卦 (外卦)
    const benLowerBits = [digits[0] % 2 === 1 ? '1' : '0', digits[1] % 2 === 1 ? '1' : '0', digits[2] % 2 === 1 ? '1' : '0'].join('');
    const benUpperBits = [digits[3] % 2 === 1 ? '1' : '0', digits[4] % 2 === 1 ? '1' : '0', digits[5] % 2 === 1 ? '1' : '0'].join('');

    // 之卦變爻：6 (老陰) 變陽 1，9 (老陽) 變陰 0；7, 8 不變
    const zhiDigits = digits.map(d => {
        if (d === 6) return 7; // 變陽
        if (d === 9) return 8; // 變陰
        return d;
    });

    const zhiLowerBits = [zhiDigits[0] % 2 === 1 ? '1' : '0', zhiDigits[1] % 2 === 1 ? '1' : '0', zhiDigits[2] % 2 === 1 ? '1' : '0'].join('');
    const zhiUpperBits = [zhiDigits[3] % 2 === 1 ? '1' : '0', zhiDigits[4] % 2 === 1 ? '1' : '0', zhiDigits[5] % 2 === 1 ? '1' : '0'].join('');

    return {
        digits,
        zhiDigits,
        benLower: TRIGRAMS[benLowerBits].name,
        benUpper: TRIGRAMS[benUpperBits].name,
        zhiLower: TRIGRAMS[zhiLowerBits].name,
        zhiUpper: TRIGRAMS[zhiUpperBits].name,
        movingLines: digits.map((d, idx) => (d === 6 || d === 9 ? idx + 1 : null)).filter(Boolean)
    };
}

/**
 * 構建單卦六爻排盤資料 (本卦或之卦)
 */
function buildHexagramLines(upperName, lowerName, palaceElement, dayStem, monthBranch, dayBranch, digits = null) {
    const innerNajia = NAJIA_TABLE[lowerName].inner;
    const outerNajia = NAJIA_TABLE[upperName].outer;
    const allNajia = [...innerNajia, ...outerNajia];
    const liushen = LIUSHEN_MAP[dayStem] || LIUSHEN_MAP['甲'];

    return allNajia.map((nj, idx) => {
        const pos = idx + 1; // 1~6
        const branchElement = BRANCH_ELEMENTS[nj.branch];
        const liuqin = getLiuqin(palaceElement, branchElement);
        const seasonal = monthBranch ? getSeasonalStrength(monthBranch, branchElement) : '平';
        const isMonthBroken = monthBranch && (BRANCH_CHONG[nj.branch] === monthBranch);
        const isDayClash = dayBranch && (BRANCH_CHONG[nj.branch] === dayBranch);
        const rawDigit = digits ? digits[idx] : 7;
        const isMoving = rawDigit === 6 || rawDigit === 9;
        const isYang = (rawDigit === 7 || rawDigit === 9);

        return {
            position: pos,
            stem: nj.stem,
            branch: nj.branch,
            element: branchElement,
            liuqin,
            liushen: liushen[idx],
            digit: rawDigit,
            isYang,
            isMoving,
            movingSymbol: rawDigit === 9 ? '○' : rawDigit === 6 ? '×' : '',
            lineSymbol: isYang ? '▅▅▅▅▅' : '▅▅　▅▅',
            seasonal,
            isMonthBroken,
            isDayClash
        };
    });
}

/**
 * 尋找伏神 (若本卦中缺少某六親，自所屬宮位的首純卦中尋出伏神)
 */
function resolveFuShen(palaceName, palaceElement, benLines) {
    const pureLeader = EIGHT_PALACES[palaceName].hexagrams[0];
    const pureInner = NAJIA_TABLE[pureLeader.lower].inner;
    const pureOuter = NAJIA_TABLE[pureLeader.upper].outer;
    const pureAll = [...pureInner, ...pureOuter];

    // 本卦現有的六親
    const presentLiuqin = new Set(benLines.map(l => l.liuqin));
    const allRequiredLiuqin = ['父母', '官鬼', '妻財', '子孫', '兄弟'];
    const missingLiuqin = allRequiredLiuqin.filter(q => !presentLiuqin.has(q));

    const fushenMap = {};
    for (const missing of missingLiuqin) {
        // 在首卦中找出具有此六親的爻
        for (let i = 0; i < pureAll.length; i++) {
            const pureBranch = pureAll[i].branch;
            const pureStem = pureAll[i].stem;
            const pureElem = BRANCH_ELEMENTS[pureBranch];
            const q = getLiuqin(palaceElement, pureElem);
            if (q === missing) {
                const flyingLine = benLines[i]; // 飛神
                let relation = '比和';
                if (ELEMENT_GEN[pureElem] === flyingLine.element) relation = '伏生飛 (洩氣)';
                else if (ELEMENT_RESTRICT[pureElem] === flyingLine.element) relation = '伏剋飛 (出暴)';
                else if (ELEMENT_GEN[flyingLine.element] === pureElem) relation = '飛生伏 (得助吉)';
                else if (ELEMENT_RESTRICT[flyingLine.element] === pureElem) relation = '飛剋伏 (受制凶)';

                fushenMap[i + 1] = {
                    position: i + 1,
                    liuqin: missing,
                    stem: pureStem,
                    branch: pureBranch,
                    element: pureElem,
                    flyingPosition: i + 1,
                    flyingLiuqin: flyingLine.liuqin,
                    flyingBranch: flyingLine.branch,
                    relation
                };
                break;
            }
        }
    }
    return fushenMap;
}

/**
 * 朱熹《易學啟蒙》變爻斷法 (0~6 動爻判定主體)
 */
function evaluateZhuXiRule(benGuaName, zhiGuaName, movingLines) {
    const count = movingLines.length;
    let mainRule = '';
    let explanation = '';
    let primaryYaoIndex = null;

    if (count === 0) {
        mainRule = `占【${benGuaName}】彖辭`;
        explanation = `六爻皆靜，以本卦彖辭為主，以內卦為貞、外卦為悔。`;
    } else if (count === 1) {
        const m = movingLines[0];
        primaryYaoIndex = m;
        mainRule = `以本卦【${benGuaName}】第${m}爻動爻辭為主`;
        explanation = `一爻發動，事情樞紐全在此爻，依本卦動爻爻辭推斷吉凶動靜。`;
    } else if (count === 2) {
        const [low, high] = movingLines;
        primaryYaoIndex = high;
        mainRule = `以本卦【${benGuaName}】二動爻辭占，以上爻（第${high}爻）為主`;
        explanation = `二爻俱動，以下爻（第${low}爻）為輔、以上爻（第${high}爻）為綱。`;
    } else if (count === 3) {
        mainRule = `占本卦【${benGuaName}】及之卦【${zhiGuaName}】彖辭`;
        explanation = `三爻發動，事態處於轉折平分點，以本卦彖辭為貞（前階段）、之卦彖辭為悔（後階段）。`;
    } else if (count === 4) {
        // 4 爻動，看之卦 2 不變爻，以下者為主
        const allPos = [1, 2, 3, 4, 5, 6];
        const quietLines = allPos.filter(p => !movingLines.includes(p));
        primaryYaoIndex = quietLines[0]; // 下爻為主
        mainRule = `以之卦【${zhiGuaName}】二靜爻占，以下靜爻（第${quietLines[0]}爻）為主`;
        explanation = `四爻俱變，本卦氣數已退，轉向之卦；以之卦不變之二爻斷之，以下爻（第${quietLines[0]}爻）為主。`;
    } else if (count === 5) {
        // 5 爻動，看之卦唯一不變爻
        const allPos = [1, 2, 3, 4, 5, 6];
        const quietLine = allPos.find(p => !movingLines.includes(p));
        primaryYaoIndex = quietLine;
        mainRule = `以之卦【${zhiGuaName}】唯一靜爻（第${quietLine}爻）爻辭為主`;
        explanation = `五爻發動，大勢已完全轉入之卦，唯看之卦唯一未動之靜爻（第${quietLine}爻）。`;
    } else if (count === 6) {
        if (benGuaName === '乾為天') {
            mainRule = `占乾卦【用九】：見群龍無首，吉`;
            explanation = `乾卦六爻皆變，群龍無首，剛健純粹，化為坤。`;
        } else if (benGuaName === '坤為地') {
            mainRule = `占坤卦【用六】：利永貞`;
            explanation = `坤卦六爻皆變，厚德載物，純陰轉陽。`;
        } else {
            mainRule = `以之卦【${zhiGuaName}】彖辭斷之`;
            explanation = `六爻全動，事體全非，事物徹底轉變，全占之卦彖辭。`;
        }
    }

    return {
        movingCount: count,
        movingLines,
        primaryYaoIndex,
        mainRule,
        explanation
    };
}

/**
 * 智能自動辨識用神 (依問事領域)
 */
function resolveYongShen(category, gender = '男') {
    const cat = (category || '').trim();
    if (/財|錢|投資|買賣|生意|股票|理財|利潤|業績/.test(cat)) {
        return { target: '妻財', name: '財運/求財', desc: '以妻財爻為用神。妻財旺相有氣生世為吉，兄弟發動剋財或旬空為憂。' };
    }
    if (/事業|工作|官|升遷|職位|求職|面試|跳槽|長官|領導/.test(cat)) {
        return { target: '官鬼', name: '官職/事業', desc: '以官鬼爻為用神。官鬼持世或生世且得月令生旺為吉，子孫持世剋官為阻礙。' };
    }
    if (/考|高考|考試|考研|學業|錄取|文憑|證照|合約|契約|房子|房屋|文章|車輛|父母|長輩/.test(cat)) {
        return { target: '父母', name: '學業/文書/長輩', desc: '以父母爻為用神。父母爻主文書、文憑、契約、房產；旺相得生為吉。' };
    }
    if (/姻緣|婚姻|感情|戀愛|桃花|復合|結婚|對象|男友|女友|老公|老婆/.test(cat)) {
        if (gender === '女') {
            return { target: '官鬼', name: '女性問婚 (看夫星官鬼與世應)', desc: '女占以官鬼為用神（夫星），同時參看世應生剋：應生世、官鬼生世主大吉。' };
        }
        return { target: '妻財', name: '男性問婚 (看妻星妻財與世應)', desc: '男占以妻財為用神（妻星），同時參看世應生剋：應生世、妻財生世主和美。' };
    }
    if (/健康|疾病|身體|平安|消災|避禍|壽元/.test(cat)) {
        return { target: '子孫', name: '健康安危 (子孫為醫藥福神，官鬼為病灶)', desc: '問病以子孫爻為福神醫藥，以官鬼爻為病灶病原。子孫旺而剋官鬼者病立癒。' };
    }
    if (/小孩|懷孕|生產|生子|求子|晚輩|徒弟|寵物/.test(cat)) {
        return { target: '子孫', name: '求子/子孫', desc: '以子孫爻為用神。子孫得月生旺相者大吉，受父母爻動剋者受制。' };
    }
    if (/出門|出行|旅途|尋物|合夥|人際|綜合/.test(cat)) {
        return { target: '世應', name: '世爻與應爻 (世為我，應為彼或所往之地)', desc: '世爻代表自己，應爻代表對方、夥伴或所去之處。應爻生世合世大吉，相衝相剋不利。' };
    }
    // 預設為世應與綜合
    return { target: '世應', name: '綜合事態 (世應為主)', desc: '世爻代表當事人本體狀況，應爻代表外部環境與對應之人事。' };
}

/**
 * 起卦法 1：大衍筮法 (古典 49 策揲四歸奇三變成爻)
 */
function castByDayan() {
    const lines = [];
    for (let l = 0; l < 6; l++) {
        let stalks = 49;
        for (let change = 0; change < 3; change++) {
            // 分而為二以象兩 (分左右兩組，至少各 1 策)
            const left = Math.floor(Math.random() * (stalks - 3)) + 2;
            let right = stalks - left;
            // 掛一以象三 (右手取出一策放置小指間)
            right -= 1;
            // 揲之以四以象四時
            let leftRem = left % 4;
            if (leftRem === 0) leftRem = 4;
            let rightRem = right % 4;
            if (rightRem === 0) rightRem = 4;
            // 歸奇於扐以象閏
            const changeExtract = leftRem + rightRem + 1;
            stalks -= changeExtract;
        }
        // 三變之後，策數除以 4 得出爻值 (6, 7, 8, 9)
        const lineVal = stalks / 4;
        lines.push(lineVal);
    }
    return lines.join('');
}

/**
 * 起卦法 2：三枚銅錢搖卦模擬 (單次或連搖六次)
 * 每枚銅錢：字面 (陽=3)、背面 (陰=2)
 * 3 背 (2+2+2 = 6): 老陰 (動)
 * 1 字 2 背 (3+2+2 = 7): 少陽 (靜)
 * 2 字 1 背 (3+3+2 = 8): 少陰 (靜)
 * 3 字 (3+3+3 = 9): 老陽 (動)
 */
function tossThreeCoins() {
    const c1 = Math.random() < 0.5 ? 2 : 3;
    const c2 = Math.random() < 0.5 ? 2 : 3;
    const c3 = Math.random() < 0.5 ? 2 : 3;
    const sum = c1 + c2 + c3;
    return {
        coins: [c1, c2, c3],
        value: sum,
        description: sum === 6 ? '老陰 (動爻 ▅▅　▅▅ ×)' :
                     sum === 7 ? '少陽 (靜爻 ▅▅▅▅▅)' :
                     sum === 8 ? '少陰 (靜爻 ▅▅　▅▅)' : '老陽 (動爻 ▅▅▅▅▅ ○)'
    };
}

function castByCoins() {
    const lines = [];
    for (let i = 0; i < 6; i++) {
        lines.push(tossThreeCoins().value);
    }
    return lines.join('');
}

/**
 * 起卦法 3：年月日時起卦 (農曆年月日時數)
 */
function castByDatetime(date = new Date()) {
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();

    // 年支數 (子1~亥12)
    const yearZhiIndex = lunar.getYearZhiIndex() + 1;
    const month = lunar.getMonth();
    const day = lunar.getDay();
    const timeZhiIndex = lunar.getTimeZhiIndex() + 1;

    // 上卦 = (年 + 月 + 日) % 8
    let upperRem = (yearZhiIndex + Math.abs(month) + day) % 8;
    if (upperRem === 0) upperRem = 8;

    // 下卦 = (年 + 月 + 日 + 時) % 8
    let lowerRem = (yearZhiIndex + Math.abs(month) + day + timeZhiIndex) % 8;
    if (lowerRem === 0) lowerRem = 8;

    // 動爻 = (年 + 月 + 日 + 時) % 6
    let movingYao = (yearZhiIndex + Math.abs(month) + day + timeZhiIndex) % 6;
    if (movingYao === 0) movingYao = 6;

    // 先天八卦二進位 (初至三爻)
    const lowerBits = INDEX_TO_TRIGRAM[lowerRem]; // 內卦
    const upperBits = INDEX_TO_TRIGRAM[upperRem]; // 外卦
    const allBits = (lowerBits + upperBits).split(''); // 6 爻位 (0: 初爻, 5: 上爻)

    // 建立 6 爻值：若為動爻，陽爻為 9，陰爻為 6；靜爻陽為 7，陰為 8
    const lines = allBits.map((bit, idx) => {
        const pos = idx + 1;
        const isYang = bit === '1';
        if (pos === movingYao) {
            return isYang ? 9 : 6;
        }
        return isYang ? 7 : 8;
    });

    return lines.join('');
}

/**
 * 完整排盤主函數
 * @param {Object} options
 * @param {string} options.method 'coins' | 'dayan' | 'datetime' | 'manual'
 * @param {string} [options.lines] 6位爻值 (manual 時必填)
 * @param {Date|string} [options.datetime] 起卦時間 (預設當前時間)
 * @param {string} [options.question] 問事題目
 * @param {string} [options.category] 問事分類 (求財/事業/考試/姻緣/健康等)
 * @param {string} [options.gender] 性別 ('男' | '女')
 */
function calculateLiuyao(options = {}) {
    const {
        method = 'coins',
        lines: inputLines,
        datetime,
        question = '',
        category = '綜合運勢',
        gender = '男'
    } = options;

    const dateObj = datetime ? new Date(datetime) : new Date();
    const solar = Solar.fromDate(dateObj);
    const lunar = solar.getLunar();

    // 取得時間干支與農曆資訊
    const yearGanZhi = lunar.getYearInGanZhi();
    const monthGanZhi = lunar.getMonthInGanZhi();
    const dayGanZhi = lunar.getDayInGanZhi();
    const timeGanZhi = lunar.getTimeInGanZhi();

    const dayStem = dayGanZhi.substring(0, 1);
    const dayBranch = dayGanZhi.substring(1, 2);
    const monthBranch = monthGanZhi.substring(1, 2);

    // 旬空
    const xunKong = XUNKONG_MAP[dayGanZhi] || '';

    // 取得爻值
    let lineStr = '';
    if (method === 'manual') {
        lineStr = inputLines;
    } else if (method === 'dayan') {
        lineStr = castByDayan();
    } else if (method === 'datetime') {
        lineStr = castByDatetime(dateObj);
    } else {
        // coins / 預設
        lineStr = inputLines || castByCoins();
    }

    // 解析六爻、本卦、之卦
    const parsed = parseLines(lineStr);

    // 查找本卦所屬宮位與世應
    const benKey = `${parsed.benUpper}-${parsed.benLower}`;
    const benMeta = HEXAGRAM_LOOKUP[benKey] || {
        name: `${parsed.benUpper}${parsed.benLower}`,
        type: '純卦',
        shi: 6,
        ying: 3,
        palace: parsed.benUpper,
        palaceElement: TRIGRAMS[TRIGRAM_BY_NAME[parsed.benUpper]].element
    };

    // 查找之卦所屬宮位與世應
    const zhiKey = `${parsed.zhiUpper}-${parsed.zhiLower}`;
    const zhiMeta = HEXAGRAM_LOOKUP[zhiKey] || {
        name: `${parsed.zhiUpper}${parsed.zhiLower}`,
        type: '純卦',
        shi: 6,
        ying: 3,
        palace: parsed.zhiUpper,
        palaceElement: TRIGRAMS[TRIGRAM_BY_NAME[parsed.zhiUpper]].element
    };

    // 排本卦六爻
    const benLines = buildHexagramLines(
        parsed.benUpper,
        parsed.benLower,
        benMeta.palaceElement,
        dayStem,
        monthBranch,
        dayBranch,
        parsed.digits
    );

    // 排之卦六爻 (若無動爻則之卦同本卦，但六親以之卦宮位為準或本卦宮位為準？六爻傳統皆以本卦宮位定六親)
    const zhiLines = buildHexagramLines(
        parsed.zhiUpper,
        parsed.zhiLower,
        benMeta.palaceElement, // 六爻傳統中，之卦亦從本卦宮位論六親生剋
        dayStem,
        monthBranch,
        dayBranch,
        parsed.zhiDigits
    );

    // 伏神解析
    const fushen = resolveFuShen(benMeta.palace, benMeta.palaceElement, benLines);

    // 朱熹考變占規則斷法
    const zhuxi = evaluateZhuXiRule(benMeta.name, zhiMeta.name, parsed.movingLines);

    // 用神分析
    const yongshenInfo = resolveYongShen(category || question, gender);

    // 尋找用神在盤中的位置
    let yongshenStatus = {
        name: yongshenInfo.name,
        target: yongshenInfo.target,
        foundInBen: false,
        foundInFu: false,
        positions: [],
        summary: ''
    };

    if (yongshenInfo.target === '世應') {
        yongshenStatus.positions = [benMeta.shi, benMeta.ying];
        yongshenStatus.foundInBen = true;
        yongshenStatus.summary = `以世爻（第${benMeta.shi}爻）為我，應爻（第${benMeta.ying}爻）為他/事。`;
    } else {
        const matches = benLines.filter(l => l.liuqin === yongshenInfo.target);
        if (matches.length > 0) {
            yongshenStatus.foundInBen = true;
            yongshenStatus.positions = matches.map(m => m.position);
            const first = matches[0];
            const isKong = xunKong.includes(first.branch);
            yongshenStatus.summary = `用神【${yongshenInfo.target}】現於第 ${yongshenStatus.positions.join(', ')} 爻（${first.stem}${first.branch}${first.element}，月令${first.seasonal}${isKong ? '、落旬空' : ''}${first.isMonthBroken ? '、月破' : ''}）。`;
        } else {
            // 尋伏神
            const fuList = Object.values(fushen).filter(f => f.liuqin === yongshenInfo.target);
            if (fuList.length > 0) {
                yongshenStatus.foundInFu = true;
                yongshenStatus.positions = fuList.map(f => f.position);
                const firstFu = fuList[0];
                yongshenStatus.summary = `用神【${yongshenInfo.target}】本卦不現，伏於第 ${firstFu.position} 爻飛神【${firstFu.flyingLiuqin}${firstFu.flyingBranch}】之下（伏神 ${firstFu.stem}${firstFu.branch}${firstFu.element}，${firstFu.relation}）。`;
            } else {
                yongshenStatus.summary = `用神【${yongshenInfo.target}】未上卦亦無合適伏神，事態暫隱或需觀待時機。`;
            }
        }
    }

    // 爻辭匹配
    const yaoci = YAOCI_DATA[benMeta.name] || {};

    return {
        question,
        category,
        method,
        linesInput: lineStr,
        datetime: dateObj.toISOString(),
        lunarText: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} (${lunar.getJieQi() || (lunar.getPrevJieQi() ? lunar.getPrevJieQi().getName() : '節氣')})`,
        ganzhi: {
            year: yearGanZhi,
            month: monthGanZhi,
            day: dayGanZhi,
            time: timeGanZhi,
            dayStem,
            dayBranch,
            monthBranch,
            xunKong
        },
        benGua: {
            name: benMeta.name,
            upper: parsed.benUpper,
            lower: parsed.benLower,
            palace: benMeta.palace,
            palaceElement: benMeta.palaceElement,
            type: benMeta.type,
            shi: benMeta.shi,
            ying: benMeta.ying,
            lines: benLines
        },
        zhiGua: {
            name: zhiMeta.name,
            upper: parsed.zhiUpper,
            lower: parsed.zhiLower,
            palace: zhiMeta.palace,
            palaceElement: zhiMeta.palaceElement,
            type: zhiMeta.type,
            shi: zhiMeta.shi,
            ying: zhiMeta.ying,
            lines: zhiLines
        },
        fushen,
        zhuxiRule: zhuxi,
        yongshen: yongshenStatus,
        yaoci: {
            guaci: yaoci.guaci || '',
            tuanci: yaoci.tuanci || '',
            yaociList: yaoci.yaoci || []
        }
    };
}

module.exports = {
    calculateLiuyao,
    parseLines,
    castByCoins,
    castByDayan,
    castByDatetime,
    tossThreeCoins,
    resolveYongShen,
    evaluateZhuXiRule,
    resolveFuShen,
    buildHexagramLines,
    getLiuqin,
    getSeasonalStrength,
    EIGHT_PALACES,
    HEXAGRAM_LOOKUP,
    TRIGRAMS,
    NAJIA_TABLE,
    LIUSHEN_MAP,
    XUNKONG_MAP
};
