## ADDED Requirements

### Requirement: get_meihua_chart tool
The MCP server must expose a tool to calculate a Meihua Yishu hexagram.

#### Scenario: Meihua calculation by numbers
- **WHEN** the tool is called with `method="number"` and numbers `num1, num2, num3`.
- **THEN** it should return the corresponding original, mutual, and change hexagrams (bengua, hugua, biangua).

#### Scenario: Meihua calculation by time
- **WHEN** the tool is called with `method="time"` and an optional `datetime`.
- **THEN** it should return the hexagrams based on the lunar calendar time, consistent with `lib/meihua.js`.

### Requirement: analyze_meihua tool
The MCP server must expose a tool to interpret a Meihua hexagram via LLM.

#### Scenario: Romance inquiry
- **WHEN** the tool is called with `purpose="感情"`, valid `meihuaData`, and a `userQuestion`.
- **THEN** it should return a detailed interpretation using the configured LLM provider.
