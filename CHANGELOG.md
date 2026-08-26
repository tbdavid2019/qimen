# 更新日誌 (Changelog)

所有本專案的重要更新都將記錄在此文件中。

## [2026-08-26]

- 移除沒有實際計算作用的「靜心問事」入口：刪除 `/start`、頁面、導航連結與 WebMCP 工具。
- 新增塔羅、風水、生辰八字2、姻緣四個一站式問答 API，統一支援 JavaScript 計算、同一組 LLM fallback、AI 回覆與 Discord 完整記錄。
- 新增四份 JavaScript Skill：`tarot-consultant`、`fengshui-consultant`、`bazi2-consultant`、`yinyuan-consultant`。
- WebMCP 四個套件工具改為完整輸入 schema，並直接呼叫對應一站式 API。
- 官方 MCP Server 與零依賴 `mcp-bridge.js` 均先擴充至六個服務工具，後續再加入解答之書成為七個服務。
- 新增「解答之書」頁面與 `POST /api/answerbook-question`：支援直接默念取得原始答案，以及輸入問題後由共用 LLM 解讀。
- 新增 `answerbook-consultant` JavaScript Skill、WebMCP `answerbook_reading`、官方 MCP 與 bridge 工具，並將導覽列擴充至七個服務。
- 解答之書後端代理使用 `GET https://answerbook.david888.com/answersOriginal`，保存原始答案、問題與 AI 回應至 Discord。
- `/api/docs`、README、LLM 整合與 Vercel 文件同步更新。
- 新增共用服務問答流程、模組專用 AI 提示詞、API／Skill／MCP／文件回歸測試。
- 全站導覽列將外部八字站改名為「888人生K線」，移至最右側並保留 `target="_blank"` 新視窗開啟。
- 優化新增術數服務的 Discord Webhook：以易讀 Embed 分區呈現問題、輸入、計算摘要與 AI 回覆，完整原始資料改以 JSON 附件保存。
- 統一全站 footer，移除舊版「333奇門遁甲梅花易數排盤系統 © 2026」文字，只保留技術提供與年度資訊；網站品牌標題為「333 一句提醒·照見當下」。
- 新增 1200×630 `og-image.png`，補齊 Open Graph 圖片尺寸、格式、安全 URL 與 alternate locale metadata，並同步完善 Twitter Card、robots、canonical 與 JSON-LD 描述。
- 首頁 SEO 標題與描述擴充至適合搜尋與社群摘要的完整長度，涵蓋奇門、梅花、塔羅、風水、八字、姻緣與解答之書服務。

### 本次採用的參考來源

