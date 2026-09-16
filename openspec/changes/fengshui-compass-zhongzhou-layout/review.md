# Independent Implementation Review — 2026-09-16

## Verdict

**Request changes.** The implementation adds substantial UI, API, data, CLI, and MCP surface area, but it does not yet satisfy the accepted OpenSpec contract. The change must not be archived or described as complete until the critical findings and required remediation tasks are closed.

This review modified OpenSpec artifacts only. No production code was changed.

## Review scope and verification

Reviewed:

- calculation and layout engine in [`lib/fengshui.js`](../../../lib/fengshui.js)
- HTTP validation/routes in [`app.js`](../../../app.js)
- Fengshui page state and result rendering in [`public/js/fengshui.js`](../../../public/js/fengshui.js), [`public/js/divination-suite.js`](../../../public/js/divination-suite.js), and [`views/fengshui.html`](../../../views/fengshui.html)
- WebMCP, official MCP, bridge, CLI/Skill, data registries, README, CHANGELOG, and changed tests

Verification performed:

- `npm test`: **160 passed, 0 failed**
- `openspec validate fengshui-compass-zhongzhou-layout --strict`: passed before review remediation was added; it must be rerun after this review update
- `node --check` on both changed browser scripts: syntax passed
- `npx biome check`: reported 4 errors, 53 warnings, and 25 infos across the reviewed files; notably `checkStability()` is unused
- deterministic Node/API probes reproduced substitute-chart parity, kitchen/stove conflation, ignored declination, invalid metadata acceptance, unrelated entry-path acceptance, misleading empty-input data quality, and CLI output mismatch
- `npm audit --omit=dev`: 3 moderate vulnerabilities in the existing Express/body-parser/qs chain; no dependency was added by this change, so this is recorded as FYI rather than a feature blocker

Browser DevTools/real-device tooling was not available in this review session. No repository evidence was found for the checked-off browser automation, deployed HTTPS sensor spike, or iOS/Android manual acceptance tasks.

## Critical findings

### C1. Fengshui result rendering crashes and expects a different response contract

[`public/js/divination-suite.js`](../../../public/js/divination-suite.js) reads undeclared `mountainStars` and `facingStars`. Repository-wide search finds no declaration, so a normal Yangzhai render reaches a `ReferenceError` before the result board completes.

The same renderer also reads fields that the server never returns:

- `report.orientation.chartQualification`, while qualification is returned as `report.chartQualification`
- `report.orientation.mountain`, while the backend returns `sittingMountain`
- `layoutEvaluation.overallRating`, `placedCount`, `entryPath`, `pathQuality`, `practicalActions`
- finding fields `level`, `description`, `recommendation`, and `classicalQuote`
- missing-data objects `{item,note}`, while the backend returns strings

Impact: the primary Web UI result path is broken even though all Node tests pass. This blocks merge.

Required acceptance:

- execute the actual renderer with a real `/api/fengshui/report` fixture
- assert zero console errors
- assert visible orientation, mountain/facing stars, findings, actions, quotes, and string missing-data entries

### C2. Default hidden heading breaks the legacy facing selector

The page initializes hidden `heading=180`; `getFengshuiLayoutPayload()` always emits that heading, even when the user never started, adjusted, or locked the compass. If the user changes only the legacy facing dropdown to 北/東/etc., the normal submit sends both the new facing and stale 180°, and the server returns `FACING_HEADING_CONFLICT`.

Reproduction: `POST /api/fengshui/report` with `{heading:180, headingSource:"manual", facing:"北", layoutObjects:{}}` returns 400.

Impact: backward compatibility promised by the proposal is broken for existing UI users. This blocks merge.

Required acceptance:

- omit `heading` until explicit compass/manual interaction or lock
- changing only the existing facing selector continues to succeed for all 8 directions and 24 pairs
- add an automated regression test for the actual form payload

### C3. A result marked 替卦 still uses the unchanged lower-gua chart

At 65°, `determineChartType()` returns `chartType: substitute`, replacement star 8, and a replacement rule ID. `calculateFengShui()` then calls the unchanged `calculateXuanKong24()` with only the derived pair; the substitute star never affects mountain/facing chart generation.

Probe result: the flying-star JSON for `{heading:65}` is byte-for-byte identical to the ordinary `申山寅向` lower-gua result (`substituteChangesChart: false`).

Impact: the system claims a classical substitute chart that it does not calculate. Under the repository's zero-placeholder requirement, this blocks merge.

Required acceptance:

- an approved substitute rule changes the appropriate chart inputs/output and has a golden fixture, or
- the result remains `candidate` and no substitute chart is claimed

## Important findings

### I1. True north, declination, and provenance are metadata only

`northReference`, `declination`, and `headingSource` are copied into the result without enum/finite validation. Declination does not adjust the heading. A request containing `northReference:"bogus"`, `headingSource:"bogus"`, and `declination:"bogus"` succeeds; a true-north request with +10° produces the same heading and mountain as magnetic north.

