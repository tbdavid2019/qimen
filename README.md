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
- **💍 快速通關：看出你未來另一半深度解析 (`/ziwei/spouse` & `/api/ziwei/spouse`)**：
  - **破解單星年齡誤區**：雙主星兼看（如武貪、同梁、紫府），正統解析夫妻宮主星、生年四化與吉煞照會。
  - **多維度正緣畫像**：客觀年齡差距區間推定（同齡、大3-6歲、小2-5歲、極端差）、心智成熟度、外貌體態風格標籤、性格優缺點與相處地雷、相遇場合與契機，以及月老感情錦囊。
- **⚡ 快速通關：男生真實尺寸與親密戰鬥力雙核測算 (`/ziwei/male-size` & `/api/ziwei/male-size`)**：
  - **破解網路單宮流言**：打破網路流傳「單看子位」導致 50% 膨脹為特大杯的誤區，首創正統斗數「子位（外觀視覺器量）」＋「疾厄宮（肉身器官與實質體能）」雙核合參。
  - **公分區間與風格判定**：明確提供客觀公分區間（`＞16 cm 特大杯`、`11 - 15 cm 大/中杯`、`＜10 cm 小杯`）、耐力評分與戰鬥風格（如暴風破壞型、鋒刃精鋼型、長效永動型等）。
- **三合一 Canonical 路由直達體系**：
  - `/ziwei` (完整排盤) · `/ziwei/spouse` (未來另一半) · `/ziwei/male-size` (男生尺寸) 具備獨立 SEO Canonical Tags 與 History API 無縫切換。
- **標準 CLI 工具**：`skills/ziwei-consultant/scripts/ziwei_cli.js` 支援 `--spouse` 與 `--male-size` 旗標直接輸出對應的結構化 JSON。

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
- **PWA 實時電子羅盤與 24 山坐向測定 (`heading`, `northReference`, `declination`)**：
  - 提供 iOS/Android 感測器介面與手動角度 fallback；實機權限、磁干擾與跨平台校正仍需在 HTTPS 裝置環境驗證。
  - 授權後會同時監聽絕對方向與一般方向事件；只有絕對方向資料才會轉為羅盤向首，相對方向資料會保留手動輸入，不會誤當成北向。
  - 結合圓周平滑低通濾波與傾角防呆（傾角超過 ±15° 發出水平握持警告並禁止鎖定），提供手動滑桿；頁面方向選擇完整涵蓋 8 大方位與 24 山精確坐向全集合下拉選單。
  - 嚴格幾何演算法自動判定**正向下卦**（距山中心 $\le 4.5^\circ$）、**兼向候選**（$4.5^\circ \sim <6.0^\circ$；完整替卦排盤尚未宣稱完成）與**大小空亡線**（距山界或八宮交界 $\le 1.5^\circ$ 出卦警示）。
- **STEP 2 快速九宮住宅物件落位標註器 (`layoutObjects`, `entryPath`, `pathQuality`)**：
  - **7 大類 63 項 Canonical 住宅物件目錄**（空間 15 項、門窗 5 項、家具 11 項、設備 11 項、動線 4 項、外局 6 項、形體 11 項），區分單一放置模式與多處放置。
  - 南在頂、北在下之互動九宮格住宅標註盤面，支援即時點選落位、標籤移除、全盤清空與版本化 `localStorage` 本地快照（`fengshui-layout:v1`）。
  - 進門動線循跡（最後入路宮位序列）與通暢度評估（`open` / `obstructed` / `unknown`）。
- **中州派玄空室內佈局評估引擎 (`lib/fengshui.js`)**：
  - 門氣納氣（向星當令旺生衰死）、主臥床位（山星生旺、病符煞星迴避）、爐灶火門（西北乾宮火燒天門、西兌宮烈火焚金、二黑五黃重煞）、衛浴廁所壓煞、書房文昌（一四同宮、一六共宗）。
  - **資料不足誠實標註原則（Omission Honesty）**：未標註或缺漏的住宅項目（如未安床、未設灶、未設入路），系統嚴格標記為「資料不足」，絕不憑空臆測或產生 AI 幻覺。
  - 收錄傳統文獻短句作文化背景與現代空間行動指引；目前資料未提供可核驗的版本／頁碼，故不宣稱精確版本考據。
