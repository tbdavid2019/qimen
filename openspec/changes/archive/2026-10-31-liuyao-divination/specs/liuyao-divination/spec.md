# Spec Delta

## Purpose

Provides a classical, uncastrated Liu Yao (京房納甲筮法) divination system with full 64-hexagram Najia, Shi/Ying, Liuqin, Liushou, Fushen, dynamic line mutations, and multi-modal casting.

## ADDED Requirements

### Requirement: Multi-Modal Hexagram Casting
The system SHALL support four casting methods for generating a Liu Yao hexagram from bottom (初爻) to top (上爻):
1. **Interactive 3-Coin Toss (銅錢搖卦)**: Simulating three tossed coins (2=Yin/Tail, 3=Yang/Head; sum 6=Old Yin, 7=Young Yang, 8=Young Yin, 9=Old Yang) sequentially for 6 throws.
2. **Great Derivation Method (大衍筮法)**: Simulating the classical 49 yarrow-stalk three-change algorithm (揲四歸奇) to yield lines 6, 7, 8, or 9 according to authentic classical probability.
3. **Datetime Casting (年月日時起卦)**: Deriving upper/lower trigrams and the changing line index via lunar calendar numbers.
4. **Manual Line Input (手動爻值)**: Accepting an exact 6-character string composed of digits `6`, `7`, `8`, and `9`.

#### Scenario: 3-Coin sequential casting
- **WHEN** a user initiates a coin toss session and throws 6 times
- **THEN** the system generates line values between 6 and 9 from bottom to top and renders the corresponding solid, broken, or moving line symbols

#### Scenario: Great Derivation algorithm casting
- **WHEN** a user requests casting via Great Derivation method
- **THEN** the system executes the classical 3-change 4-remainder calculation 6 times and produces a verified 6-digit line configuration

#### Scenario: Datetime casting
- **WHEN** a user provides a Gregorian datetime or requests the current time
- **THEN** the system converts the time to lunar calendar values, computes the inner trigram, outer trigram, and moving line (1–6), producing the exact hexagram and transformed hexagram

#### Scenario: Manual line validation
- **WHEN** a user enters a 6-character string such as `"789687"`
- **THEN** the system validates each digit against `{6, 7, 8, 9}` and constructs the hexagram; if length != 6 or invalid characters are present, it returns a structured validation error

---

### Requirement: Classical Jing Fang Najia Board Calculation
The system SHALL calculate the complete Jing Fang Najia (京房納甲) hexagram matrix for the primary hexagram (本卦) and transformed hexagram (之卦):
- Identify the Eight Palaces (乾、坎、艮、震、巽、離、坤、兌) classification and Palace Five-Element.
- Determine the exact World (世) and Response (應) line positions (1 to 6).
- Assign the Najia Heavenly Stem and Earthly Branch (納甲干支) and Five Elements for each line.
- Assign Six Relatives (六親: 父母、官鬼、妻財、子孫、兄弟) relative to the Palace element.
- When target Yong Shen (用神) is absent in Ben Gua, determine the Hidden Spirit (伏神) and Flying Spirit (飛神) by looking up the palace's primary hexagram (首宮純卦).
- Assign Six Beasts / Spirits (六獸: 青龍、朱雀、勾陳、螣蛇、白虎、玄武) from line 1 to 6 based on the Day Stem.
- Calculate Month Commander (月建), Day Branch (日辰), Xun Kong (旬空), and Day Branch 12 Life Stages (長生十二運).

#### Scenario: Palace, World, and Response identification
- **WHEN** any of the 64 hexagrams is calculated (e.g. 天風姤)
- **THEN** the system correctly identifies its Palace (乾宮), Palace element (金), World line position (初爻), and Response line position (四爻)

#### Scenario: Hidden Spirit (伏神) resolution
- **WHEN** a hexagram lacks one or more Six Relatives (e.g. 澤山咸 lacks 父母)
- **THEN** the system retrieves the missing relative and its line position from the leader hexagram of that Palace (兌為澤) and displays it as 伏神 beside the corresponding flying line (飛神)

