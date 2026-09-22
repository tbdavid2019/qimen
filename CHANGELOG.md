# 更新日誌 (Changelog)

所有本專案的重要更新都將記錄在此文件中。

## [2026-09-22]

### 🛡️ Cloudflare Turnstile 機器人防護升級：全站 8 大模組網頁「詢問」與「解盤」Token 全面防刷防護，外部 API 維持純淨開放

- **全站 8 大服務前端「詢問」與「解盤」LLM Token 防刷防護 (`views/*.html`, `public/js/app.js`, `public/js/meihua.js`, `public/js/divination-suite.js`, `public/js/answerbook.js`, `app.js`)**：
  - **奇門遁甲問答與解盤防護**：於首頁 `#qimenQuestionForm` 獨立掛載 `#question-turnstile` 安全元件，前端點擊「💬 詢問」或「開始解盤」時主動校驗 Turnstile 狀態，將憑證注入 `/api/llm-analysis`。成功或失敗後自動調用 `turnstile.reset()`，支援流暢續問。
  - **梅花易數解卦防護**：於 `#meihuaQuestionForm` 掛載 `#meihua-turnstile`，前端點擊「🌸 梅花解卦」時強制校驗，發送至 `/api/meihua/llm-analysis`。
  - **術數套件全面防護 (紫微、八字、塔羅、風水、月老)**：於 `ziwei.html`、`bazi2.html`、`tarot.html`、`fengshui.html`、`yinyuan.html` 之主表單 (`#suiteForm`) 與追問表單 (`#suiteFollowUpForm`) 均掛載 Turnstile 安全驗證元件。前端 `public/js/divination-suite.js` 於排盤解讀與後續追問時強制校驗憑證，並自動重置元件。紫微快速測算模式（未來另一半、男生真實尺寸）因屬確定性演算法不耗費 LLM Token，智慧隱藏驗證元件以保持秒開極速體驗。
  - **解答之書解讀防護**：於 `answerbook.html` 嵌入 `#answerbook-turnstile`，`public/js/answerbook.js` 於「💬 輸入問題並解讀」模式下強制人機驗證，防護文字解讀 LLM Token。
  - **後端端點中介層保護**：針對 `/api/llm-analysis`、`/api/meihua/llm-analysis` 以及所有術數套件解讀端點 `/api/:module/llm-analysis` 施加 `turnstileMiddleware` 嚴格校驗，有效防範惡意爬蟲無節制調用消耗使用者的珍貴 LLM Token 額度。
- **外部 API 100% 開放無阻保證 (`app.js`, `test/turnstile.test.js`)**：
  - 所有供 Telegram Bot、OpenClaw、CLI 腳本（`ask_qimen.js` 等）與第三方調用的專屬 API 端點（`POST /api/qimen-question`、`POST /api/meihua-question`、`POST /api/ziwei-question`、`POST /api/tarot-question`、`POST /api/fengshui-question`、`POST /api/bazi2-question`、`POST /api/yinyuan-question`、`POST /api/answerbook-question`）**絕不掛載 Turnstile**，徹底杜絕 403 誤傷，確保自動化調用永遠暢通無阻。
- **WebMCP 跨工具對齊 (`public/js/webmcp.js`)**：
  - `qimen_question` 與 `meihua_question` WebMCP 工具擴充 `turnstileToken` 輸入參數，並支援自動從 DOM 與全域 Widget 提取安全憑證及執行後自動重置。
- **Google AdSense 全站埋設狀態確認**：
  - 確認全站 8 大服務頁面（奇門遁甲、梅花易數、紫微斗數、生辰八字、塔羅、風水、月老姻緣、解答之書）均已完整埋入 Google AdSense 代碼（發布商 ID：`ca-pub-5210017545918559`），包含 `ads-head.html` 全局 SDK 載入、`ads-mobile.html` 行動版專屬橫幅與 `ads-bottom.html` 頁底響應式廣告單元。
- **自動化測試全面覆蓋**：
  - 擴充 `test/turnstile.test.js`，包含 `/api/llm-analysis`、`/api/meihua/llm-analysis`、`/api/:module/llm-analysis` Token 阻擋測試、`*-question` 端點開放驗證，以及全站 8 大頁面模板靜態元件完整性檢驗。全套測試 220 項 100% 通過。

## [2026-09-21]

### 🏷️ 郵件品牌嚴格校正為「333 一句提醒·照見當下」& Markdown-to-HTML 郵件排版引擎深度強化

- **品牌與寄件者名稱嚴格校正 (`lib/email.js`, `test/email.test.js`)**：
  - **杜絕未經授權名稱**：徹底移除不符品牌規範的名稱，嚴格統一為官方品牌名稱 **「333 一句提醒·照見當下」**。
  - **動態寄件者名稱解析 (`getFromAddress`)**：無論是預設的 `333 一句提醒·照見當下 <onboarding@resend.dev>` 或是使用者自訂的 `RESEND_FROM_EMAIL`（支援純 Email 或帶有舊名稱之格式），均自動轉換為標準官方品牌名稱。
  - **信件標題與主頁落款一致化**：預設主旨為 `【333 一句提醒·照見當下】您的奇門遁甲諮詢對話紀錄`，信件頁首與頁尾明確標示「傳統智慧，理性解讀；照見當下，指引行動」官方文化理念。
- **Markdown-to-HTML 郵件排版與行內樣式全面強化 (`lib/email.js`, `public/js/markdown-renderer.js`, `public/css/style-new.css`, `public/js/app.js`, `views/index.html`)**：
  - **共用 Markdown 核心渲染 (`public/js/markdown-renderer.js`)**：伺服端郵件服務直接引入權威 `MarkdownRenderer`，並擴充區塊引言（`> ` blockquote）原生解析，讓「一句提醒」等重點標註在網頁與郵件中皆以高質感卡片呈現。
  - **跨 Email 客戶端行內樣式注入 (`markdownToEmailHtml`)**：解決行動版 Gmail、Apple Mail、Outlook 等郵件應用程式過濾外部 `<style>` 的問題，對表格 (`<table>`, `<th>`, `<td>`)、標題、清單、引言、程式碼區塊等自動注入高對比度的優雅行內 CSS 樣式。
  - **完整匯出脈絡包含首輪排盤解讀 (`buildExportHistory`)**：前端自動將首輪奇門大師盤面深度解讀與後續所有問答對話打包為完整脈絡發送，首頁解盤面板同步新增「✉️ 寄送解盤」專屬按鈕。
  - **自動化測試 196 項 100% 通過 (`test/email.test.js`, `test/markdown-renderer.test.js`)**。

### 🎨 Lucide Icons 全站圖標升級 & ✉️ Resend API 對話紀錄一鍵寄送信箱

- **Lucide Icons 向量圖標全面升級 (`public/js/lucide.min.js`, `views/index.html`, `public/js/app.js`, `public/css/style-new.css`)**：
  - **根除符號丟失與 `▯` 缺字框問題**：徹底解決歷史 Bootstrap 3 Glyphicons 缺少字型檔且部分圖標（如 `glyphicon-copy`、`glyphicon-trash`）未設定 fallback 導致瀏覽器渲染出缺字方框 `▯` 的問題。
  - **本地整合 Lucide 向量 SVG**：引入 `public/js/lucide.min.js`，將「複製內容 (`copy`)」、「清除對話 (`trash-2`)」、「發問 (`message-square`)」、「寄送信箱 (`mail`)」、「重新解盤 (`refresh-cw`)」、「成功已複製 (`check`)」、「載入中 (`loader-2`)」等全面升級為清晰現代的 Lucide SVG 向量圖標。
  - **雙層彈性容錯防禦**：在 `style-new.css` 中完整補齊所有 Glyphicon 的 Unicode Emoji 後備樣式（包含 `📋`、`🗑️`、`⭐`、`✅`、`📅`、`✉️`），即使未加載 JS 也絕不會出現 `▯` 框框。
