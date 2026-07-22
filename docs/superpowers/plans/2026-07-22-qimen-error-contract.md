# Qimen Error Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace silent Qimen calculation failures with typed validation errors and correct HTTP status codes.

**Architecture:** Validate domain inputs inside `lib/qimen.js`, the boundary shared by web, API, LLM, MCP, and scripts. Route handlers use a small status helper to map validation errors to 400 while preserving 500 for unexpected failures.

**Tech Stack:** CommonJS, Node.js test runner, Express 4, Vercel Git deployment

---

### Task 1: Add failing core contract tests

**Files:**
- Modify: `test/qimen.test.js`

- [x] Assert that an invalid `Date` throws `QimenValidationError` with `code: INVALID_DATE` and `field: date`.
- [x] Assert that an unsupported method throws with `code: INVALID_METHOD` and `field: method`.
- [x] Assert that an unsupported precision mode throws with `code: INVALID_TIME_PRECISION_MODE` and `field: timePrecisionMode`.
- [x] Run `node --test test/qimen.test.js`; require the new tests to fail because the current function returns or accepts invalid values.

### Task 2: Implement the core error contract

**Files:**
- Modify: `lib/qimen.js`
- Test: `test/qimen.test.js`

- [x] Add and export `QimenValidationError`.
- [x] Add `validateCalculationInput(date, options)` and call it before calculation work.
- [x] Replace the catch block's error-object return with `throw e`.
- [x] Run `node --test test/qimen.test.js`; require all core tests to pass.

### Task 3: Map validation errors at HTTP boundaries

**Files:**
- Modify: `app.js`

- [x] Add `getQimenErrorStatus(error)` returning 400 for `QimenValidationError` and 500 otherwise.
- [x] Use the helper in `/`, `/custom`, `/api/qimen`, `/api/llm-analysis`, and `/api/qimen-question` calculation error paths.
- [x] Validate the `/` route date before calling `toISOString()` so malformed query values return 400.

### Task 4: Verify and publish

**Files:**
- Modify: `docs/2026-07-22-refactoring-todo.md`
- Modify: `docs/changelog.md`

- [x] Run `npm test` and `TZ=UTC npm test`.
- [x] Run syntax checks, `npm audit --audit-level=low`, and `git diff --check`.
- [x] Update TODO and changelog with the new contract and evidence.
- [ ] Commit only intended files and push `main`.
- [ ] Verify production valid requests return 200 and invalid method/precision requests return 400.
