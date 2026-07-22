const assert = require('node:assert/strict');
const test = require('node:test');

const qimen = require('../lib/qimen');

function assertValidationError(action, expected) {
    assert.throws(action, (error) => {
        assert.equal(error.name, 'QimenValidationError');
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, expected.code);
        assert.equal(error.field, expected.field);
        return true;
    });
}

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

test('無效日期會丟出可辨識的驗證錯誤', () => {
    assertValidationError(
        () => qimen.calculate(new Date('invalid')),
        { code: 'INVALID_DATE', field: 'date' }
    );
});

test('不支援的排盤方法會丟出可辨識的驗證錯誤', () => {
    assertValidationError(
        () => qimen.calculate(new Date(2026, 0, 20, 15, 0, 0), { method: '未知方法' }),
        { code: 'INVALID_METHOD', field: 'method' }
    );
});

test('不支援的時間精度模式會丟出可辨識的驗證錯誤', () => {
    assertValidationError(
        () => qimen.calculate(new Date(2026, 0, 20, 15, 0, 0), { timePrecisionMode: 'turbo' }),
        { code: 'INVALID_TIME_PRECISION_MODE', field: 'timePrecisionMode' }
    );
});

test('HTTP 邊界能區分輸入錯誤與內部錯誤', () => {
    assert.equal(typeof qimen.getQimenErrorStatus, 'function');

    const validationError = new qimen.QimenValidationError('bad input', {
        code: 'INVALID_METHOD',
        field: 'method'
    });
    assert.equal(qimen.getQimenErrorStatus(validationError), 400);
    assert.equal(qimen.getQimenErrorStatus(new Error('unexpected')), 500);
});