- **Resend API 對話紀錄信箱寄送功能 (`lib/email.js`, `app.js`, `views/index.html`, `public/js/app.js`)**：
  - **Vercel 環境變數安全隔離**：由伺服端 Node.js 原生讀取 `process.env.RESEND_API_KEY`，在 Vercel Serverless Function 內部安全呼叫 Resend API (`https://api.resend.com/emails`)，API Key 絕對不會傳輸至前端瀏覽器。
  - **精美響應式 HTML 郵件模板 (`lib/email.js`)**：
    - 頂部品牌 Header（333 一句提醒 · 照見當下）。
    - 盤面摘要（排盤時間、遁局、值符、值使、專題用神）。
    - 對話歷史問答（氣泡對稱排版：使用者問道 👤 與大師解讀 🔮，Markdown 轉精美 Email 排版）。
    - 底部文化正向指引與品牌落款。
  - **前端互動彈窗與智慧記憶 (`views/index.html`, `public/js/app.js`)**：
    - 在輸入框旁與每一則大師解讀卡片新增「✉️ 寄送對話」按鈕。
    - 點擊開啟簡潔郵件發送彈窗，自動記憶使用者信箱至本地儲存 (`localStorage`)。
    - 即時表單驗證、按鈕防重複提交載入動態，發送成功自動提示並延遲關閉。
  - **端到端架構對齊**：
    - API 端點：`POST /api/conversation/send-email`，支援電子信箱校驗、對話歷史校驗與 Resend API 錯誤轉譯。
    - WebMCP：註冊 `send_conversation_email` 工具。
    - 自動化測試：新增 `test/email.test.js`，覆蓋 HTML 轉換、模板生成、參數保護、Resend Mock 與 HTTP 路由驗證。全站測試 194 項 100% 通過。


### 💍 紫微斗數「看出你未來另一半」正緣深度解析 & Canonical Routes 直達體系與月老跨域導流

- **紫微斗數未來另一半解析引擎 (`lib/ziwei.js`)**：
  - **破解粗糙單星年齡速查盲點**：針對社群「單靠夫妻宮單星斷年齡」無法處理雙主星同宮（如同梁、武貪、紫府等）與性別差異的缺陷，實作正統三合派夫妻宮雙主星、吉煞四化與對宮借星全維度解析。
  - **多維度正緣畫像**：包含年齡差距區間推定（同齡/上下1-3歲、大3-6歲、小2-5歲、極端差等）、心智成熟度、外貌體態風格標籤（明艷迷人、尊貴雍容、得體優雅、清秀知性等）、性格脾氣與相處地雷、相遇場合與契機，以及月老感情升溫錦囊。
  - **排盤引擎自動附帶**：`calculateZiweiChart` 全盤排盤結果同步嵌入 `futureSpouse` 物件。
- **Canonical Routes 直達體系與雙向同步 (`app.js`, `public/js/divination-suite.js`)**：
  - **伺服器端獨立 Canonical 路由**：
    - `GET /ziwei`：完整紫微排盤主頁 (Canonical: `https://qi.david888.com/ziwei`)
    - `GET /ziwei/spouse`：看出你未來另一半直達頁 (Canonical: `https://qi.david888.com/ziwei/spouse`)，具備專屬 SEO 標題與描述
    - `GET /ziwei/male-size`：男生真實尺寸直達頁 (Canonical: `https://qi.david888.com/ziwei/male-size`)，具備專屬 SEO 標題與描述
  - **前端 History API 無縫同步**：點擊模式切換藥丸（🔮完整排盤 / 💍未來另一半 / ⚡男生尺寸）時自動執行 `pushState` 更新網址列，支援瀏覽器上一頁/下一頁（`popstate`）即時切換。
  - **URL 參數預填與深度鏈接**：支援外鏈直達時自動預填 `?date=...&time=...&sex=...` 並自動切換對應模式。
- **月老姻緣 (`/yinyuan`) 跨模組導流專屬入口視覺與文案全面升級**：
  - **文案精簡吸睛**：主標題精煉為「💍 看出你未來另一半」與「⚡ 男生真實尺寸速測」，加入「🔥 夫妻宮直斷」與「🔥 隱私雙核」醒目標籤，副標題直擊用戶核心關切（「大你幾歲？長相、性格與相遇時機全揭秘」），按鈕升級為「立即揭秘 ➔」與「立即測算 ➔」。
  - **醒目高對比底色與視覺層級**：告別容易被忽視的平淡底色，未來另一半卡片注入玫瑰粉漸層（`#fff0f3` ~ `#ffd1dc`）與玫瑰光暈投影；尺寸速測卡片注入金黃暖琥珀漸層（`#fffbeb` ~ `#fde68a`）與琥珀光暈投影，適配暗黑模式玻璃霓虹質感。
  - **字體加大與排版呼吸感**：標題放大至 18px (800加粗)，描述放大至 13.5px，圖標升級為 48px 圓角半透明懸浮容器，按鈕升級為質感膠囊按鈕，行動端流暢垂直自適應。
- **紫微斗數頁面 (`/ziwei`) 模式選擇器全面升級新風格 & 頂部留白呼吸感優化**：
  - **模式選擇器卡片化升級**：將原本灰白單薄的藥丸按鈕重構為三張專屬特色卡片（`.ziwei-mode-grid`）：
    - 🔮 **完整紫微排盤**：典雅紫晶漸層（`#fbf9ff` ~ `#ddd6fe`）＋紫色亮邊框＋「全命盤」標籤。
    - 💍 **看出你未來另一半**：浪漫玫瑰粉漸層（`#fff5f7` ~ `#ffd1dc`）＋粉紅亮邊框＋「🔥 夫妻宮直斷」標籤。
    - ⚡ **3秒測男生真實尺寸**：暖金琥珀漸層（`#fffdf5` ~ `#fde68a`）＋金琥珀亮邊框＋「🔥 隱私雙核」標籤。
  - **頂部排版精簡與下移**：將佔據首屏大版位的長篇理論說明（「經典安星訣排定十二宮位...」）自頂部 Hero 移至頁尾 Footer 區域（`.ziwei-footer-note`），頂部保留精煉緊湊標題，首屏即刻呈現特色模式與表單。
- **Web UI Spacing 與版面呼吸感優化 (`views/ziwei.html`, `public/css/divination-suite.css`)**：
  - 修復 Bootstrap 3 環境下缺少 `.mt-4` / `.mb-3` 工具類別導致「問題輸入框」與「提交按鈕」黏在一起的間距問題，重構 `.suite-submit-container`，提供舒適的視覺呼吸感。
  - 新增 `.spouse-banner`、`.male-size-banner`、`.spouse-card`、`.spouse-hero`、`.spouse-age-badge`、`.spouse-tag-pill` 等自適應主題樣式。
- **API、CLI、WebMCP 與測試保障**：
  - **API 端點**：新增毫秒級確定性端點 `GET /api/ziwei/spouse` 與 `POST /api/ziwei/spouse`，同步登記至 `/api/docs`。
  - **CLI & Skill**：`ziwei_cli.js` 與 `ask_ziwei.js` 支援 `--spouse` 與 `--mode spouse`；同步更新 `skills/ziwei-consultant/SKILL.md`。
  - **WebMCP**：`public/js/webmcp.js` 新增 `ziwei_future_spouse` 工具，符合 Chrome WebMCP 協定並在 `/ziwei` 及子路徑宣告。
  - **自動化測試**：`test/ziwei.test.js`、`test/service-question-routes.test.js`、`test/webmcp.test.js` 全面覆蓋，全套 188 項測試 100% 通過。

