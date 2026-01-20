const express = require('express');
const app = express();
const path = require('path');
const {Lunar, Solar} = require('lunar-javascript');

// 載入環境變數
require('dotenv').config();

// 導入奇門遁甲計算模塊
const qimen = require('./lib/qimen');
const i18n = require('./lib/i18n');
const LLMAnalysisService = require('./lib/llm-analysis');
const DiscordWebhook = require('./lib/discord-webhook');
const APITimeHandler = require('./lib/api-time-handler');

// 初始化 LLM 服務
const llmService = new LLMAnalysisService({
    provider: process.env.LLM_PROVIDER || 'openai',
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL || 'gpt-4o-mini'
});

// 初始化 Discord Webhook 服務
const discordWebhook = new DiscordWebhook();

// 中間件設置
app.use(express.json());  // 解析 JSON 請求體
app.use(express.urlencoded({ extended: true }));  // 解析 URL 編碼請求體

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
// public files
app.use(express.static(path.join(__dirname, 'public')));
app.disable('view cache');

// 中介軟體：處理語言參數
app.use((req, res, next) => {
    const lang = req.query.lang || req.headers['accept-language'] || 'zh-tw';
    const supportedLangs = ['zh-tw', 'zh-cn'];
    
    // 設定語言
    if (supportedLangs.includes(lang)) {
        i18n.setLanguage(lang);
    } else {
        i18n.setLanguage('zh-tw'); // 預設繁體
    }
    
    // 將翻譯函數和當前語言傳遞給模板
    res.locals.t = (key) => i18n.t(key);
    res.locals.currentLang = i18n.getCurrentLanguage();
    res.locals.availableLanguages = i18n.getAvailableLanguages();
    
    next();
});

// 靜心起盤頁面
app.get('/start', (req, res) => {
    res.render('start');
});

// 首頁 - 實時排盤
app.get('/', async (req, res) => {
    // 獲取時間參數（來自前端或使用伺服器時間）
    let date;
    const serverTime = new Date();
    
    // 優先順序：userDateTime > timestamp > 伺服器時間 + 時區調整
    if (req.query.userDateTime) {
        // 使用前端傳遞的本地時間字串（格式：YYYY-MM-DDTHH:mm:ss）
        const userDateTime = req.query.userDateTime;
        date = new Date(userDateTime);
        
        if (process.env.NODE_ENV !== 'production') {
            console.log(`使用前端本地時間字串: ${userDateTime}`);
            console.log(`解析後的時間: ${date.toString()}`);
        }
    } else if (req.query.timestamp) {
        // 備用：使用時間戳，但需要考慮時區差異
        const timestamp = parseInt(req.query.timestamp);
        const timezoneOffset = req.query.timezoneOffset ? parseInt(req.query.timezoneOffset) : 0;
        
        // 建立基於時間戳的 Date 物件
        date = new Date(timestamp);
        
        // 在 Vercel (UTC) 環境中，需要調整顯示時間
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            // 計算時區差異：用戶時區偏移 vs UTC (0)
            const offsetDiff = -timezoneOffset; // 負號是因為 getTimezoneOffset 返回相反值
            date = new Date(date.getTime() + offsetDiff * 60000);
        }
        
        if (process.env.NODE_ENV !== 'production') {
            console.log(`使用時間戳: ${timestamp}, 時區偏移: ${timezoneOffset}`);
            console.log(`調整後時間: ${date.toString()}`);
        }
    } else {
        // 使用伺服器時間，根據用戶時區調整
        date = new Date();
        const timezoneOffset = req.query.timezoneOffset ? parseInt(req.query.timezoneOffset) : null;
        
        if (timezoneOffset !== null) {
            const serverOffset = date.getTimezoneOffset();
            const userOffset = timezoneOffset;
            const offsetDiff = serverOffset - userOffset;
            date = new Date(date.getTime() + offsetDiff * 60000);
            
            if (process.env.NODE_ENV !== 'production') {
                console.log(`時區調整: 伺服器=${serverOffset}, 用戶=${userOffset}, 差異=${offsetDiff}分鐘`);
            }
        }
    }
    if (process.env.NODE_ENV !== 'production') {
        console.log(`最終使用時間: ${date.toISOString()}, 本地表示: ${date.toString()}`);
    }
    
    // 獲取時間精度模式參數
    const timePrecisionMode = req.query.timePrecisionMode || 'advanced';

    // 計算奇門盤
    const options = {
        type: '四柱',
        method: '時家',
        purpose: '綜合',
        location: '默認位置',
        timePrecisionMode: timePrecisionMode
    };

    try {
        const qimenPan = qimen.calculate(date, options);

        // 初始化缺失的屬性，確保模板不會報錯
        if (!qimenPan.jiuGongAnalysis) {
            qimenPan.jiuGongAnalysis = {};
        }

        // 確保每個宮位都有基本屬性
        for (let i = 1; i <= 9; i++) {
            if (!qimenPan.jiuGongAnalysis[i]) {
                qimenPan.jiuGongAnalysis[i] = {
                    direction: '',
                    gongName: '',
                    jiXiong: 'ping'
                };
            }
        }

        // LLM 功能狀態（不自動調用，改為按需調用）
        const enableLLM = process.env.LLM_API_KEY ? true : false;

        // 傳遞常量給視圖（使用當前語言）
        const currentLang = i18n.getCurrentLanguage();
        res.locals.JIU_GONG = qimen.JIU_GONG;
        res.locals.JIU_XING = qimen.getJiuXingForLang(currentLang);
        res.locals.BA_MEN = qimen.getBaMenForLang(currentLang);
        res.locals.BA_SHEN = qimen.BA_SHEN;

        // 渲染頁面
        res.render('index', {
            qimen: qimenPan,
            llmAnalysis: null,  // 初始不提供 LLM 分析
            enableLLM: enableLLM
        });
    } catch (error) {
        console.error('排盤錯誤:', error);
        // 返回錯誤頁面
        res.status(500).send('排盤錯誤: ' + error.message);
    }
});

