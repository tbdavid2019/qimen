---
name: bazi2-consultant
description: 生辰八字2 consultant for four pillars, ten gods, hidden stems, five elements, and luck cycles.
---

# 生辰八字2 Consultant Skill

Use this skill when the user requests a Four Pillars chart or asks about a birth-date-based life theme.

## Workflow

1. Call `scripts/ask_bazi2.js` with `date` (`YYYY-MM-DD`), optional `time`, `sex`, `calendar`, `name`, `formerName`, and `place`, plus the question.
2. Start with the four pillars and day master, then explain ten gods, hidden stems, five-element balance, and luck cycles that are present in the returned data.
3. Translate patterns into practical, non-fatalistic choices. Never claim certainty about destiny, illness, death, or guaranteed wealth.
4. Remind the user that the reading is a traditional cultural reference and professional advice is needed for high-stakes decisions.

The script calls `POST /api/bazi2-question` with Node.js `fetch`; it is JavaScript-only.
