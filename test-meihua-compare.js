const meihua = require('./lib/meihua');

function assertEqual(label, actual, expected) {
    if (actual !== expected) {
        throw new Error(`${label} 不一致：${actual} !== ${expected}`);
    }
}

function assertHexagram(label, actual, expected) {
    assertEqual(`${label} 卦序`, actual.num, expected.num);
    assertEqual(`${label} 名稱`, actual.name, expected.name);
    if (expected.binary) {
        assertEqual(`${label} 二進位`, actual.binary, expected.binary);
    }
}

function runCase(label, actual, expected) {
    try {
        assertHexagram(`${label} 本卦`, actual.bengua, expected.bengua);
        assertHexagram(`${label} 互卦`, actual.hugua, expected.hugua);
        assertHexagram(`${label} 變卦`, actual.biangua, expected.biangua);
        assertEqual(`${label} 五行生克`, actual.wuxingRelation, expected.wuxingRelation);
        Object.keys(expected.calculations).forEach((key) => {
            assertEqual(`${label} 計算 ${key}`, actual.calculations[key], expected.calculations[key]);
        });
        if (expected.shichen) {
            assertEqual(`${label} 時辰`, actual.shichen.name, expected.shichen.name);
        }
        console.log(`✅ ${label} 一致`);
    } catch (error) {
        console.log(`❌ ${label} 不一致`);
        console.log(`   - ${error.message}`);
    }
}

function testTimeCase() {
    const jsResult = meihua.qiguaByGregorianComponents(2026, 1, 20, 15);
    const expected = {
        bengua: { num: 23, name: '山地剝', binary: '100000' },
        hugua: { num: 2, name: '坤為地', binary: '000000' },
        biangua: { num: 4, name: '山水蒙', binary: '100010' },
        wuxingRelation: '比和（吉）',
        calculations: {
            yearSum: 9,
            month: 12,
            day: 2,
            shichenNum: 9,
            upperSum: 23,
            lowerSum: 32,
            upperGua: 7,
            lowerGua: 8,
            dongYao: 2
        },
        shichen: { name: '申' }
    };

    runCase('時間起卦 (2026-01-20 15:00)', jsResult, expected);
}

function testNumberCase() {
    const jsResult = meihua.qiguaByNumbers(6, 8, 3);
    const expected = {
        bengua: { num: 8, name: '水地比', binary: '010000' },
        hugua: { num: 23, name: '山地剝', binary: '100000' },
        biangua: { num: 39, name: '水山蹇', binary: '010100' },
        wuxingRelation: '用克體（凶）',
        calculations: {
            upperGua: 6,
            lowerGua: 8,
            dongYao: 3
        }
    };

    runCase('數字起卦 (6, 8, 3)', jsResult, expected);
}

console.log('=== 梅花易數 JS 對照測試 ===');
testTimeCase();
testNumberCase();