// 自定義排盤
app.get('/custom', async (req, res) => {
    // 獲取請求參數
    const type = req.query.type || '四柱';
    const method = req.query.method || '時家';
    const dateStr = req.query.date;
    const timeStr = req.query.time;
    const location = req.query.location || '默認位置';
    const purpose = req.query.purpose || '綜合';
    const timePrecisionMode = req.query.timePrecisionMode || 'advanced';

    // 解析日期時間
    let date;
    if (dateStr && timeStr) {
        date = new Date(`${dateStr}T${timeStr}`);
    } else {
        date = new Date();
    }

    // 檢查日期是否有效
    if (isNaN(date.getTime())) {
        return res.status(400).send('無效的日期時間');
    }

    try {
        // 計算奇門盤
        const options = {
            type,
            method,
            purpose,
            location,
            timePrecisionMode
        };

        const qimenPan = qimen.calculate(date, options);

        // LLM 功能狀態（不自動調用）
        const enableLLM = process.env.LLM_API_KEY ? true : false;

        // 初始化缺失的屬性，確保模板不會報錯
        if (!qimenPan.jiuGongAnalysis) {
            qimenPan.jiuGongAnalysis = {};
        }

        // 確保每個宮位都有基本屬性
        for (let i = 1; i <= 9; i++) {
            if (!qimenPan.jiuGongAnalysis[i]) {
                qimenPan.jiuGongAnalysis[i] = {
                    direction: '',
                    gongName: '',
                    jiXiong: 'ping'
                };
            }
        }

        // 傳遞常量給視圖（使用當前語言）
        const currentLang = i18n.getCurrentLanguage();
        res.locals.JIU_GONG = qimen.JIU_GONG;
        res.locals.JIU_XING = qimen.getJiuXingForLang(currentLang);
        res.locals.BA_MEN = qimen.getBaMenForLang(currentLang);
        res.locals.BA_SHEN = qimen.BA_SHEN;

        // 渲染頁面
        res.render('index', {
            qimen: qimenPan,
            llmAnalysis: null,  // 初始不提供 LLM 分析
            enableLLM: enableLLM
        });
    } catch (error) {
        console.error('自定義排盤錯誤:', error);
        // 返回錯誤頁面
        res.status(500).send('排盤錯誤: ' + error.message);
    }
});

