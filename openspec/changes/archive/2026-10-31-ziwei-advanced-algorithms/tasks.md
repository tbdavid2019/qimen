# Tasks

## 1. 星曜廟旺善本校驗與十二神煞模組

- [x] 1.1 校驗並更新 `lib/ziwei.js` 中的 `STAR_BRIGHTNESS` 善本標準（太陰午宮陷、天機辰戌廟、天府辰戌旺等 24 處差異），並新增單元測試驗證廟旺準確性
- [x] 1.2 建立 `lib/ziwei-shensha.js`，實現將前十二神、歲前十二神與博士十二神煞起盤算法，並驗證起神煞單元測試

## 2. 34 種正統古籍格局判定庫 (Patterns Engine)

- [x] 2.1 建立 `lib/ziwei-patterns.js`，完整實作 34 種古籍格局判定邏輯（涵蓋三方四正、夾宮、成格條件 required、加分 bonus、破格 breaking、出處 source）
- [x] 2.2 整合至 `lib/ziwei.js` 的 `calculateZiweiChart`，輸出結構化 `patterns` 並保留向後相容欄位，通過單元測試

## 3. 夫妻宮深層斷語與雙人紫微合婚 (Match Engine)

- [x] 3.1 擴充夫妻宮十四主星與四化星情深層畫像（性格、外型、年齡差與婚期建議）
- [x] 3.2 建立 `lib/ziwei-match.js` 實現 `evaluateZiweiMatch` 雙盤比對算法（命宮契合、夫妻宮投射、四化互照、煞星衝破），輸出 0-100 評分與相處指南，並通過單元測試

## 4. 全端五層對齊與整合 (UI / API / CLI / WebMCP / Docs)

- [x] 4.1 更新 `app.js` API 端點：`/api/ziwei/chart` 回傳格局條件與神煞，新增 `/api/ziwei/match` 雙盤合婚端點
- [x] 4.2 更新 `views/ziwei.html` 與 `public/js/ziwei.js`：視覺展示 34 種格局（吉/平/課題標籤、成格破格卡片）、宮位神煞折疊標籤、以及合盤互動模組
- [x] 4.3 更新 CLI 腳本 `skills/ziwei-consultant/scripts/ziwei_cli.js` 與 `SKILL.md`，支援 `--match` 與詳細格局
- [x] 4.4 更新 `public/js/webmcp.js`，擴充 `calculate_ziwei_chart` 並註冊 `match_ziwei_charts` 工具
- [x] 4.5 執行全套測試 `npm test`（確保 100% 通過），同步更新 `CHANGELOG.md` 與 `README.md`
