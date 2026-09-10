const CIVIL_DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))?$/;
const API_TIMEZONE_PATTERN = /^([+-])(\d{2}):(\d{2})$/;

class CivilTimeValidationError extends Error {
    constructor(message, { code, field }) {
        super(message);
        this.name = 'CivilTimeValidationError';
        this.statusCode = 400;
        this.code = code;
        this.field = field;
    }
}

function hasValue(value) {
    return value !== undefined && value !== null && value !== '';
}

function validationError(message, code, field) {
    return new CivilTimeValidationError(message, { code, field });
}

function parseApiTimezone(timezone) {
    const match = typeof timezone === 'string' ? timezone.match(API_TIMEZONE_PATTERN) : null;
    if (!match) {
        throw validationError('timezone 格式無效，應為 ±HH:MM 格式 (如 +08:00)', 'INVALID_TIMEZONE', 'timezone');
    }

    const hours = Number(match[2]);
    const minutes = Number(match[3]);
    if (minutes > 59 || hours > 14 || (hours === 14 && minutes !== 0)) {
        throw validationError('timezone 超出支援範圍', 'INVALID_TIMEZONE', 'timezone');
    }

    const totalMinutes = hours * 60 + minutes;
    return match[1] === '+' ? totalMinutes : -totalMinutes;
}

function parseBrowserOffset(timezoneOffset) {
    const numericOffset = typeof timezoneOffset === 'number'
        ? timezoneOffset
        : (typeof timezoneOffset === 'string' && /^-?\d+$/.test(timezoneOffset)
            ? Number(timezoneOffset)
            : Number.NaN);

    if (!Number.isInteger(numericOffset) || numericOffset < -840 || numericOffset > 840) {
        throw validationError('timezoneOffset 必須是 -840 到 840 之間的整數分鐘', 'INVALID_TIMEZONE_OFFSET', 'timezoneOffset');
    }

    return numericOffset;
}

function buildLocalDate(parts, field) {
    const [year, month, day, hour, minute, second, millisecond] = parts;
    const date = new Date(year, month - 1, day, hour, minute, second, millisecond);
    const actual = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    ];

    if (Number.isNaN(date.getTime()) || actual.some((value, index) => value !== parts[index])) {
        throw validationError(`${field} 格式無效`, 'INVALID_DATETIME', field);
    }

    return date;
}

function parseCivilDateTime(value, field, timezone) {
    if (hasValue(timezone)) {
        parseApiTimezone(timezone);
    }

    const match = typeof value === 'string' ? value.match(CIVIL_DATETIME_PATTERN) : null;
    if (!match) {
        throw validationError(`${field} 格式無效`, 'INVALID_DATETIME', field);
    }

    if (match[8] && match[8] !== 'Z') {
        parseApiTimezone(match[8]);
    }

    const parts = [
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6] || 0),
        Number((match[7] || '').padEnd(3, '0') || 0)
    ];

    return buildLocalDate(parts, field);
}

function parseEpoch(timestamp) {
    const numericTimestamp = typeof timestamp === 'number'
        ? timestamp
        : (typeof timestamp === 'string' && /^-?\d+$/.test(timestamp)
            ? Number(timestamp)
            : Number.NaN);

    if (!Number.isSafeInteger(numericTimestamp) || Number.isNaN(new Date(numericTimestamp).getTime())) {
        throw validationError('timestamp 必須是有效的毫秒整數', 'INVALID_TIMESTAMP', 'timestamp');
    }

    return numericTimestamp;
}

function buildLocalDateFromUtcFields(date) {
    return buildLocalDate([
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
    ], 'timestamp');
}

function civilTimeFromInstant(instant, timezoneOffset, timezone) {
    if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
        throw validationError('timestamp 必須是有效的毫秒整數', 'INVALID_TIMESTAMP', 'timestamp');
    }

    let shiftMinutes = null;
    if (hasValue(timezoneOffset)) {
        shiftMinutes = -parseBrowserOffset(timezoneOffset);
    } else if (hasValue(timezone)) {
        shiftMinutes = parseApiTimezone(timezone);
    }

    if (shiftMinutes === null) {
        return new Date(instant.getTime());
    }

    return buildLocalDateFromUtcFields(new Date(instant.getTime() + shiftMinutes * 60000));
}

function parseCivilTime(input = {}, { now = new Date() } = {}) {
    if (hasValue(input.userDateTime)) {
        return parseCivilDateTime(input.userDateTime, 'userDateTime', input.timezone);
    }
    if (hasValue(input.datetime)) {
        return parseCivilDateTime(input.datetime, 'datetime', input.timezone);
    }
    if (hasValue(input.date) && hasValue(input.time)) {
        return parseCivilDateTime(`${input.date}T${input.time}`, 'datetime', input.timezone);
    }
    if (hasValue(input.timestamp)) {
        const timestamp = parseEpoch(input.timestamp);
        return civilTimeFromInstant(new Date(timestamp), input.timezoneOffset, input.timezone);
    }
    return civilTimeFromInstant(now, input.timezoneOffset, input.timezone);
}

