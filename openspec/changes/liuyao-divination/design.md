# Design

## Context

The 333 Metaphysics Suite operates on Node.js / Express deployed on Vercel serverless functions. Metaphysical calculations for time, solar terms, and stems/branches are provided by [`lib/solar-time.js`](file:///Users/david/Documents/git/tbdavid2019/qimen/lib/solar-time.js) and [`lib/api-time-handler.js`](file:///Users/david/Documents/git/tbdavid2019/qimen/lib/api-time-handler.js).

While `kentang2017/ichingshifa` serves as an authentic Python reference for Jing Fang Najia algorithms, our repository guidelines strictly prohibit Python runtime dependencies. Therefore, the complete mathematical logic and classical tables must be ported to a pure Node.js engine with zero runtime dependencies.

## Goals / Non-Goals

**Goals:**
- Implement a pure Node.js engine in `lib/liuyao.js` implementing classical 64-hexagram Najia, Eight Palaces, Shi/Ying positions, Six Relatives, Six Beasts, Hidden Spirits (伏神), Xun Kong, and Zhu Xi's 7-rule changing line judgment.
- Support 4 casting methods: Interactive 3-Coin Toss (with animation), Great Derivation method (大衍筮法), Datetime casting, and manual 6-line code input.
- Automatic Yong Shen (用神) resolution based on user's query intent.
- Full 5-layer parameter alignment across Web UI, REST API, CLI/Skill, WebMCP, and Documentation.
- Follow the "Punchy & Prominent" design guidelines: high-contrast badges, ambient glow, mobile-first responsiveness, and clear action-oriented LLM guidance.

**Non-Goals:**
- Introducing Python runtime dependencies or microservices.
- Modifying existing Qimen, Meihua, or Bazi modules.
- Generating deterministic fatalistic predictions.

## Decisions

### 1. Pure Node.js Port of Najia Tables and Logic
- **Decision:** Construct `lib/liuyao.js` with pre-computed classical lookup tables:
  - 8 Palaces order & Palace 5-elements (乾金、坎水、艮土、震木、巽木、離火、坤土、兌金).
  - Shi/Ying line mapping for each of the 64 hexagrams.
  - Najia stem/branch assignments for inner (lines 1–3) and outer (lines 4–6) trigrams:
    - 乾: 內 甲子寅辰, 外 壬午申戌
    - 坤: 內 乙未巳卯, 外 癸丑亥酉
    - 震: 內 庚子寅辰, 外 庚午申戌
    - 巽: 內 辛丑亥酉, 外 辛未巳卯
    - 坎: 內 戊寅辰午, 外 戊申戌子
    - 離: 內 己卯丑亥, 外 己酉未巳
    - 艮: 內 丙辰午申, 外 丙戌子寅
    - 兌: 內 丁巳卯丑, 外 丁亥酉未
- **Rationale:** O(1) deterministic evaluation, ultra-lightweight, zero bundle bloat, 100% compliant with serverless execution constraints.
- **Alternatives Considered:** Calling Python via child_process or external API (rejected: adds external dependency, high latency, violates AGENTS.md).

### 2. Complete Hidden Spirit (伏神) Resolution
- **Decision:** When evaluating the primary hexagram (本卦), if any of the five Six Relatives is absent, the system queries the Palace Pure Hexagram (首宮八純卦) to find the missing relative's stem/branch and displays it alongside the corresponding flying line (飛神).
- **Rationale:** Critical for classical validity. Many real-world divination cases (e.g. asking for wealth when 妻財 does not appear in the hexagram) rely directly on Fu Shen analysis (伏神有用/無用、生飛/剋飛).
- **Alternatives Considered:** Omitting Fu Shen (rejected: violates "Zero Castrated Versions" directive).

### 3. State-Driven Coin Toss Interaction
- **Decision:** Implement a progressive 6-toss interaction on the frontend:
  - Each throw rolls three coins with animated physics/spin, showing Heads (陽=3) and Tails (陰=2).
  - Calculates line value (6=Old Yin, 7=Young Yang, 8=Young Yin, 9=Old Yang) and builds the hexagram upwards (初爻 -> 二爻 -> ... -> 上爻).
  - Provides a "神速起卦 (Quick Roll)" button to instantly generate all 6 lines for users wanting immediate analysis.
- **Rationale:** Maximizes user engagement, authenticity, and ritual while maintaining swift usability.

### 4. Intent-Driven Automatic Yong Shen Identification
- **Decision:** Allow users to choose their question category from a pill radio group:
  - 💰 求財投資 → 妻財 (Primary), 子孫 (Origin), 兄弟 (Loss/Rival)
  - 💼 事業升遷 → 官鬼 (Primary), 父母 (Power/Docs), 子孫 (Hurdle)
  - 📚 考試學業 → 父母 (Exam/Docs), 官鬼 (Ranking)
  - 💍 姻緣感情 → 男占看妻財、女占看官鬼、世應 (Harmony)
  - 🩺 健康安危 → 子孫 (Medicine), 官鬼 (Illness/Pathogen)
  - 🔍 出行尋物 → 世爻/應爻/用神
- **Rationale:** Bridges the gap between complex metaphysical terminology and modern user intent.

### 5. Multi-Interface Alignment Architecture
```
                         [User Interfaces]
      Web UI (/liuyao)      WebMCP Tool      CLI Skill (scripts/liuyao.js)
             │                   │                        │
             ▼                   ▼                        │
       [REST API]         [WebMCP Handler]                │
      POST /api/liuyao           │                        │
             │                   │                        │
             └───────────────────┴────────────────────────┘
                                 │
                                 ▼
                     [Core Engine: lib/liuyao.js]
               - 64 Hexagram Najia & 8 Palaces
               - Shi / Ying & Fu Shen Resolution
               - 6 Relatives & 6 Beasts
               - Zhu Xi 7-Rule Changing Line Priority
               - Time & Solar Term Integration
                                 │
                                 ▼
                   [LLM Engine: lib/llm-analysis.js]
               - Prompt construction with Yong Shen
               - Rational, actionable interpretation
```

## Risks / Trade-offs

- **[Risk]** Discrepancies in inner/outer trigram stem-branch assignments between different regional schools.
  - **Mitigation:** Adhere strictly to the orthodox Jing Fang Najia canon (*Jing Shi Yi Zhuan* 京氏易傳 & *Bu Shi Zheng Zong* 卜筮正宗), verified with cross-validation tests.
- **[Risk]** Visual clutter from dense hexagram tables on mobile devices.
  - **Mitigation:** Implement high-converting visual hierarchy: top summary banner with primary judgment & Yong Shen status, followed by an elegant, responsive hexagram board with tabbed or card views for detailed parameters.