Required acceptance: validate the canonical enums and apply declination exactly once, or reject unsupported true-north conversion.

### I2. Kitchen-only input is treated as an actual stove

`evaluateZhongzhouLayout()` falls back from `appliance.stove` to `space.kitchen`. A layout containing only `space.kitchen` in 西北 triggers `stove-fire-heaven-gate-v1`, contradicting spec/task 1.7.

Required acceptance: kitchen-only input reports missing stove and never runs stove-specific rules.

### I3. Empty deterministic requests are reported as complete

`POST /api/fengshui/evaluate-layout` with `{}` returns HTTP 200, `layoutEvaluation:null`, `missingData:[]`, and `dataQuality:"complete"`.

Required acceptance: require a layout for this endpoint or return explicit insufficient data; `complete` requires a completed deterministic evaluation.

### I4. The versioned rule registry does not drive the evaluator

The implementation loads `zhongzhou-rules.json`, but `rules.rules` is never executed. Period-9 stars, conditions, titles, evidence, and actions are hard-coded in `evaluateZhongzhouLayout()`. Periods other than 9 therefore reuse 9/1/8 favorable-star assumptions. The JSON source string is not a reviewable bibliographic citation and has no per-rule fixtures or edition/page metadata.

Required acceptance: make the registry executable or make code the explicit source of truth, then add reviewed provenance and golden fixtures for every released rule.

### I5. Entry-path evidence is not connected to the door

Validation checks only palace membership and length. With a main door in 南 and `entryPath:["北","中"]`, the API emits a positive `door-entry-path-v1` finding for the unrelated path.

Required acceptance: path start must match the main-door palace; invalid/ambiguous paths are rejected or marked insufficient.

### I6. Sensor acceptance criteria are marked complete but are not implemented or evidenced

- the client calls `requestPermission()` rather than the specified absolute permission flow
- `checkStability()` is never called, and lock checks tilt only
- missing accuracy is displayed as `正常`
- the relative-orientation fallback can show “感測中” while all events are ignored
- no automated browser test or committed iOS/Android HTTPS acceptance record exists

Required acceptance: close task 7.10 and attach reproducible browser/real-device evidence before restoring task completion.

### I7. Nine-grid accessibility and snapshot requirements are incomplete

- the edit grid does not display period/mountain/facing star values
- cells have `tabindex` and `role=button` but no Enter/Space handler
- dynamic updates have no live-region announcement
- localStorage version is written but never checked
- corrupt/outdated snapshots are neither removed nor reported
- the 63-item catalog is duplicated manually in browser JS instead of using one source of truth

Required acceptance: satisfy tasks 7.9 and 7.11 with browser tests.

### I8. WebMCP/MCP/CLI/API contracts are not aligned

- WebMCP says trigram palace keys are accepted, while backend validation accepts direction keys only
- `layoutObjects` and `entryPath` schemas are unbounded and lack palace/object enums and `additionalProperties:false`
- `headingSource:preset` exists in Skill/MCP but not the canonical spec
- MCP/WebMCP reject negative wrapped headings while the core spec explicitly normalizes them
- no deterministic WebMCP/MCP tool was added although README advertises the endpoint for agents
- local CLI `evaluate-layout` calls `evaluateZhongzhouLayout()` without generating a chart, so star-based output is absent
- API Skill `ask_fengshui.js` was not updated; documented `--layout` and comma-separated `--entry-path` do not map to the required API payload

Required acceptance: define one machine-readable schema and prove parity with shared fixtures across every interface.

### I9. Test completion is overstated

Only `test/fengshui.test.js` and `test/service-question-routes.test.js` changed. There are no browser tests or new WebMCP/MCP/bridge parity tests. The test named “24山中心度數與坐向推導全覆蓋” checks four centers, while boundary classification checks only one small and one large boundary. No test proves every substitute rule, layout rule, quote, declination, kitchen-only behavior, empty payload, or result renderer.

Passing 160 tests therefore does not establish the acceptance criteria listed in tasks 5.1–5.6.

### I10. Documentation and cultural-safety claims need correction

README/CHANGELOG currently claim complete iOS/Android adaptation, 24-mountain dropdown fallback, precise classical citations, and completed test coverage. The UI dropdown contains only eight exact mountain pairs, sensor evidence is absent, and citations lack edition/page provenance.

New rules/quotes also include deterministic health/family harm language and commercial talisman prescriptions. This conflicts with the approved design and project guidance to avoid fear and present metaphysics as cultural interpretation with constructive practical actions.

### I11. Period label is hard-coded

`getPeriod()` now computes periods 1–9, but `profile.period` always renders `2024-2043`. A 1870 request returns `1運 (2024-2043)`.

Required acceptance: derive the display range from the actual period cycle and add historical/future range tests.

