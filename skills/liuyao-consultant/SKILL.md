---
name: liuyao-consultant
description: Professional Liu Yao Divination (六爻神卦 / 京房納甲) consultant. Use this skill when the user asks for targeted single-event predictive divination (wealth, career promotion, exam success, relationships, health, lost items) using Liu Yao Jing Fang Najia mechanics.
---

# Liu Yao Consultant Skill (六爻神卦顧問)

This skill provides comprehensive guidance on acting as a professional, rational Chinese metaphysics consultant utilizing the classical **Jing Fang Najia Liu Yao (京房納甲六爻筮法)** system.

## When to use

Trigger this skill whenever a user:
- Asks for a "六爻", "六爻神卦", "納甲", "文王神卦", or "文王課" reading.
- Seeks a granular single-event forecast (e.g. "這筆投資能不能投？", "下個月能升遷嗎？", "考試能錄取嗎？", "雙方能否復合？").
- Supplies 6 line values (e.g. `789687`, 6=老陰, 7=少陽, 8=少陰, 9=老陽).
- Requests divination via 3-coin toss simulation or Great Derivation (大衍之數 49 策).

## Workflow

1. **Calculate the Hexagram**:
   Use `scripts/ask_liuyao.js` to compute or query the Liu Yao engine:
   ```bash
   node skills/liuyao-consultant/scripts/ask_liuyao.js '{"question":"今年投資運勢","category":"求財投資","method":"coins"}'
   ```
2. **Lock in the Yong Shen (用神)**:
   - **求財/投資**: 妻財 (Wealth). Check whether 妻財 is strong in Month (月令旺相), or suppressed by 兄弟 (Rival/Loss).
   - **事業/升遷**: 官鬼 (Career/Authority). Check whether 官鬼 supports the World line (生世/持世) or is attacked by 子孫 (Hurdle).
   - **學業/考證/文書**: 父母 (Documents/Certificate).
   - **婚姻/感情**: 妻財 (for male querent) / 官鬼 (for female querent), and check Shi/Ying harmony (世應相生).
   - **健康/避禍**: 子孫 (Medicine/Blessing), 官鬼 (Illness/Pathogen).
3. **Inspect the Core Dynamics**:
   - **世應向背**: World line (世) is the querent; Response line (應) is the counterpart or target situation.
   - **動變之爻 (Moving Lines)**: Moving lines (老陽 9 ○, 老陰 6 ×) represent the catalyst of change and impending transitions.
   - **朱熹考變占**: Reference Zhu Xi's *Yi Xue Qi Meng* 7-rule changing line judgment hierarchy.
   - **伏神與飛神**: If target Yong Shen is missing from the board, analyze the Hidden Spirit (伏神) under the corresponding flying line (飛神).
   - **日月權限**: Month commander (月建) dictates seasonal strength (旺相休囚死) and Month Break (月破); Day branch (日辰) controls direct clashes and Xun Kong (旬空).
4. **Synthesize Empowering Guidance**:
   Adhere to the motto: "傳統智慧，理性解讀；照見當下，指引行動". Offer clear conclusions, likely timelines (應期), and three concrete next steps.

## Script Arguments (`ask_liuyao.js`)

Supports inline JSON, stdin JSON, and command-line flags:
- `--question`: Specific question/inquiry (required).
- `--method`: `coins` | `dayan` | `datetime` | `manual`.
- `--lines`: 6-character string with digits 6, 7, 8, 9 (e.g. `789687`).
- `--category`: Query category (`求財投資`, `事業升遷`, `考試學業`, `戀愛婚姻`, `身體健康`, `出行尋物`, `綜合運勢`).
- `--gender`: `男` | `女`.
- `--datetime`: ISO datetime string.