### ⚡ 紫微斗數男生真實尺寸與親密戰鬥力雙核測算引擎 & 快速通關模式 (ziwei-male-size-fastpass)

- **紫微斗數男生真實尺寸與親密戰鬥力雙核測算引擎 (`lib/ziwei.js`)**：
  - **破解網路單宮流言**：打破社群粗糙「單看子位」流言，開創正統「子位（外觀視覺器量）」＋「疾厄宮（肉身器官與實質體能）」雙核合參演算法。
  - **精準排盤校正**：嚴格依循水二局等五行局安紫微星歌訣，排除網路推算偏誤，解決傳統單宮流言將全天 50% 時辰盲目灌水為「＞16 cm 特大杯」的失真現象。
  - **客觀區間與風格判定**：明確提供客觀公分區間（`＞16 cm 特大杯`、`11 - 15 cm 大/中杯`、`＜10 cm 小杯`）、耐力評分（50～95分）、實戰風格標籤（暴風破壞型、鋒刃精鋼型、長效永動型等）與正統合參解讀。
- **全介面 5 層架構同步對齊 (Full-Stack 5-Layer Parameter Alignment)**：
  - **1. Web UI (`views/ziwei.html`, `public/js/divination-suite.js`, `public/css/divination-suite.css`)**：
    - 頂部模式切換 Pill Group：【🔮 完整紫微排盤】與【⚡ 男生尺寸速測（快速通關）】。
    - 快速通關模式僅需出生年月日與時辰，0.1 秒純演算法即時出盤，免除等待 LLM 分析耗時。
    - 完整排盤模式分析結果同步嵌入「⚡ 趣味彩蛋：男生真實尺寸與親密戰鬥力」專屬卡片。
    - 樣式新增 `.ziwei-mode-pills`、`.male-size-card`、`.male-size-cm-badge` 等自適應深淺色主題卡片。
  - **2. API 端點 (`app.js`)**：
    - 新增確定性運算端點 `POST /api/ziwei/male-size` 與 `GET /api/ziwei/male-size`，自動紀錄至 Discord webhook。
    - `/api/docs` API Catalog 字典同步登記。
  - **3. CLI & Skill (`skills/ziwei-consultant`)**：
    - `ziwei_cli.js` 新增 `--male-size` 與 `--mode male-size` 旗標；強化非互動 TTY 輸入偵測。
    - `ask_ziwei.js` 支援 `mode: "male-size"` 路由至本地確定性端點。
    - `SKILL.md` 完整補充參數與使用範例。
  - **4. WebMCP / 官方 MCP / Bridge (`public/js/webmcp.js`, `mcp-bridge.js`, `mcp/src/tools/divination.ts`)**：
    - 新增 `ziwei_male_size` 工具，暴露完整 Schema 與 input validation。
    - 編譯並同步官方 MCP TypeScript 輸出至 `mcp/dist/tools/divination.js`。
  - **5. 文檔與 Wiki**：
    - 發布全面深度分析專文至 `david888 wiki`（Live URL: `https://wiki.david888.com/share/25nfaa`），解析 1981-08-11 十二時辰全天比對與巳時 11cm 校正實測。
    - `README.md` 與 `CHANGELOG.md` 同步更新。
  - **6. 自動化測試**：
    - `test/ziwei.test.js`、`test/service-question-routes.test.js`、`test/webmcp.test.js`、`test/mcp.test.js` 擴充，全套 175 項測試 100% 通過。

## [2026-09-17]

### 🧭 易經風水中州派規則庫考據深化 (Task 7.7) 與九宮編輯器實時飛星/無障礙宣告 (Task 7.11)

- **中州派規則庫與考據出處完整化 (Task 7.7)**：
  - `data/fengshui/zhongzhou-rules.json` 與 `data/fengshui/classical-quotes.json` 全面補充古典文獻版本、卷數、章節與確切頁碼考據（涵蓋《沈氏玄空學》、《中州派玄空陽宅室內理氣》等 24 兼向替卦與 13 項室內佈局規則）。
  - 佈局評估引擎 (`lib/fengshui.js`) 改由版本化規則庫與賦文庫動態執行，並在前端結果卡片中完整輸出「考據出處」。
- **Step 2 九宮編輯器即時飛星預覽與互動無障礙宣告 (Task 7.11)**：
  - 編輯器九宮格盤面實作確定性客戶端玄空飛星演算法，依房屋坐向與入住年份即時在九宮宮位顯示運星、山星與向星，點選宮位時可直接對照星曜吉凶擺放物件。
  - 盤面宮位、標籤刪除按鈕、分類分頁與物件選項全面落實鍵盤存取性（`Enter` / `Space` 鍵啟用）與 WAI-ARIA 屬性（`role="tab"`、`aria-selected`、`role="button"`、`aria-pressed`）。
  - 九宮標註盤面新增無障礙宣告容器（`#fsAriaStatus`，ARIA Live Announcements），在物件選取、放置、移除、清空與入路循跡操作時即時語音朗讀回饋。
- **Android 羅盤感測與測試保障**：
  - 修正 Android 瀏覽器授權後同時保留 absolute 與一般方向 listener，確保相對方向不被誤判為北向。
  - 強化 `divination-suite.js` 表單元素可選串連防呆。
  - 全套自動化測試提升至 173 項通過（173/173 PASS，100% 通過率）；OpenSpec 嚴格驗證通過。

## [2026-09-16]

### 🧭 易經風水 PWA 實時電子羅盤與中州派快速九宮住宅佈局評估 (fengshui-compass-zhongzhou-layout)

- **跨平台 PWA 實時電子羅盤 (`views/fengshui.html`, `public/js/fengshui.js`)**：
  - 提供 iOS Safari/Android Chrome 感測器介面與手動 fallback；實機 HTTPS 權限與跨平台校正仍待驗證。
  - 引入圓周平滑低通濾波演算法（Circular Low-pass Filter），消除微幅抖動。
  - 姿態防呆安全門檻：感測傾角（Pitch/Roll）超過 $\pm 15^\circ$ 時即時提示水平握持警告並鎖定禁止誤鎖定。
  - 羅盤幾何演算法：自動將向首度數精確映射至 24 山，嚴格判定**正向下卦**、**兼向候選**（完整替卦排盤待補）與**大小空亡線**。
  - 手動度數微調滑桿提供無感測器桌機備援；頁面方向選擇完整涵蓋 8 大方位與 24 山精確坐向全集合下拉選單。
- **STEP 2 快速九宮住宅物件落位標註器 (`data/fengshui/layout-catalog.json`, `public/js/fengshui.js`)**：
  - 建立 7 大類 63 項 Canonical 住宅物件標準庫（空間 15 項、門窗 5 項、家具 11 項、設備 11 項、動線 4 項、外局 6 項、形體 11 項），區分單一與多處放置模式。
  - 實作「南在頂、北在下」互動式九宮格標註盤面，支援物件點選放置、重複點選移除、標籤刪除與全盤清空。
  - 進門動線循跡（最後入路宮位序列）與通暢度設定（`open` / `obstructed` / `unknown`），並與大門宮位即時雙向連動防呆。
  - 版本化本地快照機制（`fengshui-layout:v1`），自動儲存與載入裝置本地配置。