- **陽宅玄空飛星與八宅 (`yangzhai`)**：
  - 8 大朝向與 24 山精確坐向立極。
  - 1-9 元運運盤、山星盤、向星盤順逆飛九宮，判定「旺山旺向/雙星到向/雙星到坐/上山下水」。
  - 流年九星飛臨，標註傳統星曜名稱；健康、家庭與財務結果不作確定性預測。
  - 八宅明鏡（四吉方：生氣/天醫/延年/伏位；四凶方：絕命/五鬼/六煞/禍害）。
  - 居住者命卦（男命/女命東四命/西四命配對）與空間功能區佈局優化。
- **形煞診斷與化解 (`shaqi`)**：路沖煞、天斬煞、壁刀煞、反弓煞、穿堂風、橫梁壓頂、鏡對床等 24 種外局與內局形煞「移形易位」化解法。
- **協紀辨方擇日 (`zeri`)**：入宅喬遷、開業開市、動土裝修、婚嫁之建除十二神黃道吉日吉時，避太歲、歲破、三煞。
- **確定性純算 API 端點 (`POST /api/fengshui/evaluate-layout`)**：純演算法評估室內格局，不呼叫 LLM，供 Agent 與外部系統直接查詢。
  - 官方 MCP 提供 `fengshui_layout_evaluation`；WebMCP 與 bridge 使用同一方向宮位／canonical ID／最多 9 段入路契約。

### 7. 🃏 韋特塔羅與生命靈數雙核心 (`/tarot`, `/tarot/numerology`, `/tarot/gallery`)
- **78 張完整原創偉特牌庫與高清視覺**：22 張大阿爾克那 + 56 張小阿爾克那（權杖/火、聖杯/水、寶劍/風、錢幣/土），全數配備 625x1082 高畫質插畫、逆位 180° 翻轉動畫、中英雙語牌名、正逆位關鍵字提煉與全螢幕 Lightbox 原畫燈箱。
- **6 大占卜牌陣**：單張指引（`single`）、三牌陣（`three`：時間線/現狀/感情關係變體）、五牌鑽石（`diamond`）、月亮週期（`moon`）、七星馬蹄（`horseshoe`）、十牌凱爾特十字（`celtic`）。
- **四維透鏡與能量矩陣**：鏡子（現狀）、窗戶（盲點）、門（突破路徑）、錨（核心價值）；大牌佔比、四大元素分佈、牌性生剋、經典牌對組合檢測與具體行動清單。
- **塔羅生命靈數（靈魂本命牌）模組 (`/tarot/numerology` & `/api/tarot/numerology`)**：
  - 依出生西元年月日連加歸約至 1~9 個位數，精準對應大阿爾克那 1~9 號靈魂象徵牌（魔術師、女祭司、皇后、皇帝、教皇、戀人、戰車、力量、隱士）。
  - 提供生日數字九宮格、1–9 生命數與生日數特質、缺數反思題、12 組數字連線觀察、實踐建議與 AI 補充解讀；缺數不代表能力不足，也不作心理診斷或命運預測。
  - 網頁直達路由 `/tarot/numerology` 可獨立完成純計算，不需要 AI；確定性 API `GET|POST /api/tarot/numerology` 與 CLI `tarot_numerology.js` 回傳結構化計算資料。每次計算的輸入與完整結果會送至 Discord webhook；使用 AI 補充解讀時，完整計算資料會送至設定的 LLM。
- **78 張全牌庫圖鑑 (`/tarot/gallery` & `/api/tarot/cards`)**：全牌庫分類篩選（大牌、權杖、聖杯、寶劍、錢幣），點選牌卡即可檢視高清原畫、占星對應與正逆位牌義。