#### Scenario: Day-stem Six Beasts assignment
- **WHEN** casting on a day with Heavenly Stem 甲 or 乙
- **THEN** the system assigns 青龍 to line 1, 朱雀 to line 2, 勾陳 to line 3, 螣蛇 to line 4, 白虎 to line 5, and 玄武 to line 6

---

### Requirement: Classical Changing Line Priority and Yong Shen Resolution
The system SHALL evaluate changing lines according to classical priority rules and automatically identify Yong Shen candidates:
- Implement Zhu Xi's *Yi Xue Qi Meng* (朱熹《易學啟蒙》考變占) 7-case rule for 0 to 6 changing lines.
- Map query intent (e.g., 財運/投資 → 妻財, 事業/功名 → 官鬼, 升學/文書/長輩 → 父母, 感情/婚姻 → 妻財/官鬼/世應, 健康/消災 → 子孫/官鬼) to target Yong Shen.
- Calculate element strength (旺、相、休、囚、死) against the Month Commander (月建).
- Mark dynamic interactions (動變生剋, 化進神, 化退神, 化絕, 化回頭克).

#### Scenario: Zhu Xi changing line rule for 1 moving line
- **WHEN** exactly 1 line is moving (老陽 9 or 老陰 6)
- **THEN** the system identifies that moving line's line statement (本卦變爻爻辭) as the primary classical textual focus

#### Scenario: Zhu Xi changing line rule for 2 moving lines
- **WHEN** exactly 2 lines are moving
- **THEN** the system takes both line statements, giving precedence to the upper moving line

#### Scenario: Automatic Yong Shen mapping
- **WHEN** the user specifies a query topic such as "求財" or "投資"
- **THEN** the system automatically designates "妻財" as the primary Yong Shen, checks whether it is present on the board or hidden as Fu Shen, and assesses its seasonal vitality

---

### Requirement: Punchy & Prominent Web User Experience
The system SHALL provide a responsive, high-contrast, ambient glow web interface for Liu Yao divination:
- Follow the repository's design system: vibrant dual/triple gradients, ambient glow box-shadow, badge pills, and responsive layout.
- Provide a coin tossing animation widget allowing manual or rapid auto-toss.
- Display the hexagram board clearly with lines, stems, branches, six relatives, six beasts, World/Response badges, moving line indicators (`○` / `×`), and Fu Shen columns.
- Offer AI / LLM consultation synthesizing the board mechanics into actionable guidance ("傳統智慧，理性解讀；照見當下，指引行動").

#### Scenario: Interactive coin tossing animation
- **WHEN** the user clicks "搖卦"
- **THEN** three virtual coins flip with dynamic sound/visual feedback and register the outcome of that line, updating the board upwards

#### Scenario: Mobile viewport responsiveness
- **WHEN** viewed on screens below 768px
- **THEN** the interface adapts to a single-column stacked view with touch-friendly controls and legible hexagram symbols without horizontal overflow

---

### Requirement: Multi-Interface Parity (API, CLI, WebMCP)
The system SHALL provide unified access across all runtime layers:
- REST API `/api/liuyao` supporting method selection and returning structured board data and interpretation.
- Node.js CLI script executable in standalone environments supporting stdin and CLI flags.
- Chrome WebMCP tool registered in `public/js/webmcp.js`.

#### Scenario: REST API invocation
- **WHEN** a POST request is sent to `/api/liuyao` with `{ method: "time", question: "今年事業發展" }`
- **THEN** the server returns status 200 with full Ben Gua, Zhi Gua, Najia details, Yong Shen, and AI analysis

#### Scenario: CLI script invocation
- **WHEN** the script `skills/liuyao-consultant/scripts/liuyao.js` is executed with `--lines 789687`
- **THEN** it outputs formatted board text or JSON matching the API calculation exactly
