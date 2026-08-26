# Complete Service Integrations Design

## Goal

Complete the integration surface for the six local divination services while removing the unused meditation shell. Every local service should expose a browser page, a calculation API, a one-shot AI question API, WebMCP metadata, MCP tooling, and a JavaScript Skill where that surface is supported by the repository.

## Scope

- Keep the existing Qimen and Meihua request/response contracts.
- Keep the existing calculation endpoints for Tarot, Feng Shui, Bazi2, and Yinyuan.
- Add one-shot question endpoints for Tarot, Feng Shui, Bazi2, and Yinyuan.
- Reuse the single configured `llmService` and Discord webhook, with service-specific prompt methods.
- Add JavaScript-only Skills for the four newer services.
- Add MCP tools for the four newer services and compile the MCP package.
- Make WebMCP schemas describe every input accepted by the four newer services.
- Remove `/start`, its view, navigation links, and the meditation WebMCP tool.
- Update API documentation, README, changelog, and automated tests.

## API design

The four new one-shot endpoints follow the existing Qimen/Meihua response style:

```json
{
  "success": true,
  "question": "...",
  "answer": "...",
  "result": {},
  "metadata": { "provider": "...", "model": "...", "language": "zh-tw", "apiVersion": "1.0" },
  "discord": { "questionSent": true, "analysisSent": true, "enabled": true },
  "timestamp": "..."
}
```

Endpoints:

- `POST /api/tarot-question`: `question`, `spread`, optional `seed`, `lang`, and conversation history.
- `POST /api/fengshui-question`: `question`, `facing`, `moveInYear`, `residentYear`, `sex`, `year`, `lang`, and conversation history.
- `POST /api/bazi2-question`: `question`, `date`, optional `time`, `sex`, `calendar`, `name`, `formerName`, `place`, `lang`, and conversation history.
- `POST /api/yinyuan-question`: `question`, `mode`, `firstYear`, `secondYear`, `status`, optional chart objects for chart-dependent modes, `lang`, and conversation history.

Calculation errors return HTTP 400. LLM failures return HTTP 500 with the calculation result and a safe fallback when available. Existing calculation and module LLM endpoints remain unchanged.

## LLM design

`LLMAnalysisService` gains a generic service-analysis method backed by a prompt map for Tarot, Feng Shui, Bazi2, and Yinyuan. All routes use the already configured provider/model fallback chain. Prompts receive only the structured calculation result and user question; they must not alter calculated facts and must give practical, non-fatalistic guidance.

## Agent integrations

- Each new Skill contains `SKILL.md` plus a Node 18 `scripts/ask_*.js` client that calls the corresponding one-shot endpoint.
- MCP source registers four tools with full Zod schemas and returns the answer plus structured metadata. Generated `mcp/dist` is rebuilt from source.
- WebMCP registers the four tools with complete JSON schemas and calls the one-shot endpoints, rather than exposing only a `question` placeholder.
- Qimen and Meihua tools remain intact.

## Removal

Delete the `/start` route and `views/start.html`, remove meditation links from all navigation templates, remove `start_meditation_divination`, and replace the start-page test with an assertion that the obsolete route is unavailable.

## Verification

Add route-level tests for validation and successful calculation-before-LLM behavior using controlled service seams, unit tests for shared request handling, schema tests for WebMCP and MCP, and run the complete Node test suite plus the MCP TypeScript build.