### 8. 📖 解答之書 (`/answerbook` & `/api/answerbook-question`)
- **雙模式運作**：
  - `direct`（直接默念）：隨機翻開一頁獲取宇宙的一句提醒。
  - `question`（輸入問題）：輸入具體困惑，由 AI 結合書中籤言進行深層象徵解讀與理性行動指引。

### 9. ⏰ 時間標準化與午夜邊界解決引擎 (`/api/time/range` & `/api/time/boundary`)
- **午夜邊界問題 (Midnight Boundary Problem)**：徹底根治資料工程與時序統計中常見的「9/1 ~ 9/9 漏算 9/9 當天下午與晚間」的重大邊界缺陷。
- **雙標準保證**：
  - **當日末刻閉區間**：`endDate` 自動補齊至 `23:59:59.999`（或秒精度 `23:59:59`），完整包容當天所有數據。
  - **次日零點半開區間**：同步生成 `endDateTimeExclusive`（次日 `00:00:00.000`），完美支援資料庫標準半開區間查詢（`>= start AND < next_day_start`）。
  - **時區防禦**：避免 JavaScript `new Date('YYYY-MM-DD')` 強制轉 UTC 造成西半球倒退一天或東八區時辰錯亂問題。

---

## Discord webhook 完整紀錄

- 互動計算及解讀紀錄涵蓋奇門、梅花、紫微、塔羅（含生命靈數）、風水、生辰八字、姻緣、姓名驗證／取名、一般術數問答與解答之書。紀錄會以易讀摘要放在 Discord embed，並附完整 JSON 檔，保留請求輸入、完整計算結果和完整 AI 回覆；生命靈數保留出生日期與逐位計算式。
- 奇門與梅花的問題／解讀 webhook 也附完整 JSON，包含完整問題、原始輸入脈絡、盤面資料和未截斷的 AI 回答。梅花網頁會一併傳出起卦方式及原始數字／文字／時間參數。
- 姓名驗證、取名與補充分析都會記錄完整輸入及計算結果；Turnstile 驗證權杖不屬於計算資料，不放進附件。
- 所有紀錄請求以 `wait=true` 等待 Discord 確認訊息已建立。紫微排盤可明確設 `skipRecord: true` 略過紀錄；靜態牌庫、牌卡／風水資料目錄、時間換算與時間驗證等查詢工具不建立占卜紀錄。未設定 Discord webhook 或 Discord 傳送失敗時，API 的 `discord` 欄位會回報狀態；伺服器會記錄傳送錯誤。

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
| **紫微斗數** | `question`, `date`, `time`, `shichen`, `sex`, `calendar`, `leap`, `name`, `conversationHistory`, `mode` (chart/spouse/male-size) | `/ziwei`, `/ziwei/spouse`, `/ziwei/male-size` | `POST /api/ziwei-question`, `POST /api/ziwei/spouse`, `POST /api/ziwei/male-size` | `skills/ziwei-consultant/scripts/ziwei_cli.js` & `ask_ziwei.js` | `ziwei_chart`, `ziwei_future_spouse`, `ziwei_male_size` |
| **梅花易數** | `question`, `method` (time/number/text), `text`, `num1..3`, `purpose`, `conversationHistory` | `/meihua` | `POST /api/meihua-question` | `skills/meihua-consultant/scripts/ask_meihua.js` | `meihua_qigua_time`, `meihua_qigua_numbers`, `meihua_qigua_text`, `meihua_question`, `meihua_divination` |
| **生辰八字2** | `question`, `name`, `formerName`, `calendar`, `date`, `time`, `sex`, `place`, `conversationHistory` | `/bazi2` | `POST /api/bazi2-question` | `skills/bazi2-consultant/scripts/ask_bazi2.js` | `bazi2_chart` |
| **月老姻緣** | `question`, `mode` (6大模式), `name`, `sex`, `stickNum` (1-100), `calendar`, `date`, `time`, `status`, `stage`, `scope`, `seekingSex`, `first/secondZodiac`, `first/secondYear`, `first/second` (雙方四柱), `preference` | `/yinyuan` | `POST /api/yinyuan-question` | `skills/yinyuan-consultant/scripts/ask_yinyuan.js` | `yinyuan_reading` |
| **易經風水** | `question`, `mode` (yangzhai/shaqi/zeri/evaluate-layout), `facing`, `heading`, `northReference`, `declination`, `headingSource`, `layoutObjects`, `entryPath`, `pathQuality`, `moveInYear`, `residentYear`, `sex`, `year`, `shaType`, `matter`, `zeriYear`, `zeriMonth` | `/fengshui` | `POST /api/fengshui-question`, `POST /api/fengshui/evaluate-layout`, `POST /api/fengshui/report` | `skills/fengshui-consultant/scripts/fengshui_cli.js` & `ask_fengshui.js` | `fengshui_report`, `fengshui_layout_evaluation` |
| **韋特塔羅** | `question`, `spread` (6大牌陣), `variant` (4種視角), `time_factor`, `seed`, `conversationHistory` | `/tarot` | `POST /api/tarot-question` | `skills/tarot-consultant/scripts/ask_tarot.js` | `tarot_reading` |
| **解答之書** | `mode` (direct/question), `question`, `conversationHistory` | `/answerbook` | `POST /api/answerbook-question` | `skills/answerbook-consultant/scripts/ask_answerbook.js` | `answerbook_reading` |
| **中文姓名分析** | 驗名 `name` (2–8 字), `surname`, `profile`; 取名 `givenNameLength` (1–4), `includeChars`, `excludeChars`, `desiredElements`, `birthData`, `limit` | `/name-analysis` | `POST /api/name-analysis/verify`, `/api/name-analysis/generate`, `/api/name-analysis-question` | `skills/name-analysis-consultant/scripts/name_analysis_cli.js` | `name_analysis_verify`, `name_analysis_generate`, `name_analysis_question` |
| **時間範圍校正** | `startDate`, `endDate`, `timezone`, `precision` | `/` | `GET/POST /api/time/range` | `lib/civil-time.js` | `date_range_normalize` |

