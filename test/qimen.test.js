const assert = require('node:assert/strict');
const test = require('node:test');

const qimen = require('../lib/qimen');

test('傳統模式固定時間會產生完整且可分析的九宮盤', () => {
    const result = qimen.calculate(new Date(2026, 0, 20, 15, 0, 0), {
        method: '時家',
        timePrecisionMode: 'traditional'
    });

    assert.notEqual(result.error, true, result.message);
    assert.deepEqual(Object.keys(result.jiuGongAnalysis).sort(), ['1', '2', '3', '4', '5', '6', '7', '8', '9']);

    const nonCenterPalaces = Object.values(result.jiuGongAnalysis).filter((gong) => gong.gongNumber !== '5');
    assert.equal(nonCenterPalaces.length, 8);
    for (const gong of nonCenterPalaces) {
        assert.notEqual(gong.shen, '', `第 ${gong.gongNumber} 宮缺少八神`);
        assert.notEqual(gong.shenFeature, '', `${gong.shen} 缺少分析說明`);
    }
});
