# Tasks

## 1. Data sources and rule contract

- [x] 1.1 Inventory redistributable Han-character data sources, verify per-dataset license/attribution terms, and record field coverage plus version in a source manifest before committing any data.
- [x] 1.2 Define versioned name-method profiles for Taiwan/Kangxi and modern strokes, surname segmentation, single/double surnames, five-grid, 81 numerology, three-talents, character five-elements, and zodiac word associations; verify formulas against documented examples from permitted references.
- [x] 1.3 Build supported surname/rule/character datasets from approved sources; document the unsupported zodiac method and verify source manifest references every shipped dataset.

## 2. Deterministic Node.js engine

- [x] 2.1 Implement validation for 2–8 Han-character names, explicit or inferred surname boundaries, ambiguity reporting, and missing/variant character data; verify long-name and invalid-input cases with unit tests.
- [x] 2.2 Implement per-character analysis and source-aware modern/Kangxi stroke profiles without fallback or pseudo-strokes; verify all character records have valid fields and unknown characters are reported as unknown.
- [x] 2.3 Implement separate five-grid, 81 numerology, three-talents, five-elements, and optional local Bazi results, with extended-method labels for long names; document why zodiac data is unavailable and verify supported components.
- [x] 2.4 Implement deterministic candidate generation for 1–4 given-name characters with hard inclusion/exclusion constraints and inspectable preference ranking; verify length, filtering, no-result behavior, and reproducibility.
- [x] 2.5 Add deterministic unit tests for source profiles, segmentation, rare/compound surnames, extended names, and method output provenance as each engine feature lands.

## 3. API and LLM integration

- [x] 3.1 Add `/api/name-analysis/verify` and `/api/name-analysis/generate` with shared validation, structured errors, bounded inputs, and stable JSON responses; verify with route tests.
- [x] 3.2 Add `/api/name-analysis-question` and a prompt formatter that passes only deterministic results, provenance, and uncertainties to the LLM; verify the prompt cannot turn missing data into asserted facts.
- [x] 3.3 Add API documentation and request/response examples for all method profiles, long-name boundaries, privacy behavior, and error cases; verify `/api/docs` matches route contracts.

## 4. Web interface

- [x] 4.1 Add a Traditional Chinese `/name-analysis` page with create/verify modes, explicit surname controls, long given-name length selection, optional local birth-data lens, method profile selection, and clear source/uncertainty presentation; verify markup and mobile layout requirements.
- [x] 4.2 Add client behavior for candidate generation, verification, result comparison, and optional LLM follow-up without duplicate submit pipelines; verify browser-facing serialization and error rendering.
- [x] 4.3 Add module navigation and localized high-contrast responsive styling; verify the new link and styles are present in the page.

## 5. CLI, consultant skill, and WebMCP

- [x] 5.1 Add a standalone Node.js CLI supporting JSON/stdin and documented flags for generation and verification; verify CLI output matches canonical engine fixtures.
- [x] 5.2 Add `name-analysis-consultant/SKILL.md` with full parameters, method limitations, attribution, and examples; verify the referenced script paths and examples exist.
- [x] 5.3 Add WebMCP tools for verify, generate, and question flows plus a declarative verification form, with schemas aligned to the API; verify tool schema and execution parity.

## 6. Documentation and integration acceptance

- [x] 6.1 Update README with endpoints, CLI, WebMCP, data sources/licenses, name-length limits, calculation profiles, and examples; verify documented paths and parameters match implementation.
- [x] 6.2 Add an accurate dated CHANGELOG entry describing the delivered scope; verify the date and claims match the final implementation.
- [x] 6.3 Run the focused name-analysis tests and `npm test`, fix all regressions, and verify 100% passing results.
- [x] 6.4 Run `openspec validate chinese-name-analysis --strict` and review that all requirements map to implemented interface behavior.
