# Spec Delta

## Purpose

This capability lets users create Chinese name candidates and inspect existing names through clearly identified cultural methods. It supports long names and reports the characters, assumptions, data sources, and calculation details behind each result.

## ADDED Requirements

### Requirement: Verify an existing Chinese name
The system SHALL accept a Chinese full name containing 2–8 Han characters, including names longer than three characters, and return a character-by-character report. The user MAY provide the surname explicitly. If automatic parsing has more than one plausible surname boundary, the system MUST report the ambiguity and require a selection before calculating surname-dependent results.

#### Scenario: Verify a long name with explicit surname
- **WHEN** a user submits a valid full name of at least four Han characters and identifies its surname
- **THEN** the system returns the selected surname and given-name portion, one entry per character, and all supported name-method results

#### Scenario: Ambiguous surname boundary
- **WHEN** a submitted name can be segmented using multiple supported surnames and no surname was supplied
- **THEN** the system returns the plausible segmentations and does not present a single surname-dependent result as certain

#### Scenario: Unsupported character data
- **WHEN** a name contains a Han character that is absent from or ambiguous in the local character data
- **THEN** the system identifies that character and omits calculations that require missing data instead of fabricating a stroke count, pronunciation, or element

#### Scenario: Invalid input
- **WHEN** the full name is empty, outside the supported length, or contains disallowed non-name characters
- **THEN** the system returns a structured validation error with a localized correction

### Requirement: Generate name candidates
The system SHALL generate candidates from an explicit surname and a requested given-name character count from one to four. It MUST support a complete generated name longer than three Han characters. The user MAY specify required characters, excluded characters, preferred character five-elements, and an optional local Bazi lens. Unsupported style or gender preferences MUST be disclosed rather than guessed.

#### Scenario: Generate a long candidate name
- **WHEN** the user supplies a surname and requests at least three given-name characters
- **THEN** the system returns candidates whose total length exceeds three characters and identifies every character and method contributing to each result

#### Scenario: Apply supported user preferences
- **WHEN** the user supplies required or excluded characters and supported five-element preferences
- **THEN** returned candidates obey hard constraints and show which soft preferences influenced their ordering

#### Scenario: No candidates satisfy constraints
- **WHEN** the requested constraints produce no candidates
- **THEN** the system returns an empty result with the conflicting constraints and does not silently relax them

### Requirement: Explain traditional name-analysis methods
The system SHALL report supported naming lenses separately, including five-grid/81 numerology, three-talents, character five-elements, and an opt-in local Bazi useful-element alignment. It MAY report zodiac character associations only when an approved source data set exists; otherwise it MUST disclose that the lens is unavailable. Each result MUST identify its rule profile, stroke-count convention, source/version, and any scope limitation. Long-name calculations outside a method's established convention MUST be labeled as an extension and MUST NOT be presented as an uncontested classical rule.

#### Scenario: Inspect method details
- **WHEN** a user requests name generation or verification
- **THEN** each available method includes its component values, interpretation source, and method profile so the user can compare methods

#### Scenario: Compare incompatible conventions
- **WHEN** character forms or selected rule profiles produce different stroke counts or results
- **THEN** the system shows the differing conventions and their results separately rather than silently mixing them

#### Scenario: Optional birth-data lens
- **WHEN** the user explicitly supplies the birth fields required by a supported birth-data method
- **THEN** the system may add that lens and must disclose the calendar/time assumptions and unresolved data; without those fields it omits the lens

#### Scenario: Unsupported style preferences
- **WHEN** the user asks for gendered name styles or zodiac radical auspiciousness without an approved source profile
- **THEN** the system does not infer or rank those properties and identifies the unsupported lens

### Requirement: Keep results culturally framed and actionable
The system MUST describe name-analysis results as traditional cultural references, not scientific or deterministic judgments about a person's fate. It MUST avoid fear-based language and provide a practical explanation of name qualities and trade-offs.

#### Scenario: Interpret a low traditional score
- **WHEN** one traditional method classifies a component as unfavorable
- **THEN** the system explains the method-specific reason and offers a constructive alternative without describing harm or an inevitable outcome

### Requirement: Expose the same capability through supported interfaces
The system SHALL provide the same canonical inputs and method results through the web interface, HTTP API, standalone Node.js CLI/consultant skill, and WebMCP tools. Optional LLM interpretation MUST consume the deterministic result and MUST NOT invent missing character data, method results, or sources.

#### Scenario: Interface parity
- **WHEN** the same valid request is submitted through web, API, CLI, or WebMCP
- **THEN** each interface uses the same validation, surname parsing, calculations, and result schema

#### Scenario: LLM explanation follows evidence
- **WHEN** a user asks a follow-up question about a generated or verified name
- **THEN** the LLM prompt contains the deterministic method results, data provenance, uncertainties, and cultural framing
