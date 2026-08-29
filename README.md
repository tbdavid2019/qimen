# 333 一句提醒·照見當下 (Metaphysics & Divination Suite)

> **傳統智慧，理性解讀；照見當下，指引行動**
> 
> [!IMPORTANT]
> **🤖 FOR AI AGENTS & LLMs**: 
> This repository provides native Model Context Protocol (MCP), **WebMCP** (Chrome In-Browser Agent Tools) support, Standalone CLI Skills, and standard JSON REST APIs.
> - **🌐 WebMCP (In-Browser Tools)**: Full support for Chrome WebMCP Imperative & Declarative API (`document.modelContext`). AI browser agents can directly discover and execute tools across all 7 divination services.
> - **⚡ Zero-Dependency MCP Bridge**: Use `mcp-bridge.js` to access all 7 services via JSON-RPC 2.0 stdio.
> - **🚀 Production APIs**: Send POST requests to `https://qi.david888.com/api/` endpoints.
> - **🧠 Consultant Skills**: Behavioral guidance and CLI tools available in `skills/*-consultant/SKILL.md`.

👉 [查看更新日誌 (Changelog)](CHANGELOG.md)

---

## 📱 手機版導覽

手機版採「品牌列＋可左右滑動功能列」設計，主要術數模組與工具入口直接呈現，不藏在漢堡選單中。淺色與深色模式共用同一套響應式結構，並依主題 token 自動切換背景、邊框、文字與目前頁面高亮色。

---

## 🌟 7 大正統術數與心靈模組

本系統拒絕任何敷衍與閹割版本，全量實作古典正統算法與全息數據庫：

### 1. 🧭 奇門遁甲 (`/` & `/api/qimen-question`)
- **排盤立極**：陰陽遁 18 局、三奇六儀、九宮、八門、九星、八神、值符值使。
- **十天干克應格局庫 (`lib/qimen-geju.js`)**：青龍返首（戊+丙）、飛鳥跌穴（丙+戊）、玉女伏地（丁+乙）、奇儀順遂（乙+丙）、青龍逃走（乙+辛）、白虎猖狂（辛+乙）、朱雀投江（丁+癸）、騰蛇夭矯（癸+丁）、太白入熒（庚+丙）、熒入太白（丙+庚）、伏吟、反吟等。
- **三遁吉格與門迫宮迫**：天遁、地遁、人遁、神遁、鬼遁、風遁、雲遁、龍遁、虎遁；精準計算八門五行與落宮生剋之門迫與宮迫。
- **專題用神與主客動靜**：
  - **求財投資**：生門（利潤）、甲子戊（本金資本）、日干。
  - **工作事業**：開門（工作單位）、值符（主管貴人）、日干。
  - **感情婚姻**：六合（合約婚姻）、乙（女方）、庚（男方）、日時干。
  - **考試學業**：景門（成績）、天輔星（名聲）、丁奇（文章）。
  - **疾病健康**：天芮星（病灶）、死門（嚴重度）、日干（結合現實就醫提醒）。
  - **出行方位**：目標方位宮位、開門、生門、值符。
  - **官司合約**：驚門、開門（法官合約）、天心星（律師）。
  - **主客動靜**：辨析「宜主宜靜（防守等待）」或「宜客宜動（主動出擊）」。
- **時間精度模式**：傳統時辰（兩小時一盤）與進階九宮拆補 13 分鐘法。
- **標準 CLI 工具**：`skills/qimen-consultant/scripts/qimen_cli.js` 遵循 `mainline-cn-v1` 規格輸出標準排盤與用神定位。

### 2. 🔮 紫微斗數 (`/ziwei` & `/api/ziwei-question`)
- **正統三合安星訣**：
  - 寅宮起生月順逆定命身宮、起寅首天干定十二宮天干、五行局（水二局、木三局、金四局、土五局、火六局）。
  - 安紫微星與天府星、紫微六星系（紫微、天機、太陽、武曲、天同、廉貞）與天府八星系（天府、太陰、貪狼、巨門、天相、天梁、七殺、破軍）。
  - 安六吉星（文昌、文曲、左輔、右弼、天魁、天鉞）、六煞星（擎羊、陀羅、火星、鈴星、地空、地劫）、祿存、天馬、紅鸞、天喜。
  - 十四主星廟旺平陷亮度矩陣。
  - 十天干生年四化（祿權科忌）增減損益。
  - 大限順逆排盤（陽男陰女順行、陰男陽女逆行，起運年齡=局數）與三方四正照會。
  - 30+ 種吉凶格局自動檢測（紫府同宮、機月同梁、殺破狼、陽梁昌祿、火貪格等）。
