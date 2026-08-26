---
name: tarot-consultant
description: Tarot reading consultant for six spreads, upright/reversed cards, and practical reflective guidance. Use when a user asks for a Tarot reading or supplies a Tarot question.
---

# Tarot Consultant Skill

Use this skill when the user wants a Tarot reading. Ask for the question and choose one of the supported spreads: `single`, `three`, `diamond`, `moon`, `horseshoe`, or `celtic`.

## Workflow

1. Call `scripts/ask_tarot.js` with JSON containing `question` and optional `spread`/`seed`.
2. Describe the drawn cards in position order, including orientation and whether a card is Major Arcana.
3. Connect the positions into a coherent story, then give practical choices and reflection prompts.
4. Treat Tarot as symbolic reflection, not guaranteed prediction. For health, legal, financial, or safety matters, recommend a qualified professional.

The script calls `POST /api/tarot-question` on the configured qimen site and uses Node.js `fetch`; it does not require Python or local server state.
