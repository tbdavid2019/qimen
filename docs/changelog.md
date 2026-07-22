# 更新日誌 (Changelog)

所有本專案的重要更新都將記錄在此文件中。

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
