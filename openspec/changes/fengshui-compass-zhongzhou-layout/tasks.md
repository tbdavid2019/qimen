## 0. Contract, source, and feasibility gates

- [x] 0.1 Confirm the canonical input/output contract: `heading`, `northReference`, `declination`, `headingSource`, `layoutObjects`, `entryPath`, `pathQuality`, response fields, and conflict precedence with existing `facing`.
- [x] 0.2 Build the versioned `data/fengshui/layout-catalog.json` with all 63 tags, stable IDs, seven categories, localized labels, placement modes, and critical-factor flags.
- [ ] 0.3 Build and review `data/fengshui/zhongzhou-rules.json` and `data/fengshui/classical-quotes.json`; include 24-mountain/three-yuan dragon data, substitute-star rules, rule IDs, source/version metadata, and fixtures. Do not expose a rule until its fixture and source fields are complete.
- [ ] 0.4 Run a sensor spike on a deployed HTTPS preview. Record iOS Safari and Android Chrome behavior, permission results, absolute-event availability, screen-orientation effects, magnetic accuracy, and manual-fallback behavior before committing to the adapter contract.

## 1. Pure compass and chart calculation (`lib/fengshui.js` and data)

- [x] 1.1 Implement finite-number validation and circular heading normalization to `[0, 360)`.
- [x] 1.2 Implement the complete 24-mountain geometry, trigram grouping, facing/sitting derivation, and `calculateMountainFromHeading(heading)` without changing existing 8-direction/24-mountain string behavior.
- [x] 1.3 Implement `determineChartType(heading, mountain)` with boundary-first evaluation, pure ±4.5°, candidate 4.5°–<6°, small/large void ±1.5°, exact inclusive/exclusive boundaries, and circular-distance tests.
- [ ] 1.4 Implement substitute-chart selection from the reviewed ruleset only. Return candidate plus insufficient-data metadata when no approved replacement rule exists.
- [x] 1.5 Complete `getPeriod()` for all nine periods and verify existing Xuan Kong chart outputs for historical and current years.
- [ ] 1.6 Implement `validateLayoutInput()` and `evaluateZhongzhouLayout(params)` using catalog IDs, chart star provenance, entry-path evidence, missing-data tracking, rule IDs, quote IDs, and the practical-action output contract.
- [x] 1.7 Keep stove, kitchen, room, and bed semantics distinct; ensure rules do not turn a generic kitchen tag into a stove placement or infer any absent element.

## 2. API and LLM integration (`app.js`, `lib/llm-analysis.js`)

- [x] 2.1 Add `POST /api/fengshui/evaluate-layout` as a deterministic endpoint with no LLM, Discord, or external network call.
- [x] 2.2 Extend `/api/fengshui/report` with optional heading, north-reference, layout, and entry-path fields while preserving the existing response shape and `shaqi`/`zeri` behavior.
- [ ] 2.3 Extend `validateFengShuiQuestion()` and the shared input validator with catalog allowlists, length limits, finite-number checks, heading/facing conflict detection, and structured 400 errors.
- [x] 2.4 Pass the same deterministic result and `missingData` to `/api/fengshui-question` and update `formatFengShuiPrompt()` so the LLM cannot invent missing rooms, paths, rules, or quotations.
- [x] 2.5 Update `/api/docs` with all new fields, enum values, examples, response shape, sensor limitations, and the distinction between deterministic evaluation and LLM interpretation.
- [x] 2.6 Add the sensor Permissions-Policy directives while preserving the existing WebMCP `tools=(self)` directive.

## 3. Web UI sensor module (`views/fengshui.html`, `public/js/fengshui.js`)

