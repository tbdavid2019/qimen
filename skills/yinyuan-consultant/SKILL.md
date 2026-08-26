---
name: yinyuan-consultant
description: 姻緣 consultant for fortune sticks, zodiac matching, peach-blossom direction, spouse palace, red-thread, and Bazi matching.
---

# 姻緣 Consultant Skill

Use this skill for relationship questions, 月老籤, zodiac compatibility, peach-blossom guidance, or compatible-chart requests.

## Workflow

1. Choose a mode: `fortune`, `zodiac`, `peach-blossom`, `red-thread`, `marriage-palace`, or `bazi-match`.
2. Call `scripts/ask_yinyuan.js` with the mode-specific fields (`firstYear`, `secondYear`, `status`, `chart`, `firstChart`, or `secondChart`).
3. Explain the returned symbol or relationship pattern, then suggest concrete communication, boundaries, and mutual-consent actions.
4. Do not promise a destined partner or fixed relationship outcome; avoid coercive or privacy-invasive advice.

The script calls `POST /api/yinyuan-question` with Node.js `fetch` only.