- **中州派玄空室內佈局評估引擎 (`lib/fengshui.js`)**：
  - 門氣納氣評估（依建造/入住年份動態推導當令旺星與生氣星，不再寫死九運）。
  - 主臥床位評估（依動態元運判定山星當令吉凶、避開二黑病符與五黃大煞）。
  - 爐灶火門評估（西北乾宮火燒天門、西兌宮烈火焚金、二黑五黃煞位安灶禁忌）。
  - 衛浴廁所壓煞與書房文昌吉位評估（一四同宮、一六共宗）。
  - **資料不足誠實標註原則 (Omission Honesty)**：未標註之住宅項目（如未標註主臥、未標註瓦斯爐、未標註入路）嚴格列入 `missingData`，演算法與 LLM 提示詞全面禁止憑空臆測與幻覺。
  - 整合傳統文獻短句與文化詮釋及現代化空間調整指引；版本／頁碼 provenance 尚待補齊。
- **全介面 5 層參數同步對齊 (Full-Stack 5-Layer Parameter Alignment)**：
  - **Web UI**：`views/fengshui.html` 羅盤儀表、24 山全集合下拉選單、STEP 2 九宮標註、`public/js/fengshui.js`、`public/js/divination-suite.js`（支援 63 項住宅標籤中文本地化顯示、修正兼向 badge 樣式）與 `public/css/divination-suite.css` 完整樣式。
  - **API 端點**：新增純演算法確定性端點 `POST /api/fengshui/evaluate-layout` 與 `GET /api/fengshui/evaluate-layout`；修復 Query 字串空物件防呆漏洞；擴充 `/api/fengshui/report` 與 `/api/fengshui-question`；`Permissions-Policy` 新增感測器授權指令；坐向與度數衝突檢查（`FACING_HEADING_CONFLICT`）；`/api/docs` 同步登記住宅目錄端點。
  - **CLI / Skill**：更新 `skills/fengshui-consultant/scripts/fengshui_cli.js` 支援 `--heading`、`--layout`、`--entry-path`、`--path-quality` 等旗標與非阻塞 stdin 讀取；同步更新 `SKILL.md`。
  - **WebMCP / 官方 MCP / Bridge**：更新 `public/js/webmcp.js` `fengshui_report` 與獨立 `fengshui_layout_evaluation` 工具宣告與表單序列化；更新 `mcp/src/tools/divination.ts`、`mcp/dist/tools/divination.js` 與 `mcp-bridge.js`。
  - **文檔**：同步更新 `README.md` 與 `CHANGELOG.md`。
  - **Node 測試**：目前全專案 169 項自動化測試通過（169/169 PASS），新增 DOM 渲染回歸測試與動態元運佈局評估測試。

## [2026-09-10]

### ⏰ 午夜邊界問題徹底解決 (Midnight Boundary Problem Resolution Engine)

- **核心設計原則（「9/1 ~ 9/9 必到 9/9 23:59:59.999」）**：
  - 解決資料工程、時序統計與 API 查詢中最易被忽視的午夜邊界陷阱：使用者指定之結束日期自動完整覆蓋當日最後一毫秒（`23:59:59.999`），或以資料庫半開區間標準（`< 次日 00:00:00.000`）進行精準查詢。
- **民用時間引擎擴充 (`lib/civil-time.js`)**：
  - 新增 `normalizeDateBoundary(dateInput, { boundary: 'start' | 'end' | 'next_day_start', precision, timezone })`：標準化時間戳邊界，精準支援當日午夜（`00:00:00.000`）、當日末刻（`23:59:59.999`）與次日零點（`next_day_start`）。
  - 新增 `parseDateRange(input, options)`：支援 `startDate`/`endDate` 及 `from`/`to` 別名，自動計算涵蓋天數（9/1 ~ 9/9 為 9 天），生成 SQL `BETWEEN`、半開區間（`>= start AND < next_day_start`）及 MongoDB 查詢條件物件，並提供記憶體內 `contains(testDate)` 判斷工具。
- **API 與端點對齊 (`app.js`, `lib/api-time-handler.js`)**：
  - 擴充 `APITimeHandler.normalizeDateBoundary` 與 `APITimeHandler.parseDateRange`。
  - 新增端點 `GET /api/time/range`、`POST /api/time/range` 與 `GET /api/time/boundary`、`POST /api/time/boundary`，並完整更新 `/api/docs` API 文檔規格。
- **CLI 與 Skill 防止 UTC 午夜漂移 (`skills/qimen-consultant/scripts/qimen_cli.js`)**：
  - 修復 `parseTargetDate` 中純日期字串使用 `new Date(timeStr)` 遭 Node.js 依 UTC 午夜解析導致在西半球向後漂移一天的隱患，改採本地年月日直解並預設正午。
- **WebMCP 標準擴充 (`public/js/webmcp.js`)**：
  - 新增 `date_range_normalize` WebMCP 工具定義，使 AI Agent 可在瀏覽器端標準化處理任意日期區間查詢。
- **全套測試覆蓋 (`test/civil-time.test.js`, `test/api-time-handler.test.js`, `test/api-time-routes.test.js`)**：
  - 新增 10 項專題測試，驗證 9/1 ~ 9/9 邊界涵蓋、閏年跨月、倒置日期校驗與端點整合，全套 152 項測試 100% 通過（152/152 PASS）。

## [2026-09-02]


### 🛡️ Cloudflare Security Audit Skill 全專案安全審計與漏洞修復 (run-1)

- **遠端 DoS 無限迴圈修復 (`lib/solar-time.js`)**：
  - 修復 `resolveCoordinates` 中未校驗 `Number.isFinite()` 導致 `Infinity` 經度使 `calculateTrueSolarTime` 的 `while` 迴圈無法終止、鎖死 Node.js 單執行緒 Event Loop 的重大高危弱點。
  - 將經緯度嚴格限制於合理地理範圍（經度 `-180..180`、緯度 `-90..90`），並改以數學取模計算 `dayShift` 與 `adjustedMinutes`。
- **奇門遁甲陽遁啟用重大演算法修復 (`lib/qimen.js`)**：
  - 修復 `calculateJuShu` 中 `date >= dongZhiDate` 於 `Date` 與 `Solar` 物件比較時轉型為 `NaN` 恆為 `false` 的缺陷，改由 `JIE_QI_JU_SUAN` 節氣映射表直接提取正規陰陽遁類型，恢復春夏期間陽遁（Yang Dun）正常排盤。
- **反射型 XSS 修復 (`app.js`)**：
  - 修復 `GET /` 與 `GET /custom` 錯誤捕獲中未設定 Content-Type 導致 `error.message` 反射未跳脫 query 參數的 XSS 隱患，強制指定 `res.type('text/plain')`。
- **未授權測試端點與環境資訊防護 (`app.js`)**：
  - 將 `/api/llm-test`、`/api/discord-test` 與 `/api/timezone-debug` 診斷端點限制為僅在非生產環境（`process.env.NODE_ENV !== 'production'`）開放，避免公開消耗 LLM 額度與 Webhook 濫用。
  - 修復 `/api/:module/llm-analysis` 透過 `Object.prototype` 原型鏈解析繞過模組白名單校驗的漏洞。
- **AI 對話歷史角色注入過濾 (`lib/llm-analysis.js`)**：
  - 於 `buildPayloadWithHistory` 增加嚴格 Schema 過濾，僅允許 `role === 'user'` 或 `role === 'assistant'` 且內容為字串的訊息，防止攻擊者注入 `system` / `developer` 角色覆寫系統提示詞。
- **梅花易數與風水負數運算健全化 (`lib/meihua.js`, `lib/fengshui.js`)**：
  - `numToGua` 與 `chooseZeri` 統一採用正餘數取模 `((n % m) + m) % m`，防止負數輸入引發 `TypeError`。
- **Discord Webhook 提及防護與長度截斷 (`lib/discord-webhook.js`)**：
  - 全面配置 `allowed_mentions: { parse: [] }` 防止 `@everyone` 提及濫用，並對提問文字進行 4000 字元上限截斷。