// API接口 - 獲取奇門排盤數據
app.get('/api/qimen', (req, res) => {
    // 獲取請求參數
    const type = req.query.type || '四柱';
    const method = req.query.method || '時家';
    const dateStr = req.query.date;
    const timeStr = req.query.time;
    const location = req.query.location || '默認位置';
    const purpose = req.query.purpose || '綜合';
    const timePrecisionMode = req.query.timePrecisionMode || 'advanced';

    // 解析日期時間
    let date;
    if (dateStr && timeStr) {
        date = new Date(`${dateStr}T${timeStr}`);
    } else {
        date = new Date();
    }

    // 檢查日期是否有效
    if (isNaN(date.getTime())) {
        return res.status(400).json({error: '無效的日期時間'});
    }

    try {
        // 計算奇門盤
        const options = {
            type,
            method,
            purpose,
            location,
            timePrecisionMode
        };

        const qimenPan = qimen.calculate(date, options);

        // 初始化缺失的屬性，確保模板不會報錯
        if (!qimenPan.jiuGongAnalysis) {
            qimenPan.jiuGongAnalysis = {};
        }

        // 確保每個宮位都有基本屬性
        for (let i = 1; i <= 9; i++) {
            if (!qimenPan.jiuGongAnalysis[i]) {
                qimenPan.jiuGongAnalysis[i] = {
                    direction: '',
                    gongName: '',
                    jiXiong: 'ping'
                };
            }
        }

        // 返回JSON數據（包含多語言資訊）
        const result = {
            ...qimenPan,
            translations: i18n.getAllTranslations(),
            currentLang: i18n.getCurrentLanguage()
        };
        res.json(result);
    } catch (error) {
        console.error('API排盤錯誤:', error);
        res.status(500).json({error: '排盤錯誤', message: error.message});
    }
});

// LLM 解盤 API
app.post('/api/llm-analysis', async (req, res) => {
    let resolvedQimenData = null;
    try {
        const {
            qimenData: requestQimenData,
            purpose = '綜合',
            userQuestion = '',
            conversationHistory = [],
            lang = 'zh-tw',
            userDateTime = null,
            timestamp = null,
            timezoneOffset = null,
            timePrecisionMode = 'advanced'
        } = req.body;
        
        let qimenData = requestQimenData;

        if (typeof qimenData === 'string') {
            try {
                qimenData = JSON.parse(qimenData);
            } catch (parseError) {
                qimenData = null;
            }
        }

        if (!qimenData || (typeof qimenData === 'object' && Object.keys(qimenData).length === 0)) {
            const supportedLangs = ['zh-tw', 'zh-cn'];
            if (supportedLangs.includes(lang)) {
                i18n.setLanguage(lang);
            } else {
                i18n.setLanguage('zh-tw');
            }

            const parsedTimestamp = timestamp !== null ? parseInt(timestamp, 10) : null;
            const parsedTimezoneOffset = timezoneOffset !== null ? parseInt(timezoneOffset, 10) : null;
            let date;

            if (userDateTime) {
                date = new Date(userDateTime);
            } else if (!Number.isNaN(parsedTimestamp) && parsedTimestamp !== null) {
                date = new Date(parsedTimestamp);
                if ((process.env.VERCEL || process.env.NODE_ENV === 'production') && parsedTimezoneOffset !== null && !Number.isNaN(parsedTimezoneOffset)) {
                    const offsetDiff = -parsedTimezoneOffset;
                    date = new Date(date.getTime() + offsetDiff * 60000);
                }
            } else {
                date = new Date();
                if (parsedTimezoneOffset !== null && !Number.isNaN(parsedTimezoneOffset)) {
                    const serverOffset = date.getTimezoneOffset();
                    const offsetDiff = serverOffset - parsedTimezoneOffset;
                    date = new Date(date.getTime() + offsetDiff * 60000);
                }
            }

            if (Number.isNaN(date.getTime())) {
                return res.status(400).json({
                    error: '缺少奇門數據',
                    message: '請提供 qimenData 或有效的時間參數'
                });
            }

            qimenData = qimen.calculate(date, {
                type: '四柱',
                method: '時家',
                purpose: purpose,
                location: '默認位置',
                timePrecisionMode: timePrecisionMode || 'advanced'
            });

            // 初始化缺失的屬性，確保模板不會報錯
            if (!qimenData.jiuGongAnalysis) {
                qimenData.jiuGongAnalysis = {};
            }

            // 確保每個宮位都有基本屬性
            for (let i = 1; i <= 9; i++) {
                if (!qimenData.jiuGongAnalysis[i]) {
                    qimenData.jiuGongAnalysis[i] = {
                        direction: '',
                        gongName: '',
                        jiXiong: 'ping'
                    };
                }
            }

            console.warn('LLM 解盤使用後端重算盤口 (qimenData 缺失)');
        }

        resolvedQimenData = qimenData;

        // 如果有用戶問題，先發送到 Discord
        if (userQuestion && userQuestion.trim()) {
            const questionResult = await discordWebhook.sendUserQuestion(userQuestion.trim(), qimenData);
            if (questionResult.success) {
                console.log('User question sent to Discord successfully');
            } else if (questionResult.reason !== 'Discord webhook not configured') {
                console.warn('Failed to send user question to Discord:', questionResult.reason);
            }
        }

        const analysisResult = await llmService.analyzeQimen(qimenData, {
            purpose,
            userQuestion,
            conversationHistory,
            language: lang
        });

        // 發送 LLM 解盤結果到 Discord
        if (analysisResult.success && analysisResult.analysis) {
            const analysisDiscordResult = await discordWebhook.sendLLMAnalysis(
                analysisResult.analysis, 
                qimenData, 
                userQuestion.trim()
            );
            if (analysisDiscordResult.success) {
                console.log('LLM analysis sent to Discord successfully');
            } else if (analysisDiscordResult.reason !== 'Discord webhook not configured') {
                console.warn('Failed to send LLM analysis to Discord:', analysisDiscordResult.reason);
            }
        }

        res.json(analysisResult);
    } catch (error) {
        console.error('LLM 分析 API 錯誤:', error);
        res.status(500).json({ 
            error: '分析失敗', 
            message: error.message,
            fallback: llmService.getFallbackAnalysis(resolvedQimenData || req.body?.qimenData || {})
        });
    }
});