## Merge gate

Before approval:

1. Resolve C1–C3.
2. Resolve I1–I11 or explicitly narrow the release scope/spec without claiming the omitted behavior.
3. Complete tasks 7.1–7.15.
4. Add browser and real-device evidence.
5. Run `npm test`, schema/parity tests, browser tests, lint/check, and strict OpenSpec validation.
6. Re-review the resulting diff before archiving this change.

## Post-Luna review — 2026-09-16

Luna (`gpt-5.6-luna`) completed a focused remediation pass. Sol independently reran `npm test` and targeted pure-function probes.

Verified fixed:

- C2 core behavior: `heading` starts unset and the payload omits it until explicit sensor/manual interaction, preserving facing-only submission.
- C3: 65° is now `candidate` with `isSubstitute:false`; no completed substitute chart is claimed.
- I1: invalid north reference/source/declination are rejected, and the selected true-north correction changes the derived heading.
- I2: kitchen-only input reports missing stove and produces no stove finding.
- I3: missing/empty deterministic layout input is rejected or evaluated as insufficient rather than complete.
- I5: entry path must begin at the actual main-door palace.
- I11: period display range is derived from the requested cycle; 1870 reports `1運 (1864-1883)`.
- Verification: 161 Node tests passed; changed JavaScript syntax checks passed.

Still blocking completion:

1. **Renderer contract remains incomplete.** The undeclared variables and sitting-mountain field were repaired, but the UI still reads nonexistent `isVoid`, `categoryLabel`, `reason`, `overallRating`, `placedCount`, `layoutEvaluation.entryPath`, and `layoutEvaluation.pathQuality`. Void/candidate badges and evaluation summary therefore remain misleading or blank.
2. **Sensor stability is still disconnected.** `checkStability()` is declared but never called. `recentHeadings` remains empty, while lock requires at least three entries when listening, so a sensor-driven lock cannot become ready.
3. **Locking without a measurement is not guarded.** `heading` now begins as null, but the lock button remains active and `syncHiddenInputs()` can derive a facing from null/0° when locked. The manual-input path itself is now first-class and only emits a heading after explicit interaction.
4. I6–I11 remain substantially open: no browser/real-device evidence, duplicated catalog and weak snapshot recovery, missing editor stars/keyboard/live announcements, incomplete WebMCP/MCP/CLI schema parity, incomplete full-matrix tests, and deterministic health/talisman language.
5. In-app browser/Node browser-control tooling was unavailable to Sol in this session, so no claim of visual or console-clean browser acceptance is made.

Post-Luna verdict remains **Request changes**. Tasks 7.3–7.6 and 7.8 are accepted; new follow-up tasks 8.1–8.5 capture the remaining concrete regressions and verification gate.

## Second Luna pass review — 2026-09-16

The second focused Luna pass repaired the remaining known JavaScript paths:

- renderer now uses `chartType`, `chartDesc`, `warning`, `severity`, `evidence`, `action`, `actions`, `quotesCited`, and string `missingData`
- unsupported rating/count/path summary fields were removed from the result card
- lock is disabled/rejected while heading is null
- explicit manual angle synchronizes the derived facing, while facing-only mode retains its existing selection and omits heading
- sensor events now record stability samples and lock requires a stable three-sample window
- localStorage snapshot version, palace keys, IDs, and path-quality values are checked; corrupt snapshots are removed
- palace cells support Enter/Space and the board has a polite live region
- hidden heading now starts empty

Sol verification after the second pass:

- `npm test`: 161 passed, 0 failed
- `node --check` for changed browser/core scripts: passed
- `git diff --check`: passed
- strict OpenSpec validation: must be rerun after this review update

Remaining blockers are narrower but still real:

1. No executable browser/DOM regression test or real browser clean-console evidence exists. Task 8.1 therefore remains open even though its code mapping is corrected.
2. No HTTPS iOS/Android device acceptance evidence exists; task 7.10 remains open.
3. The client catalog remains manually duplicated from `data/fengshui/layout-catalog.json`; task 7.9 remains open.
4. The edit-time nine-grid still does not display period/mountain/facing stars because it has no chart data before submission; task 7.11 is only partially complete.
5. WebMCP/MCP/bridge/CLI schemas and deterministic-tool parity remain incomplete; task 7.12 remains open.
6. Full matrix/browser/parity tests remain incomplete; task 7.13 remains open.
7. README/CHANGELOG still claim a 24-mountain dropdown although the view contains only eight exact pair options; CHANGELOG still says 160 tests after the suite reached 161; precise-citation claims remain stronger than the stored provenance. Tasks 7.14 and 8.4 remain open.
8. New rule/quote data still contains deterministic health/family harm and talisman language; task 7.15 remains open.

Verdict remains **Request changes / in progress**, with the user-facing manual-angle requirement now implemented at code level but awaiting browser acceptance evidence.