- **容器安全現代化 (`Dockerfile`, `.dockerignore`)**：
  - 基礎映像檔升級至目前 Active LTS 之 `node:24-alpine`，改以非 root 使用者 `USER node` 運行，並配置 `.dockerignore` 避免敏感檔案打包。
- **全套測試覆蓋 (`test/security-audit-fixes.test.js`)**：
  - 新增針對上述弱點的防護測試，全套 142 項單元與整合測試 100% 通過（142/142 PASS）。

## [2026-08-29]

### 🧩 WebMCP 宣告式表單避免重複註冊

- 修正首頁 `qimen_question` 與 `qimen_custom_paipan` 同時被 HTML 宣告式表單和 JavaScript imperative API 註冊，造成 Chrome `Duplicate tool name` 的問題。
- 註冊器現在會辨識頁面上的 `form[toolname]`，交由 Chrome 處理宣告式工具，JavaScript 僅註冊沒有宣告式表單的工具；重複呼叫註冊流程也不會再次註冊已成功的工具。

### 📱 手機版導覽改為直接可滑動功能列

- 移除手機版漢堡選單的可見入口，改為品牌列下方的橫向滑動導覽列，主要模組與右側工具仍可直接觸達。
- 淺色、深色模式共用 CSS 色彩 token，維持相同的高亮、hover、邊框與滑動提示視覺；同步修正固定導覽的手機版內容頂部間距。

### 🔗 WebMCP、API 與 Skill 契約補齊

- 修正梅花時間／數字 WebMCP 對 API 的 method 值，補上目前盤面追問工具，並讓首頁註冊完整梅花工具。
- 宣告式 WebMCP 表單改為將 `FormData` 轉成 canonical payload 後實際執行對應工具，不再回傳固定成功訊息；同步統一 Qimen／Meihua 表單名稱。
- 修正風水 24 山與形煞 canonical enum、姻緣模式 enum，以及 API 文件中落後的梅花、風水、紫微、姻緣參數。
- 新增共用 Node.js Skill CLI 輸入解析器，所有 `ask_*.js` 支援 inline JSON、stdin JSON 與旗標參數；同步補齊各 Skill 的參數說明。
- 移除 WebMCP 與 Skill 操作描述中的 AI 自我強調字眼；移除未實作的塔羅 `cards` 輸入宣稱。

### 📢 Google AdSense 廣告共用 Partial 模組化與全站 8 大頁面統一佈局

- **廣告元件模組化 (`views/partials/`)**：
  - 新建 `views/partials/ads-head.html`：統一管理 Google AdSense SDK 腳本引入（`ca-pub-5210017545918559`）。
  - 新建 `views/partials/ads-mobile.html`：統一管理行動端頂部/問答區下方自適應橫幅廣告。
  - 新建 `views/partials/ads-bottom.html`：統一管理桌面端兩側浮動側邊欄（160x600）與頁尾橫幅廣告。
- **全站 8 大頁面端到端一致性佈局**：
  - 將廣告版位同步引入至全站所有 8 個術數模組頁面（奇門遁甲 `index.html`、紫微斗數 `ziwei.html`、梅花易數 `meihua.html`、生辰八字 `bazi2.html`、易經風水 `fengshui.html`、韋特塔羅 `tarot.html`、月老姻緣 `yinyuan.html`、解答之書 `answerbook.html`）。
  - 完美適配 `style-new.css` 響應式邏輯：大螢幕（>1200px）自動展示兩側浮動廣告，小螢幕（<=1200px）自動收合側欄並展示自適應頂部橫幅，底端統一展示橫幅廣告。

### 🎯 全模組 LLM 解盤「直面解答 · 一句提醒」白話決策結論升級

- **核心解讀邏輯優化（保留專業深度 + 強化白話直答）**：
  - 為解決使用者反饋「術語過於專業、看不懂、未直面核心問題」的痛點，全面重構各術數模組（奇門、梅花、紫微、八字、風水、塔羅、姻緣、解答之書）的 Prompt 與 System Message。
  - **前段保留正統推演**：維持 100% 完整古典演算法與格局推演（用神、十干克應、體用生剋、四化、神煞等），確保術數論據權威嚴謹。
  - **末段強制「直球對決」**：在 Prompt 尾端強制規範 **【🎯 直面解答 · 一句提醒】**，要求 AI 完全脫離術數黑話，用通俗白話直接正面回答求測者提出的具體問題（明確告知吉凶傾向、成敗利弊、適合或不適合），並提煉一句核心箴言（「一句提醒·照見當下」）與現實生活 2~3 點可落地的具體行動建議。
- **全模組覆蓋與測試驗證**：
  - 更新 `lib/llm-analysis.js`（奇門、梅花、紫微、八字2、風水、塔羅、姻緣、解答之書）。
  - 新增 `test/service-llm.test.js` 全模組提示詞結構與直面回答要求測試，全套 131 項測試 100% 通過（131/131 PASS）。

### 🎨 全站介面可讀性與主題切換修正

- 統一紫微頁右上角主題切換控制項，修正按鈕無法觸發共用主題腳本的問題。
- 修正性別選項 pill 在欄寬不足時斷行，並維持足夠的點擊範圍。
- 移除奇門首頁標題旁重複的「AI 智能問答」與「智能分析」標籤。
- 提升全站導覽、表單、結果盤面與輔助文字的字級與可讀性。
- 統一紫微頁主操作按鈕與右側導覽樣式。
- 收斂全站可見文案，移除「AI 大師」「AI 深度」「智能分析」「深度解析」等自我強調字眼，改用直接的功能描述。
- 預設導入 Google Fonts「LXGW WenKai Mono TC」，並保留系統中文字型作為遠端載入失敗時的 fallback。
- 再提高奇門問答正文、解讀表格、提問泡泡與操作按鈕的字級；同步放大其他排盤頁面的主要表單文字，避免 14px 內嵌樣式讓內容顯得過小。
- 將共用字級集中為語意化 typography tokens，並把奇門、梅花問答訊息改用共用元件 class；後續調整正文或輔助字級只需修改共用 token。
- **暗黑模式（Dark Mode）深度優化與高對比重構**：
  - 重構 `dark-mode.css`，注入完整 `--claude-*` 深色 Tokens，解決九宮詳解卡片文字過暗看不清的問題。
  - 修正表單控制項（`select.form-control`, `input`）與按鈕（`btn-default`, `time-mode-selector`）在暗黑模式下過亮刺眼的問題，改為沉浸式深褐灰（`#26211E` / `#2A2521`）搭配暖色焦點。
  - 優化五行屬性（`wuxing-mu`, `wuxing-huo`, `wuxing-tu`, `wuxing-jin`, `wuxing-shui`）在暗黑背景下的高對比發光感與清晰度。
  - 清除 HTML 樣板殘留的寫死色碼（`color: #555`, `color: #666`），確保全站 8 大頁面明暗主題切換體驗一致。

## [2026-08-28]

### 🌌 天文真太陽時、形勢巒頭全庫、月老全鏈路時空窗口與 100% 0-Diff Parity 升級

- **🌞 天文經緯度真太陽時與均時差 (EOT) 核心模組 (`lib/solar-time.js`, `/api/solar-time`)**：
  - 內建兩岸三地及國際主要華人城市精確經緯度字典（`CITY_COORDINATES`，涵蓋臺北、新北、臺中、臺南、高雄、香港、澳門、北京、上海、廣州、深圳、成都、新加坡、紐約、舊金山等）。
  - 實作天文均時差（Equation of Time, EOT，年內週期性軌道偏心與傾角校正）與經度時差（$\Delta t_{\text{lon}} = (\text{經度} - 120) \times 4$ 分鐘）。
  - 支援早夜子時切換（`ziMode: 'early_late'` vs `'next_day'`）與跨日校正（`dayShift`）。
  - 全面整合至八字命理（`lib/bazi2.js`）、奇門遁甲（`lib/qimen.js`）與紫微斗數（`lib/ziwei.js`），在 `normalized_input` 與排盤剖析中動態輸出真太陽時與經緯度校正摘要。