// 奇門問答 API - 遠端 POST 請求接口
app.post('/api/qimen-question', async (req, res) => {
    try {
        const {
            question,
            datetime = null,
            mode = 'advanced',
            purpose = '綜合',
            timezone = '+08:00',
            lang = 'zh-tw'
        } = req.body;

        // 驗證必需參數
        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({
                success: false,
                error: '缺少必需參數',
                message: 'question 參數是必需的且不能為空'
            });
        }

        // 驗證時間參數
        const timeValidation = APITimeHandler.validateTimeParams({ datetime, timezone });
        if (!timeValidation.valid) {
            return res.status(400).json({
                success: false,
                error: '參數驗證失敗',
                message: timeValidation.errors.join(', ')
            });
        }

        // 生成排盤時間
        const qimenDate = APITimeHandler.generateQimenDateTime({ datetime, timezone });
        
        // 設定語言
        const supportedLangs = ['zh-tw', 'zh-cn'];
        if (supportedLangs.includes(lang)) {
            i18n.setLanguage(lang);
        } else {
            i18n.setLanguage('zh-tw');
        }

        // 排盤計算
        const options = {
            type: '四柱',
            method: '時家',
            purpose: purpose,
            location: 'API調用',
            timePrecisionMode: mode
        };

        let qimenPan;
        try {
            qimenPan = qimen.calculate(qimenDate, options);
        } catch (qimenError) {
            console.error('排盤計算錯誤:', qimenError);
            return res.status(500).json({
                success: false,
                error: '排盤計算失敗',
                message: qimenError.message,
                fallback: '抱歉，排盤計算出現問題，無法提供基於奇門盤的分析'
            });
        }

        // 初始化缺失的屬性
        if (!qimenPan.jiuGongAnalysis) {
            qimenPan.jiuGongAnalysis = {};
        }
        for (let i = 1; i <= 9; i++) {
            if (!qimenPan.jiuGongAnalysis[i]) {
                qimenPan.jiuGongAnalysis[i] = {
                    direction: '',
                    gongName: '',
                    jiXiong: 'ping'
                };
            }
        }

        // 發送問題到 Discord
        const questionResult = await discordWebhook.sendUserQuestion(question.trim(), qimenPan);
        let discordQuestionSent = false;
        if (questionResult.success) {
            discordQuestionSent = true;
            console.log('API question sent to Discord successfully');
        } else if (questionResult.reason !== 'Discord webhook not configured') {
            console.warn('Failed to send API question to Discord:', questionResult.reason);
        }

        // LLM 分析
        let analysisResult;
        try {
            analysisResult = await llmService.analyzeQimen(qimenPan, {
                purpose,
                userQuestion: question.trim(),
                language: lang
            });
        } catch (llmError) {
            console.error('LLM 分析錯誤:', llmError);
            return res.status(500).json({
                success: false,
                error: 'LLM 分析失敗',
                message: llmError.message,
                qimenInfo: APITimeHandler.formatTimeInfo(qimenDate, timezone),
                discordSent: discordQuestionSent
            });
        }

        // 發送 LLM 結果到 Discord
        let discordAnalysisSent = false;
        if (analysisResult.success && analysisResult.analysis) {
            const analysisDiscordResult = await discordWebhook.sendLLMAnalysis(
                analysisResult.analysis,
                qimenPan,
                question.trim()
            );
            if (analysisDiscordResult.success) {
                discordAnalysisSent = true;
                console.log('API LLM analysis sent to Discord successfully');
            } else if (analysisDiscordResult.reason !== 'Discord webhook not configured') {
                console.warn('Failed to send API LLM analysis to Discord:', analysisDiscordResult.reason);
            }
        }

        // 構建返回結果
        const response = {
            success: analysisResult.success,
            question: question.trim(),
            answer: analysisResult.analysis || analysisResult.fallback || '抱歉，暫時無法提供分析',
            qimenInfo: {
                ...APITimeHandler.formatTimeInfo(qimenDate, timezone),
                mode: mode,
                purpose: purpose,
                location: options.location
            },
            metadata: {
                provider: analysisResult.provider || null,
                model: analysisResult.model || null,
                language: lang,
                apiVersion: '1.0'
            },
            discord: {
                questionSent: discordQuestionSent,
                analysisSent: discordAnalysisSent,
                enabled: discordWebhook.isEnabled()
            },
            timestamp: new Date().toISOString()
        };

        res.json(response);

    } catch (error) {
        console.error('奇門問答 API 錯誤:', error);
        res.status(500).json({
            success: false,
            error: '服務器內部錯誤',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 獲取 LLM 配置 API
app.get('/api/llm-config', (req, res) => {
    res.json({
        enabled: !!process.env.LLM_API_KEY,
        provider: llmService.provider,
        model: llmService.model,
        supportedProviders: ['openai', 'anthropic', 'ollama', 'qwen'],
        discord: {
            enabled: discordWebhook.isEnabled(),
            configured: !!process.env.DISCORD_WEBHOOK_URL
        }
    });
});

// 測試 Discord webhook
app.get('/api/discord-test', async (req, res) => {
    try {
        if (!discordWebhook.isEnabled()) {
            return res.json({ 
                success: false, 
                message: '未配置 Discord Webhook URL' 
            });
        }

        const result = await discordWebhook.sendTestMessage();
        res.json(result);
    } catch (error) {
        res.json({ 
            success: false, 
            message: 'Discord webhook 測試失敗', 
            error: error.message 
        });
    }
});

// 測試 LLM 連接
app.get('/api/llm-test', async (req, res) => {
    try {
        if (!process.env.LLM_API_KEY) {
            return res.json({ 
                success: false, 
                message: '未配置 LLM API Key' 
            });
        }

        // 使用簡單的測試提示詞
        const testPrompt = '請回答：你好，請簡單介紹奇門遁甲';
        const response = await llmService.callLLM(testPrompt);
        const responsePreview = response?.content || '';
        
        res.json({ 
            success: true, 
            message: 'LLM 連接正常',
            provider: llmService.provider,
            finishReason: response?.finishReason || null,
            response: responsePreview.substring(0, 100) + '...'
        });
    } catch (error) {
        res.json({ 
            success: false, 
            message: 'LLM 連接失敗', 
            error: error.message 
        });
    }
});

// API 文檔端點
app.get('/api/docs', (req, res) => {
    const apiDocs = {
        title: "奇門遁甲問答 API 文檔",
        version: "1.0",
        description: "提供遠端奇門遁甲問答服務的 RESTful API",
        baseUrl: `${req.protocol}://${req.get('host')}`,
        endpoints: {
            qimenQuestion: {
                method: "POST",
                path: "/api/qimen-question",
                description: "提交問題並獲得基於奇門遁甲的 AI 分析回答",
                headers: {
                    "Content-Type": "application/json"
                },
                parameters: {
                    question: {
                        type: "string",
                        required: true,
                        description: "要詢問的問題",
                        example: "今天適合投資嗎？"
                    },
                    datetime: {
                        type: "string",
                        required: false,
                        description: "指定排盤時間 (ISO 8601 格式)，不提供則使用當前時間",
                        example: "2024-12-10T14:30:00"
                    },
                    mode: {
                        type: "string",
                        required: false,
                        default: "advanced",
                        description: "時間精度模式",
                        enum: ["traditional", "advanced"]
                    },
                    purpose: {
                        type: "string",
                        required: false,
                        default: "綜合",
                        description: "問事用途",
                        example: "事業"
                    },
                    timezone: {
                        type: "string",
                        required: false,
                        default: "+08:00",
                        description: "時區偏移 (±HH:MM 格式)",
                        example: "+08:00"
                    },
                    lang: {
                        type: "string",
                        required: false,
                        default: "zh-tw",
                        description: "回答語言",
                        enum: ["zh-tw", "zh-cn"]
                    }
                },
                responseExample: {
                    success: true,
                    question: "今天適合投資嗎？",
                    answer: "根據當前奇門盤分析...",
                    qimenInfo: {
                        datetime: "2024-12-10T14:30:00.000Z",
                        localDate: "2024/12/10",
                        localTime: "下午2:30:00",
                        mode: "advanced",
                        purpose: "綜合"
                    },
                    metadata: {
                        provider: "openai",
                        model: "gpt-4o-mini",
                        language: "zh-tw"
                    },
                    discord: {
                        questionSent: true,
                        analysisSent: true,
                        enabled: true
                    }
                }
            },
            discordTest: {
                method: "GET",
                path: "/api/discord-test",
                description: "測試 Discord webhook 連接"
            },
            llmConfig: {
                method: "GET",
                path: "/api/llm-config",
                description: "獲取 LLM 和 Discord 配置狀態"
            }
        },
        examples: {
            curl: `curl -X POST ${req.protocol}://${req.get('host')}/api/qimen-question \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "今天適合投資嗎？",
    "mode": "advanced",
    "purpose": "事業"
  }'`,
            javascript: `fetch('${req.protocol}://${req.get('host')}/api/qimen-question', {
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

    res.json(apiDocs);
});

// 時區調試 API
app.get('/api/timezone-debug', (req, res) => {
    const serverTime = new Date();
    const userTimestamp = req.query.timestamp ? new Date(parseInt(req.query.timestamp)) : null;
    const userTimezoneOffset = req.query.timezoneOffset ? parseInt(req.query.timezoneOffset) : null;
    
    const debugInfo = {
        server: {
            time: serverTime.toString(),
            utc: serverTime.toUTCString(),
            iso: serverTime.toISOString(),
            timestamp: serverTime.getTime(),
            timezoneOffset: serverTime.getTimezoneOffset(),
            timezone: process.env.TZ || 'system default'
        },
        user: {
            timestamp: req.query.timestamp,
            timezoneOffset: req.query.timezoneOffset,
            calculatedTime: userTimestamp ? userTimestamp.toString() : null,
            calculatedUTC: userTimestamp ? userTimestamp.toUTCString() : null
        },
        environment: {
            nodeEnv: process.env.NODE_ENV,
            platform: process.platform,
            isVercel: !!process.env.VERCEL,
            timezone: process.env.TZ
        }
    };
    
    res.json(debugInfo);
});

// 啟動服務器
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`奇門遁甲在運行中 http://localhost:${port}`);
});
