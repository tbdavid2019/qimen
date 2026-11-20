/**
 * API 文檔資料產生器（從 app.js 抽離以維持單體精簡並消除重複端點定義）
 */
function buildApiDocs({
    baseUrl,
    tarotSpreads,
    fengshuiFacings,
    yinyuanModes,
    shaQiLibrary
}) {
    return {
        title: "333 一句提醒·照見當下 術數套件全方位 API 文檔",
        version: "2.0",
        description: "提供奇門遁甲、紫微斗數、六爻神卦、梅花易數、生辰八字（含韓式現代四柱 K-Saju）、易經風水、韋特塔羅、月老姻緣、解答之書、姓名分析、測字占事與中醫五運六氣養生服務之全方位 RESTful API",
        baseUrl,
        endpoints: {
            nameAnalysisVerify: {
                method: "POST", path: "/api/name-analysis/verify", description: "驗證 2–8 個漢字中文姓名；姓名邊界可明確指定，或由姓氏索引提示切分。",
                parameters: { name: { type: "string", required: true, minLength: 2, maxLength: 8 }, surname: { type: "string", required: false, description: "姓名開頭的明確姓氏" }, profile: { type: "string", required: false, enum: ["taiwanKangxi", "modern"], default: "taiwanKangxi" }, birthData: { type: "object", required: false, description: "選填：本地八字計算；date、sex 與 time/shichen 或 allowUnknownHour。出生資料不進入 LLM prompt。" } },
                errors: ["INVALID_NAME", "INVALID_SURNAME", "SURNAME_REQUIRED", "INVALID_PROFILE"]
            },
            nameAnalysisGenerate: {
                method: "POST", path: "/api/name-analysis/generate", description: "依姓氏與條件產生 1–4 字名字候選；命名風格排序結合編輯整理字表及 CCNC 語料字頻／字組統計，僅作軟性參考。",
                parameters: { surname: { type: "string", required: true, minLength: 1, maxLength: 3 }, givenNameLength: { type: "integer", required: false, minimum: 1, maximum: 4, default: 2 }, includeChars: { type: "array", items: "single Han character" }, excludeChars: { type: "array", items: "single Han character" }, desiredElements: { type: "array", items: ["木", "火", "土", "金", "水"] }, nameStyle: { type: "string", enum: ["auto", "feminine", "masculine", "neutral"], default: "auto", description: "命名風格；auto 參照 birthData.sex，沒有性別資料則中性。僅為常見命名風格排序，不代表性別判定。" }, profile: { type: "string", enum: ["taiwanKangxi", "modern"] }, limit: { type: "integer", maximum: 50 }, birthData: { type: "object", required: false, description: "選填：date、sex、time/shichen 或 allowUnknownHour；本地計算後作為偏好排序。" } },
                errors: ["INVALID_SURNAME", "INVALID_GIVEN_NAME_LENGTH", "INVALID_CHAR_CONSTRAINT", "TOO_MANY_REQUIRED_CHARS"]
            },
            nameAnalysisQuestion: {
                method: "POST", path: "/api/name-analysis-question", description: "重算驗名、命名或測字結果；提供 question 且設定 LLM 時，姓名與確定性分析結果會傳至設定的 LLM；出生日期與時間不放入提示，派生五行摘要可能會傳入。",
                parameters: { mode: { type: "string", enum: ["verify", "generate", "cezi"], default: "verify" }, name: { type: "string", required: false }, surname: { type: "string", required: false }, givenNameLength: { type: "integer", minimum: 1, maximum: 4 }, includeChars: { type: "array", items: "single Han character" }, excludeChars: { type: "array", items: "single Han character" }, desiredElements: { type: "array", items: ["木", "火", "土", "金", "水"] }, nameStyle: { type: "string", enum: ["auto", "feminine", "masculine", "neutral"], default: "auto" }, question: { type: "string", required: false, maxLength: 1000 }, profile: { type: "string", enum: ["taiwanKangxi", "modern"] }, birthData: { type: "object", required: false, description: "選填八字欄位；LLM 僅接收派生的五行摘要，不接收出生資料。" } },
                notes: ["未配置 LLM 或未提供 question 時只回傳確定性結果。", "缺失欄位不得推斷；三字以上名字使用標示的延伸五格算法。"]
            },
            nameMethodProfiles: { method: "GET", path: "/data/name-analysis/method-profiles.json", description: "姓名方法與來源版本清單。" },
            nameStyleProfiles: { method: "GET", path: "/data/name-analysis/name-style-profiles.json", description: "取名風格排序字表、風格組合與方法限制。" },
            nameCorpusProfile: { method: "GET", path: "/data/name-analysis/name-corpus-profile.json", description: "CCNC 中文姓名語料的性別標記字頻及名字相鄰字組聚合統計；不含完整姓名，僅作排序參考。" },
            qimenQuestion: {
                method: "POST",
                path: "/api/qimen-question",
                description: "提交問題並獲得基於奇門遁甲的分析回答",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "要詢問的問題", example: "今天適合投資嗎？" },
                    datetime: { type: "string", required: false, description: "指定排盤時間 (ISO 8601 格式)，不提供則使用當前時間", example: "2024-12-10T14:30:00" },
                    mode: { type: "string", required: false, default: "advanced", description: "時間精度模式", enum: ["traditional", "advanced"] },
                    purpose: { type: "string", required: false, default: "綜合", description: "問事用途", example: "事業" },
                    timezone: { type: "string", required: false, default: "+08:00", description: "時區偏移 (±HH:MM 格式)", example: "+08:00" },
                    lang: { type: "string", required: false, default: "zh-tw", description: "回答語言", enum: ["zh-tw", "zh-cn"] }
                },
                responseExample: {
                    success: true,
                    question: "今天適合投資嗎？",
                    answer: "根據當前奇門盤分析...",
                    qimenInfo: { datetime: "2024-12-10T14:30:00.000Z", localDate: "2024/12/10", localTime: "下午2:30:00", mode: "advanced", purpose: "綜合" },
                    metadata: { provider: "openai", model: "gpt-5.6-sol", language: "zh-tw" },
                    discord: { questionSent: true, analysisSent: true, enabled: true }
                }
            },
            discordTest: { method: "GET", path: "/api/discord-test", description: "測試 Discord webhook 連接" },
            llmConfig: { method: "GET", path: "/api/llm-config", description: "獲取 LLM 和 Discord 配置狀態" },
            meihuaQuestion: {
                method: "POST",
                path: "/api/meihua-question",
                description: "提交問題並獲得基於梅花易數的分析回答",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "要詢問的問題" },
                    method: { type: "string", required: false, default: "time", enum: ["time", "number", "text", "character"], description: "起卦方式" },
                    datetime: { type: "string", required: false, description: "指定時間 (ISO 8601 格式)" },
                    num1: { type: "number", required: false, description: "數字起卦第一數" },
                    num2: { type: "number", required: false, description: "數字起卦第二數" },
                    num3: { type: "number", required: false, description: "數字起卦第三數 (動爻)" },
                    text: { type: "string", required: false, description: "漢字或詞語（text/character 起卦時使用）" },
                    purpose: { type: "string", required: false, default: "綜合", description: "問事用途" },
                    timezone: { type: "string", required: false, default: "+08:00", description: "時區偏移 (±HH:MM 格式)" },
                    lang: { type: "string", required: false, default: "zh-tw", enum: ["zh-tw", "zh-cn"], description: "回答語言" }
                }
            },
            tarotQuestion: {
                method: "POST",
                path: "/api/tarot-question",
                description: "抽取塔羅牌並獲得模組化解讀",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "要詢問的問題" },
                    spread: { type: "string", required: false, default: "three", enum: Object.keys(tarotSpreads), description: "牌陣" },
                    variant: { type: "string", required: false, enum: ["timeline", "situation", "relationship", "decision"], description: "三牌陣解讀視角" },
                    time_factor: { type: "string", required: false, enum: ["morning", "afternoon", "night"], description: "時間能量因子" },
                    timeFactor: { type: "string", required: false, enum: ["morning", "afternoon", "night"], description: "時間能量因子（相容別名）" },
                    seed: { type: "string", required: false, description: "可重現抽牌的亂數種子" },
                    lang: { type: "string", required: false, default: "zh-tw", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
                    conversationHistory: { type: "array", required: false, description: "多輪對話歷史" }
                }
            },
            fengshuiQuestion: {
                method: "POST",
                path: "/api/fengshui-question",
                description: "計算八宅、九運與流年飛星並獲得行動建議",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "要詢問的問題" },
                    mode: { type: "string", required: false, default: "yangzhai", enum: ["yangzhai", "shaqi", "zeri"], description: "風水服務模式" },
                    facing: { type: "string", required: false, default: "南", enum: Array.from(fengshuiFacings), description: "房屋朝向（8 大方位或 24 山）" },
                    heading: { type: "number", required: false, description: "電子羅盤向首角度 [0, 360)，優先推導 24 山" },
                    northReference: { type: "string", required: false, enum: ["magnetic", "true"], default: "magnetic", description: "北向基準" },
                    declination: { type: "number", required: false, default: 0, description: "磁偏角（真北校正度數）" },
                    headingSource: { type: "string", required: false, enum: ["sensor", "manual"], description: "角度數據來源" },
                    layoutObjects: { type: "object", required: false, description: "住宅物件九宮配置（九宮方位鍵 -> 63 種 Canonical ID 陣列）" },
                    entryPath: { type: "array", required: false, description: "最後入路宮位有序序列（例如 [\"東南\", \"南\", \"中\"]）" },
                    pathQuality: { type: "string", required: false, enum: ["open", "obstructed", "unknown"], description: "入路通暢程度" },
                    moveInYear: { type: "integer", required: false, description: "入住年份" },
                    residentYear: { type: "integer", required: false, description: "居住者出生年份" },
                    sex: { type: "string", required: false, enum: ["男", "女"], description: "居住者性別" },
                    year: { type: "integer", required: false, description: "分析年份" },
                    shaType: { type: "string", required: false, enum: shaQiLibrary.map(({ name }) => name), description: "形煞類型（shaqi 模式）" },
                    matter: { type: "string", required: false, enum: ["入宅/喬遷", "開業/開市", "動土/裝修", "婚嫁/嫁娶"], description: "擇日事項（zeri 模式）" },
                    zeriYear: { type: "integer", required: false, description: "擇日目標年份" },
                    zeriMonth: { type: "integer", required: false, minimum: 1, maximum: 12, description: "擇日目標月份" },
                    lang: { type: "string", required: false, default: "zh-tw", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
                    conversationHistory: { type: "array", required: false, description: "多輪對話歷史" }
                }
            },
            fengshuiEvaluateLayout: {
                method: "POST",
                path: "/api/fengshui/evaluate-layout",
                description: "純計算端點：根據坐向角度或 24 山與九宮物件標註進行中州派陽宅理氣評估（無 LLM 延遲）",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    heading: { type: "number", required: false, description: "向首角度 [0, 360)" },
                    facing: { type: "string", required: false, enum: Array.from(fengshuiFacings), description: "房屋朝向" },
                    layoutObjects: { type: "object", required: false, description: "九宮物件 ID 分佈物件" },
                    entryPath: { type: "array", required: false, description: "大門至核心入路宮位序列" },
                    pathQuality: { type: "string", required: false, enum: ["open", "obstructed", "unknown"], description: "入路通暢狀態" },
                    moveInYear: { type: "integer", required: false, description: "入住年份" },
                    year: { type: "integer", required: false, description: "分析年份" }
                }
            },
            fengshuiLayoutCatalog: {
                method: "GET",
                path: "/data/fengshui/layout-catalog.json",
                description: "獲取權威中州派 7 大類 63 項 Canonical 住宅物件目錄元數據",
                headers: { "Content-Type": "application/json" },
                parameters: {}
            },
            ziweiQuestion: {
                method: "POST",
                path: "/api/ziwei-question",
                description: "計算紫微斗數十二宮命盤、18經典格局與十干四化，並獲得命理解讀",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "要詢問的命理問題" },
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, default: "12:00", description: "出生時間（HH:mm）" },
                    shichen: { type: "string", required: false, enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
                    sex: { type: "string", required: false, enum: ["男", "女"], description: "命主性別" },
                    calendar: { type: "string", required: false, default: "solar", enum: ["solar", "lunar"], description: "曆法" },
                    leap: { type: "boolean", required: false, description: "農曆是否閏月" },
                    lang: { type: "string", required: false, default: "zh-tw", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
                    conversationHistory: { type: "array", required: false, description: "多輪對話歷史" }
                }
            },
            ziweiChart: {
                method: "GET / POST",
                path: "/api/ziwei/chart",
                description: "紫微斗數純排盤：十四主星善本廟旺、34種古籍格局成格/加分/破格判定、三組十二神煞與夫妻宮畫像，支援 skipRecord: true 跳過記錄",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, description: "出生時間（HH:mm）" },
                    shichen: { type: "string", required: false, enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
                    sex: { type: "string", required: false, enum: ["男", "女"], default: "男", description: "性別" },
                    calendar: { type: "string", required: false, enum: ["solar", "lunar"], default: "solar", description: "曆法" },
                    skipRecord: { type: "boolean", required: false, description: "設為 true 跳過 Discord 記錄" }
                }
            },
            ziweiMatch: {
                method: "POST",
                path: "/api/ziwei/match",
                description: "雙人紫微合盤：以命宮主星 30%、夫妻宮投射 30%、四化互照 25%、煞星對衝 15% 形成 0–100 契合指數與理性相處指南",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    first: { type: "object", required: true, description: "第一方出生資料（date, time/shichen, sex, calendar）" },
                    second: { type: "object", required: true, description: "第二方出生資料（date, time/shichen, sex, calendar）" }
                }
            },
            ziweiMaleSize: {
                method: "GET / POST",
                path: "/api/ziwei/male-size",
                description: "紫微斗數男生真實尺寸與體質雙核速測（子位出廠氣象＋疾厄宮實體肉身合參）",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, description: "出生時間（HH:mm）" },
                    shichen: { type: "string", required: false, enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
                    sex: { type: "string", required: false, enum: ["男"], description: "性別（此功能僅限男生命盤）" }
                }
            },
            ziweiSpouse: {
                method: "GET / POST",
                path: "/api/ziwei/spouse",
                description: "紫微斗數未來另一半正緣畫像與年齡差深度解析（夫妻宮主星＋吉煞四化）",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, description: "出生時間（HH:mm）" },
                    shichen: { type: "string", required: false, enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
                    sex: { type: "string", required: false, enum: ["男", "女"], description: "性別" }
                }
            },
            ziweiDomain: {
                method: "GET / POST",
                path: "/api/ziwei/domain",
                description: "紫微斗數 13 大主題深度論斷（命格總覽、性格、感情、事業、財運、健康、兄弟、子女、遷移、人際、田宅、福德、父母）",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, description: "出生時間（HH:mm）" },
                    shichen: { type: "string", required: false, enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
                    sex: { type: "string", required: false, enum: ["男", "女"], description: "性別" },
                    topic: { type: "string", required: false, default: "overview", enum: ["overview", "personality", "love", "career", "wealth", "health", "family", "children", "move", "friends", "home", "spirit", "parents"], description: "13大主題代碼" },
                    ai: { type: "boolean", required: false, description: "是否同步產出 LLM 專項深度解析" }
                }
            },
            bazi2Question: {
                method: "POST",
                path: "/api/bazi2-question",
                description: "計算生辰八字2命盤並獲得命理解讀",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "要詢問的問題" },
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, default: "12:00", description: "出生時間（HH:mm）" },
                    shichen: { type: "string", required: false, enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
                    sex: { type: "string", required: false, enum: ["男", "女"], description: "性別" },
                    calendar: { type: "string", required: false, default: "solar", enum: ["solar", "lunar"], description: "曆法" },
                    deceasedYear: { type: "integer", required: false, description: "已故年份上限過濾" },
                    allowUnknownHour: { type: "boolean", required: false, description: "未提供時辰時保留未知時柱" },
                    name: { type: "string", required: false, description: "姓名（可選）" },
                    formerName: { type: "string", required: false, description: "曾用名（可選）" },
                    place: { type: "string", required: false, description: "出生地（可選）" },
                    lang: { type: "string", required: false, default: "zh-tw", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
                    conversationHistory: { type: "array", required: false, description: "多輪對話歷史" }
                }
            },
            yinyuanQuestion: {
                method: "POST",
                path: "/api/yinyuan-question",
                description: "提供月老姻緣、生肖合婚、八字合婚與桃花指引",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "要詢問的問題" },
                    mode: { type: "string", required: false, default: "fortune", enum: Array.from(yinyuanModes), description: "姻緣測算模式" },
                    firstYear: { type: "integer", required: false, description: "第一位出生年份（生肖／桃花模式）" },
                    secondYear: { type: "integer", required: false, description: "第二位出生年份（生肖合婚模式）" },
                    firstZodiac: { type: "string", required: false, description: "第一位生肖" },
                    secondZodiac: { type: "string", required: false, description: "第二位生肖" },
                    name: { type: "string", required: false, description: "姓名" },
                    sex: { type: "string", required: false, enum: ["男", "女"], description: "性別" },
                    stickNum: { type: "integer", required: false, minimum: 1, maximum: 100, description: "自選籤號（1-100）" },
                    calendar: { type: "string", required: false, enum: ["solar", "lunar"], description: "曆法" },
                    date: { type: "string", required: false, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, description: "出生時間或時辰" },
                    stage: { type: "string", required: false, description: "關係階段" },
                    seekingSex: { type: "string", required: false, enum: ["男", "女"], description: "尋找對象性別" },
                    preference: { type: "string", required: false, description: "理想型特質偏好" },
                    scope: { type: "string", required: false, description: "桃花查詢範圍" },
                    status: { type: "string", required: false, default: "單身", description: "感情狀態" },
                    seed: { type: "string", required: false, description: "姻緣籤亂數種子" },
                    chart: { type: "object", required: false, description: "八字命盤（紅線／夫妻宮模式）" },
                    firstChart: { type: "object", required: false, description: "第一份八字命盤（合婚模式）" },
                    secondChart: { type: "object", required: false, description: "第二份八字命盤（合婚模式）" },
                    lang: { type: "string", required: false, default: "zh-tw", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
                    conversationHistory: { type: "array", required: false, description: "多輪對話歷史" }
                }
            },
            answerbookQuestion: {
                method: "POST",
                path: "/api/answerbook-question",
                description: "直接默念取得解答之書原始答案，或輸入問題後取得解讀",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    mode: { type: "string", required: false, default: "direct", enum: ["direct", "question"], description: "direct 直接默念；question 輸入問題後取得解讀" },
                    question: { type: "string", required: false, description: "問題模式的具體問題；省略時為直接默念" },
                    lang: { type: "string", required: false, default: "zh-tw", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
                    conversationHistory: { type: "array", required: false, description: "問題模式的多輪對話歷史" }
                },
                responseExample: {
                    success: true,
                    mode: "question",
                    answer: "準時\nBE ON TIME",
                    analysis: "請依問題與現況安排可執行的下一步。",
                    analysisSuccess: true
                }
            },
            liuyao: {
                method: "POST",
                path: "/api/liuyao",
                description: "六爻神卦純排盤（京房納甲、世應六親六獸、伏神旬空與朱熹七規，無 LLM 延遲）",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: false, description: "占問事項" },
                    category: { type: "string", required: false, enum: ["求財投資", "事業升遷", "考試學業", "戀愛婚姻", "身體健康", "求子生產", "出行尋物", "綜合運勢"], description: "占問分類" },
                    method: { type: "string", required: false, enum: ["coins", "dayan", "datetime", "manual"], default: "coins", description: "起卦方式" },
                    lines: { type: "array", required: false, description: "初至上爻值 [6,7,8,9]" },
                    gender: { type: "string", required: false, enum: ["男", "女"], description: "性別" },
                    datetime: { type: "string", required: false, description: "起卦時間" }
                }
            },
            liuyaoQuestion: {
                method: "POST",
                path: "/api/liuyao-question",
                description: "六爻神卦排盤並調用 LLM 宗師進行納甲深度解讀",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "占問具體事項" },
                    category: { type: "string", required: false, enum: ["求財投資", "事業升遷", "考試學業", "戀愛婚姻", "身體健康", "求子生產", "出行尋物", "綜合運勢"], description: "占問分類" },
                    method: { type: "string", required: false, enum: ["coins", "dayan", "datetime", "manual"], default: "coins", description: "起卦方式" },
                    lines: { type: "array", required: false, description: "初至上爻值 [6,7,8,9]" },
                    gender: { type: "string", required: false, enum: ["男", "女"], description: "性別" },
                    datetime: { type: "string", required: false, description: "起卦時間" },
                    lang: { type: "string", required: false, default: "zh-tw", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
                    conversationHistory: { type: "array", required: false, description: "多輪對話歷史" }
                }
            },
            timeRange: {
                method: "GET / POST",
                path: "/api/time/range",
                description: "標準化日期區間並徹底解決午夜邊界問題（Midnight Boundary Problem，如 9/1~9/9 覆蓋至 9/9 23:59:59.999 或半開區間 < 9/10 00:00:00）",
                parameters: {
                    startDate: { type: "string", required: true, description: "開始日期 (YYYY-MM-DD)", example: "2026-09-01" },
                    endDate: { type: "string", required: true, description: "結束日期 (YYYY-MM-DD)", example: "2026-09-09" },
                    timezone: { type: "string", required: false, default: "+08:00", description: "時區偏移 (±HH:MM 格式)" },
                    precision: { type: "string", required: false, default: "millisecond", enum: ["millisecond", "second"], description: "邊界精度" }
                },
                responseExample: {
                    success: true,
                    range: {
                        startDate: "2026-09-01",
                        endDate: "2026-09-09",
                        startDateTime: "2026-09-01T00:00:00.000",
                        endDateTimeInclusive: "2026-09-09T23:59:59.999",
                        endDateTimeExclusive: "2026-09-10T00:00:00.000",
                        days: 9,
                        midnightBoundaryResolved: true
                    }
                }
            },
            bazi2Chart: {
                method: "GET / POST",
                path: "/api/bazi2/chart",
                description: "生辰八字純排盤：四柱干支、地支藏干、十神、納音、十二長生、吉凶神煞、大運流年與袁天罡稱骨",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, default: "12:00", description: "出生時間（HH:mm）" },
                    shichen: { type: "string", required: false, enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
                    sex: { type: "string", required: false, enum: ["男", "女"], default: "男", description: "性別" },
                    calendar: { type: "string", required: false, enum: ["solar", "lunar"], default: "solar", description: "曆法" },
                    allowUnknownHour: { type: "boolean", required: false, description: "時辰未知時保留未知時柱" },
                    deceasedYear: { type: "integer", required: false, description: "已故年份上限過濾" }
                }
            },
            bazi2InverseLookup: {
                method: "GET / POST",
                path: "/api/bazi2/inverse-lookup",
                description: "已知四柱干支反查西曆生辰日期與時辰範圍",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    pillars: { type: "string", required: true, description: "四柱干支字串，例如 '庚午 辛巳 庚辰 壬午'" },
                    startYear: { type: "integer", required: false, description: "檢索起始年份" },
                    endYear: { type: "integer", required: false, description: "檢索結束年份" }
                }
            },
            bazi2TimeSensitivity: {
                method: "GET / POST",
                path: "/api/bazi2/time-sensitivity",
                description: "出生時辰不確定敏感度分析與定時校準，橫向比對全天或特定時段各時辰對日主強弱、喜用神與格局之實質差異",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    timeRange: { type: "string", required: false, enum: ["all", "morning", "afternoon", "evening", "night"], default: "all", description: "比對時段範圍" },
                    sex: { type: "string", required: false, enum: ["男", "女"], default: "男", description: "性別" }
                }
            },
            sajuChart: {
                method: "GET / POST",
                path: "/api/saju/chart",
                description: "韓式現代四柱 (K-Saju · 18장 평생사주)：日干 10 大靈魂原型 (東方 MBTI)、身強身弱 0~100% 能量天秤、缺行生活開運錦囊、四柱宮位四幕人生",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, description: "出生時間（HH:mm）" },
                    shichen: { type: "string", required: false, enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
                    sex: { type: "string", required: false, enum: ["男", "女"], default: "男", description: "性別" },
                    calendar: { type: "string", required: false, enum: ["solar", "lunar"], default: "solar", description: "曆法" }
                }
            },
            sajuQuestion: {
                method: "GET / POST",
                path: "/api/saju-question",
                description: "韓式現代四柱排盤並調用 LLM 產出 18 章平生四柱藍圖指南問答解讀",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "要詢問的問題" },
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, description: "出生時間（HH:mm）" },
                    shichen: { type: "string", required: false, enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
                    sex: { type: "string", required: false, enum: ["男", "女"], default: "男", description: "性別" },
                    calendar: { type: "string", required: false, enum: ["solar", "lunar"], default: "solar", description: "曆法" },
                    lang: { type: "string", required: false, default: "zh-tw", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
                    conversationHistory: { type: "array", required: false, description: "多輪對話歷史" }
                }
            },
            nameAnalysisCezi: {
                method: "POST",
                path: "/api/name-analysis/cezi",
                description: "漢字測字占事純計算：六書拆字形意、康熙筆畫、81數理、梅花字卦與八字喜忌合參",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    character: { type: "string", required: true, description: "欲測之單個漢字（例如：明、泰、轉、安）" },
                    question: { type: "string", required: false, description: "占問具體事項" },
                    birthDate: { type: "string", required: false, description: "問測人出生公曆日期（用於八字喜忌合參）" },
                    sex: { type: "string", required: false, enum: ["男", "女"], default: "男", description: "性別" }
                }
            },
            wellnessReport: {
                method: "GET / POST",
                path: "/api/bazi2/yunqi-wellness",
                description: "中醫五運六氣、二十四節氣與十二時辰子午流注養生報告純計算",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    targetYear: { type: "integer", required: false, description: "分析流年份（預設當前年）" },
                    targetHour: { type: "integer", required: false, description: "查詢時辰小時（0–23，預設當前時辰）" },
                    birthDate: { type: "string", required: false, description: "出生公曆日期（用於推算本命體質偏盛）" }
                }
            },
            wellnessQuestion: {
                method: "GET / POST",
                path: "/api/wellness-question",
                description: "五運六氣養生一站式問答：結合本命體質、流年大運、當令節氣與經絡時辰由 LLM 產出深度調養錦囊",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "要諮詢的養生或體質問題" },
                    targetYear: { type: "integer", required: false, description: "分析流年份" },
                    targetHour: { type: "integer", required: false, description: "查詢時辰小時" },
                    birthDate: { type: "string", required: false, description: "出生公曆日期" },
                    lang: { type: "string", required: false, default: "zh-tw", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
                    conversationHistory: { type: "array", required: false, description: "多輪對話歷史" }
                }
            },
            tarotReading: {
                method: "GET / POST",
                path: "/api/tarot/reading",
                description: "韋特塔羅純抽牌：78張完整牌庫、6大經典牌陣、時間因子、可重現 seed、四維透鏡與牌間生剋關係",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    spread: { type: "string", required: false, default: "three", enum: Object.keys(tarotSpreads), description: "牌陣代碼" },
                    variant: { type: "string", required: false, enum: ["timeline", "situation", "relationship", "decision"], description: "三牌陣視角" },
                    time_factor: { type: "string", required: false, enum: ["morning", "afternoon", "night"], description: "時間能量因子" },
                    seed: { type: "string", required: false, description: "可重現隨機種子" }
                }
            },
            tarotNumerology: {
                method: "GET / POST",
                path: "/api/tarot/numerology",
                description: "生命靈數純計算：九宮數網格、十二條連線性格象徵、缺數轉念心法與對應大阿卡納象徵牌",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    date: { type: "string", required: true, description: "西曆出生日期（YYYY-MM-DD）" }
                }
            },
            yinyuanReading: {
                method: "GET / POST",
                path: "/api/yinyuan/reading",
                description: "月老靈籤 100 首完整籤詩與籤解純計算，支援自選籤號或種子隨機抽籤",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    stickNum: { type: "integer", required: false, minimum: 1, maximum: 100, description: "自選籤號（1–100）" },
                    seed: { type: "string", required: false, description: "抽籤亂數種子" },
                    name: { type: "string", required: false, description: "問測人姓名" }
                }
            },
            yinyuanMatch: {
                method: "GET / POST",
                path: "/api/yinyuan/match",
                description: "生肖合婚與八字配對純計算：三合六合六沖六害與天干地支相生相剋評分",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    first: { type: "object", required: false, description: "第一方資料（year / zodiac / date / sex）" },
                    second: { type: "object", required: false, description: "第二方資料（year / zodiac / date / sex）" },
                    firstYear: { type: "integer", required: false, description: "第一方出生年份" },
                    secondYear: { type: "integer", required: false, description: "第二方出生年份" }
                }
            },
            meihuaQigua: {
                method: "POST",
                path: "/api/meihua/qigua",
                description: "梅花易數純起卦：時間、數字、文字起卦，輸出本卦、互卦、變卦、錯卦、綜卦與體用五行生剋",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    method: { type: "string", required: false, default: "time", enum: ["time", "number", "text", "character"], description: "起卦方式" },
                    datetime: { type: "string", required: false, description: "指定時間（ISO 格式）" },
                    num1: { type: "number", required: false, description: "上卦數" },
                    num2: { type: "number", required: false, description: "下卦數" },
                    num3: { type: "number", required: false, description: "動爻數" },
                    text: { type: "string", required: false, description: "起卦漢字或詞語" }
                }
            },
            zeriSearch: {
                method: "GET / POST",
                path: "/api/zeri/search",
                description: "傳統協紀辨方與奇門吉時獵手綜合擇日吉時搜尋，精選 Top 5 黃金時辰",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    year: { type: "integer", required: false, description: "擇日目標年份" },
                    month: { type: "integer", required: false, minimum: 1, maximum: 12, description: "擇日目標月份" },
                    matter: { type: "string", required: false, enum: ["入宅/喬遷", "開業/開市", "動土/裝修", "婚嫁/嫁娶"], default: "入宅/喬遷", description: "擇日事項" }
                }
            },
            comboDecision: {
                method: "POST",
                path: "/api/combo/decision",
                description: "重大決策「奇門 × 六爻 × 梅花」三卜合參引擎，跨體系共識度、三術比對與明確行動錦囊",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "重大決策事項" },
                    category: { type: "string", required: false, default: "綜合運勢", description: "決策領域" },
                    datetime: { type: "string", required: false, description: "起局時間" }
                }
            },
            conversationSendEmail: {
                method: "POST",
                path: "/api/conversation/send-email",
                description: "全模組占卜結果與問答歷史匯出寄送至使用者 Email",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    email: { type: "string", required: true, description: "收件人電子郵件地址" },
                    history: { type: "array", required: true, description: "對話或問答紀錄陣列" },
                    service: { type: "string", required: false, description: "服務模組識別碼" },
                    subject: { type: "string", required: false, description: "郵件主旨自訂前綴" },
                    chartSummary: { type: "string", required: false, description: "排盤或卦象純文字摘要" }
                }
            },
            byokModels: {
                method: "POST",
                path: "/api/byok/models",
                description: "自備金鑰中心 (BYOK Hub)：獲取支援供應商之可用模型清單",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    provider: { type: "string", required: true, enum: ["openai", "groq", "gemini", "xai", "anthropic", "qwen", "custom"], description: "LLM 供應商代碼" },
                    apiKey: { type: "string", required: true, description: "用戶自備 API Key（端對端無痕不落地儲存）" },
                    baseURL: { type: "string", required: false, description: "自訂 Base URL（選填）" }
                }
            },
            byokTest: {
                method: "POST",
                path: "/api/byok/test",
                description: "自備金鑰中心 (BYOK Hub)：測試自備金鑰連線與延遲驗證",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    provider: { type: "string", required: true, enum: ["openai", "groq", "gemini", "xai", "anthropic", "qwen", "custom"], description: "LLM 供應商代碼" },
                    apiKey: { type: "string", required: true, description: "用戶自備 API Key" },
                    model: { type: "string", required: false, description: "欲測試的模型名稱" },
                    baseURL: { type: "string", required: false, description: "自訂 Base URL" }
                }
            }
        },
        examples: {
            curl: `curl -X POST ${baseUrl}/api/qimen-question \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "今天適合投資嗎？",
    "mode": "advanced",
    "purpose": "事業"
  }'`,
            javascript: `fetch('${baseUrl}/api/qimen-question', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: '今天適合投資嗎？',
    mode: 'advanced',
    purpose: '事業'
  })
})
.then(response => response.json())
.then(data => console.log(data));`
        },
        notes: [
            "所有時間都基於指定時區進行排盤計算",
            "如果配置了 Discord webhook，問題和回答會自動發送到 Discord 頻道",
            "LLM 分析基於真實的奇門遁甲排盤結果",
            "API 支援即時排盤，每次請求都會重新計算奇門盤"
        ]
    };
}

module.exports = { buildApiDocs };
