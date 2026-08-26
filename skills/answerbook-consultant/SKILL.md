---
name: answerbook-consultant
description: 解答之書 consultant for a direct memorized answer or an answer interpreted against a user's question.
---

# 解答之書 Consultant Skill

Use this skill when the user wants a short answer from the 解答之書 or asks for help interpreting that answer in context.

## Workflow

1. For a direct reading, call `scripts/ask_answerbook.js` with `{ "mode": "direct" }` or an empty JSON object. No question is required.
2. For an interpreted reading, call it with `{ "mode": "question", "question": "..." }`. The service obtains the original answer and asks the shared LLM to interpret it.
3. Quote the original answer clearly, then separate any AI interpretation from the source text.
4. Treat the answer as a reflective prompt rather than a guaranteed prediction. For medical, legal, financial, or safety matters, recommend qualified professional advice.

The script calls `POST /api/answerbook-question` with Node.js `fetch` only. It supports `QIMEN_API_BASE_URL`, prints the complete JSON response, and does not require Python or a local server.
