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

module.exports = {
    CivilTimeValidationError,
    parseCivilTime
};