- **🏡 易經風水形勢巒頭 24 大形煞與空間六事診斷庫 (`lib/fengshui.js`, `skills/fengshui-consultant/`)**：
  - 完整收錄 14 大外局形煞（天斬煞、路沖煞/槍煞、壁刀煞、反弓煞/反弓水、鐮刀煞、穿心煞、白虎煞、孤陽煞、獨陰煞、探頭煞、頂心煞、火形煞等）與 10 大內局空間六事（穿堂煞、門沖床、樑壓床、橫樑壓頂、樑壓灶、門沖灶、水火相沖、廁居中宮、開門見灶、開門見廁）。
  - 提供多重形煞診斷（`diagnoseLuantou`）與煞氣百科（`getAllShaQiLibrary`），輸出成因、影響、移形易位與五行制化之道。
  - 新增 API 端點：`/api/fengshui/shaqi-list` 與 `/api/fengshui/luantou`。
  - 新增獨立 CLI 腳本：`skills/fengshui-consultant/scripts/fengshui_cli.js`。

- **🏮 月老姻緣 12 個月桃花流月起伏與紅線測算三大時空窗口 (`lib/yinyuan.js`, `skills/yinyuan-consultant/`)**：
  - 實作 12 個月桃花月令能量曲線（結合流年天喜、月令五行、沐浴桃花位、生肖吉凶加權評分）。
  - 升級紅線測算：深度交叉【雙方生肖合沖】+【八字日主五行互補度】+【紫微夫妻宮主星與生年四化】+【月老靈籤神諭詩】，推算三大黃金良緣時空窗口。
  - 新增獨立 CLI 腳本：`skills/yinyuan-consultant/scripts/yinyuan_cli.js`。

- **🃏 韋特塔羅 100% 對齊原作者 Python `draw.py` (`lib/tarot.js`, `skills/tarot-consultant/`)**：
  - 完整實作 Python MT19937 (`PythonRandom`) 隨機數生成器與累積權重選擇機制（`rng.choices`）。
  - 在相同 `seed=12345, time_factor=night, spread=three` 條件下，抽出的牌陣為 `權杖十 (正位) / 宝剑十 (正位) / 权杖五 (正位)`，與上游 Python `draw.py` 輸出 100% 逐字逐卡精確對齊。
  - 支援 `relationship`, `decision`, `situation`, `timeline` 變體牌陣與自選時間因子加權。

- **📜 八字命理全面對齊上游 `references/shensha-table.md` (`lib/bazi2.js`, `skills/bazi2-consultant/`)**：
  - 補齊完整神煞體系：天乙貴人、天德、月德、文昌、學堂（長生位）、詞館（臨官位）、將星、華蓋、驛馬、天醫、祿神、金輿、羊刃、劫煞、災煞、亡神、咸池桃花、孤辰、寡宿、空亡/旬空、元辰（大耗，分陰陽年男女）、血刃。
  - 支援未知時辰模式（`allowUnknownHour`，時柱保持未知只排六字）與已故年份上限過濾（`deceasedYear`）。

- **⚡ 完整 CLI 套件與 100% 測試覆蓋率**：
  - 全模組均配備純 Node.js 獨立 CLI 工具（`bazi_cli.js`, `qimen_cli.js`, `ziwei_cli.js`, `fengshui_cli.js`, `yinyuan_cli.js`, `tarot_cli.js`），全面支援 CLI 參數、Inline JSON 與 Stdin 串流輸入。
  - 130 項單元與整合測試全數通過（130/130 PASS，100% 通過率）。

- **🏛️ 純 JavaScript 正統三合派安星排盤引擎 (`lib/ziwei.js`)**：
  - **定命身宮與十二宮天干**：以生月及生時由寅宮起算定命宮與身宮地支；起寅首天干定十二宮干支。
  - **定五行局**：依命宮干支納音五行精確確定水二局、木三局、金四局、土五局、火六局。
  - **安紫微星與天府星系十四主星**：落實標準安紫微星訣（`q = ceil(d/n)`, `r = q*n - d`），安紫微六星（紫微、天機、太陽、武曲、天同、廉貞）與天府八星（天府、太陰、貪狼、巨門、天相、天梁、七殺、破軍）。
  - **安六吉六煞與輔曜**：精確安文昌、文曲、左輔、右弼、天魁、天鉞、擎羊、陀羅、火星、鈴星、地空、地劫、祿存、天馬、紅鸞、天喜。
  - **十四主星廟旺平陷**：完整十四主星在十二地支之廟旺平陷亮度矩陣。
  - **十天干生年四化（祿權科忌）**：甲廉破武陽、乙機梁紫陰、丙同機昌廉、丁陰同機巨、戊貪陰右機、己武貪梁曲、庚陽武陰同、辛巨陽曲昌、壬梁紫左武、癸破巨陰貪。
  - **大限與三方四正照會**：依陽男陰女順行、陰男陽女逆行排定各宮大限年齡；計算本宮、對宮（遷移/照會）、三合宮（財帛/官祿）與夾宮。
  - **30+ 種吉凶格局自動判定**：紫府同宮、機月同梁、殺破狼、陽梁昌祿、火貪格、鈴貪格、昌曲同宮、左右同宮、天乙拱命、祿馬交馳、巨日同宮、月朗天門、日照雷門等。

### 📜 八字命理全面對齊權威排盤體系 (`lib/bazi2.js`, `skills/bazi2-consultant/`)
- **完整神煞體系**：全面實作天乙貴人、天德貴人、月德貴人、文昌貴人、太極貴人、國印貴人、金輿、學堂（長生位）、天醫、祿神、羊刃、驛馬、桃花（咸池）、華蓋、將星、劫煞、災煞、亡神、孤辰、寡宿等。
- **精確起運年齡與月數**：依節氣精確換算起運歲數與月數（`startYunAge`）。
- **時辰交界邊界提醒**：時辰交界 ±15 分鐘精確提供跨時辰真太陽時提示。
- **獨立 CLI 排盤工具**：建置純 Node.js CLI `skills/bazi2-consultant/scripts/bazi_cli.js`，支援 `--date`, `--lunar`, `--hour`/`--time`, `--shichen`, `--sex`, `--place`, `--deceased-year`。

### ⛩️ 月老姻緣流程規範與嚴格輸入驗證升級 (`lib/yinyuan.js`, `skills/yinyuan-consultant/`)
- **嚴格輸入約束**：紫微夫妻宮模式缺少出生日期時回傳明確錯誤提示，杜絕隨意 fallback 成假命盤。
- **490 行全模式訪談指引庫**：完整納入 6 大模式（八字合婚、生肖配對、紫微夫妻宮、月老靈籤、桃花運勢、紅線測算）前置資訊收集、兩輪追問流程與月老解盤原則。

### 🧭 易經風水玄空理氣與協紀辨方擇日算法升級 (`lib/fengshui.js`, `skills/fengshui-consultant/`)
- **通用太歲、歲破與三煞動態計算**：依年支對沖與三合五行局動態計算太歲方、歲破方與流年三煞方位。
- **正統協紀辨方擇日算法**：依 `lunar-javascript` 動態遍歷該月每日，排布建除十二神（建除滿平定執破危成收開閉）與黃黑道吉神，依測算事項精選吉日。
- **24 山坐向 WebMCP 支援**：WebMCP Schema 完整支援 24 山精確坐向。

