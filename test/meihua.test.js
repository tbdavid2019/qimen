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
    assert.ok(result.cuogua && result.cuogua.num > 0);
    assert.ok(result.zonggua && result.zonggua.num > 0);
    assert.ok(result.timing && result.timing.timingDesc);
});

test('梅花漢字起卦正確生成五卦全息與動爻爻辭', () => {
    const result = meihua.qiguaByText('天地人', 12);
    assert.equal(result.method, 'text');
    assert.equal(result.text, '天地人');
    assert.ok(result.bengua.num > 0);
    assert.ok(result.biangua.num > 0);
    assert.ok(result.hugua.num > 0);
    assert.ok(result.cuogua.num > 0);
    assert.ok(result.zonggua.num > 0);
    assert.ok(result.dongYaoInfo && result.dongYaoInfo.text);
    assert.ok(result.timing && result.timing.timingDesc);
});

test('梅花時間起卦輸出國曆與農曆資訊，且四季旺衰狀態使用中文名稱', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const result = meihua.qiguaByGregorianComponents(2026, 11, 18, 16);
    assert.deepEqual(result.solar, { year: 2026, month: 11, day: 18, hour: 16 });
    assert.deepEqual(result.lunar, { year: 2026, month: 10, day: 10, isLeap: false });
    assert.equal(result.shichen.name, '申');
    assert.match(result.wuxing.tiStatus, /【[旺相休囚死平]】/);
    assert.match(result.wuxing.yongStatus, /【[旺相休囚死平]】/);
    assert.doesNotMatch(result.wuxing.tiStatus + result.wuxing.yongStatus, /\b(wang|xiang|xiu|qiu|si)\b/);

    const frontendJs = fs.readFileSync(path.join(__dirname, '..', 'public/js/meihua.js'), 'utf8');
    assert.match(frontendJs, /國曆 \$\{data\.solar\.year\}/);
    assert.match(frontendJs, /農曆 \$\{data\.lunar\.year\}年/);
});