- [x] 3.1 Add the compass markup, 24-mountain ring, trigram sectors, heading/accuracy/source labels, tilt warning, permission state, lock/unlock controls, and manual angle fallback to `views/fengshui.html`.
- [x] 3.2 Include the new page-specific `public/js/fengshui.js` from the Fengshui view. Keep sensor and layout state in that module; do not create a second form-submit pipeline.
- [x] 3.3 Implement iOS WebKit heading, Android absolute-orientation adapter, feature detection, `requestPermission(true)` user-gesture handling, screen-orientation correction, listener cleanup, and manual fallback. Android permission API and absolute-event listener paths are covered by a regression test; real-device acceptance remains under 5.6/7.10.
- [ ] 3.4 Implement circular filtering, tilt/stability gating, visible measurement provenance, and lock synchronization with the existing `facing` field and payload hook.
- [ ] 3.5 Add the fixed South-top/North-bottom nine-grid board with palace stars and assigned tags. Support multi-item stacking, single-placement movement, toggle removal, clear-grid, keyboard access, and screen-reader labels.
- [ ] 3.6 Implement catalog-driven category pills, quick actions, ordered `entryPath` editing, `pathQuality`, versioned localStorage snapshots, corrupt-snapshot recovery, and state reset.
- [ ] 3.7 Update `public/js/divination-suite.js` to include the current compass/layout state in `buildPayload()` and render deterministic layout findings without breaking the existing AI conversation flow.
- [x] 3.8 Add compass, grid, tags, warnings, and responsive dark/light styles to `public/css/divination-suite.css`.

## 4. WebMCP, official MCP, and CLI alignment

- [ ] 4.1 Update `public/js/webmcp.js` `fengshui_report` schema with heading metadata, layout object schema, entry path, path quality, and bounded enums; add a deterministic layout-evaluation tool only if its endpoint is exposed for agent use.
- [ ] 4.2 Ensure declarative WebMCP form serialization reads the same payload hook as the normal submit flow, including JSON encoding for `layoutObjects` and `entryPath`.
- [ ] 4.3 Update `skills/fengshui-consultant/scripts/fengshui_cli.js` to support the canonical fields, inline JSON, stdin JSON, documented flags, and deterministic evaluation output.
- [ ] 4.4 Update `skills/fengshui-consultant/scripts/ask_fengshui.js` and `SKILL.md` with actual filenames, API examples, layout schema, source limitations, missing-data behavior, and sensor/manual-input guidance.
- [ ] 4.5 Update `mcp/src/tools/divination.ts`, regenerate `mcp/dist`, and update `mcp-bridge.js` so the official MCP and zero-dependency bridge use the same schema and endpoint behavior.

## 5. Tests and real-device QA

- [ ] 5.1 Add unit tests for all 24 mountain centers, all mountain/trigram boundaries, 0/360° wrapping, invalid numbers, sitting/facing inversion, chart classification, and all nine periods.
- [ ] 5.2 Add fixture tests for every approved substitute rule, every critical layout rule, classical quote IDs, stove/kitchen distinction, rule evidence, and omission honesty.
- [ ] 5.3 Add HTTP tests for `/api/fengshui/evaluate-layout`, `/api/fengshui/report`, and `/api/fengshui-question`, including old payload compatibility, invalid structures, conflicts, limits, and LLM fallback behavior.
- [ ] 5.4 Add CLI, WebMCP, official MCP, and bridge schema/parity tests using the same canonical fixtures.
- [ ] 5.5 Add browser tests with mocked orientation events for permission states, absolute/relative fallback, screen rotation, circular filtering, tilt lockout, lock/unlock, grid interaction, localStorage, and form serialization.
- [ ] 5.6 Perform manual HTTPS acceptance on supported iOS Safari and Android Chrome devices, including portrait/landscape, magnetic interference, denied permissions, missing sensors, and desktop fallback.
- [x] 5.7 Run `npm test` and require 100% pass rate with no regressions before documentation is marked complete.

## 6. Documentation and release

- [ ] 6.1 Update `README.md` parameter tables, examples, endpoint documentation, sensor limitations, layout schema, and data-sufficiency rules.
- [ ] 6.2 Update `CHANGELOG.md` with the dated release entry and actual delivered scope; do not claim full substitute-star or classical coverage unless the reviewed datasets are shipped.
- [ ] 6.3 Confirm the two reference assets are included in version control and that all OpenSpec links point to existing repository paths.
- [ ] 6.4 Run `openspec validate fengshui-compass-zhongzhou-layout --strict` and review the implementation checklist before archive.

## 7. Independent implementation review remediation (2026-09-16)

