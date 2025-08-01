const express = require('express');
const app = express();
const path = require('path');
const {Lunar, Solar} = require('lunar-javascript');

// 載入環境變數
require('dotenv').config();

// 导入奇门遁甲计算模块
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

// 首页 - 实时排盘
app.get('/', async (req, res) => {
    // 获取当前时间
    const date = new Date();

    // 计算奇门盘
    const options = {
        type: '四柱',
        method: '时家',
        purpose: '综合',
        location: '默认位置'
    };

    try {
        const qimenPan = qimen.calculate(date, options);

        // 初始化缺失的属性，确保模板不会报错
        if (!qimenPan.jiuGongAnalysis) {
            qimenPan.jiuGongAnalysis = {};
        }

        // 确保每个宫位都有基本属性
        for (let i = 1; i <= 9; i++) {
            if (!qimenPan.jiuGongAnalysis[i]) {
                qimenPan.jiuGongAnalysis[i] = {
                    direction: '',
                    gongName: '',
                    jiXiong: 'ping'
                };
            }
        }

        // LLM 解盤分析
        let llmAnalysis = null;
        const enableLLM = req.query.llm !== 'false'; // 預設開啟，可通過 ?llm=false 關閉
        
        if (enableLLM && process.env.LLM_API_KEY) {
            try {
                const analysisResult = await llmService.analyzeQimen(qimenPan, {
                    purpose: options.purpose,
                    language: i18n.getCurrentLanguage()
                });
                
                if (analysisResult.success) {
                    llmAnalysis = {
                        content: analysisResult.analysis,
                        timestamp: analysisResult.timestamp,
                        provider: analysisResult.provider,
                        model: analysisResult.model
                    };
                } else {
                    llmAnalysis = {
                        content: analysisResult.fallback,
                        error: analysisResult.error,
                        isFallback: true
                    };
                }
            } catch (error) {
                console.error('LLM 分析失敗:', error);
                llmAnalysis = {
                    content: llmService.getFallbackAnalysis(qimenPan),
                    error: error.message,
                    isFallback: true
                };
            }
        }

        // 傳遞常量給視圖（使用當前語言）
        const currentLang = i18n.getCurrentLanguage();
        res.locals.JIU_GONG = qimen.JIU_GONG;
        res.locals.JIU_XING = qimen.getJiuXingForLang(currentLang);
        res.locals.BA_MEN = qimen.getBaMenForLang(currentLang);
        res.locals.BA_SHEN = qimen.BA_SHEN;

        // 渲染页面
        res.render('index', {
            qimen: qimenPan,
            llmAnalysis: llmAnalysis,
            enableLLM: enableLLM
        });
    } catch (error) {
        console.error('排盘错误:', error);
        // 返回错误页面
        res.status(500).send('排盘错误: ' + error.message);
    }
});

// 自定义排盘
app.get('/custom', async (req, res) => {
    // 获取请求参数
    const type = req.query.type || '四柱';
    const method = req.query.method || '时家';
    const dateStr = req.query.date;
    const timeStr = req.query.time;
    const location = req.query.location || '默认位置';
    const purpose = req.query.purpose || '综合';

    // 解析日期时间
    let date;
    if (dateStr && timeStr) {
        date = new Date(`${dateStr}T${timeStr}`);
    } else {
        date = new Date();
    }

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
        return res.status(400).send('无效的日期时间');
    }

    try {
        // 计算奇门盘
        const options = {
            type,
            method,
            purpose,
            location
        };

        const qimenPan = qimen.calculate(date, options);

        // LLM 解盤分析
        let llmAnalysis = null;
        const enableLLM = req.query.llm !== 'false';
        
        if (enableLLM && process.env.LLM_API_KEY) {
            try {
                const analysisResult = await llmService.analyzeQimen(qimenPan, {
                    purpose: purpose,
                    language: i18n.getCurrentLanguage()
                });
                
                if (analysisResult.success) {
                    llmAnalysis = {
                        content: analysisResult.analysis,
                        timestamp: analysisResult.timestamp,
                        provider: analysisResult.provider,
                        model: analysisResult.model
                    };
                }
            } catch (error) {
                console.error('LLM 分析失敗:', error);
                llmAnalysis = {
                    content: llmService.getFallbackAnalysis(qimenPan),
                    error: error.message,
                    isFallback: true
                };
            }
        }

        // 初始化缺失的属性，确保模板不会报错
        if (!qimenPan.jiuGongAnalysis) {
            qimenPan.jiuGongAnalysis = {};
        }

        // 确保每个宫位都有基本属性
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

        // 渲染页面
        res.render('index', {
            qimen: qimenPan,
            llmAnalysis: llmAnalysis,
            enableLLM: enableLLM
        });
    } catch (error) {
        console.error('自定义排盘错误:', error);
        // 返回错误页面
        res.status(500).send('排盘错误: ' + error.message);
    }
});

// API接口 - 获取奇门排盘数据
app.get('/api/qimen', (req, res) => {
    // 获取请求参数
    const type = req.query.type || '四柱';
    const method = req.query.method || '时家';
    const dateStr = req.query.date;
    const timeStr = req.query.time;
    const location = req.query.location || '默认位置';
    const purpose = req.query.purpose || '综合';

    // 解析日期时间
    let date;
    if (dateStr && timeStr) {
        date = new Date(`${dateStr}T${timeStr}`);
    } else {
        date = new Date();
    }

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
        return res.status(400).json({error: '无效的日期时间'});
    }

    try {
        // 计算奇门盘
        const options = {
            type,
            method,
            purpose,
            location
        };

        const qimenPan = qimen.calculate(date, options);

        // 初始化缺失的属性，确保模板不会报错
        if (!qimenPan.jiuGongAnalysis) {
            qimenPan.jiuGongAnalysis = {};
        }

        // 确保每个宫位都有基本属性
        for (let i = 1; i <= 9; i++) {
            if (!qimenPan.jiuGongAnalysis[i]) {
                qimenPan.jiuGongAnalysis[i] = {
                    direction: '',
                    gongName: '',
                    jiXiong: 'ping'
                };
            }
        }

        // 返回JSON数据（包含多語言資訊）
        const result = {
            ...qimenPan,
            translations: i18n.getAllTranslations(),
            currentLang: i18n.getCurrentLanguage()
        };
        res.json(result);
    } catch (error) {
        console.error('API排盘错误:', error);
        res.status(500).json({error: '排盘错误', message: error.message});
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

// 测试 LLM 连接
app.get('/api/llm-test', async (req, res) => {
    try {
        if (!process.env.LLM_API_KEY) {
            return res.json({ 
                success: false, 
                message: '未配置 LLM API Key' 
            });
        }

        // 使用简单的测试提示词
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

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`奇門遁甲在運行中 http://localhost:${port}`);
});
