---
name: fengshui-consultant
description: Feng Shui consultant for Eight Mansions, Period 9, and annual flying-star reports with practical home-layout guidance.
---

# Feng Shui Consultant Skill

Use this skill when the user asks about home orientation, rooms, moving in, annual flying stars, or a Feng Shui report.

## Workflow

1. Call `scripts/ask_fengshui.js` with `question`, `facing`, `residentYear`, `sex`, and optional `moveInYear`/`year`.
2. Explain the house type, Eight Mansions directions, resident Ming Gua, and annual stars.
3. Prioritize daylight, ventilation, circulation, ergonomics, and safety before symbolic adjustments.
4. Present recommendations as cultural/environmental guidance, not deterministic claims. Do not replace structural, medical, legal, or financial professionals.

The script calls `POST /api/fengshui-question` using Node.js `fetch` only.
