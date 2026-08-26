# 解答之書整合設計

## 目標

把 `https://answerbook.david888.com/answersOriginal` 整合成第七個術數服務，提供「直接默念取得答案」與「輸入問題後取得答案並由 LLM 解讀」兩種流程，並讓網站、REST API、Skill、WebMCP、官方 MCP 與零依賴 MCP bridge 使用同一套服務語意。

## 使用者流程

### 直接默念

使用者在 `/answerbook` 選擇直接默念，不輸入問題，按下按鈕後由後端代理呼叫解答之書端點。畫面顯示原始答案及中英文換行，不呼叫 LLM；Discord 仍保存模式、原始答案與空白 AI 欄位。

### 輸入問題並解讀

使用者輸入問題後送出，後端代理取得解答之書原始答案，再以共用 `LLM_API_KEY`、模型 fallback 與服務專用角色交給 LLM。畫面同時顯示原始答案與 AI 解讀，Discord 保存完整輸入、原始答案及 AI 回應。

## API 與資料流

- `POST /api/answerbook-question`
  - `question` 可省略或為空，代表直接默念模式。
  - 有內容時代表問題解讀模式。
  - 後端以 `GET https://answerbook.david888.com/answersOriginal` 取得 `{ answer: string }`。
  - 回傳 `mode`、`answer`、`rawAnswer`、`analysis`、`metadata`、`discord` 與時間戳。
  - 解答之書上游失敗時回傳清楚的 502 錯誤；LLM 失敗時保留原始答案並回傳可辨識的 fallback 狀態。

## 代理整合

- `skills/answerbook-consultant/SKILL.md` 與 Node.js 腳本呼叫一站式 API；腳本支援 `--mode direct|question` 與 JSON stdin/引數。
- WebMCP `answerbook_reading` 提供 `mode`、`question`、`lang` 與 `conversationHistory` schema。
- 官方 MCP 與 `mcp-bridge.js` 暴露相同工具與相同一站式 API。

## 前端

新增 `views/answerbook.html` 與 `public/js/answerbook.js`，沿用 suite page 的 header/nav、卡片、載入、結果與錯誤樣式。直接默念只顯示原始答案；問題模式顯示原始答案及 AI 解讀。所有既有頁面的導覽列都加入解答之書連結。

## 測試與文件

使用注入式 HTTP/LLM stub 測試兩種 API 模式與錯誤處理；測試 Skill、WebMCP、MCP schema、導覽與頁面。README、LLM-INTEGRATION、API docs、部署文件與根目錄 CHANGELOG 必須列出新服務及其來源。
