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

6. **極致視覺轉換率與高質感 UI 設計規範 (High-Converting & Aesthetic UI Design System - "Punchy & Prominent")**:
   - **全面貫徹「精簡吸睛、高對比底色、放大字重、微光暈懸浮」設計風格**：所有跨模組導流卡片、特色功能橫幅（Banners）、推薦標籤與重點互動元件均須嚴格採用此標準，杜絕平淡灰白底與微型小字。
   - **文案原則 (Punchy & Concise Copy)**：
     - 主標題精煉直擊好奇心（如「💍 看出你未來另一半」、「⚡ 男生真實尺寸速測」），杜絕長篇生硬的術語標題。
     - 必備高對比彩色膠囊小標籤（Badges，如「🔥 夫妻宮直斷」、「🔥 隱私雙核」），放置於主標題旁。
     - 副標題直擊用戶核心關切（如「大你幾歲？長相、性格與相遇時機全揭秘」），字數精煉、口語流暢。
     - 行動呼籲（CTA）按鈕必須具備指向箭頭與強烈動詞（如「立即揭秘 ➔」、「立即測算 ➔」），嚴禁平淡的「送出」或「確定」。
   - **字體層次與視覺呼吸感 (Typography & Hierarchy)**：
     - 主標題：`17px - 18px`，`font-weight: 800`，微縮字距（`-0.2px`），醒目不突兀。
     - 副標題：`13.5px`，`font-weight: 500`，舒適行高（`1.4 - 1.5`），文字清晰易讀。
     - 圖標容器：`46px - 48px` 圓角（`border-radius: 12px`）半透明懸浮玻璃容器，內嵌 `28px - 34px` 大圖標。
     - 按鈕規格：`14px` 粗體（`font-weight: 700`），`padding: 8px 18px`，精緻圓角膠囊（`border-radius: 20px`）。
     - 表單呼吸感：表單輸入框與送出按鈕間必須保持 `24px - 26px` 呼吸間距（使用 `.suite-submit-container`），嚴禁擠壓緊貼。
   - **底色、漸層與微光暈陰影 (Vibrant Gradients & Ambient Glow)**：
     - 杜絕與米白/淺灰背景融為一體的平淡白底或細灰邊框。
     - 必須採用「高對比雙色/三色亮麗漸層」＋「1.5px~2px 飽和色邊框」＋「同色系環境光暈陰影（Ambient Glow Box-Shadow）」：
       - **感情/姻緣/桃花**：浪漫玫瑰粉漸層（`#fff0f3` ~ `#ffd1dc`）＋粉紅邊框（`#fda4af`）＋玫瑰光暈（`rgba(244, 63, 94, 0.16)`）＋珊瑚粉漸層按鈕。
       - **活力/尺寸/實戰/神速**：暖金琥珀漸層（`#fffbeb` ~ `#fde68a`）＋金琥珀邊框（`#fcd34d`）＋琥珀光暈（`rgba(245, 158, 11, 0.16)`）＋琥珀金漸層按鈕。
       - **智慧/事業/財運**：翡翠綠或群青藍漸層＋飽和邊框＋微光陰影。
     - Hover 動態回饋：微幅浮起（`transform: translateY(-2px)`）搭配光暈加深擴散，強化可點擊暗示。
     - 暗黑模式（Dark Mode）嚴格適配：採用半透明深色微光玻璃漸層（如 `rgba(..., 0.24)`）搭配彩色發光邊框，杜絕反白刺眼或失去對比度。
   - **響應式適配 (Mobile First)**：
     - 採用 `repeat(auto-fit, minmax(320px, 1fr))` 彈性網格，在手機螢幕（`< 768px`）自動轉為優雅單欄堆疊，觸控標靶清晰（按鈕高度與間距適中），杜絕橫向破版溢出。