---

### 中文姓名命名與驗證

姓名模組以本地 Node.js 計算，驗證 2–8 個漢字姓名；取名時可指定 1–4 個名字字，所以完整姓名可超過三字。複姓可以手動指定，也能由索引提出切分建議；若有多個可能，回報替代切分。驗名和取名都可選 `taiwanKangxi`（台灣常用康熙筆畫）或 `modern` 筆畫口徑。結果分層呈現逐字字義／讀音／五行、五格與三才；缺漏筆畫、五行、讀音或字義會標示缺漏，不會用預設值填補。

- 驗名：`POST /api/name-analysis/verify`，JSON 範例 `{"name":"歐陽明月清風","profile":"taiwanKangxi"}`。可選 `surname` 明確指定姓氏。
- 取名：`POST /api/name-analysis/generate`，JSON 範例 `{"surname":"歐陽","givenNameLength":3,"includeChars":["安"],"excludeChars":["凶"],"desiredElements":["木"],"limit":20}`。
- 問答：`POST /api/name-analysis-question`，傳入驗名或取名參數並可附 `question`（最多 1,000 字）。沒有設定 LLM 或未提供問題時只回傳確定性結果。驗名與取名的完整輸入和結果送至 Discord webhook；若使用補充解讀，姓名及確定性分析結果會送至設定的 LLM，原始出生日期與時間不加入 LLM prompt，衍生八字摘要可能包含在分析結果中。
- 數理：五格採 `data/name-analysis/method-profiles.json` 所列版本；81 數理與三才分項呈現，不合併成單一「命運分數」。名字部分超過兩字時標示延伸算法，生肖部首喜忌則因缺乏可驗證來源而未啟用。
- 命名候選字來自專案獨立整理的常用姓名字池，依可用字義/筆畫資料與明確偏好排序，並非姓名品質或未來結果的客觀評級。結果應一併考量讀音、多音字、字義、書寫、家庭與個人偏好。
- 可選 `birthData` 以本地既有 `lib/bazi2.js` 計算；需提供日期、排盤性別，以及出生時間/時辰或明確標示未知，可指定曆法、農曆閏月及子時換日口徑。結果列出四柱、日主、五行分布、強弱依據與喜忌參考，缺時辰時明示時柱未知。出生日期與時間不加入 LLM prompt；姓名驗證／取名輸入與完整結果會送至 Discord webhook。若使用補充解讀，姓名、結果與派生八字摘要（含排盤性別與四柱）會送至設定的 LLM。缺出生地時不做真太陽時校正。尚未啟用性別化字風格及生肖部首規則，避免推測用字偏好或套用無來源分類。
- CLI 範例：`node skills/name-analysis-consultant/scripts/name_analysis_cli.js --verify --name 王小明 --surname 王`；取名範例：`node skills/name-analysis-consultant/scripts/name_analysis_cli.js --generate --surname 王 --length 3 --include 安`。也接受 JSON stdin。來源授權與欄位清單見 `data/name-analysis/SOURCES.md`。

