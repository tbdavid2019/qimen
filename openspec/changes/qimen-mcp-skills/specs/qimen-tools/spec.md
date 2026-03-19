## ADDED Requirements

### Requirement: get_qimen_chart tool
The MCP server must expose a tool to calculate a Qimen Dunjia chart.

#### Scenario: Successful Qimen calculation
- **WHEN** the tool is called with a date, time, and optional location/mode.
- **THEN** it should return a structured JSON object containing the 8 palaces (jiu gong), stars, doors, and deities, consistent with existing calculation logic.

### Requirement: analyze_qimen tool
The MCP server must expose a tool to interpret a Qimen chart via LLM.

#### Scenario: Professional Career inquiry
- **WHEN** the tool is called with `purpose="事業"`, a valid `qimenData`, and a `userQuestion`.
- **THEN** it should return a detailed interpretation text using the configured LLM provider (OpenAI/Anthropic/etc).