- [ ] 7.1 **Critical:** Repair the Fengshui result renderer so all variables are declared and it consumes the actual `orientation`, `chartQualification`, `layoutEvaluation`, `missingData`, `actions`, and `quotesCited` response fields. Add a regression test that executes `renderFengShui()` with a real API fixture and fails on browser console errors.
- [ ] 7.2 **Critical:** Preserve the legacy facing selector. Do not submit the default `heading=180` unless the user has explicitly measured, adjusted, or locked a heading; changing `facing` alone must not trigger `FACING_HEADING_CONFLICT`.
- [x] 7.3 **Critical:** Apply an approved substitute-star rule to the generated mountain/facing charts, or keep the result as `candidate`. A response marked `chartType=substitute` must not return the same flying-star chart as the lower-gua calculation.
- [x] 7.4 Validate and apply `northReference`, `declination`, and `headingSource`. True-north input must either correct the heading exactly once or be rejected; invalid enum and non-finite declination values must return structured 400 errors.
- [x] 7.5 Keep `space.kitchen` and `appliance.stove` distinct in evaluation. Kitchen-only input must report missing stove data and must not trigger stove-specific rules.
- [x] 7.6 Make `POST /api/fengshui/evaluate-layout` reject or mark empty/missing layout input as insufficient. It must never return `dataQuality: complete` with `layoutEvaluation: null`.
- [ ] 7.7 Execute layout findings from the versioned rules registry rather than hard-coded period-9 conditions and prose. Add source edition/page or another reviewable reference plus fixtures for every released substitute, layout rule, and quote.
- [x] 7.8 Validate entry-path evidence: when a main door is provided, `entryPath[0]` must match its palace; do not emit a positive open-path finding for an unrelated sequence.
- [ ] 7.9 Use one catalog source of truth. Remove or mechanically generate the duplicated 63-item client catalog, and validate localStorage version, palace keys, IDs, placement modes, and corrupt/outdated snapshots before rendering.
- [ ] 7.10 Complete sensor behavior: request absolute permission as specified, use the stability result to gate locking, represent unknown accuracy honestly, and record real HTTPS iOS/Android acceptance evidence.
- [ ] 7.11 Complete the nine-grid interaction acceptance criteria: display period/mountain/facing stars in the editor, implement keyboard activation, and add accessible announcements for dynamic placement/removal.
- [ ] 7.12 Align WebMCP, official MCP, bridge, local CLI, API Skill, and HTTP schemas. Bound palace/object enums and entry-path length, remove undocumented values such as `preset` or add them to the canonical spec, support documented flags, and add the deterministic agent tool if the endpoint remains advertised for agent use.
- [ ] 7.13 Add the missing test layers: all 24 centers and 24 boundaries, every substitute/rule/quote fixture, empty and invalid metadata API cases, kitchen-without-stove, declination, legacy UI facing selection, CLI/API/WebMCP/MCP parity, mocked sensor/browser behavior, and clean-console rendering.
- [ ] 7.14 Correct README/CHANGELOG claims until the acceptance evidence exists, including full cross-platform adaptation, 24-mountain dropdown fallback, precise classical citations, and completion status.
- [ ] 7.15 Remove deterministic health/fear claims and commercial talisman prescriptions from new rules/quotes. Keep traditional terminology clearly framed as cultural interpretation and prioritize practical environmental actions in line with the project persona.

## 8. Post-Luna independent review (2026-09-16)

- [ ] 8.1 **Critical UI follow-up:** Complete the renderer contract fix. Use `chartType === 'void'`, `chartDesc`, and `warning` instead of nonexistent `isVoid`, `categoryLabel`, and `reason`; hide unsupported rating/count/path fields or add them to the backend contract. Add an executable browser/DOM regression test.
- [x] 8.2 **Important manual-input follow-up:** Disable or reject `鎖定坐向` while `heading` is null. Locking before sensor/manual input must not derive 0° or change the existing facing selector.
- [x] 8.3 **Important sensor follow-up:** Call `checkStability()` from the orientation event path and use its boolean result for locking. The current code never appends `recentHeadings`, so sensor mode cannot satisfy the lock sample gate.
- [x] 8.4 **Important documentation follow-up:** The page contains all 24 mountain pairs; README/CHANGELOG retain the truthful statement that real-device HTTPS validation is pending.
- [ ] 8.5 **Verification gate:** After 8.1–8.4 and remaining 7.x items, rerun Node tests, browser/DOM tests, schema parity tests, `git diff --check`, lint/check, strict OpenSpec validation, and an independent Sol review before archive.
