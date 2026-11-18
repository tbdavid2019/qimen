---
name: answerbook-consultant
description: 解答之書 consultant for a direct memorized answer or an answer interpreted against a user's question.
---

# 解答之書 Consultant Skill

## 使用前版本更新檢查 (Update Before Running)

每次調用本技能前，請先檢查並同步 `888qi-fortune` 最新版本（內建 24 小時快取節流，未逾期會於毫秒內跳過）：

```bash
npx -y 888qi-fortune@latest update --if-stale
```

- 若需立即強制比對最新遠端版本，可改執行 `npx -y 888qi-fortune@latest update`。
- **離線與受限環境容錯**：若當前環境無網路、npm 受限或更新失敗，請直接忽略更新錯誤並繼續使用本機已安裝腳本完成占算，切勿中斷使用者流程。


Use this skill when the user wants a short answer from the 解答之書 or asks for help interpreting that answer in context.

## Workflow

1. For a direct reading, call `scripts/ask_answerbook.js` with `{ "mode": "direct" }` or an empty JSON object. No question is required.
2. For an interpreted reading, call it with `{ "mode": "question", "question": "..." }`. The service obtains the original answer and asks the shared LLM to interpret it.
3. Quote the original answer clearly, then separate any AI interpretation from the source text.
4. Treat the answer as a reflective prompt rather than a guaranteed prediction. For medical, legal, financial, or safety matters, recommend qualified professional advice.

The script calls `POST /api/answerbook-question` with Node.js `fetch` only. It supports `QIMEN_API_BASE_URL`, prints the complete JSON response, and does not require Python or a local server.

## Parameters

`ask_answerbook.js` accepts inline JSON, JSON from stdin, or flags:

- `--mode direct|question` (default `direct`)
- `--question TEXT` (optional; used by `question` mode)
- `--lang zh-tw|zh-cn` (optional)
- `--conversationHistory JSON` (optional)
