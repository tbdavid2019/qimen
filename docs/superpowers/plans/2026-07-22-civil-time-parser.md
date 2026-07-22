# Civil Time Parser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route every Qimen and Meihua server calculation through one host-timezone-independent civil-time parser while preserving existing API request formats.

**Architecture:** Add a pure `lib/civil-time.js` module that converts ISO civil fields or epoch-plus-offset inputs into the local `Date` fields consumed by existing calculators. Keep `APITimeHandler` as a compatibility facade, replace duplicated parsing in Express routes, and verify HTTP behavior by starting the real app in a child process.

**Tech Stack:** CommonJS, Node.js built-in test runner/assert/fetch/child_process, Express 4, lunar-javascript, Vercel Git deployment

---

### Task 1: Build the civil-time parser with TDD

**Files:**
- Create: `test/civil-time.test.js`
- Create: `lib/civil-time.js`

- [ ] **Step 1: Write failing parser contract tests**

Create tests that import `parseCivilTime` and `CivilTimeValidationError`, assert local date fields through a helper, and cover these exact cases:

```js
assertCivilFields(
    parseCivilTime({ datetime: '2026-01-20T15:30:45', timezone: '+08:00' }),
    [2026, 1, 20, 15, 30, 45]
);

assertCivilFields(
    parseCivilTime({ timestamp: Date.UTC(2026, 0, 20, 7, 30), timezoneOffset: -480 }),
    [2026, 1, 20, 15, 30, 0]
);

assertCivilFields(parseCivilTime({
    userDateTime: '2026-01-20T15:00:00',
    datetime: '2025-02-03T04:05:06',
    timestamp: 0
}), [2026, 1, 20, 15, 0, 0]);

assertCivilFields(
    parseCivilTime({ date: '2024-02-29', time: '23:59' }),
    [2024, 2, 29, 23, 59, 0]
);

assert.throws(
    () => parseCivilTime({ datetime: '2026-02-30T15:00:00' }),
    error => error instanceof CivilTimeValidationError
        && error.code === 'INVALID_DATETIME'
        && error.field === 'datetime'
);
```

Also assert `INVALID_TIMESTAMP`, `INVALID_TIMEZONE_OFFSET`, `INVALID_TIMEZONE`, and that a partial `date`/`time` pair preserves the existing fallback-to-`now` behavior.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/civil-time.test.js`

Expected: FAIL because `../lib/civil-time` does not exist.

- [ ] **Step 3: Implement the minimal parser**

Implement and export this interface:

```js
class CivilTimeValidationError extends Error {
    constructor(message, { code, field }) {
        super(message);
        this.name = 'CivilTimeValidationError';
        this.statusCode = 400;
        this.code = code;
        this.field = field;
    }
}

function parseCivilTime(input = {}, { now = new Date() } = {}) {
    if (input.userDateTime) return parseCivilDateTime(input.userDateTime, 'userDateTime', input.timezone);
    if (input.datetime) return parseCivilDateTime(input.datetime, 'datetime', input.timezone);
    if (input.date !== undefined || input.time !== undefined) return parseDateAndTime(input.date, input.time);
    if (input.timestamp !== undefined && input.timestamp !== null && input.timestamp !== '') {
        return parseEpochTime(input.timestamp, input.timezoneOffset, input.timezone);
    }
    return civilTimeFromInstant(now, input.timezoneOffset, input.timezone);
}

module.exports = { CivilTimeValidationError, parseCivilTime };
```

Use one strict ISO regex, validate calendar rollover by comparing every constructed local field, accept millisecond epoch values only, validate browser offsets within `-840..840`, and validate API offsets no further than `±14:00`. For timestamp conversion, use `timestamp - timezoneOffset * 60000` for browser offsets and `timestamp + apiOffsetMinutes * 60000` for API offsets, read the shifted instant with UTC getters, then construct the local civil `Date`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test test/civil-time.test.js`

Expected: all civil-time tests pass in the default timezone.

- [ ] **Step 5: Prove host-timezone independence**

Run: `TZ=UTC node --test test/civil-time.test.js`

Expected: the same tests pass with identical asserted civil fields.

### Task 2: Make APITimeHandler a compatibility facade

**Files:**
- Create: `test/api-time-handler.test.js`
- Modify: `lib/api-time-handler.js`

- [ ] **Step 1: Write failing compatibility tests**

Test that `generateQimenDateTime({ datetime: '2026-01-20T15:00:00', timezone: '+08:00' })` has local hour 15, not 23; test that `validateTimeParams` returns invalid for `+15:00` and February 30; test that valid input remains valid.

```js
const result = APITimeHandler.generateQimenDateTime({
    datetime: '2026-01-20T15:00:00',
    timezone: '+08:00'
});
assert.equal(result.getHours(), 15);
assert.equal(APITimeHandler.validateTimeParams({
    datetime: '2026-02-30T15:00:00',
    timezone: '+08:00'
}).valid, false);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/api-time-handler.test.js`

Expected: at least the 15:00 preservation or strict calendar/timezone validation assertion fails against the current double-shift implementation.

- [ ] **Step 3: Delegate generation and validation**

Import `parseCivilTime` and `CivilTimeValidationError`. Replace `generateQimenDateTime` with `return parseCivilTime(apiParams)`. Implement `validateTimeParams` by calling `parseCivilTime` with a fixed `now` and returning the existing `{ valid, errors }` shape:

