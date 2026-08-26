# Complete Service Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended; unavailable for this direct mainline session) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete API, Skill, WebMCP, MCP, documentation, and test coverage for Tarot, Feng Shui, Bazi2, and Yinyuan while removing the unused meditation shell.

**Architecture:** Preserve existing calculation endpoints and add a shared one-shot question flow that calculates a module result, calls the existing single `llmService`, records the complete exchange through the existing Discord webhook, and returns a unified response. Agent-facing Skills and MCP/WebMCP tools call those one-shot endpoints with explicit schemas.

**Tech Stack:** Node.js 18+, Express 4, native `fetch`, existing Axios LLM/Discord client, Node test runner, TypeScript MCP SDK, Zod, EJS templates.

---

### Task 1: Lock down the new API contracts with failing tests

**Files:**
- Modify: `test/api-time-routes.test.js`
- Create: `test/service-question-routes.test.js`

- [ ] **Step 1: Add tests for required question validation**

  Add tests that POST an empty question to each new endpoint and assert HTTP 400 with `success: false` and the existing required-question message.

- [ ] **Step 2: Add tests for module-specific input validation**

  Assert Tarot rejects an unknown spread, Feng Shui rejects an unknown facing, Bazi2 rejects a missing date, and Yinyuan rejects an unknown mode before any external LLM/Discord call.

- [ ] **Step 3: Run the focused tests and verify RED**

  Run `node --test test/service-question-routes.test.js`. The expected result is four or more failures because the routes do not yet exist.

### Task 2: Add shared service-question orchestration

**Files:**
- Create: `lib/service-question.js`
- Modify: `app.js:1-150`
- Modify: `lib/llm-analysis.js`
- Test: `test/service-question.test.js`

- [ ] **Step 1: Test the orchestration contract**

  Test that a valid module definition calculates once, calls the module LLM method with the question/history/language, sends one complete Discord record, and returns `result`, `answer`, provider/model metadata, and Discord status. Test invalid input returns a 400-shaped error without calling external dependencies.

- [ ] **Step 2: Implement `createServiceQuestionHandler`**

  Implement a small dependency-injected helper accepting `calculate`, `analyze`, `moduleName`, `resultKey`, and `validate`. It must normalize `question`, `conversationHistory`, and `lang`, call the calculator, call the analyzer, record both calculation and final analysis using the existing webhook methods, and produce the unified response.

- [ ] **Step 3: Add module-specific LLM analysis**

  Add `analyzeTarot`, `analyzeFengShui`, `analyzeBazi2`, `analyzeYinyuan`, and a shared `analyzeService` prompt path to `LLMAnalysisService`. Keep the current Qimen and Meihua methods unchanged.

- [ ] **Step 4: Run unit tests and verify GREEN**

  Run `node --test test/service-question.test.js` and confirm all new orchestration tests pass.

### Task 3: Register the four one-shot Express APIs

**Files:**
- Modify: `app.js:99-152`
- Modify: `app.js:890-1140`
- Modify: `test/service-question-routes.test.js`

- [ ] **Step 1: Add route tests for successful calculation responses**

  Stub the injected orchestration seam in the test or use deterministic calculation-only mode to assert each endpoint returns its module result key and does not change existing calculation routes.

- [ ] **Step 2: Register module definitions**

  Register `POST /api/tarot-question`, `/api/fengshui-question`, `/api/bazi2-question`, and `/api/yinyuan-question`. Reuse `drawCards`, `calculateFengShui`, `calculateBazi`, and the six existing Yinyuan modes.

- [ ] **Step 3: Add complete API documentation**

  Extend `/api/docs` with the four routes, parameter schemas, response shape, and Discord/LLM behavior.

- [ ] **Step 4: Run focused route tests and verify GREEN**

  Run `node --test test/service-question-routes.test.js`.

### Task 4: Remove the meditation shell

**Files:**
- Delete: `views/start.html`
- Modify: `app.js:78-81`
- Modify: `views/index.html`
- Modify: `views/meihua.html`
- Modify: `views/tarot.html`
- Modify: `views/fengshui.html`
- Modify: `views/bazi2.html`
- Modify: `views/yinyuan.html`
- Modify: `public/js/webmcp.js`
- Modify: `test/webmcp.test.js`
- Modify: `README.md`

- [ ] **Step 1: Add the removal regression test**

  Assert the Express app no longer serves `/start` and no template contains the old meditation navigation/tool name.

- [ ] **Step 2: Remove route, view, links, and WebMCP tool**

  Delete the route and template, remove every meditation navigation item, and remove `start_meditation_divination` from definitions and registration.

