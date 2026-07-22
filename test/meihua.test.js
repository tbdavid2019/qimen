const assert = require('node:assert/strict');
const test = require('node:test');

const meihua = require('../lib/meihua');

test('時間起卦固定案例產生預期的本卦、互卦與變卦', () => {
    const result = meihua.qiguaByGregorianComponents(2026, 1, 20, 15);

    assert.deepEqual(
        {
            bengua: result.bengua,
            hugua: result.hugua,
            biangua: result.biangua,
            wuxingRelation: result.wuxingRelation,
            calculations: result.calculations,
            shichen: result.shichen
        },
        {
            bengua: {
                num: 23,
                name: '山地剝',
                upper: 7,
                lower: 8,
                upperGua: meihua.BAGUA[7],
                lowerGua: meihua.BAGUA[8],
                binary: '100000',
                dongYao: 2
            },
            hugua: { num: 2, name: '坤為地', upper: 8, lower: 8, binary: '000000' },
            biangua: { num: 4, name: '山水蒙', upper: 7, lower: 6, binary: '100010' },
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
            shichen: { name: '申', num: 9 }
        }
    );
});

test('數字起卦固定案例產生預期的本卦、互卦與變卦', () => {
    const result = meihua.qiguaByNumbers(6, 8, 3);

    assert.equal(result.bengua.num, 8);
    assert.equal(result.bengua.name, '水地比');
    assert.equal(result.bengua.binary, '010000');
    assert.deepEqual(result.hugua, {
        num: 23,
        name: '山地剝',
        upper: 7,
        lower: 8,
        binary: '100000'
    });
    assert.deepEqual(result.biangua, {
        num: 39,
        name: '水山蹇',
        upper: 6,
        lower: 7,
        binary: '010100'
    });
    assert.equal(result.wuxingRelation, '用克體（凶）');
    assert.deepEqual(result.calculations, { upperGua: 6, lowerGua: 8, dongYao: 3 });
});