function normalizeDateBoundary(dateInput, options = {}) {
    const boundary = options.boundary || 'start';
    const precision = options.precision || 'millisecond';
    const timezone = options.timezone;

    if (!hasValue(dateInput)) {
        throw validationError('請提供有效的日期', 'MISSING_DATE', 'date');
    }

    let year, month, day;

    if (typeof dateInput === 'string') {
        const trimmed = dateInput.trim();
        const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateMatch) {
            year = Number(dateMatch[1]);
            month = Number(dateMatch[2]);
            day = Number(dateMatch[3]);
            // 檢查日曆有效性（例如 2026-02-30）
            buildLocalDate([year, month, day, 0, 0, 0, 0], 'date');
        } else {
            const parsedDate = parseCivilDateTime(trimmed, 'date', timezone);
            year = parsedDate.getFullYear();
            month = parsedDate.getMonth() + 1;
            day = parsedDate.getDate();
        }
    } else if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
        year = dateInput.getFullYear();
        month = dateInput.getMonth() + 1;
        day = dateInput.getDate();
    } else if (typeof dateInput === 'number' || (typeof dateInput === 'string' && /^-?\d+$/.test(dateInput))) {
        const instant = civilTimeFromInstant(new Date(parseEpoch(dateInput)), options.timezoneOffset, timezone);
        year = instant.getFullYear();
        month = instant.getMonth() + 1;
        day = instant.getDate();
    } else {
        throw validationError('日期格式無效', 'INVALID_DATE', 'date');
    }

    if (boundary === 'start') {
        return buildLocalDate([year, month, day, 0, 0, 0, 0], 'date');
    } else if (boundary === 'end') {
        const ms = precision === 'second' ? 0 : 999;
        return buildLocalDate([year, month, day, 23, 59, 59, ms], 'date');
    } else if (boundary === 'next_day_start') {
        return new Date(year, month - 1, day + 1, 0, 0, 0, 0);
    } else {
        throw validationError(`未知的邊界類型: ${boundary}，有效值為 start, end, next_day_start`, 'INVALID_BOUNDARY', 'boundary');
    }
}

function parseDateRange(input = {}, options = {}) {
    const rawStart = input.startDate || input.start || input.from || input.dateFrom || input.date1 || options.startDate || options.start;
    const rawEnd = input.endDate || input.end || input.to || input.dateTo || input.date2 || options.endDate || options.end;
    const timezone = input.timezone || options.timezone;
    const precision = input.precision || options.precision || 'millisecond';

    if (!hasValue(rawStart)) {
        throw validationError('請提供開始日期 (startDate 或 from)', 'MISSING_START_DATE', 'startDate');
    }
    if (!hasValue(rawEnd)) {
        throw validationError('請提供結束日期 (endDate 或 to)', 'MISSING_END_DATE', 'endDate');
    }

    const startDateObj = normalizeDateBoundary(rawStart, { boundary: 'start', timezone, precision });
    const endInclusiveDateObj = normalizeDateBoundary(rawEnd, { boundary: 'end', timezone, precision });
    const endExclusiveDateObj = normalizeDateBoundary(rawEnd, { boundary: 'next_day_start', timezone });

    if (startDateObj.getTime() > endInclusiveDateObj.getTime()) {
        throw validationError('開始日期不能晚於結束日期', 'INVALID_DATE_RANGE', 'endDate');
    }

    const pad = (n, len = 2) => String(n).padStart(len, '0');
    const formatYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const formatIso = (d, ms = true) => `${formatYmd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${ms ? '.' + pad(d.getMilliseconds(), 3) : ''}`;

    const startDateStr = formatYmd(startDateObj);
    const endDateStr = formatYmd(endInclusiveDateObj);
    const startIso = formatIso(startDateObj, precision === 'millisecond');
    const endInclusiveIso = formatIso(endInclusiveDateObj, precision === 'millisecond');
    const endExclusiveIso = formatIso(endExclusiveDateObj, precision === 'millisecond');

    const startMidnightEpoch = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate()).getTime();
    const endMidnightEpoch = new Date(endInclusiveDateObj.getFullYear(), endInclusiveDateObj.getMonth(), endInclusiveDateObj.getDate()).getTime();
    const days = Math.round((endMidnightEpoch - startMidnightEpoch) / 86400000) + 1;

    return {
        startDate: startDateStr,
        endDate: endDateStr,
        startDateTime: startIso,
        endDateTimeInclusive: endInclusiveIso,
        endDateTimeExclusive: endExclusiveIso,
        days,
        startEpoch: startDateObj.getTime(),
        endInclusiveEpoch: endInclusiveDateObj.getTime(),
        endExclusiveEpoch: endExclusiveDateObj.getTime(),
        precision,
        timezone: timezone || null,
        sql: {
            betweenInclusive: `BETWEEN '${formatIso(startDateObj, false)}' AND '${formatIso(endInclusiveDateObj, false)}'`,
            halfOpen: `>= '${formatIso(startDateObj, false)}' AND < '${formatIso(endExclusiveDateObj, false)}'`
        },
        mongo: {
            inclusive: { $gte: startDateObj, $lte: endInclusiveDateObj },
            halfOpen: { $gte: startDateObj, $lt: endExclusiveDateObj }
        },
        contains(testDate) {
            let target;
            if (testDate instanceof Date) {
                target = testDate.getTime();
            } else if (typeof testDate === 'number') {
                target = testDate;
            } else if (typeof testDate === 'string') {
                try {
                    target = parseCivilTime({ datetime: testDate, timezone }).getTime();
                } catch {
                    return false;
                }
            } else {
                return false;
            }
            return target >= startDateObj.getTime() && target <= endInclusiveDateObj.getTime();
        },
        midnightBoundaryResolved: true,
        summary: `區間 ${startDateStr} 至 ${endDateStr}（共 ${days} 天），午夜邊界已校正：結束時刻為 ${endInclusiveIso}（或 < ${endExclusiveIso}）`
    };
}

module.exports = {
    CivilTimeValidationError,
    parseCivilTime,
    normalizeDateBoundary,
    parseDateRange
};

