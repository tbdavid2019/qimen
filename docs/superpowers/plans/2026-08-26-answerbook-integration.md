# 解答之書整合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 將解答之書兩種流程整合到網站、共用 API、Skill、WebMCP、MCP 與文件。

**Architecture:** 後端以一站式 Express API 代理解答之書 upstream，直接模式只回傳原始答案，問題模式再呼叫共用 LLM service 的 answerbook profile。前端與所有代理工具都只呼叫這個一站式 API，Discord 由後端保存完整紀錄。

**Tech Stack:** Node.js 18、Express、axios、EJS、原生 WebMCP、TypeScript MCP SDK、Node.js native fetch、Node test runner。

---

### Task 1: API 與 LLM 核心

**Files:**
- Create: `lib/answerbook.js`
- Modify: `lib/llm-analysis.js`
- Modify: `lib/service-question.js`
- Modify: `app.js`
- Test: `test/answerbook.test.js`

- [ ] Write failing tests for upstream parsing, direct mode, question mode, blank-question acceptance, and upstream failure.
- [ ] Run `node --test test/answerbook.test.js` and verify failure.
- [ ] Implement an injected answerbook client, an `answerbook` LLM profile, and an API handler that records the complete result through `sendDivinationRecord`.
- [ ] Run the focused test and verify it passes.

### Task 2: 前端頁面與導覽

**Files:**
- Create: `views/answerbook.html`
- Create: `public/js/answerbook.js`
- Modify: `views/index.html`, `views/meihua.html`, `views/tarot.html`, `views/fengshui.html`, `views/bazi2.html`, `views/yinyuan.html`
- Test: `test/answerbook.test.js`

- [ ] Add the suite-style page with direct/question mode controls, raw answer card, question-mode AI card, loading/error states, and responsive navigation.
- [ ] Add `/answerbook` links to every current header/nav without adding consent controls.
- [ ] Test that the page and all nav links exist and no removed meditation route is reintroduced.

### Task 3: Answerbook Skill

**Files:**
- Create: `skills/answerbook-consultant/SKILL.md`
- Create: `skills/answerbook-consultant/scripts/ask_answerbook.js`
- Test: `test/skills.test.js`

- [ ] Document direct and question modes, safety wording, API payloads, and Discord behavior.
- [ ] Implement a native-fetch CLI that accepts JSON argument/stdin and prints API JSON.
- [ ] Run syntax and skill contract tests.

### Task 4: WebMCP 與 MCP

**Files:**
- Modify: `public/js/webmcp.js`
- Modify: `mcp/src/tools/divination.ts`, `mcp/src/services/api.ts`
- Modify: `mcp-bridge.js`
- Test: `test/webmcp.test.js`, `test/mcp.test.js`

- [ ] Register `answerbook_reading` with direct/question schema and one-shot endpoint.
- [ ] Add the official TypeScript MCP tool and build the checked-in `mcp/dist` output.
- [ ] Add the zero-dependency bridge tool and endpoint branch.
- [ ] Run WebMCP source tests, bridge syntax checks, and MCP build/tests.

### Task 5: 文件、CHANGELOG 與完整驗證

**Files:**
- Modify: `README.md`, `LLM-INTEGRATION.md`, `DEPLOYMENT-vercel.md`, `CHANGELOG.md`, `test/docs.test.js`

- [ ] Document the page, API, Skill, WebMCP, MCP and upstream source.
- [ ] Add a root CHANGELOG entry with the answerbook source link.
- [ ] Run the full Node test suite, MCP build, JavaScript syntax checks, and `git diff --check`.
