# 更新日誌 (Changelog)

所有本專案的重要更新都將記錄在此文件中。

## [2026-08-28]

### 🔮 正統術數核心與上游算法 100% Golden Parity 等價移植

- **🃏 韋特塔羅 100% 對齊原作者 Python `draw.py` (`lib/tarot.js`, `skills/tarot-consultant/`)**：
  - 完整實作 Python MT19937 (`PythonRandom`) 隨機數生成器與累積權重選擇機制（`rng.choices`）。
  - 在相同 `seed=12345, time_factor=night, spread=three` 條件下，抽出的牌陣為 `權杖十 (正位) / 寶劍十 (正位) / 權杖五 (正位)`，與上游 Python `draw.py` 輸出 100% 逐字逐卡精確對齊。
  - 支援 `relationship`, `decision`, `situation`, `timeline` 變體牌陣與自選時間因子加權。

- **📜 八字命理全面對齊上游 `references/shensha-table.md` (`lib/bazi2.js`, `skills/bazi2-consultant/`)**：
  - 補齊完整神煞體系：天乙貴人、天德、月德、文昌、學堂（長生位）、詞館（臨官位）、將星、華蓋、驛馬、天醫、祿神、金輿、羊刃、劫煞、災煞、亡神、咸池桃花、孤辰、寡宿、空亡/旬空、元辰（大耗，分陰陽年男女）、血刃。
  - 修復 `--shichen` 被預設 12:00 覆蓋之問題，傳入 `shichen: '子'` 時精確排定子時（`00:00`，如五鼠遁 `丙子` 時）。
  - 支援未知時辰模式（`allowUnknownHour`，時柱保持未知只排六字）與已故年份上限過濾（`deceasedYear`）。

- **⛩️ 月老姻緣嚴格輸入驗證與防偽機制 (`lib/yinyuan.js`, `app.js`)**：
  - 所有模式（`zodiac`, `bazi-match`, `peach-blossom`, `red-thread`, `ziwei-marriage`, `fortune`）缺少必要資料時均嚴格回傳 400 驗證錯誤，徹底根除靜默 fallback 與虛假合婚。

- **🧭 易經風水完整 24 山三元玄空飛星排盤 (`lib/fengshui.js`, `app.js`)**：
  - 實作完整三元玄空 1-9 運 24 山運盤、山星盤、向星盤動態排盤與順逆飛星（天元/地元/人元龍性與五黃寄宮）。
  - 動態判定四大格局：旺山旺向（如九運壬山丙向、丙山壬向）、雙星到向（如九運丑山未向、坤山艮向）、雙星到坐（如九運艮山坤向、未山丑向）、上山下水（如九運子山午向、午山子向）。
  - 協紀辨方擇日依當日天干以五鼠遁動態推算黃道吉時，`/api/fengshui-question` 依 `mode` (`yangzhai`/`shaqi`/`zeri`) 正確分流計算。

- **✨ 奇門遁甲 Consultant CLI 全動態化 (`skills/qimen-consultant/scripts/qimen_cli.js`)**：
  - 依日支三合動態查驛馬星、時干為甲時改用旬首隱儀定位落宮、輸出動態星門宮五行生剋關係（`star_palace_relation`, `door_palace_relation`）。

- **🌐 MCP 五層（TypeScript MCP Server / dist / MCP Bridge / WebMCP / API）100% 逐欄同步**：
  - `mcp/src/tools/divination.ts` 與 `mcp/dist/` 新增 `ziwei_analysis`，並全數補齊塔羅 `variant`/`time_factor`、風水 24 山坐向與 `mode`/`shaType`/`matter`、八字 `shichen`/`hour`/`deceasedYear`、姻緣所有模式。
  - `test/parity-golden.test.js` 建立逐案例 Golden 對照測試，全系統 127 項測試 100% 通過。

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