- **標準 CLI 工具**：`skills/ziwei-consultant/scripts/ziwei_cli.js` 輸出標準十二宮位與四化格局 JSON。

### 3. 🌸 梅花易數 (`/meihua` & `/api/meihua-question`)
- **起卦方式**：
  - **時間起卦**：精確到年月日時與時辰。
  - **數字起卦**：提供 3 個 1-100 數字計算上卦、下卦與動爻。
  - **漢字起卦**：任意輸入 1 至多個漢字，依康熙/筆畫數定乾坤。
- **五卦全息系統**：本卦（現狀基礎）、互卦（過程演變）、變卦（最終趨勢）、錯卦（盲點危機）、綜卦（換位思考）。
- **爻辭與應期**：完整 64 卦與 384 爻動爻爻辭、體用五行生剋旺衰、四季得時與先天數應期推算。

### 4. 📜 八字命理 / 賽博算命 (`/bazi2` & `/api/bazi2-question`)
- **四柱排盤**：年月日時四柱天干地支、六十甲子納音五行、十二長生運。
- **十神與藏干**：十神六親、地支本氣/中氣/餘氣藏干。
- **旺衰與五行力量**：日主得令、得地、得勢判定（身旺/身弱），五行百分比能量分佈。
- **格局與喜用神**：正官格、七殺格、正偏財格、食神格、傷官格、印格、建祿格、陽刃格等判定，指明生扶/泄秀之喜用神與忌神。
- **吉凶神煞**：天乙貴人、文昌貴人、驛馬、桃花咸池、華蓋、將星、祿神、羊刃、月德貴人。
- **大運與流年**：十年大運排盤、流年干支生剋互動與歷史關鍵轉折年份驗證。

### 5. 🏮 月老 · 姻緣測算 (`/yinyuan` & `/api/yinyuan-question`)
- **100 支月老靈籤 (`fortune`)**：支援自選籤號（1-100）或🎲誠心搖籤按鈕、信士姓名/性別（Radio Pills 快速點選）、出生日期、感情狀態（單身/暗戀/熱戀/備婚/已婚/分手挽回）與問事主題。
- **生肖配對 (`zodiac`)**：12 生肖快速選擇或出生西元年份、相處階段（初識/曖昧/熱戀/備婚/已婚）、三合/六合/六沖/六害契合評分與磨合錦囊。
- **紫微夫妻宮 (`ziwei-marriage`)**：姓名、性別、公曆/農曆雙曆法、出生年月日、十二時辰下拉、感情狀態、14 主星四化與配偶特質畫像。
- **桃花運勢 (`peach-blossom`)**：出生年月日、性別、感情狀態、2026年度/近期3-6個月查詢範圍、本命桃花位（子午卯酉）與開運法。
- **八字合婚 (`bazi-match`)**：甲方與乙方雙方姓名、性別、公曆/農曆、出生年月日、出生時辰、關係階段與四柱天合地合互補評分。
- **紅線測算 (`red-thread`)**：命主姓名、性別、尋找對象性別、理想型特質偏好、單身狀態、正緣外貌氣質/職業/相遇場景與時機窗口。

### 6. 🏡 易經風水 / 陽宅分析 (`/fengshui` & `/api/fengshui-question`)
- **陽宅玄空飛星與八宅 (`yangzhai`)**：
  - 8 大朝向與 24 山精確坐向立極。
  - 1-9 元運運盤、山星盤、向星盤順逆飛九宮，判定「旺山旺向/雙星到向/雙星到坐/上山下水」。
  - 流年九星飛臨，標註五黃大煞、二黑病符與當令旺星。
  - 八宅明鏡（四吉方：生氣/天醫/延年/伏位；四凶方：絕命/五鬼/六煞/禍害）。
  - 居住者命卦（男命/女命東四命/西四命配對）與空間功能區佈局優化。