補充問答的 `mode` 請明確指定 `verify` 或 `generate`；驗名需 `name`，取名需 `surname`。紫微純排盤 API `POST /api/ziwei/chart` 可設 `skipRecord: true` 僅回傳命盤、不送 Discord 紀錄；CLI 可用 `skills/ziwei-consultant/scripts/ziwei_cli.js` 直接取得不經 LLM 的排盤。

---

## 🤖 外部調用與 AI Agent 整合

LLM 導覽索引位於 [`llms.txt`](https://qi.david888.com/llms.txt)，列出功能模組、API、WebMCP、MCP Bridge、CLI Skills 與資料來源。

### 1. WebMCP (Chrome 瀏覽器標準 In-Browser AI Tools)
本系統支援 Chrome WebMCP 規範：
- 開啟支援 WebMCP 的瀏覽器（如 Chrome 150+ 或啟用 `chrome://flags/#enable-webmcp-testing`）
- 瀏覽器內建代理或擴充套件即可透過 `document.modelContext` 自動探索並執行網頁工具；工具 schema 與 API 使用同一組 canonical enum。
- 頁面上的 `toolname` 宣告式表單由瀏覽器直接註冊；共用 JavaScript 註冊器會自動跳過同名工具，避免重複註冊錯誤。

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

# 紫微斗數十二宮排盤
node skills/ziwei-consultant/scripts/ziwei_cli.js --date 1981-08-11 --shichen 巳 --sex male

# 中文姓名驗證與命名
node skills/name-analysis-consultant/scripts/name_analysis_cli.js --verify --name 歐陽明月清風
node skills/name-analysis-consultant/scripts/name_analysis_cli.js --generate --surname 歐陽 --length 3 --include 安

# 紫微斗數未來另一半正緣年齡差與特質速測（免等 LLM）
node skills/ziwei-consultant/scripts/ziwei_cli.js --date 1981-08-11 --shichen 巳 --sex male --spouse

# 紫微斗數男生真實尺寸與戰鬥力快速測算（免等 LLM）
node skills/ziwei-consultant/scripts/ziwei_cli.js --date 1981-08-11 --shichen 巳 --sex male --male-size
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
# 編輯 .env 填入金鑰：
# - LLM 提供商與金鑰（必要）：LLM_PROVIDER=openai, LLM_API_KEY=sk-...
# - Cloudflare Turnstile 人機驗證（生產環境防刷必要）：
#   TURNSTILE_SITE_KEY=0x4AAAAAA...
#   TURNSTILE_SECRET=0x4AAAAAA...
#   （註：TURNSTILE_HOSTNAMES 為選填，Vercel 部署留空即可）

# 4. 運行單元與整合測試 (100% Pass Rate)
npm test

# 5. 啟動本機伺服器
npm start
# 訪問 http://localhost:3000
```

---

## 🛡️ 安全架構與安全審計 (Security Architecture & Auditing)

本系統全面導入 [Cloudflare Security Audit Skill](https://github.com/cloudflare/security-audit-skill) 標準進行 6 階段深度安全審計（Reconnaissance, Hunting, Validation, Reporting, Structured JSON, Independent Verification）：

- **零資料庫無狀態架構 (Zero-Storage Architecture)**：無 SQL/NoSQL 資料庫，不儲存使用者生辰八字、姓名或對話歷史，杜絕 SQL Injection 與個資外洩風險。
- **金鑰隔離與後端封裝**：所有 LLM API Key 與 Resend 郵件金鑰（`RESEND_API_KEY`）嚴格留存於伺服端環境變數（Vercel Serverless Function 隔離），絕不外流至前端 JavaScript Bundle。
- **向量圖標標準化 (Lucide Icons)**：全面導入 Lucide SVG 向量圖標系統（含 Emoji 雙層後備），杜絕字型檔遺失產生的 `▯` 缺字框。
- **安全標頭與 WebMCP 邊界**：伺服器配置 `Permissions-Policy: tools=(self)`、`X-Content-Type-Options: nosniff`、`X-Frame-Options: SAMEORIGIN`，並停用 `X-Powered-By`。
- **防禦 DoS 與演算法邊界**：地理經緯度與時間計算皆施加嚴格 `Number.isFinite` 邊界校驗與數學取模，杜絕無限迴圈與 ReDoS 風險。
- **Prompt Injection 防護**：對話歷史嚴格限制僅接受 `user` 與 `assistant` 角色，防止攻擊者注入 `system` / `developer` 角色覆寫提示詞。
- **Cloudflare Turnstile 機器人防護**：全站 8 大服務網頁端「詢問」與「解盤」端點（`/api/llm-analysis`、`/api/meihua/llm-analysis`、`/api/:module/llm-analysis`）以及對話紀錄寄送（`/api/conversation/send-email`）全面整合 Cloudflare Turnstile 人機驗證，防範惡意機器人盜刷消耗珍貴 LLM Token 與郵件轟炸；所有程式化調用占卜問答 API（`POST /api/*-question`）維持純淨開放，外部機器人（Telegram Bot、OpenClaw、CLI）調用永遠暢通無阻。
- **安全審計產物**：審計報表與機器可讀格式位於 `~/security-audit-skill/qimen/run-1/`（包含 `architecture.md`、`REPORT.md`、`FINDINGS-DETAIL.md` 與符合 JSON Schema 之 `findings.json`）。

### 🛡️ Cloudflare Turnstile 機器人防護與運維設定合約 (Turnstile Configuration Contract)

系統於網頁端 AI 解盤問答與郵件導出端點實作了標準 Cloudflare Turnstile Managed 人機安全驗證，並貫徹 **「網頁詢問防刷保護 LLM Token、外部 API 直通零阻礙」** 的架構合約：

#### 1. 防護範圍與端點劃分 (Protection Scope & Boundaries)
| 端點類別 | 路由端點 | Turnstile 驗證 | 設計理念與外部整合說明 |
| :--- | :--- | :---: | :--- |
| **網頁問答與解盤 (Web UI)** | `POST /api/llm-analysis`<br>`POST /api/meihua/llm-analysis`<br>`POST /api/:module/llm-analysis`<br>*(支援 ziwei, bazi2, tarot, fengshui, yinyuan, answerbook)* | **強制驗證 (Protected)** | **保護 LLM Token 額度**。前端網頁訪客點擊「💬 詢問」、「開始解盤」、「🌸 梅花解卦」或「排盤並查看命理解讀」時，必須通過 Turnstile 人機驗證，有效杜絕爬蟲盜刷後端 LLM 額度。支援單次使用與續問自動重置。 |
| **對話紀錄寄送** | `POST /api/conversation/send-email` | **強制驗證 (Protected)** | 防止惡意爬蟲、自動化腳本利用 Resend API 進行郵件轟炸（Email Bombing）與垃圾郵件濫發。 |
| **外部程式化 API (Telegram / OpenClaw / CLI)** | `POST /api/qimen-question`<br>`POST /api/meihua-question`<br>`POST /api/ziwei-question`<br>`POST /api/tarot-question`<br>`POST /api/fengshui-question`<br>`POST /api/bazi2-question`<br>`POST /api/yinyuan-question`<br>`POST /api/answerbook-question` | **100% 零阻擋 (開放)** | **杜絕任何驗證碼阻礙**。外部 Telegram Bot、OpenClaw、CLI 腳本（如 `ask_qimen.js`）與第三方串接程式可直接透過 JSON 呼叫，保證 100% 暢通無阻。 |
| **安全配置端點** | `GET /api/turnstile/config` | **公開讀取** | 回傳 `{ success: true, enabled: boolean, siteKey: string\|null }`，供前端瀏覽器與 WebMCP 客戶端動態偵測驗證狀態並載入對應金鑰。 |

#### 2. 環境變數規範 (Environment Variables Reference)
| 變數名稱 | 必要性 | 預設值 | 說明 |
| :--- | :---: | :--- | :--- |
| `TURNSTILE_SITE_KEY` | 生產必要 | 空 (未配置) | Cloudflare Turnstile 前端 Site Key（如 `0x4AAAAAAEvqf7unH6MrhIv2`），用於前端表單渲染驗證元件。 |
| `TURNSTILE_SECRET` | 生產必要 | 空 (未配置) | Cloudflare Turnstile 伺服端 Secret Key（如 `0x4AAAAAAEvqf_c5mhEOQxVqIasfqUddfKU`），用於向 Cloudflare `siteverify` 端點校驗憑證。 |
| `TURNSTILE_ENABLED` | 選填 | 依金鑰自動判定 | 若明確設為 `false` 或 `0`，則在一般環境強制停用驗證；若未設定，只要配置完整金鑰即自動啟用。 |
| `TURNSTILE_FORCE_ENABLE`| 選填 | `false` | 若設為 `true`，則擁有**最高優先權**，無論 `NODE_ENV` 或 `TURNSTILE_ENABLED` 均強制執行驗證與 Fail-Closed 檢查。 |
| `TURNSTILE_HOSTNAMES` | 選填 | 空 (不限主機) | 允許之來源網域名稱白名單（逗號分隔，例如 `qi.david888.com,localhost,127.0.0.1`）。 |
| `TURNSTILE_BYPASS_TOKEN`| 選填 | 空 (未配置) | 專屬內部授權旁路權杖。自動化 CI/CD 或內部整合測試可於 HTTP Request 帶上標頭 `x-turnstile-bypass: <TOKEN>` 直通跳過驗證。 |

#### 3. 關鍵安全檢驗機制
- **嚴格 Fail-Closed 防禦**：
  若設定不完整（例如設定了 `TURNSTILE_SECRET` 卻漏設 `TURNSTILE_SITE_KEY`），中介層嚴格返回 HTTP 503 阻止連線，絕不靜默略過安全防線。
- **動態主機綁定校驗 (Host Binding Validation)**：
  中介層將當前 HTTP 請求的主機名稱（`req.hostname` / `Host` Header）傳入驗證器，嚴格比對 Cloudflare `siteverify` 回傳之 `hostname`。防止攻擊者於 `localhost` 本機解題獲取 Token 後重播（Replay）至生產環境 `qi.david888.com`。
- **操作標籤一致性 (Action Validation)**：
  驗證權杖必須綁定 `action: "llm_analysis"`、`"qimen_question"`、`"meihua_question"` 或 `"send_email"`，杜絕跨表單或跨操作之 Token 挪用。
- **權杖單次使用與即時清理 (Single-use Token & Instant Reset)**：
  無論問答解盤成功或失敗，前端與 WebMCP 均於 `complete`/`finally` 區塊立即重置 Turnstile Widget 並清除快取 Token，確保單次驗證權杖絕不重複發送，並讓續問流暢無縫。

---

## 📜 專案理念與社群規範

> 「傳統智慧，理性解讀；照見當下，指引行動。」
> 本系統旨在藉由傳統數術之符號全息系統，為使用者梳理思緒、發現盲點，不宣揚宿命迷信，賦予當下清晰理性的決策行動力。