- [ ] **Step 3: Run removal tests and verify GREEN**

  Run `node --test test/webmcp.test.js`.

### Task 5: Add four JavaScript Skills

**Files:**
- Create: `skills/tarot-consultant/SKILL.md`
- Create: `skills/tarot-consultant/scripts/ask_tarot.js`
- Create: `skills/fengshui-consultant/SKILL.md`
- Create: `skills/fengshui-consultant/scripts/ask_fengshui.js`
- Create: `skills/bazi2-consultant/SKILL.md`
- Create: `skills/bazi2-consultant/scripts/ask_bazi2.js`
- Create: `skills/yinyuan-consultant/SKILL.md`
- Create: `skills/yinyuan-consultant/scripts/ask_yinyuan.js`
- Create: `test/skills.test.js`

- [ ] **Step 1: Test Skill metadata and script syntax**

  Test each `SKILL.md` has frontmatter name/description, each script exists, and `node --check` succeeds.

- [ ] **Step 2: Implement the four SKILL.md files**

  Document trigger conditions, complete JSON parameters, one-shot endpoint, interpretation workflow, non-fatalistic tone, and the fact that scripts use JavaScript/fetch only.

- [ ] **Step 3: Implement the four scripts**

  Use Node 18 native `fetch`, accept JSON from a CLI argument or stdin, default endpoint to `https://qi.david888.com`, and print the API JSON without exposing environment secrets.

- [ ] **Step 4: Run Skill tests and verify GREEN**

  Run `node --test test/skills.test.js`.

### Task 6: Expand WebMCP schemas and execution

**Files:**
- Modify: `public/js/webmcp.js:558-577`
- Modify: `test/webmcp.test.js`

- [ ] **Step 1: Add schema assertions**

  Assert every new tool advertises all required module fields and points to its one-shot endpoint.

- [ ] **Step 2: Replace `createSuiteTool` placeholders**

  Give Tarot, Feng Shui, Bazi2, and Yinyuan explicit object schemas with enums, required fields, and descriptions. Make execution call the matching one-shot API and return the answer plus structured result.

- [ ] **Step 3: Run WebMCP tests and verify GREEN**

  Run `node --test test/webmcp.test.js`.

### Task 7: Expand MCP source and compiled output

**Files:**
- Modify: `mcp/src/tools/divination.ts`
- Modify: `mcp/src/services/api.ts`
- Modify: `mcp/package.json` only if build scripts require it
- Regenerate: `mcp/dist/`
- Modify: `test/mcp.test.js`

- [ ] **Step 1: Add MCP schema tests**

  Assert the four new tool names, required fields, endpoint payloads, and readable response formatting.

- [ ] **Step 2: Implement typed response interfaces and four tools**

  Register full Zod schemas and call the four new one-shot endpoints through `makeApiRequest`.

- [ ] **Step 3: Build the MCP package**

  Run `npm --prefix mcp run build` and ensure `mcp/dist` matches source.

- [ ] **Step 4: Run MCP tests and verify GREEN**

  Run `node --test test/mcp.test.js`.

### Task 8: Synchronize documentation and changelog

**Files:**
- Modify: `README.md`
- Modify: `LLM-INTEGRATION.md`
- Modify: `DEPLOYMENT-vercel.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Document all six services and all agent surfaces**

  Replace stale “Qimen/Meihua only” descriptions with the six-service matrix, API examples, Skill paths, WebMCP names, MCP names, and the removed meditation route.

- [ ] **Step 2: Add reference sources to root CHANGELOG.md**

  List the four GitHub reference Skills and note which JavaScript behavior/data structures were adopted.

- [ ] **Step 3: Verify documentation references**

  Run `rg -n "/start|start_meditation|tarot-question|fengshui-question|bazi2-question|yinyuan-question|tarot-consultant|fengshui-consultant|bazi2-consultant|yinyuan-consultant" README.md LLM-INTEGRATION.md DEPLOYMENT-vercel.md CHANGELOG.md` and confirm no stale removal references remain.

### Task 9: Full verification

**Files:**
- Test: `test/*.test.js`
- Test: MCP build

- [ ] **Step 1: Run the complete Node suite**

  Run `npm test` and confirm zero failures.

- [ ] **Step 2: Run JavaScript syntax checks**

  Run `node --check app.js`, `node --check lib/service-question.js`, and `find skills -name '*.js' -print0 | xargs -0 -n1 node --check`.

- [ ] **Step 3: Build MCP**

  Run `npm --prefix mcp run build` and confirm exit code 0.

- [ ] **Step 4: Review the diff and status**

  Run `git diff --check`, `git status --short`, and inspect changed files for accidental secrets or unrelated edits.
