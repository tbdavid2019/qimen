# Proposal

## Why

The 333 Divination Suite ("333 一句提醒·照見當下") currently covers Qimen Dunjia (奇門遁甲), Meihua Yishu (梅花易數), Bazi (八字命理), Ziwei Doushu (紫微斗數), Fengshui (易經風水), Tarot (韋特塔羅), Yinyuan (月老姻緣), Chinese Name Analysis (姓名學), and Answerbook (解答之書). However, it lacks **Liu Yao Divination (六爻神卦 / 京房納甲筮法)**—the most classical, granular, and mathematically rigorous single-event predictive system in Chinese metaphysics.

While Meihua Yishu provides rapid intuitive forecasts and Qimen Dunjia provides broad situational strategy, Liu Yao is the acknowledged gold standard for targeted, concrete inquiries (e.g., investment payoffs, career promotions, exam results, relationship clarity, legal verdicts, lost property, and precise timing/應期). Introducing a complete, uncastrated Liu Yao module—modeled after classical algorithmic benchmarks like `kentang2017/ichingshifa` rewritten cleanly in pure Node.js—will fulfill user demand for rigorous event-based divination while honoring our architectural standards.

## What Changes

We introduce an end-to-end, production-grade Liu Yao divination module adhering to the repository's 5-layer parameter alignment and "Punchy & Prominent" design guidelines:

- **Core Algorithm Engine (`lib/liuyao.js`)**:
  - Pure Node.js zero-Python-dependency engine implementing the Jing Fang Eight Palaces (京房八宮), 64 hexagrams, World and Response lines (世應), and Heavenly Stems/Earthly Branches (納甲天干地支).
  - Complete Six Relatives (六親: 父母、官鬼、妻財、子孫、兄弟) and Hidden Spirits (伏神: palace root hexagram lookup when target Yong Shen is missing).
  - Six Beasts / Spirits (六獸: 青龍、朱雀、勾陳、螣蛇、白虎、玄武) aligned with the Day Stem.
  - Hexagram mutation mechanics (動爻與之卦: Old Yang 9 O, Old Yin 6 X, Young Yang 7, Young Yin 8).
  - Zhu Xi's *Yi Xue Qi Meng* (朱熹《易學啟蒙》考變占) 7-rule changing line judgment hierarchy.
  - Integration with existing astronomical/solar calendar modules for Lunar Date, Solar Terms, Month Commander (月建), Day Branch (日辰), Xun Kong (旬空), and 12 Life Stages (長生十二運).
  - 4 Casting Modes: Interactive 3-Coin Toss simulation (三枚銅錢搖卦), Great Derivation method (大衍筮法三變成爻), Datetime casting (年月日時起卦), and manual 6-line code input (`'789687'`).
- **API & LLM Service Layer (`app.js`, `lib/llm-analysis.js`)**:
  - `/api/liuyao` endpoint supporting all 4 casting methods with full structured board JSON response.
  - Automatic Yong Shen (用神) candidate detection based on query category (Wealth → 妻財, Career → 官鬼, Study/Documents → 父母, Relationship → 妻財/官鬼/世應, Health/Peace → 子孫/官鬼).
  - LLM prompt generation synthesizing Ben Gua, Zhi Gua, Shi/Ying relations, changing lines, and seasonal strength.
- **Web UI Layer (`views/liuyao.html`, `public/js/liuyao.js`, `public/css/liuyao.css`)**:
  - "Punchy & Prominent" responsive board layout with ambient glow, high-contrast typography, interactive coin tossing visualizer, and mobile-first single/double-column presentation.
  - Navigation links and cross-promotional banners integrated across existing tools.
- **CLI & Agent Skill Layer (`skills/liuyao-consultant/`)**:
  - Standalone CLI script supporting JSON stdin and CLI flags (`--date`, `--lines`, `--type`, `--query`).
  - Agent instructions in `SKILL.md`.
- **WebMCP Integration (`public/js/webmcp.js`)**:
  - Chrome WebMCP tool declarations for Liu Yao divination.
- **Documentation & Tests (`README.md`, `CHANGELOG.md`, `test/liuyao.test.js`)**:
  - 100% test coverage for 64-hexagram Najia calculation, Shi/Ying positions, Fu Shen resolution, and changing line rules.

## Capabilities

### New Capabilities
- `liuyao-divination`: Complete 64-hexagram Najia Liu Yao divination engine, multi-mode casting (coins, Dayan, datetime, manual), Yong Shen resolution, interactive visual hexagram board, and LLM interpretation.

### Modified Capabilities
<!-- None. No existing spec requirements are modified. -->

## Impact

- **New files**:
  - `lib/liuyao.js`
  - `views/liuyao.html`
  - `public/js/liuyao.js`
  - `public/css/liuyao.css`
  - `skills/liuyao-consultant/SKILL.md`
  - `skills/liuyao-consultant/scripts/liuyao.js`
  - `test/liuyao.test.js`
- **Modified files**:
  - `app.js` (add router `/liuyao`, API `/api/liuyao`)
  - `public/js/webmcp.js` (register WebMCP tools)
  - `views/partials/header.html` or nav elements across views (add 六爻 link)
  - `README.md` & `CHANGELOG.md`
- **Dependencies**: No external runtime dependencies introduced; leverages existing `solar-time.js` and `api-time-handler.js`. Pure Node.js runtime.
