const assert = require('node:assert/strict');
const test = require('node:test');

const { CivilTimeValidationError, parseCivilTime } = require('../lib/civil-time');

function assertCivilFields(date, expected) {
    assert.deepEqual([
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    ], expected.length === 7 ? expected : [...expected, 0]);
}

function assertTimeError(action, { code, field }) {
    assert.throws(action, (error) => {
        assert.ok(error instanceof CivilTimeValidationError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, code);
        assert.equal(error.field, field);
        return true;
    });
}

test('帶 API 時區的民用時間保持原本 15 時，不重複位移', () => {
    const result = parseCivilTime({
        datetime: '2026-01-20T15:30:45',
        timezone: '+08:00'
    });

    assertCivilFields(result, [2026, 1, 20, 15, 30, 45]);
});

test('ISO 字串內的 offset 不改變其民用時間欄位', () => {
    const result = parseCivilTime({ datetime: '2026-01-20T15:30:45+08:00' });

    assertCivilFields(result, [2026, 1, 20, 15, 30, 45]);
});

test('timestamp 搭配瀏覽器 timezoneOffset 轉成使用者民用時間', () => {
    const result = parseCivilTime({
        timestamp: Date.UTC(2026, 0, 20, 7, 30),
        timezoneOffset: -480
    });

    assertCivilFields(result, [2026, 1, 20, 15, 30, 0]);
});

test('timestamp 搭配 API timezone 轉成所在地民用時間', () => {
    const result = parseCivilTime({
        timestamp: Date.UTC(2026, 0, 20, 7, 30),
        timezone: '+08:00'
    });

    assertCivilFields(result, [2026, 1, 20, 15, 30, 0]);
});

test('時間來源維持 userDateTime 優先於 datetime 與 timestamp', () => {
    const result = parseCivilTime({
        userDateTime: '2026-01-20T15:00:00',
        datetime: '2025-02-03T04:05:06',
        timestamp: 0
    });

    assertCivilFields(result, [2026, 1, 20, 15, 0, 0]);
});

test('date 與 time 組合支援真實閏日', () => {
    const result = parseCivilTime({ date: '2024-02-29', time: '23:59' });

    assertCivilFields(result, [2024, 2, 29, 23, 59, 0]);
});

test('只有 date 或 time 時維持既有 fallback 到目前時間', () => {
    const now = new Date(2026, 6, 22, 9, 8, 7, 6);

    assertCivilFields(parseCivilTime({ date: '2024-02-29' }, { now }), [2026, 7, 22, 9, 8, 7, 6]);
    assertCivilFields(parseCivilTime({ time: '23:59' }, { now }), [2026, 7, 22, 9, 8, 7, 6]);
});

test('不可能的日期回傳穩定驗證錯誤', () => {
    assertTimeError(
        () => parseCivilTime({ datetime: '2026-02-30T15:00:00' }),
        { code: 'INVALID_DATETIME', field: 'datetime' }
    );
});

test('非法 timestamp 回傳穩定驗證錯誤', () => {
    assertTimeError(
        () => parseCivilTime({ timestamp: 'not-a-timestamp' }),
        { code: 'INVALID_TIMESTAMP', field: 'timestamp' }
    );
});

test('非法瀏覽器 offset 回傳穩定驗證錯誤', () => {
    assertTimeError(
        () => parseCivilTime({ timestamp: 0, timezoneOffset: 900 }),
        { code: 'INVALID_TIMEZONE_OFFSET', field: 'timezoneOffset' }
    );
});

test('非法 API timezone 回傳穩定驗證錯誤', () => {
    assertTimeError(
        () => parseCivilTime({ datetime: '2026-01-20T15:00:00', timezone: '+15:00' }),
        { code: 'INVALID_TIMEZONE', field: 'timezone' }
    );
});

test('午夜邊界：normalizeDateBoundary 正確校正 start, end, next_day_start', () => {
    const { normalizeDateBoundary } = require('../lib/civil-time');

    const start = normalizeDateBoundary('2026-09-09', { boundary: 'start' });
    assertCivilFields(start, [2026, 9, 9, 0, 0, 0, 0]);

    const endMs = normalizeDateBoundary('2026-09-09', { boundary: 'end', precision: 'millisecond' });
    assertCivilFields(endMs, [2026, 9, 9, 23, 59, 59, 999]);

    const endSec = normalizeDateBoundary('2026-09-09', { boundary: 'end', precision: 'second' });
    assertCivilFields(endSec, [2026, 9, 9, 23, 59, 59, 0]);

    const nextDay = normalizeDateBoundary('2026-09-09', { boundary: 'next_day_start' });
    assertCivilFields(nextDay, [2026, 9, 10, 0, 0, 0, 0]);
});

test('午夜邊界：9/1 ~ 9/9 區間計算必到 9/9 23:59:59.999 且次日排除', () => {
    const { parseDateRange } = require('../lib/civil-time');

    const range = parseDateRange({
        startDate: '2026-09-01',
        endDate: '2026-09-09'
    });

    assert.equal(range.startDate, '2026-09-01');
    assert.equal(range.endDate, '2026-09-09');
    assert.equal(range.startDateTime, '2026-09-01T00:00:00.000');
    assert.equal(range.endDateTimeInclusive, '2026-09-09T23:59:59.999');
    assert.equal(range.endDateTimeExclusive, '2026-09-10T00:00:00.000');
    assert.equal(range.days, 9);
    assert.equal(range.midnightBoundaryResolved, true);

    // 邊界判定
    assert.equal(range.contains('2026-09-01T00:00:00'), true);
    assert.equal(range.contains('2026-09-09T23:59:59'), true);
    assert.equal(range.contains(new Date(2026, 8, 9, 23, 59, 59, 999)), true);
    assert.equal(range.contains(new Date(2026, 8, 10, 0, 0, 0, 0)), false);
    assert.equal(range.contains('2026-08-31T23:59:59'), false);
});

test('午夜邊界：支援別名 from/to 與閏年轉換 (2024-02-28 ~ 2024-02-29)', () => {
    const { parseDateRange } = require('../lib/civil-time');

    const range = parseDateRange({
        from: '2024-02-28',
        to: '2024-02-29'
    });

    assert.equal(range.days, 2);
    assert.equal(range.endDateTimeExclusive, '2024-03-01T00:00:00.000');
});

test('午夜邊界：拒絕開始日期晚於結束日期', () => {
    const { parseDateRange } = require('../lib/civil-time');

    assertTimeError(
        () => parseDateRange({ startDate: '2026-09-10', endDate: '2026-09-09' }),
        { code: 'INVALID_DATE_RANGE', field: 'endDate' }
    );
});

