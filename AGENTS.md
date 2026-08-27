# Antigravity Agent Guidelines for 333 Divination Suite

This repository is a production-grade traditional Chinese divination & metaphysics suite ("333 一句提醒·照見當下"), encompassing Qimen Dunjia (奇門遁甲), Meihua Yishu (梅花易數), Bazi (八字命理), Fengshui (易經風水), Tarot (韋特塔羅), Yinyuan (月老姻緣), and Answerbook (解答之書).

---

## 🚨 Mandatory Directives (嚴格執行準則)

1. **嚴禁敷衍與閹割 (Zero Castrated Versions)**:
   - All divination modules must implement complete, authentic classical algorithms and full datasets (e.g. 100 sticks for Yinyuan, 78 cards for Tarot, 24 mountains & 9 periods for Fengshui, complete Shensha & Geju for Bazi, 5-hexagram holographic system & 384 Yao for Meihua, complete 18 Dun & Sanqi Liuyi & Geju for Qimen).
   - No mock/placeholders in production calculation paths.

2. **全介面端到端一致性，嚴禁掛一漏萬 (Full-Stack 5-Layer Parameter Alignment)**:
   - Whenever any feature, algorithm, or parameter is introduced or upgraded, you **MUST** ensure all 5 layers are synchronously updated and aligned without exception:
     1. **Web UI (`views/*.html`, `public/js/*.js`, `public/css/*.css`)**: Complete input fields, radio pill groups, active state highlights, form validation, and localized UX.
     2. **API Endpoint (`app.js`, `lib/*.js`)**: Complete request parsing, error boundary handling, structured response, and LLM prompt generation.
     3. **CLI & Skill (`skills/*-consultant/SKILL.md`, `skills/*-consultant/scripts/*.js`)**: Standalone Node.js scripts supporting both JSON/stdin and CLI arguments, with complete parameter documentation in `SKILL.md`.
     4. **WebMCP Standard (`public/js/webmcp.js`)**: Full Chrome WebMCP tool definitions, complete JSON Schema properties & enums, declarative form markup, and client tool execution.
     5. **Documentation (`README.md`, `CHANGELOG.md`)**: Full parameter references, user guide, and dated changelog entry.

3. **重大變更同步更新文檔 (Always Synchronize README.md & CHANGELOG.md)**:
   - Whenever major features, new modules, or parameter schemas are added, **MANDATORILY** update `README.md` with complete documentation and update `CHANGELOG.md` with an accurate dated entry (`YYYY-MM-DD`).

4. **測試與品質保證 (100% Test Pass Rate)**:
   - Always run `npm test` after changes and ensure 100% pass rate before reporting completion.
   - Node.js runtime only: Do not introduce Python runtime dependencies into the Vercel/Node serving path.

5. **文化素養與正向引導 (Professional Metaphysics Persona)**:
   - Adhere to the core motto: "傳統智慧，理性解讀；照見當下，指引行動".
   - Do not make absolute supernatural predictions or create fear/anxiety; empower the user with concrete, constructive next actions.
