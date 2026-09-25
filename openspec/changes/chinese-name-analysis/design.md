# Design

## Context

The project is a Node.js/Express suite with deterministic module engines, an LLM explanation layer, web views, consultant scripts, and WebMCP contracts. It has no name-character dictionary or dedicated name-analysis route. The existing request is to add both candidate generation and verification, with names longer than three characters supported. Reference repositories provide rule ideas but are not suitable as opaque runtime dependencies; some have incompatible or unclear licenses and the Python projects do not fit the serving runtime.

## Goals / Non-Goals

**Goals:**

- Keep all calculation and request handling in Node.js with no new runtime dependency.
- Make name segmentation, character data, selected conventions, method results, and source provenance explicit.
- Support full names of 2–8 Han characters, compound surnames, user-selected surname boundaries, and generated given names of 1–4 characters.
- Present traditional methods as separate cultural lenses; avoid a single unexplained fate score.
- Keep web, API, CLI/skill, WebMCP, and LLM inputs aligned.

**Non-Goals:**

- Treat numerology, zodiac word associations, or five-element matching as empirically validated predictors.
- Reuse another repository's code or data wholesale.
- Replace or fork the existing Bazi engine. Birth-data matching may call the local deterministic engine only when the user opts in and provides complete required data.
- Promise automatic parsing of every rare surname or alternate glyph; ambiguous boundaries and missing character evidence remain visible.

## Decisions

1. **Implement a native deterministic engine and keep interfaces thin.** Put verification, surname parsing, method profiles, and candidate ranking in a standalone `lib/name-analysis.js`. Routes, browser code, CLI, and WebMCP call the same functions and share one request/response shape. This preserves the repository's existing execution model and avoids bundling Go/Python services.

2. **Use a versioned local character data product with source metadata.** Store character records and surnames/rules under `data/name-analysis/`; include provenance, license, version, and coverage metadata. Use the MIT-licensed Shunshi character data and record field coverage; use MIT/CC BY surname sources with notices. Do not copy the repositories whose data rights are absent or unclear. Every used field must record its source because code and data can have different licenses.

3. **Require explicit segmentation when inference is ambiguous.** Accept an explicit surname from the user. Otherwise, use a curated surname index, return all plausible supported boundaries, and defer surname-based scores until the user selects one. Never silently assume that the first one or two characters are the surname.

4. **Bound long-name support and mark extended rules.** Accept 2–8 Han characters for verification and allow 1–4 given-name characters for generation. Apply a method only where its rule profile defines the calculation. If a five-grid or three-talents profile is extended to a name shape without a stable convention, expose the formula and mark it as an extension instead of reporting a canonical verdict. Keep per-character data available even when one method is omitted.

5. **Keep method outputs separate and explainable.** Results contain method IDs, rule-profile versions, component values, source references, and limitations. Candidate ordering uses an independently curated starter character pool plus an explicit soft five-element preference; it is not a validated quality score. Hard user constraints are never silently relaxed. Gender/style and zodiac-radical rankings remain disabled because the reviewed pool/source does not support them.

6. **Make birth data opt-in and reuse local calculations.** Name generation/verification works without birth details. A Bazi/five-element matching lens is omitted unless the user enables it and supplies complete required data. Reuse the existing Bazi calculation module where compatible; report unresolved time/calendar assumptions and do not send birth data to an external service.

7. **Use FateCat and Meihua-Yishu as design references only.** Adopt FateCat's separation of deterministic calculation from LLM explanation, evidence fields, and reproducibility checks. Adopt Meihua-Yishu's constructive, non-fear-based interpretation and one practical next step. Existing Meihua five-perspective support already covers much of its chart structure; do not duplicate it or import its non-commercial/share-alike text or Python tool.

## Risks / Trade-offs

- **[Name boundaries and long-name rules vary]** → Require explicit surname selection for ambiguity and return method profile/formula metadata; label nonstandard long-name formulas.
- **[Character dictionary coverage does not guarantee good names]** → Separate broad verification data from a smaller, reviewed generation-character pool; show meaning, pronunciation, and exclusions for each candidate.
- **[Scoring can appear more certain than the tradition supports]** → Keep methods separate, expose their arithmetic and provenance, use neutral language, and avoid absolute outcomes.
- **[Third-party data may have different terms from its implementation]** → Track provenance per dataset/field and include an attribution/license manifest; do not ship data until redistribution terms are confirmed.
- **[Generation combinations can grow rapidly]** → Filter characters before candidate construction and use deterministic bounded ranking rather than enumerating the full Cartesian product.

## Migration Plan

Add the new module and routes alongside existing features. There is no persisted user data to migrate. Rollback consists of removing the new page/routes/data and reverting the documentation entry; existing APIs remain unchanged.
