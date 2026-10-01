# Proposal

## Why

The suite has no dedicated way to help users choose a Chinese name or examine an existing one. A new, evidence-transparent name module can bring naming and name review into the suite while supporting long names and keeping traditional scoring systems clearly identified as cultural methods rather than scientific predictions.

## What Changes

- Add a deterministic name-analysis engine for name generation and verification, with explicit surname parsing and support for full names longer than three Han characters.
- Add traceable character-stroke, pronunciation, meaning, and naming-rule data; expose the selected method and data provenance in results.
- Offer separate, inspectable traditional lenses such as Kangxi-stroke five-grid, 81 numerology, three-talents, character five-elements, and zodiac word-radical associations. Do not combine these into an unexplained objective score.
- Add an optional birth-data lens only when the user supplies the required information; show missing or uncertain inputs instead of guessing.
- Integrate the feature across the page, API/LLM, CLI consultant skill, WebMCP, README, and CHANGELOG.
- Use independently implemented Node.js logic and redistributable data. Do not copy code or datasets from projects whose license or data provenance is unclear, and do not add Python to the serving path.

## Capabilities

### New Capabilities
- `chinese-name-analysis`: Generate Chinese name candidates and verify existing names, including long names, with transparent traditional-method results.

### Modified Capabilities
- None.

## Impact

- New deterministic module and versioned datasets under `lib/` and `data/name-analysis/`.
- New localized web page, API routes and prompt formatting, consultant skill/CLI, and WebMCP tools.
- Update README and CHANGELOG. No runtime language or dependency changes are planned.
