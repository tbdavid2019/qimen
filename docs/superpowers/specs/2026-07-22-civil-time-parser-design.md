# Civil Time Parser Design

## Goal

Make every Qimen and Meihua calculation use the user's local civil time consistently, regardless of whether Node.js runs in Asia/Taipei locally or UTC on Vercel.

For example, `datetime: "2026-01-20T15:00:00"` with `timezone: "+08:00"` must always produce a chart for 15:00 in that locality. It must not silently become 07:00 or 23:00.

## Problem

Time parsing is currently duplicated across the homepage, Qimen API, Meihua API, LLM fallback calculation, Qimen question API, and Meihua question API. The implementations use different combinations of `new Date(string)`, server timezone offsets, browser `timezoneOffset`, and production-only adjustments.

This creates three risks:

- The same request can produce different chart hours locally and on Vercel.
- A datetime may be shifted twice when a timezone is also supplied.
- Fixing one route leaves other calculation routes unchanged.

The frontend also has separate 5-minute and 10-minute expiry rules. That inconsistency is related but remains outside this change so the server-side contract can be stabilized first.

## Chosen Approach

Create `lib/civil-time.js` as the single server-side boundary for converting request parameters into the wall-clock `Date` consumed by the existing calculation libraries.

The calculation code currently reads local `Date` fields. Therefore the parser will create a `Date` whose local year, month, day, hour, minute, and second equal the requested civil time. The underlying epoch may differ between hosts, but the fields used for Qimen and Meihua calculations remain identical.

This is intentionally narrower than rewriting the calculation engine to use UTC fields or introducing a timezone library. Those approaches touch substantially more code and are not required to stabilize current behavior.

## Public Interface

The module exports:

```js
parseCivilTime({
    userDateTime,
    datetime,
    timestamp,
    timezoneOffset,
    timezone
}, { now })
```

`now` is an optional `Date` used by tests. Production callers omit it.

It also exports `CivilTimeValidationError`, which has:

- `name: "CivilTimeValidationError"`
- `statusCode: 400`
- a stable machine-readable `code`
- the invalid `field`

## Input Semantics

The parser uses this precedence, preserving current public behavior:

1. `userDateTime`
2. `datetime`
3. `timestamp`
4. current time

Only the selected time source and the timezone metadata that applies to it are parsed. Lower-priority values are ignored, matching the existing precedence behavior. For example, a valid `userDateTime` is not rejected because an unused `timestamp` is malformed.

### Civil datetime strings

`userDateTime` and `datetime` represent the civil clock fields written in the string. `2026-01-20T15:00:00+08:00` therefore means 15:00 at `+08:00`, and `2026-01-20T15:00:00Z` means 15:00 at UTC. The parser preserves the literal 15:00 fields instead of allowing the host timezone to shift them.

Accepted strings use ISO calendar and time fields: `YYYY-MM-DDTHH:mm`, optionally seconds, milliseconds, and a trailing `Z` or `±HH:MM`. Calendar values must form a real date; rollover values such as February 30 are rejected.

When a separate `timezone` is supplied with a civil datetime, it is validated and retained as request context but does not shift the clock a second time.

### Epoch timestamps

`timestamp` is an epoch value in milliseconds. It identifies an instant, so the parser converts it to civil clock fields using the supplied browser-style `timezoneOffset` (`Date#getTimezoneOffset`, in minutes) or API-style `timezone` (`±HH:MM`).

If both offset forms are present for a timestamp, `timezoneOffset` takes precedence because it came from the browser that created the timestamp.

### Current time

When no explicit date is provided, the parser starts from `now`. If a timezone offset is supplied, it converts that instant to the corresponding civil fields. Without an offset it uses the server's local fields, preserving the current fallback behavior.

## Validation

The parser rejects rather than guesses when a supplied value is malformed:

- Invalid or impossible civil datetime: `INVALID_DATETIME`
- Non-finite or non-integer millisecond timestamp: `INVALID_TIMESTAMP`
- Invalid browser offset or offset outside `-840..840` minutes: `INVALID_TIMEZONE_OFFSET`
- Invalid API timezone or an offset beyond `±14:00`: `INVALID_TIMEZONE`

Missing optional values are not errors. A missing time falls back to the current time.

## Route Integration

All server-side calculation entry points will delegate time creation to `parseCivilTime`:

- `/`
- `/custom`
- `/api/qimen`
- `/api/meihua/qigua`
- `/api/llm-analysis` when it must calculate a chart
- `/api/qimen-question`
- `/api/meihua-question`

`lib/api-time-handler.js` will delegate its date generation and validation to the same module so existing callers and response formatting remain compatible.

HTML routes return HTTP 400 text for `CivilTimeValidationError`. JSON routes return HTTP 400 with `message`, `code`, and `field`. Unexpected failures remain HTTP 500. Successful response shapes and existing parameter names remain unchanged.

## API Compatibility Contract

Existing API clients must not need to change their request format:

| Endpoint | Existing time inputs retained | Parser mapping |
| --- | --- | --- |
| `GET /api/qimen` | `date=YYYY-MM-DD`, `time=HH:mm[:ss]` | Combine into `datetime`, then parse as civil time |
| `POST /api/meihua/qigua` | `userDateTime`, `datetime`, `timestamp`, `timezoneOffset` | Pass through with the documented precedence |
| `POST /api/llm-analysis` | `qimenData`, or `userDateTime`, `timestamp`, `timezoneOffset` | Parse only when `qimenData` is absent and the server must recalculate |
| `POST /api/qimen-question` | `datetime`, `timezone`, `mode` | Parse `datetime` as civil time; validate `timezone` without double shifting |
| `POST /api/meihua-question` | `datetime`, `timezone` | Use the same behavior as Qimen question requests |

The homepage and `/custom` route remain compatible with their current query parameters. `/custom` continues accepting separate `date` and `time` values and maps them to the same parser.

For `/custom` and `GET /api/qimen`, `date` and `time` form one input and must either both be present or both be absent. Supplying only one returns HTTP 400 instead of silently calculating the current time. Existing clients that supply both values or neither value remain compatible.

For JSON endpoints, malformed supplied time data returns a stable structure while preserving endpoint-specific fields such as `success` where they already exist:

```json
{
  "error": "參數驗證失敗",
  "message": "datetime 格式無效",
  "code": "INVALID_DATETIME",
  "field": "datetime"
}
```

The parser performs no network calls and has no API-specific side effects. This keeps it reusable by HTTP routes, MCP scripts, and future integrations.

## Testing

Tests will be written before production changes and will cover:

- A `15:00 +08:00` civil datetime remains 15:00.
- A timestamp plus browser offset resolves to the matching local civil fields.
- Precedence remains `userDateTime > datetime > timestamp > now`.
- Leap days work and impossible dates fail.
- Invalid timestamp and timezone formats expose stable error metadata.
- Existing `APITimeHandler` behavior delegates to the shared parser.
- The complete test suite passes with both the normal environment and `TZ=UTC`.
- After deployment, production Qimen endpoints return the same chart time for fixed civil input and return HTTP 400 for malformed input.

## Non-goals

- Rewriting Qimen or Meihua calculations around UTC getters.
- Adding a third-party datetime library.
- Changing public request parameter names or successful response shapes.
- Consolidating the frontend's 5-minute and 10-minute refresh rules.
- Refactoring request-local i18n or splitting the Express app factory.
