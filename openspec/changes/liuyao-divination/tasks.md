# Tasks

## 1. Core Algorithmic Engine (`lib/liuyao.js`)

- [x] 1.1 Implement 64-hexagram definitions, Eight Palaces classification, Palace elements, and World/Response (世應) positions; verify against classical tables.
- [x] 1.2 Implement inner/outer trigram Najia Heavenly Stem and Earthly Branch assignments (納甲干支五行); verify trigram parity across all 8 trigrams.
- [x] 1.3 Implement Six Relatives assignment (六親: 父母、官鬼、妻財、子孫、兄弟) based on Palace element, and Hidden Spirits (伏神) resolution by querying Palace leader hexagram.
- [x] 1.4 Implement Day-Stem Six Beasts (六獸) assignment, Xun Kong (旬空), and Day Branch 12 Life Stages (長生十二運) integrating with `solar-time.js`.
- [x] 1.5 Implement multi-mode casting algorithms: 3-Coin toss simulation, Great Derivation (大衍之數 49 策揲四歸奇), Datetime casting, and manual line validation.
- [x] 1.6 Implement changing line resolution (動變之卦) and Zhu Xi's *Yi Xue Qi Meng* (朱熹《易學啟蒙》考變占) 7-case rule; verify formatted text output.

## 2. Unit Testing & Verification (`test/liuyao.test.js`)

- [x] 2.1 Create comprehensive test suite `test/liuyao.test.js` validating all 64 hexagrams for correct Palace, Shi/Ying, Najia stems/branches, and Six Relatives.
- [x] 2.2 Add unit tests for Hidden Spirit (伏神) retrieval for hexagrams missing key relatives (e.g. 澤山咸 missing 父母).
- [x] 2.3 Add unit tests for 0 to 6 moving lines matching Zhu Xi's priority rules.
- [x] 2.4 Run `npm test` and verify 100% pass rate.

## 3. API & LLM Service Integration (`app.js`, `lib/llm-analysis.js`)

- [x] 3.1 Implement REST API endpoint `/api/liuyao` supporting method choices (`coins`, `dayan`, `datetime`, `manual`), intent categories, and custom queries.
- [x] 3.2 Implement intent-to-Yong Shen automatic mapping (求財→妻財, 事業→官鬼, 升學→父母, 婚姻→妻財/官鬼/世應, 健康→子孫/官鬼) in `lib/liuyao.js`.
- [x] 3.3 Enhance `lib/llm-analysis.js` with structured Liu Yao prompt construction incorporating Ben Gua, Zhi Gua, moving lines, seasonal vitality, and Yong Shen dynamics.
- [x] 3.4 Wire API error handling and validation responses in `app.js`.

## 4. Web UI & Coin Toss Animation (`views/liuyao.html`, `public/js/liuyao.js`, `public/css/liuyao.css`)

- [x] 4.1 Create `views/liuyao.html` incorporating the "Punchy & Prominent" design system: vibrant ambient glow, high-contrast badges, category pill selectors, and clean layout.
- [x] 4.2 Build interactive 3-Coin Toss animation in `public/js/liuyao.js` supporting step-by-step casting, realistic coin flips, and "神速起卦" instant roll.
- [x] 4.3 Build hexagram board rendering component displaying Ben Gua, Zhi Gua, Shi/Ying badges, Liu Shen, Liu Qin, Fu Shen columns, and Xun Kong indicators.
- [x] 4.4 Style components in `public/css/liuyao.css` ensuring mobile responsiveness (<768px single-column stack) and dark mode contrast.

## 5. CLI Tool & Agent Skill (`skills/liuyao-consultant/`)

- [x] 5.1 Implement standalone Node.js script `skills/liuyao-consultant/scripts/liuyao.js` supporting JSON stdin and CLI flags (`--date`, `--lines`, `--type`, `--query`).
- [x] 5.2 Create `skills/liuyao-consultant/SKILL.md` with complete usage instructions, schema definitions, and example invocations.

## 6. WebMCP Standard Integration (`public/js/webmcp.js`)

- [x] 6.1 Register `liuyao_cast_divination` in `public/js/webmcp.js` with full JSON schema properties, enum values, and client execution handler.
- [x] 6.2 Test WebMCP tool registration in browser environment.

## 7. Documentation & Navigation Sync (`README.md`, `CHANGELOG.md`, Navbars)

- [x] 7.1 Update `views/partials/header.html` and other views to include "六爻神卦" in primary navigation and cross-promotional banner cards.
- [x] 7.2 Update `README.md` with detailed Liu Yao module introduction, feature descriptions, API schema, and CLI instructions.
- [x] 7.3 Update `CHANGELOG.md` with a dated entry recording the new Liu Yao divination capability.
- [x] 7.4 Run full regression testing (`npm test`) and verify entire test suite passes.