```js
static validateTimeParams(params) {
    try {
        parseCivilTime(params, { now: new Date(2000, 0, 1, 0, 0, 0) });
        return { valid: true, errors: [] };
    } catch (error) {
        if (error instanceof CivilTimeValidationError) {
            return { valid: false, errors: [error.message], code: error.code, field: error.field };
        }
        throw error;
    }
}
```

Keep `formatTimeInfo` and `getSystemTimezone` response fields unchanged. Remove the private duplicate adjustment formula; retain `adjustTimezone` only as a compatibility wrapper around timestamp-plus-timezone parsing.

- [ ] **Step 4: Run parser and facade tests**

Run: `node --test test/civil-time.test.js test/api-time-handler.test.js`

Expected: all tests pass.

### Task 3: Route every HTTP calculation through the parser

**Files:**
- Create: `test/api-time-routes.test.js`
- Modify: `app.js`

- [ ] **Step 1: Write failing real-server API tests**

Use `node:child_process` to spawn `node app.js` with an available loopback port, `TZ=UTC`, `LLM_API_KEY=''`, and `DISCORD_WEBHOOK_URL=''`. Wait for the startup line, use built-in `fetch`, and always terminate the child in `after()`.

Assert these boundaries:

```js
const valid = await fetch(`${baseUrl}/api/qimen?date=2026-01-20&time=15:00&timePrecisionMode=traditional`);
assert.equal(valid.status, 200);
assert.match((await valid.json()).basicInfo.date, /15:00:00/);

const partial = await fetch(`${baseUrl}/api/qimen?date=2026-01-20`);
assert.equal(partial.status, 200);

const impossible = await fetch(`${baseUrl}/api/qimen?date=2026-02-30&time=15:00`);
assert.equal(impossible.status, 400);
assert.equal((await impossible.json()).code, 'INVALID_DATETIME');

const invalidQuestionTime = await fetch(`${baseUrl}/api/qimen-question`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: '測試', datetime: '2026-02-30T15:00:00', timezone: '+08:00' })
});
assert.equal(invalidQuestionTime.status, 400);
assert.equal((await invalidQuestionTime.json()).code, 'INVALID_DATETIME');
```

Add equivalent invalid-time assertions for `/api/meihua/qigua`, `/api/llm-analysis`, and `/api/meihua-question`. These requests must stop at validation and never contact LLM or Discord services.

- [ ] **Step 2: Run the route test and verify RED**

Run: `node --test test/api-time-routes.test.js`

Expected: FAIL because impossible calendar dates currently roll into the next month and existing validation responses omit the stable code/field contract.

- [ ] **Step 3: Replace duplicated route parsing**

Import the parser:

```js
const { CivilTimeValidationError, parseCivilTime } = require('./lib/civil-time');

function getHttpErrorStatus(error) {
    return error && error.statusCode === 400 ? 400 : 500;
}
```

Use `parseCivilTime(req.query)` in `/`; `parseCivilTime({ date: dateStr, time: timeStr })` in `/custom` and `/api/qimen`; pass the existing request-body fields to it in `/api/meihua/qigua` and `/api/llm-analysis`; and rely on the delegated `APITimeHandler.generateQimenDateTime` in both question APIs.

Move parsing inside each route's `try` boundary. Replace Qimen-only status mapping with `getHttpErrorStatus`. For a `CivilTimeValidationError`, JSON responses include `code` and `field`, preserve an existing `success: false` field where applicable, and do not attach an LLM fallback.

- [ ] **Step 4: Run the route test and verify GREEN**

Run: `node --test test/api-time-routes.test.js`

Expected: all HTTP assertions pass and the child server exits cleanly.

- [ ] **Step 5: Run the complete suite in two host timezones**

Run: `npm test`

Run: `TZ=UTC npm test`

Expected: both commands pass with no leaked server process or external-service call.

### Task 4: Document, verify, and deploy

**Files:**
- Modify: `docs/2026-07-22-refactoring-todo.md`
- Modify: `docs/changelog.md`
- Modify: `docs/superpowers/plans/2026-07-22-civil-time-parser.md`

- [ ] **Step 1: Record the completed P1 time-parser work**

Mark the single time/timezone parser item complete. Record exact test totals, both timezone runs, syntax checks, audit result, and production HTTP evidence in the changelog.

- [ ] **Step 2: Run final local verification**

Run:

```bash
node --check app.js
node --check lib/civil-time.js
node --check lib/api-time-handler.js
npm audit --audit-level=low
git diff --check
```

Expected: every command exits 0 and npm reports 0 vulnerabilities.

- [ ] **Step 3: Commit and push only intended files**

Stage the parser, handler, app routes, tests, TODO, changelog, design amendment, and this plan. Commit with `fix: unify civil time parsing`, then push `origin main`.

- [ ] **Step 4: Verify production API behavior**

Verify `https://qi.david888.com` after deployment:

- fixed `GET /api/qimen?date=2026-01-20&time=15:00&timePrecisionMode=traditional` returns 200, `basicInfo.date` contains `15:00:00`, and the chart has nine palaces;
- a date without time preserves the existing successful fallback behavior;
- an impossible date/time pair returns 400 with `code: "INVALID_DATETIME"`;
- invalid Qimen question datetime returns 400 with `code: "INVALID_DATETIME"` before any LLM call;
- the homepage with a fixed `userDateTime` renders HTTP 200.