### 🃏 韋特塔羅加權抽牌與 CLI 對齊 (`lib/tarot.js`, `skills/tarot-consultant/`)
- **加權抽牌與牌位正逆位機率**：落實指定關鍵牌位 0.7、一般牌位 0.6 正位機率，依時間因子（晨間/午後/夜間）動態加權。
- **獨立 CLI 抽牌工具**：建置純 Node.js CLI `skills/tarot-consultant/scripts/tarot_cli.js`，支援 `--spread`, `--seed`, `--time-factor`, `--variant`。
- **🧹 徹底重構月老姻緣紫微夫妻宮 (`lib/yinyuan.js`)**：
  - 徹底移除過往取巧之 `% 14` 與 `% 4` mock 代碼，全面接入真實 `calculateZiweiChart` 排盤引擎，精確提取夫妻宮主星、廟旺亮度、輔煞星曜與生年四化。
- **✨ 奇門遁甲 Consultant Skill 深度整合 (`skills/qimen-consultant/`)**：
  - 導入 `references/ruleset-mainline.md`、`geju.md`、`yongshen.md`、`interview.md`、`examples.md` 規範文檔。
  - 建置純 Node.js CLI 腳本 `scripts/qimen_cli.js`，輸出標準 `mainline-cn-v1` 規範結構。
- **✨ 紫微斗數 Consultant Skill 與 CLI 工具 (`skills/ziwei-consultant/`)**：
  - 建立完整技能包，包含 `SKILL.md`、`references/` 算法文檔、CLI 排盤工具 `scripts/ziwei_cli.js` 與 API 顧問腳本 `scripts/ask_ziwei.js`。
- **✨ 易經風水 Consultant Skill 補齊 (`skills/fengshui-consultant/`)**：
  - 補齊實戰案例 `examples/yangzhai.md` 與 `examples/zeri-example.md`。
- **🌐 全介面 5 層參數端到端完全對齊**：
  - **Web UI (`views/ziwei.html`, `views/*.html`, `public/js/divination-suite.js`, `public/css/divination-suite.css`)**：建立 Claude 溫暖人文風格之紫微排盤專頁、十二宮傳統 4x4 棋盤佈局、星曜廟旺與四化發光徽章、格局展示卡片與 AI 解讀流；全站 Navbar 統一更新為 8 大模組。
  - **API 端點 (`app.js`, `lib/llm-analysis.js`)**：新增 `/ziwei` 頁面路由、`POST /api/ziwei/chart`、`POST /api/ziwei-question`、`POST /api/ziwei/llm-analysis`。
  - **WebMCP (`public/js/webmcp.js`)**：新增 `ziwei_chart` 工具與表單宣告式屬性。
  - **MCP Bridge (`mcp-bridge.js`)**：新增 `ziwei_analysis` 工具支援。
  - **測試與文件**：新增 `test/ziwei.test.js`，113 項測試全數通過（100% pass rate）；同步更新 `README.md`、`LLM-INTEGRATION.md` 與 `CHANGELOG.md`。

## [2026-08-27]

### 🎨 全站介面美感重構：導入 Claude 溫暖人文（Warm Intellectual）設計語言

- **🧭 懸浮圓角膠囊式導航列 (Floating Capsule Pill Navbar)**：
  - 導入 Claude / Anthropic 經典的懸浮膠囊導航設計，具備暖白毛玻璃模糊背景 (`backdrop-filter: blur(16px)`)、陶土橘徽章圖示、圓角切換膠囊與平滑過渡。
  - 當前選中模組採用陶土橘漸變按鈕 (`linear-gradient(135deg, #D97757 0%, #C15F3D 100%)`) 與精緻光暈陰影。
- **📜 暖色調紙感美感系統 (Claude Warm Canvas & Palette)**：
  - 替換過往冷硬的高對比藍紫/純白配色，全面改採暖燕麥紙感底色 (`#FAF7F2`)、暖砂亞麻邊框 (`#E8E0D6`) 與深焙濃縮咖啡主文字 (`#2C221E`)。
  - 對話氣泡全面升級：用戶提問採用暖燕麥色氣泡 (`#EFE9E0`)，AI 解盤採用純白微浮雕卡片 (`#FFFFFF` + 柔和擴散投影) 配搭專屬陶土橘大師徽章。
- **🌑 暖曜石暗黑模式 (Claude Obsidian Warmth)**：
  - 同步重構暗黑主題 (`#1A1816` 底色、`#26221F` 溫暖浮雕卡片、`#EDE5DC` 象牙暖白文字與 `#E08568` 陶土橘高亮)，呈現深邃且舒適的人文閱讀質感。

### 🌟 全介面 5 層參數端到端對齊與系統文檔全面重構（嚴禁掛一漏萬）

- **🌐 WebMCP 瀏覽器 AI 工具標準升級 (`public/js/webmcp.js`)**：
  - 新增 `meihua_qigua_text` 漢字報字起卦工具。
  - 全面擴充所有 14 項 WebMCP 工具的 JSON Schema 參數定義：
    - `qimen_divination`：支援 8 大專題用神目的枚舉與續問歷史。
    - `tarot_reading`：支援 6 大牌陣、`variant`（時間線/現狀/關係）變體維度與指定牌組。
    - `fengshui_report`：支援 `mode`（陽宅/形煞/擇日）、8 大朝向、8 大內外形煞類型、4 大擇日事項與目標年月。
    - `bazi2_chart`：完整支援四柱日期、時辰、性別、姓名、曾用名、出生地與雙曆法。
    - `yinyuan_reading`：支援 6 大模式、100 籤自選號碼、雙方四柱對象、相處階段、桃花查詢範圍與理想型特質偏好。
  - 頁面工具註冊同步納入 `meihua_qigua_text`。

- **⚡ 零依賴 MCP Bridge 升級 (`mcp-bridge.js`)**：
  - 同步更新 JSON-RPC stdio 工具 schema，確保所有 7 大服務的完整參數皆可透過 Claude Desktop、Cursor 與任意 MCP 客戶端直接調用。

- **🧠 CLI Skills 全量統一重構 (`skills/*-consultant/`)**：
  - 升級 `qimen-consultant` 與 `meihua-consultant` 腳本為標準原生 `fetch` 實作，全 7 大技能統一支援 JSON/stdin 與 CLI 參數。
  - 全數 `SKILL.md` 補齊 `POST /api/` 端點指南與完整參數說明。

- **🚨 Agent 行為準則與項目說明文檔重構**：
  - **`AGENTS.md`**：永久寫入「全介面 5 層參數嚴格對齊，嚴禁掛一漏萬」與「重大變更必須同步更新 README.md 及 CHANGELOG.md」約束條款。
  - **`README.md`**：全面重構為生產級技術與使用手冊，完整收錄 7 大術數算法、全參數矩陣映射表、WebMCP / MCP-Bridge / CLI Skill 調用範例。

### 🌟 術數套件全量深度升級（拒絕閹割，全面對齊開源權威標準）

