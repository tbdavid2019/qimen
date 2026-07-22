# 2026-07-22 專案穩定性修復 TODO

## 目標

降低「小修改造成其他功能悄悄壞掉」的風險。修復順序遵循：先建立可重複執行的保護網，再修正已確認的資料錯誤，最後才拆分架構。

## P0：核心測試與已知資料錯誤

- [x] 建立正式的 `npm test` 指令，測試失敗時必須回傳非零 exit code。
- [x] 為八神排布建立回歸測試，驗證八神名稱使用同一套繁體 canonical key。
- [x] 先執行回歸測試並確認會因 `腾蛇`、`太阴` 失敗（RED）。
- [x] 修正 `lib/bashen.js` 的八神 canonical key（GREEN）。
- [x] 為九星、八門、八神排布加入集合與九宮完整性測試。
- [x] 把既有梅花易數固定案例改成真正會失敗的自動測試。
- [x] 加入奇門完整排盤 smoke test，確認九宮資料完整且所有非中宮八神都有分析說明。
- [x] 執行完整測試與語法檢查，記錄驗收結果。

### P0 涉及檔案

- 新增 `test/qimen-components.test.js`
- 新增 `test/meihua.test.js`
- 新增 `test/qimen.test.js`
- 修改 `lib/bashen.js`
- 修改 `package.json`

### P0 完成條件

- `npm test` exit code 為 0。
- 八神回歸測試在修正前可穩定重現名稱不一致，修正後通過。
- 固定日期的奇門排盤包含 9 個宮位，且 8 個非中宮八神都有 `shenFeature`。
- 既有兩組梅花易數對照案例由測試 runner 判定成功，而非只輸出 `✅`／`❌`。
- `node --check` 通過所有本次涉及的 JavaScript 檔案。

### P0 驗收記錄

- RED：`node --test test/qimen-components.test.js` 在修正前為 1 failed，差異精確顯示 `腾蛇`／`太阴` 與 `騰蛇`／`太陰` 不一致。
- GREEN：相同回歸測試在最小修正後為 1 passed、0 failed。
- 完整測試：`TZ=UTC npm test` 為 6 passed、0 failed，確認固定案例不依賴本機台北時區。
- 語法檢查：本次修改及新增的 4 個 JavaScript 檔案全部通過 `node --check`。
- 差異檢查：`git diff --check` 通過，沒有 whitespace error。
- 依賴安裝時 npm 回報的 14 個既有漏洞（3 moderate、10 high、1 critical）已在後續受控安全升級中全部清除。

### 依賴安全升級驗收記錄

- Axios：`1.11.0` → `1.18.1`。
- EJS：`2.7.4` → `6.0.1`，清除 critical template injection 漏洞。
- Express：`4.21.2` → `4.22.2`，保留 v4 API 並取得已修復的間接依賴。
- Nodemon：`2.0.22` → `3.1.14`。
- `path-to-regexp` 與 `picomatch` 已更新至安全版本。
- 已移除 root `pnpm-lock.yaml`，部署統一使用 npm 與 `package-lock.json`。
- `npm ci` 可完整重建依賴，後續 `npm test` 為 6 passed、0 failed。
- `npm audit --audit-level=low` 為 0 vulnerabilities。

## P1：統一輸入、錯誤與請求狀態

- [x] 統一核心錯誤契約；`qimen.calculate()` 不再把例外偽裝成正常結果。
- [x] 所有 HTTP 入口使用同一個排盤輸入驗證器。
- [x] 建立唯一的伺服器端時間／時區解析函式，移除各路由的重複公式。
- [ ] 統一前端時間參數的 5／10 分鐘更新差異。
- [ ] 將 i18n 改為 request-local，不再修改全域 `currentLang`。
- [x] 為錯誤狀態、無效日期和時區加入真實 HTTP API 測試。
- [ ] 為語言併發加入 API 測試。
- [x] npm／pnpm 擇一並只保留一份 root lockfile。
- [ ] 統一 Node.js 版本；更新 `package.json`、README、Dockerfile 與部署設定。
- [x] 檢視 npm audit 報告，逐項升級或替換存在漏洞的直接／間接依賴。

### P1 第一批驗收記錄：核心錯誤契約

- `qimen.calculate()` 現在會驗證日期、排盤方法與時間精度模式，輸入錯誤統一拋出帶有 `code`、`field` 與 `statusCode` 的 `QimenValidationError`。
- 核心計算不再回傳容易被誤認為正常盤面的 `{ error: true }`；未預期錯誤會保留原始例外並交由呼叫端處理。
- 首頁、自定義排盤、奇門 JSON API、LLM 分析與奇門問答的計算錯誤路徑，會將輸入錯誤回覆為 HTTP 400、內部錯誤回覆為 HTTP 500。
- 新增 4 項錯誤契約回歸測試；完整驗收結果記錄於同日 changelog。

### P1 第二批驗收記錄：民用時間解析

- 新增 `lib/civil-time.js`，統一 `userDateTime`、`datetime`、`date`／`time`、毫秒 timestamp、瀏覽器 offset 與 API timezone 的解析。
- `15:00 +08:00` 會固定以所在地 15:00 排盤，不再因 Node.js 執行於 UTC 而重複位移。
- 首頁、自定義排盤、奇門 API、梅花 API、LLM fallback 與兩支問答 API 均改走同一解析器。
- 保留既有 API 參數、成功 response shape，以及只傳 `date` 或 `time` 時的 fallback 行為；既有應用不需重寫。
- 新增純函式、相容層與真實 Express server API 測試；本機與 UTC 完整測試均為 32 passed、0 failed。

## P2：降低模組耦合

- [ ] 刪除 `lib/qimen.js` 中未被執行的重複九星、八門、八神實作。
- [ ] 將領域資料改用穩定 ID，繁簡中文只負責顯示，不再作為跨模組 key。
- [ ] 將 `app.js` 拆為 app factory、server entrypoint 與 qimen／meihua／LLM routes。
- [ ] 抽出共用的排盤結果正規化函式，移除多處九宮空資料補丁。
- [ ] 將 LLM 與 Discord 副作用移到 service boundary，讓路由可獨立測試。
- [ ] 加入 CI：安裝、測試、語法／lint、MCP build。

## 執行原則

- 每個行為修正都先新增會失敗的測試。
- 一次只修正一個根因，不混入無關 UI 或格式調整。
- 每階段完成後執行完整測試，不以人工瀏覽輸出取代 assertion。
- 保留既有 API response shape；需要破壞相容性的修改另開變更規格。