- [daman-ovo-0404/tarot-skill](https://github.com/daman-ovo-0404/tarot-skill)：塔羅 78 張牌與六種牌陣規劃；本專案以 JavaScript 重新實作抽牌服務。
- [voidforall/fengshui.skill](https://github.com/voidforall/fengshui.skill)：八宅、九運飛星與居家建議流程；本專案以 JavaScript 重新實作 API。
- [jinchenma94/bazi-skill](https://github.com/jinchenma94/bazi-skill)：四柱、十神、藏干、大運與流年分析方向；本專案保留生辰八字2的 JavaScript 計算核心。
- [Ming-H/yinyuan-skills](https://github.com/Ming-H/yinyuan-skills)：生肖、合婚、夫妻宮、姻緣籤、桃花與紅線模式；本專案以 JavaScript API 與 Skill 重新整合。
- [解答之書 API](https://answerbook.david888.com/answersOriginal)：提供原始 `{ answer }` 回應；本專案以後端代理整合 direct/question 兩種流程。

## [2026-08-25]

- 修正八宅明鏡八宅遊年九星表，補正坤宅、艮宅重複星，並校正八宅完整方位配置與伏位。
- 修正八字十神，加入天干陰陽同性／異性判斷，完整支援比肩、劫財、食神、傷官、偏印、正印、偏財、正財、七殺與正官。
- 修正八字缺少出生日期時的輸入驗證，改回傳明確的「請提供出生日期」訊息。
- 新增塔羅、風水、生辰八字2與月老姻緣四個頁面與 Express API。
- 將塔羅抽牌與八字排盤邏輯以純 JavaScript 實作，可在 Vercel Node runtime 執行，不需要 Python。
- 新增八宅／九運飛星、八字四柱與大運、生肖／合婚／籤詩／桃花／紅線等結構化結果。
- 新增模組化 Discord 完整記錄，會保存輸入、計算結果及使用者主動觸發的 AI 解讀。

### 參考來源

本次四個模組的功能規劃與規則整理參考以下公開專案；實際執行邏輯已改寫為本 repo 的 JavaScript 模組：

- [daman-ovo-0404/tarot-skill](https://github.com/daman-ovo-0404/tarot-skill)：78 張牌、六種牌陣、牌間關係與安全抽牌流程。
- [voidforall/fengshui.skill](https://github.com/voidforall/fengshui.skill)：三元玄空飛星、八宅明鏡、形勢與擇日流程。
- [jinchenma94/bazi-skill](https://github.com/jinchenma94/bazi-skill)：四柱八字、十神藏干、神煞、大運與流年分析流程。
- [Ming-H/yinyuan-skills](https://github.com/Ming-H/yinyuan-skills)：八字合婚、生肖配對、夫妻宮、姻緣籤、桃花與紅線模式。

## [2026-08-23]

### 🌐 WebMCP (Web Model Context Protocol) 支援

- **支援 Chrome WebMCP 規範**：整合最新 Chrome WebMCP 標準（支援 `document.modelContext` 及前導 `navigator.modelContext` 相容），讓 AI 瀏覽器代理（如 Chrome 內建 AI、Model Context Tool Inspector 等）能直接探索並在頁面上調用排盤與占卜工具。
- **命令式工具註冊（Imperative API）**：
  - `qimen_divination`：奇門遁甲即時起盤與 AI 大師深度解盤。
  - `qimen_custom_paipan`：奇門遁甲自定義排盤（四柱、時家/日家/月家/年家、時間精度模式、自訂時地）。
  - `get_current_pan`：擷取當前頁面奇門遁甲盤九宮結構化資料。
  - `switch_time_mode`：切換進階九時段模式（13分鐘法）與傳統時辰模式（2小時）。
  - `switch_theme`：切換暗黑（dark）與明亮（light）主題風格。
  - `meihua_qigua_time`：梅花易數時間起卦（本卦、互卦、變卦、體用五行與爻辭）。
  - `meihua_qigua_numbers`：梅花易數三數字起卦（1-100）。
  - `meihua_divination`：梅花易數大師解卦。
  - `start_meditation_divination`：靜心問事並啟動起盤流程。
- **宣告式表單支援（Declarative API）**：
  - 首頁、梅花易數頁及靜心起盤頁的所有主要表單均加上 `toolname`、`tooldescription`、`toolautosubmit` 與 `toolparamdescription` 屬性。
  - 支援表單 `event.agentInvoked` 判斷與 `event.respondWith(...)` 回應。
  - 支援全域 `toolactivated` 與 `toolcancel` 事件監聽與動態 Toast 提示反饋。
- **WebMCP 樣式規範**：
  - 實作官方規範的 `form:tool-form-active` 聚焦虛線外框與 `button:tool-submit-active` 提交光暈，並完整支援深色模式。
- **安全性標頭**：
  - Express 伺服器預設回傳 `Permissions-Policy: tools=(self)` 標頭。
- **測試**：
  - 新增 `test/webmcp.test.js` 完整覆蓋 WebMCP 模組定義、JSON Schema 規範、HTML 宣告式屬性、CSS 偽類樣式與 HTTP 安全標頭。
  - 完整測試結果：54 passed、0 failed。

## [2026-08-11]

### 🤖 AI 穩定性

- 新增 `LLM_MODELS` 多模型設定，模型會依照設定順序依序嘗試。
- 新增 `LLM_FALLBACK_MODELS`，可在保留 `LLM_MODEL` 的情況下追加備援模型。
- 當模型呼叫失敗、逾時或回傳空白內容時，自動切換下一個模型；全部模型失敗後才使用內建備用分析。
- 保留既有單一 `LLM_MODEL` 設定，不需要修改既有部署配置。
- README 與環境設定範例更新為 `gpt-5.6-sol`、`gpt-5.6-terra`、`gpt-5.6-luna`。

### 🧪 測試

- 新增多模型 fallback、空白回覆 fallback 與單一模型相容性測試。
- 完整測試結果：46 passed、0 failed。

## [2026-07-22]

### 🔒 安全性

- 將 Axios 從 1.11.0 升級至 1.18.1，修復 DoS、SSRF、header injection 與 prototype pollution 相關漏洞。
- 將 EJS 從 2.7.4 升級至 6.0.1，修復 critical template injection 與 pollution protection 漏洞。
- 將 Express 從 4.21.2 升級至 4.22.2，在保留 Express 4 API 的前提下更新 `body-parser`、`path-to-regexp` 與 `qs`。
- 將 Nodemon 從 2.0.22 升級至 3.1.14，移除開發依賴鏈漏洞。
- 更新 Axios／Express／Biome 相關間接依賴；`npm audit --audit-level=low` 結果為 0 vulnerabilities。
- 移除 root `pnpm-lock.yaml`，統一由 npm 與 `package-lock.json` 提供可重現的 Vercel 安裝結果。

### 🧪 測試與穩定性

- 建立正式 `npm test` 指令，測試範圍限定在離線的 `test/*.test.js`，避免舊 QA 腳本誤呼叫外部服務。
- 新增奇門九星、八門、八神完整性測試，以及完整排盤 smoke test。
- 將兩組梅花易數固定案例轉為真正會回傳失敗狀態的自動測試。
- 修正八神模組輸出的 `腾蛇`／`太阴` 為 canonical `騰蛇`／`太陰`，恢復吉凶分數與八神說明查找。
- 在本機時區與 UTC 環境完成 6 項測試，皆為 6 passed、0 failed。
- 統一奇門核心錯誤契約：無效日期、排盤方法與時間精度模式會拋出具穩定 `code`／`field` 的 `QimenValidationError`。
- `qimen.calculate()` 不再以 `{ error: true }` 偽裝失敗結果；HTTP 入口會將輸入錯誤映射為 400、未預期錯誤映射為 500。
- 新增錯誤契約與 HTTP 狀態分流測試，避免錯誤結果流入模板、LLM 或 API 成功回應。
- 完整測試在本機時區與 UTC 均為 10 passed、0 failed；安全檢查維持 0 vulnerabilities。
- Vercel 正式站驗收：有效固定盤 API 與首頁均回傳 200，盤面包含完整 9 宮；非法 `method`、`timePrecisionMode` 與首頁日期皆回傳 400。

### 🕒 API 時間一致性

- 新增單一民用時間解析器，所有奇門、梅花、LLM fallback 與問答入口共用相同的時間優先序、時區換算與嚴格日曆驗證。
- 修正 Vercel UTC 環境將 `15:00 +08:00` 再位移為其他時刻的問題；相同輸入在台北與 UTC 主機均使用 15:00 排盤。
- 保留既有 API method、參數名稱、成功 response shape 與 partial date/time fallback，既有應用不需改寫。
- 非法 datetime、timestamp、timezone 與 timezoneOffset 統一回傳 HTTP 400，並附加穩定的 `code` 與 `field`。
- 新增真實 Express server API 測試，覆蓋 `/api/qimen`、梅花起卦、LLM fallback、奇門問答與梅花問答；測試會在外部 LLM／Discord 呼叫前驗證失敗。
- 完整測試在本機時區與 UTC 均為 32 passed、0 failed。
- Vercel 正式站驗收：固定奇門盤維持 `2026-01-20 15:00:00` 且包含 9 宮；首頁與相容 fallback 回傳 200，五支時間相關 JSON API 的非法輸入均回傳 400 與正確 `INVALID_DATETIME` 欄位。

### 📝 AI Markdown 顯示

- 新增奇門與梅花共用的零依賴 Markdown renderer，統一初始分析與後續問答的顯示結果。
- 支援 GFM pipe table 與欄位對齊，修正表格原始 `|`、`---` 直接顯示的問題。
- 共用標題、清單與程式碼排版；表格在窄螢幕可橫向捲動，並補齊暗色模式配色。
- 梅花 AI 回覆改用完整內容寬度，減少長篇分析右側的不必要留白。
- 所有輸入先做 HTML escape，並加入 script／事件屬性注入回歸測試。
- 此次沒有變更 API request 或 response 規格，後端與既有應用不需重寫。
- Markdown focused tests 為 11 passed、0 failed；完整測試在本機與 UTC 均為 43 passed、0 failed。
- Vercel 正式站驗收：首頁、梅花頁、renderer 與共用 CSS 均回傳 200；兩頁皆先載入 renderer，再載入頁面程式。正式 renderer 與本機 SHA-1 完全一致。
- 正式站 DOM 注入固定 Markdown 案例後產生 1 個標題、2 欄表格、3 列（含表頭）及粗體內容；表格容器為 `overflow-x: auto`，桌面回覆寬度可使用對話區的大部分空間。最終人工畫面操作由站方驗收。

## [2026-04-08]

### 🚀 新功能
- **零依賴 MCP 橋接腳本 (`mcp-bridge.js`)**: 
  - 實作了一個輕量級的 Node.js 腳本，不需安裝任何 `node_modules` 即可運作。
  - 支援 Model Context Protocol (MCP)，方便 LLM 代理（如 Claude Desktop）直接呼叫奇門與梅花占卜工具。
  - 提供 `qimen_divination` 與 `meihua_divination` 工具對接。

### 🎨 介面更新
- **導航欄新增「生辰八字」連結**:
  - 在全站導航欄中添加了指向 `https://bazi.david888.com/` 的快捷連結。
  - 設定為在新分頁開啟 (`target="_blank"`)，提升使用者在不同命理工具間的轉換體驗。

### 🛠️ 技術優化
- **專案結構整理**: 確保 MCP 相關文件與導航欄更新在各頁面間的一致性（`index.html` 與 `meihua.html`）。
