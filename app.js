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

// 初始化 LLM 服務
const llmService = new LLMAnalysisService({
    provider: process.env.LLM_PROVIDER || 'openai',
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL || 'gpt-4o-mini'
});

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
    
    if (req.query.timestamp) {
        // 使用前端傳遞的時間戳（已經是用戶本地時間）
        date = new Date(parseInt(req.query.timestamp));
        if (process.env.NODE_ENV !== 'production') {
            console.log(`使用前端時間: ${date.toISOString()} (timestamp: ${req.query.timestamp})`);
        }
    } else {
        // 預設使用伺服器時間，但需要根據用戶時區調整
        date = new Date();
        
        // 獲取時區偏移參數
        const timezoneOffset = req.query.timezoneOffset ? parseInt(req.query.timezoneOffset) : null;
        
        if (timezoneOffset !== null) {
            // 計算時區差異並調整時間
            const serverOffset = date.getTimezoneOffset(); // 服務器時區偏移（分鐘）
            const userOffset = timezoneOffset; // 用戶時區偏移（分鐘）
            
            // 調整到用戶本地時間
            const offsetDiff = serverOffset - userOffset;
            date = new Date(date.getTime() + offsetDiff * 60000);
            
            if (process.env.NODE_ENV !== 'production') {
                console.log(`時區調整: 伺服器偏移=${serverOffset}, 用戶偏移=${userOffset}, 差異=${offsetDiff}分鐘`);
                console.log(`調整前伺服器時間: ${serverTime.toISOString()}`);
                console.log(`調整後用戶時間: ${date.toISOString()}`);
            }
        } else {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`使用伺服器時間，無時區資訊: ${date.toISOString()}`);
            }
        }
    }
    if (process.env.NODE_ENV !== 'production') {
        console.log(`最終使用時間: ${date.toISOString()}, 本地表示: ${date.toString()}`);
    }
    
    // 獲取時間精度模式參數
    const timePrecisionMode = req.query.timePrecisionMode || 'traditional';

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
    const timePrecisionMode = req.query.timePrecisionMode || 'traditional';

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
    const timePrecisionMode = req.query.timePrecisionMode || 'traditional';

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
    try {
        const { qimenData, purpose = '綜合', userQuestion = '', lang = 'zh-tw' } = req.body;
        
        if (!qimenData) {
            return res.status(400).json({ error: '缺少奇門數據' });
        }

        const analysisResult = await llmService.analyzeQimen(qimenData, {
            purpose,
            userQuestion,
            language: lang
        });

        res.json(analysisResult);
    } catch (error) {
        console.error('LLM 分析 API 錯誤:', error);
        res.status(500).json({ 
            error: '分析失敗', 
            message: error.message,
            fallback: llmService.getFallbackAnalysis(req.body?.qimenData || {})
        });
    }
});

// 獲取 LLM 配置 API
app.get('/api/llm-config', (req, res) => {
    res.json({
        enabled: !!process.env.LLM_API_KEY,
        provider: llmService.provider,
        model: llmService.model,
        supportedProviders: ['openai', 'anthropic', 'ollama', 'qwen']
    });
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
        
        res.json({ 
            success: true, 
            message: 'LLM 連接正常',
            provider: llmService.provider,
            response: response.substring(0, 100) + '...'
        });
    } catch (error) {
        res.json({ 
            success: false, 
            message: 'LLM 連接失敗', 
            error: error.message 
        });
    }
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
