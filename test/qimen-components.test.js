const assert = require('node:assert/strict');
const test = require('node:test');

const { distributeBaShen } = require('../lib/bashen');
const { distributeBaMen } = require('../lib/bamen');
const { distributeJiuXing } = require('../lib/jiuxing');

const PALACES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const CANONICAL_BA_SHEN = ['值符', '騰蛇', '太陰', '六合', '白虎', '玄武', '九地', '九天'];
const CANONICAL_BA_MEN = ['休門', '生門', '傷門', '杜門', '景門', '死門', '驚門', '開門'];
const CANONICAL_JIU_XING = ['天蓬', '天芮', '天沖', '天輔', '天禽', '天心', '天柱', '天任', '天英'];
const SAN_QI_LIU_YI = {
    '1': '戊',
    '2': '己',
    '3': '庚',
    '4': '辛',
    '5': '壬',
    '6': '癸',
    '7': '丁',
    '8': '丙',
    '9': '乙'
};

test('八神排布使用與分析字典一致的 canonical 名稱', () => {
    const result = distributeBaShen('1');

    assert.deepEqual(Object.keys(result).sort(), PALACES);
    assert.equal(result['5'], '');
    assert.deepEqual(
        Object.values(result).filter(Boolean).sort(),
        [...CANONICAL_BA_SHEN].sort()
    );
});

test('九星排布完整覆蓋九宮且每顆星只出現一次', () => {
    const result = distributeJiuXing(SAN_QI_LIU_YI, '戊');

    assert.equal(result.zhiFuGong, '1');
    assert.deepEqual(Object.keys(result.jiuXing).sort(), PALACES);
    assert.deepEqual(Object.values(result.jiuXing).sort(), [...CANONICAL_JIU_XING].sort());
});

test('八門排布完整覆蓋九宮且中宮無門', () => {
    const result = distributeBaMen('1', '戊', SAN_QI_LIU_YI);

    assert.equal(result.zhiShiGong, '1');
    assert.deepEqual(Object.keys(result.baMen).sort(), PALACES);
    assert.equal(result.baMen['5'], '');
    assert.deepEqual(
        Object.values(result.baMen).filter(Boolean).sort(),
        [...CANONICAL_BA_MEN].sort()
    );
});