- **🏮 月老 · 姻緣測算 (`/yinyuan`)**：
  - 互動體驗優化：將所有模式中的性別輸入欄位（信士性別、紫微性別、桃花性別、八字合婚雙方性別、紅線本人與尋找對象性別）全面由下拉選單升級為直覺、可直接點選切換並具備打勾/高亮狀態的 Radio Pills 膠囊按鈕組。
  - 完整實作 6 大核心模式，並全面擴充多維度輸入參數：
    1. **100 支月老靈籤**：支援自選籤號（1-100）或🎲誠心搖籤按鈕、信士生辰年月日、目前感情狀態（單身/暗戀/交往/論及婚嫁/已婚/分手挽回）與問事主題。
    2. **生肖配對**：支援 12 生肖下拉快速選擇或西元年份輸入、雙方相處階段（初識/曖昧/熱戀/備婚/已婚）。
    3. **紫微夫妻宮**：支援命主姓名、性別、公曆/農曆選擇、出生年月日、十二時辰下拉與目前感情狀態。
    4. **桃花運勢**：支援出生年月日、性別、目前感情狀態（單身尋覓/暗戀/曖昧/防爛桃花/婚姻和睦）與 2026/近期 3-6 個月查詢範圍。
    5. **八字合婚**：支援甲方與乙方完整姓名、性別、公曆/農曆雙曆法、出生年月日、十二時辰下拉與交往階段。
    6. **紅線測算**：支援命主姓名、性別、尋找對象性別、公曆/農曆、出生年月日、出生時辰、單身狀態與期望理想型特質偏好。
  - 前端與視覺盤面：全站頂部導覽列（Navbar）統一將名稱定名為「月老姻緣」，全面升級六大模式動態表單、籤詩卷軸、生肖合婚卡、夫妻宮星曜卡、桃花日曆儀表盤。
  - AI Persona：注入「賽博月老」專屬結構化 Prompt，幽默風趣、溫暖通透、理性質樸。

- **🧭 奇門遁甲全息格局與專題用神系統升級（全面對齊 FANzR-arch 權威規範）**：
  - 新增核心格局引擎 `lib/qimen-geju.js`：
    - **十天干克應格局庫**：青龍返首（戊+丙）、飛鳥跌穴（丙+戊）、玉女伏地、奇儀順遂、青龍逃走、白虎猖狂、朱雀投江、騰蛇夭矯、太白入熒、伏吟、反吟等完整格局演算。
    - **三遁神格判定**：天遁、地遁、人遁、神遁、鬼遁、風遁、雲遁、龍遁、虎遁。
    - **門迫與宮迫檢測**：精準計算八門五行與落宮五行生剋關係，評估能量耗損與阻力。
    - **專題主用神自動定位**：求財（生門/甲子戊）、事業（開門/值符）、感情（六合/乙庚）、考試（景門/天輔）、健康（天芮/死門）、出行（目標方位宮）、官司（驚門/開門/天心）。
    - **主客動靜利弊辨析**：依據天盤地盤八門八神配置，自動推演「宜主宜靜」或「宜客宜動」之攻守策略。
  - 問答前台升級 (`views/index.html` & `public/js/app.js`)：
    - 新增問事事項分類選單與即時專題用神引導標籤。
    - LLM Prompt 深度整合計算所得之克應格局、三遁吉格與主客決策錦囊。

- **📜 八字命理 / 賽博算命 (`/bazi2`)**：
  - 升級為子平命理完整正統排盤與分析引擎：
    - 六十甲子納音五行、十二長生運。
    - 十神六親、地支本氣/中氣/餘氣藏干。
    - 日主得令得地得勢旺衰判定（身旺/身弱）、五行能量百分比。
    - 格局判定（正官格、七殺格、正偏財格、食傷格、印格、建祿格、陽刃格等）。
    - 喜用神與忌神五行剖析。
    - 九大神煞（天乙貴人、文昌、驛馬、桃花咸池、華蓋、將星、祿神、羊刃、月德貴人）。
    - 十年大運時間軸與流年吉凶。
  - AI Persona：注入「子平命理宗師」Prompt，熟讀《窮通寶鑑》《滴天髓》《子平真詮》等 9 大典籍，給出關鍵轉折年份驗證與生涯指引。

- **🏡 易經風水 / 陽宅分析 (`/fengshui`)**：
  - 升級為三元玄空飛星 + 八宅明鏡 + 擇日學全息系統：
    - 支援 8 大朝向與精確 24 山坐向立極。
    - 1-9 元運運盤、山星盤、向星盤順逆飛九宮排布，判定「旺山旺向/雙星到向/雙星到坐/上山下水」。
    - 流年九星飛臨，標註五黃大煞與二黑病符方位與化解方案。
    - 八宅明鏡（四吉方：生氣/天醫/延年/伏位；四凶方：絕命/五鬼/六煞/禍害）。
    - 居住者命卦（男命/女命東四命/西四命配對）。
    - 8 大常見內外形煞（路沖/天斬/壁刀/反弓/穿堂風/橫梁/鏡對床）移形易位化解法。
    - 協紀辨方建除十二神擇日吉時，避太歲、歲破與三煞。
  - AI Persona：注入江南三元派「堪輿子」Prompt，「巒頭為體，理氣為用」，科學調和採光動線。

- **🔮 塔羅牌解讀 (`/tarot`)**：
  - 完整支援 78 張韋特塔羅（22 大阿爾克那 + 56 小阿爾克那四元素花色），支援正逆位。
  - 完整支援 6 大牌陣（單張指引牌、三牌陣時間/關係/抉擇變體、五牌鑽石陣、月亮週期陣、七星馬蹄形陣、十牌凱爾特十字陣）。
  - 深度推演：大阿卡納佔比分析、四大元素能量分佈與缺失、牌性相生相剋、經典牌對組合檢測。
  - AI Persona：注入「四維透鏡（鏡/窗/門/錨）」與敘事弧心靈塔羅顧問 Prompt，給出本週具體行動清單。

- **🌸 梅花易數 (`/meihua`)**：
  - 擴充「漢字報字起卦」模式（支援單字、雙字、多字筆畫起卦）。
  - 擴充「本卦、互卦、變卦、錯卦（陰陽全變）、綜卦（覆卦顛倒）」五卦全息象義系統。
  - 整合六十四卦卦辭與三百八十四爻動爻爻辭庫（`data/meihua/yaoci.json`）。
  - 擴充四季五行衰旺（春木/夏火/秋金/冬水/四季土之旺相休囚死）加權評定。
  - 擴充八卦先天數應期推算法與吉利方位指引。
  - 前端網頁支援五卦卡片排布、動爻爻辭高亮與四季旺衰條。

- **🧭 奇門遁甲 (`/`) 與專題用神體系**：
  - 參考 `FANzR-arch/Numerologist_skills` 規範，在 `lib/llm-analysis.js` 注入正統用神取用框架：
    - 求財看生門與戊、工作看開門與值符、感情看乙庚六合、學業看景門天輔、健康看天芮死門、出行看方位宮。
    - 結構化輸出：用神鎖定、主客動靜利弊辨析、星門神儀十干克應、吉方時機與破局策略。

- **🤖 規範與約束 (`AGENTS.md`)**：
  - 新增 `AGENTS.md`，明文約束所有 AI Agent 遵守：嚴禁敷衍與閹割版本、重大功能升級必更 CHANGELOG、維持 100% 測試通過率。

- **🧪 測試**：
  - 全量 104 個單元與整合測試 100% 通過（`pass 104, fail 0`）。

### 本次採用的參考來源

- [Ming-H/yinyuan-skills](https://github.com/Ming-H/yinyuan-skills)：100 支月老靈籤、生肖六合三合、紫微夫妻宮、八字合婚、桃花運勢與紅線測算。
- [jinchenma94/bazi-skill](https://github.com/jinchenma94/bazi-skill)：子平八字納音、十二長生、神煞體系、格局判定與旺衰用神。
- [voidforall/fengshui.skill](https://github.com/voidforall/fengshui.skill)：三元玄空 24 山飛星、八宅明鏡、形煞化解與協紀辨方擇日。
- [daman-ovo-0404/tarot-skill](https://github.com/daman-ovo-0404/tarot-skill)：78 張韋特牌、6 大牌陣、四維透鏡與元素能量分析。
- [FANzR-arch/Numerologist_skills](https://github.com/FANzR-arch/Numerologist_skills)：奇門專題用神取法、主客動靜辨析與防玄學幻覺工程化約束。

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
- PWA manifest 的站名與短名稱同步更新為「333 一句提醒·照見當下」。

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
