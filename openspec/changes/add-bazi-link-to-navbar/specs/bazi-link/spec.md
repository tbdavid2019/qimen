## ADDED Requirements

### Requirement: Navigation Link for Bazi
A link to https://bazi.david888.com/ must be present in the main navigation bar after the "梅花易數" link.

#### Scenario: User clicks the Bazi link
- **WHEN** the user is viewing any page with the standard navigation bar (index.html, meihua.html)
- **THEN** they should see a "生辰八字" link to the right of "梅花易數"
- **AND** clicking the link MUST open `https://bazi.david888.com/` in a new browser tab (`target="_blank"`).