- **形煞診斷與化解 (`shaqi`)**：路沖煞、天斬煞、壁刀煞、反弓煞、穿堂風、橫梁壓頂、鏡對床等 8 大內外形煞「移形易位」化解法。
- **協紀辨方擇日 (`zeri`)**：入宅喬遷、開業開市、動土裝修、婚嫁之建除十二神黃道吉日吉時，避太歲、歲破、三煞。

### 7. 🃏 韋特塔羅解讀 (`/tarot` & `/api/tarot-question`)
- **78 張完整韋特牌庫**：22 張大阿爾克那 + 56 張小阿爾克那（權杖/火、聖杯/水、寶劍/風、錢幣/土），支援正逆位與自訂牌組/種子抽牌。
- **6 大牌陣**：單張指引（`single`）、三牌陣（`three`：時間線/現狀/感情關係變體）、五牌鑽石（`diamond`）、月亮週期（`moon`）、七星馬蹄（`horseshoe`）、十牌凱爾特十字（`celtic`）。
- **四維透鏡與能量矩陣**：鏡子（現狀）、窗戶（盲點）、門（突破路徑）、錨（核心價值）；大牌佔比、四大元素分佈、牌性生剋、經典牌對組合檢測與具體行動清單。

### 8. 📖 解答之書 (`/answerbook` & `/api/answerbook-question`)
- **雙模式運作**：
  - `direct`（直接默念）：隨機翻開一頁獲取宇宙的一句提醒。
  - `question`（輸入問題）：輸入具體困惑，由 AI 結合書中籤言進行深層象徵解讀與理性行動指引。

---

## 🧠 AI 專業解盤標準與雙層輸出架構 (Dual-Layer Architecture)

為兼顧**學術嚴謹度**與**大眾決策可讀性**，本系統所有 AI 解盤均貫徹「雙層輸出結構」：

1. **第一層：正統數術推演（嚴謹論據）**：
   - 完整展示十干克應、體用生剋、四化飛星、神煞喜用、玄空九星或四維透鏡等核心推演過程，保證算法不閹割、論述有依據。
2. **第二層：【🎯 直面解答 · 一句提醒】（白話決策）**：
   - **正面回答使用者提問**：完全脫離術數黑話，用通俗大白話直接回應使用者提出的具體問題（明確給出吉凶傾向、成敗利弊、適合或不適合之結論）。
   - **一句核心提醒**：提煉一句簡潔有力的行動金句，落實「一句提醒·照見當下」。
   - **現實行動指南**：條列 2~3 點可落地的現實生活因應步驟，強調事在人為、理性客觀。

---

## 💻 全介面 5 層架構對齊矩陣

本專案嚴格貫徹 **Web UI、API、Skill、WebMCP、MCP-Bridge 5 層參數完全對齊**：

