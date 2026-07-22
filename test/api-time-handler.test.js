const assert = require('node:assert/strict');
const test = require('node:test');

const APITimeHandler = require('../lib/api-time-handler');

test('API datetime 與 timezone 不會把 15 時重複位移', () => {
    const result = APITimeHandler.generateQimenDateTime({
        datetime: '2026-01-20T15:00:00',
        timezone: '+08:00'
    });

    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth() + 1, 1);
    assert.equal(result.getDate(), 20);
    assert.equal(result.getHours(), 15);
});

test('API 時間驗證拒絕不可能的日曆日期並提供錯誤 metadata', () => {
    const result = APITimeHandler.validateTimeParams({
        datetime: '2026-02-30T15:00:00',
        timezone: '+08:00'
    });

    assert.equal(result.valid, false);
    assert.equal(result.code, 'INVALID_DATETIME');
    assert.equal(result.field, 'datetime');
});

test('API 時間驗證拒絕超出範圍的 timezone', () => {
    const result = APITimeHandler.validateTimeParams({
        datetime: '2026-01-20T15:00:00',
        timezone: '+15:00'
    });

    assert.equal(result.valid, false);
    assert.equal(result.code, 'INVALID_TIMEZONE');
    assert.equal(result.field, 'timezone');
});

test('API 時間驗證保留既有 valid 與 errors response shape', () => {
    assert.deepEqual(
        APITimeHandler.validateTimeParams({
            datetime: '2026-01-20T15:00:00',
            timezone: '+08:00'
        }),
        { valid: true, errors: [] }
    );
});