| 服務模組 | 核心參數集合 (Full Parameters) | Web UI 路由 | API 端點 | CLI Skill 腳本 | WebMCP 工具名稱 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **奇門遁甲** | `question`, `purpose` (8大專題), `mode` (adv/trad), `datetime`, `conversationHistory` | `/` & `/custom` | `POST /api/qimen-question` | `skills/qimen-consultant/scripts/qimen_cli.js` & `ask_qimen.js` | `qimen_divination`, `qimen_question`, `qimen_custom_paipan` |
| **紫微斗數** | `question`, `date`, `time`, `shichen`, `sex`, `calendar`, `leap`, `name`, `conversationHistory` | `/ziwei` | `POST /api/ziwei-question` | `skills/ziwei-consultant/scripts/ziwei_cli.js` & `ask_ziwei.js` | `ziwei_chart` |
| **梅花易數** | `question`, `method` (time/number/text), `text`, `num1..3`, `purpose`, `conversationHistory` | `/meihua` | `POST /api/meihua-question` | `skills/meihua-consultant/scripts/ask_meihua.js` | `meihua_qigua_time`, `meihua_qigua_numbers`, `meihua_qigua_text`, `meihua_question`, `meihua_divination` |
| **生辰八字2** | `question`, `name`, `formerName`, `calendar`, `date`, `time`, `sex`, `place`, `conversationHistory` | `/bazi2` | `POST /api/bazi2-question` | `skills/bazi2-consultant/scripts/ask_bazi2.js` | `bazi2_chart` |
| **月老姻緣** | `question`, `mode` (6大模式), `name`, `sex`, `stickNum` (1-100), `calendar`, `date`, `time`, `status`, `stage`, `scope`, `seekingSex`, `first/secondZodiac`, `first/secondYear`, `first/second` (雙方四柱), `preference` | `/yinyuan` | `POST /api/yinyuan-question` | `skills/yinyuan-consultant/scripts/ask_yinyuan.js` | `yinyuan_reading` |
| **易經風水** | `question`, `mode` (yangzhai/shaqi/zeri), `facing`, `moveInYear`, `residentYear`, `sex`, `year`, `shaType`, `matter`, `zeriYear`, `zeriMonth` | `/fengshui` | `POST /api/fengshui-question` | `skills/fengshui-consultant/scripts/ask_fengshui.js` | `fengshui_report` |
| **韋特塔羅** | `question`, `spread` (6大牌陣), `variant` (4種視角), `time_factor`, `seed`, `conversationHistory` | `/tarot` | `POST /api/tarot-question` | `skills/tarot-consultant/scripts/ask_tarot.js` | `tarot_reading` |
| **解答之書** | `mode` (direct/question), `question`, `conversationHistory` | `/answerbook` | `POST /api/answerbook-question` | `skills/answerbook-consultant/scripts/ask_answerbook.js` | `answerbook_reading` |

---

## 🤖 外部調用與 AI Agent 整合

### 1. WebMCP (Chrome 瀏覽器標準 In-Browser AI Tools)
本系統支援 Chrome WebMCP 規範：
- 開啟支援 WebMCP 的瀏覽器（如 Chrome 150+ 或啟用 `chrome://flags/#enable-webmcp-testing`）
- 瀏覽器內建代理或擴充套件即可透過 `document.modelContext` 自動探索並執行網頁工具；工具 schema 與 API 使用同一組 canonical enum。

### 2. 零依賴 MCP Bridge (JSON-RPC stdio)
供 Claude Desktop、Cursor 或任意 MCP Client 使用：
```json
{
  "mcpServers": {
    "qimen-suite": {
      "command": "node",
      "args": ["/path/to/qimen/mcp-bridge.js"]
    }
  }
}
```

### 3. Standalone CLI Skills
任何 Skill 腳本均可獨立運行，支援 JSON 輸入或命令列參數：
```bash
# 奇門占卜
node skills/qimen-consultant/scripts/ask_qimen.js '{"question":"今天適合投資嗎？","purpose":"求財"}'

# 梅花漢字起卦
node skills/meihua-consultant/scripts/ask_meihua.js '{"question":"事業合作前景？","method":"text","text":"吉祥如意"}'

# 月老靈籤自選籤號
node skills/yinyuan-consultant/scripts/ask_yinyuan.js '{"mode":"fortune","stickNum":66,"question":"今年有正緣嗎？"}'

# 風水擇日
node skills/fengshui-consultant/scripts/ask_fengshui.js '{"mode":"zeri","matter":"movein","zeriYear":2026,"zeriMonth":9,"question":"推薦入宅吉日"}'
```

---

## 🛠️ 本地安裝與快速啟動

### 環境需求
- **Node.js**: >= 18.0.0
- **套件管理器**: `pnpm` 或 `npm`

### 安裝與運行
```bash
# 1. 複製倉庫
git clone https://github.com/tbdavid2019/qimen.git
cd qimen

# 2. 安裝依賴
npm install

# 3. 配置環境變數
cp .env.example .env

# 4. 運行單元與整合測試 (100% Pass Rate)
npm test

# 5. 啟動本機伺服器
npm start
# 訪問 http://localhost:3000
```

---

## 📜 專案理念與社群規範

> 「傳統智慧，理性解讀；照見當下，指引行動。」
> 本系統旨在藉由傳統數術之符號全息系統，為使用者梳理思緒、發現盲點，不宣揚宿命迷信，賦予當下清晰理性的決策行動力。
