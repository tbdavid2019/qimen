const express = require('express');
const app = express();
const path = require('path');
const {Lunar, Solar} = require('lunar-javascript');

// 載入環境變數
require('dotenv').config();

// 導入奇門遁甲計算模塊
const qimen = require('./lib/qimen');
const meihua = require('./lib/meihua');
const meihuaText = require('./lib/meihua-text');
const i18n = require('./lib/i18n');
const LLMAnalysisService = require('./lib/llm-analysis');
const DiscordWebhook = require('./lib/discord-webhook');
const APITimeHandler = require('./lib/api-time-handler');
const { parseCivilTime } = require('./lib/civil-time');
const { drawCards, SPREADS: TAROT_SPREADS, calculateTarotNumerology, getAllTarotCards } = require('./lib/tarot');
const { calculateBazi } = require('./lib/bazi2');
const {
    calculateFengShui,
    diagnoseShaqi,
    diagnoseLuantou,
    getAllShaQiLibrary,
    chooseZeri,
    calculateMountainFromHeading,
    determineChartType,
    validateLayoutInput,
    evaluateZhongzhouLayout
} = require('./lib/fengshui');
const { calculateZiweiChart, evaluateMaleSize, evaluateFutureSpouse } = require('./lib/ziwei');
const { zodiacMatch, drawFortuneStick, ziweiMarriage, peachBlossomLuck, baziMatchFull, redThreadFull } = require('./lib/yinyuan');
const { calculateTrueSolarTime, resolveCoordinates } = require('./lib/solar-time');
const { createServiceQuestionHandler, validationError } = require('./lib/service-question');
const { AnswerBookClient, createAnswerbookQuestionHandler } = require('./lib/answerbook');
const { sendConversationEmail } = require('./lib/email');
const { turnstileMiddleware, verifyTurnstile, getSiteKey, isTurnstileEnabled, getTurnstileConfigError } = require('./lib/turnstile');
const nameAnalysis = require('./lib/name-analysis');

function getHttpErrorStatus(error) {
    return error && error.statusCode === 400 ? 400 : 500;
}

// 初始化 LLM 服務
const llmService = new LLMAnalysisService({
    provider: process.env.LLM_PROVIDER || 'openai',
    apiKey: process.env.LLM_API_KEY,
    models: process.env.LLM_MODELS || [process.env.LLM_MODEL, process.env.LLM_FALLBACK_MODELS]
        .filter(Boolean)
        .join(','),
    model: process.env.LLM_MODEL || 'gpt-4.1-mini',
    baseURL: process.env.LLM_BASE_URL,
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 9999,
    temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7
});

// 初始化 Discord Webhook
const discordWebhook = new DiscordWebhook(process.env.DISCORD_WEBHOOK_URL);

const SHICHEN_TIME_MAP = {
    子: '00:00', 丑: '02:00', 寅: '04:00', 卯: '06:00', 辰: '08:00', 巳: '10:00',
    午: '12:00', 未: '14:00', 申: '16:00', 酉: '18:00', 戌: '20:00', 亥: '22:00'
};

function validateZiweiQuestion(body) {
    const rawDate = body.date || body.birthDate;
    if (typeof rawDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        throw validationError('請提供出生日期（YYYY-MM-DD）', 'MISSING_BIRTH_DATE', 'date');
    }
    const [year, month, day] = rawDate.split('-').map(Number);
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
        throw validationError('出生日期無效', 'INVALID_BIRTH_DATE', 'date');
    }
    const calendar = body.calendar || 'solar';
    if (!['solar', 'lunar'].includes(calendar)) {
        throw validationError('不支援的曆法', 'INVALID_CALENDAR', 'calendar');
    }
    if (body.sex !== undefined && !['男', '女', 'male', 'female'].includes(body.sex)) {
        throw validationError('請選擇性別', 'INVALID_SEX', 'sex');
    }
    const time = body.time || (body.shichen ? SHICHEN_TIME_MAP[body.shichen] : '12:00');
    return { ...body, date: rawDate, calendar, time, sex: (body.sex === '女' || body.sex === 'female') ? '女' : '男' };
}

// 設置視圖引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// 靜態文件服務
app.use(express.static(path.join(__dirname, 'public')));
app.get('/llms.txt', (req, res) => res.type('text/plain').sendFile(path.join(__dirname, 'llms.txt')));
// Browser UI consumes the same versioned catalog used by the Node evaluator.
app.get('/data/fengshui/layout-catalog.json', (req, res) => {
    res.type('application/json').sendFile(path.join(__dirname, 'data/fengshui/layout-catalog.json'));
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 安全標頭與 WebMCP / 感測器權限政策
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'tools=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self)');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

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
    const turnstileActive = isTurnstileEnabled();
    res.locals.turnstileEnabled = turnstileActive;
    res.locals.turnstileSiteKey = turnstileActive ? getSiteKey() : '';
    
    next();
});

// Cloudflare Turnstile 前端配置端點
app.get('/api/turnstile/config', (req, res) => {
    const configError = getTurnstileConfigError();
    const enabled = isTurnstileEnabled();
    res.json({
        success: !configError,
        siteKey: enabled ? getSiteKey() : null,
        enabled: enabled,
        error: configError || null
    });
});

app.get('/data/name-analysis/method-profiles.json', (req, res) => res.type('application/json').sendFile(path.join(__dirname, 'data/name-analysis/method-profiles.json')));
app.get('/data/name-analysis/name-style-profiles.json', (req, res) => res.type('application/json').sendFile(path.join(__dirname, 'data/name-analysis/name-style-profiles.json')));
app.get('/data/name-analysis/name-corpus-profile.json', (req, res) => res.type('application/json').sendFile(path.join(__dirname, 'data/name-analysis/name-corpus-profile.json')));
app.get('/name-analysis', (req, res) => res.render('name-analysis', { enableLLM: !!process.env.LLM_API_KEY, activePage: 'name-analysis' }));
app.post('/api/name-analysis/verify', async (req, res) => {
    try {
        const body = req.body || {};
        const baziLens = resolveNameBirthLens(body.birthData);
        const result = nameAnalysis.analyzeName({ ...body, baziLens: baziLens || undefined });
        const discord = await sendModuleRecord('中文姓名驗名', body, result);
        res.json({ success: true, result, discord });
    }
    catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message, code: error.code }); }
});
app.post('/api/name-analysis/generate', async (req, res) => {
    try {
        const body = req.body || {};
        const baziLens = resolveNameBirthLens(body.birthData);
        const desiredElements = Array.isArray(body.desiredElements) && body.desiredElements.length ? body.desiredElements : (baziLens?.usefulElements || []);
        const result = nameAnalysis.generateNames({ ...body, desiredElements, baziLens: baziLens || undefined });
        const discord = await sendModuleRecord('中文姓名取名', body, result);
        res.json({ success: true, result, discord });
    }
    catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message, code: error.code }); }
});
app.post('/api/name-analysis-question', async (req, res) => {
    try {
        const body = req.body || {};
        const baziLens = resolveNameBirthLens(body.birthData);
        const calculatedInput = { ...body, baziLens: baziLens || undefined, desiredElements: Array.isArray(body.desiredElements) && body.desiredElements.length ? body.desiredElements : (baziLens?.usefulElements || []) };
        const result = body.mode === 'generate' ? nameAnalysis.generateNames(calculatedInput) : nameAnalysis.analyzeName(calculatedInput);
        const followup = String(body.question || '').slice(0, 1000);
        if (!followup || !process.env.LLM_API_KEY) {
            const discord = await sendModuleRecord('中文姓名分析', body, result);
            return res.json({ success: true, result, analysis: null, llmAvailable: !!process.env.LLM_API_KEY, discord });
        }

        const isTestMode = process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test';
        if (!isTestMode) {
            const configError = getTurnstileConfigError();
            if (configError || !isTurnstileEnabled()) {
                return res.status(503).json({ success: false, error: 'AI 補充解讀的人機驗證尚未啟用，請稍後再試。', code: 'TURNSTILE_NOT_CONFIGURED' });
            }
            const token = body.turnstileToken || body['cf-turnstile-response'] || req.headers['cf-turnstile-response'];
            const turnstileCheck = await verifyTurnstile({
                token,
                currentHost: req.get('host'),
                expectedAction: ['llm_analysis', 'name_analysis_question']
            });
            if (!turnstileCheck.success) {
                return res.status(turnstileCheck.status || 403).json({
                    success: false,
                    error: turnstileCheck.error || '人機安全驗證失敗',
                    code: turnstileCheck.code || 'TURNSTILE_VERIFICATION_FAILED'
                });
            }
        }

        const boundedResult = nameAnalysis.formatQuestionPrompt(result, followup);
        const analysis = await llmService.analyzeService('nameAnalysis', boundedResult, { userQuestion: followup, language: body.lang || 'zh-tw' });
        const { turnstileToken: _turnstileToken, 'cf-turnstile-response': _cfTurnstileResponse, ...recordInput } = body;
        const discord = await sendModuleRecord('中文姓名分析', recordInput, result, analysis.analysis || analysis.fallback || '');
        res.json({ success: true, result, analysis: analysis.analysis || analysis.fallback || null, metadata: analysis.success ? { provider: analysis.provider, model: analysis.model } : null, discord });
    } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message, code: error.code }); }
});

// 路由
function renderZiweiPage(req, res, activeMode = 'chart') {
    const modes = {
        chart: {
            title: '紫微斗數排盤 · 三合飛星命理顧問',
            description: '線上紫微斗數排盤系統，支援十二宮、十四主星廟旺、生年四化、大限流年與三方四正格局解讀。',
            canonicalUrl: 'https://qi.david888.com/ziwei'
        },
        spouse: {
            title: '看出你未來另一半 · 紫微夫妻宮正緣年齡差與長相性格解析',
            description: '運用正統紫微斗數夫妻宮安星訣，3秒精準解讀未來另一半年齡差距、外貌氣質、性格優缺點、相處模式與相逢時機。',
            canonicalUrl: 'https://qi.david888.com/ziwei/spouse'
        },
        'male-size': {
            title: '3秒測男生真實尺寸 · 紫微斗數出廠規格與體質雙核速測',
            description: '拒絕單看子位虛標！紫微斗數「子位出廠氣象＋疾厄宮實體肉身」雙核合參，3秒解鎖男生真實尺寸區間與實戰體質。',
            canonicalUrl: 'https://qi.david888.com/ziwei/male-size'
        }
    };
    const currentMode = req.query.mode && modes[req.query.mode] ? req.query.mode : activeMode;
    const config = modes[currentMode] || modes.chart;
    return res.render('ziwei', {
        enableLLM: !!process.env.LLM_API_KEY,
        activePage: 'ziwei',
        activeMode: currentMode,
        canonicalUrl: config.canonicalUrl,
        pageTitle: config.title,
        pageDescription: config.description
    });
}
app.get('/ziwei', (req, res) => renderZiweiPage(req, res, 'chart'));
app.get('/ziwei/spouse', (req, res) => renderZiweiPage(req, res, 'spouse'));
app.get('/ziwei/male-size', (req, res) => renderZiweiPage(req, res, 'male-size'));
app.get('/tarot', (req, res) => res.render('tarot', { enableLLM: !!process.env.LLM_API_KEY, activePage: 'tarot', activeMode: req.query.mode || 'spread' }));
app.get('/tarot/numerology', (req, res) => res.render('tarot', { enableLLM: !!process.env.LLM_API_KEY, activePage: 'tarot', activeMode: 'numerology' }));
app.get('/tarot/gallery', (req, res) => res.render('tarot', { enableLLM: !!process.env.LLM_API_KEY, activePage: 'tarot', activeMode: 'gallery' }));
app.get('/fengshui', (req, res) => res.render('fengshui', { enableLLM: !!process.env.LLM_API_KEY, activePage: 'fengshui' }));
app.get('/bazi2', (req, res) => res.render('bazi2', { enableLLM: !!process.env.LLM_API_KEY, activePage: 'bazi2' }));
app.get('/yinyuan', (req, res) => res.render('yinyuan', { enableLLM: !!process.env.LLM_API_KEY, activePage: 'yinyuan' }));
app.get('/meihua', (req, res) => {
    res.render('meihua', {
        enableLLM: !!process.env.LLM_API_KEY,
        activePage: 'meihua'
    });
});
app.get('/answerbook', (req, res) => res.render('answerbook', { enableLLM: !!process.env.LLM_API_KEY, activePage: 'answerbook' }));

function sendModuleRecord(moduleName, input, result, analysis = '') {
    return discordWebhook.sendDivinationRecord(moduleName, input, result, analysis)
        .catch((error) => ({ success: false, reason: error.message }));
}

const handleZiweiChart = async (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        if (payload.palaces) delete payload.palaces;
        const skipRecord = payload.skipRecord === true || payload.skipRecord === 'true';
        delete payload.skipRecord;
        const validated = validateZiweiQuestion(payload);
        const chart = calculateZiweiChart(validated);
        const discord = skipRecord ? null : await sendModuleRecord('紫微斗數', validated, chart);
        res.json({ success: true, chart, discord });
    } catch (error) { res.status(error.status || error.statusCode || 400).json({ success: false, error: error.message, code: error.code }); }
};
app.post('/api/ziwei/chart', handleZiweiChart);
app.get('/api/ziwei/chart', handleZiweiChart);

const handleZiweiMaleSize = async (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        if (payload.palaces) delete payload.palaces;
        const validated = validateZiweiQuestion(payload);
        const result = evaluateMaleSize(validated);
        // Wait for Discord's wait=true confirmation before returning webhook status.
        const discord = await sendModuleRecord('紫微男生尺寸', validated, result);
        res.json({ success: true, result, ...result, discord });
    } catch (error) { res.status(error.status || error.statusCode || 400).json({ success: false, error: error.message, code: error.code }); }
};
app.post('/api/ziwei/male-size', handleZiweiMaleSize);
app.get('/api/ziwei/male-size', handleZiweiMaleSize);

const handleZiweiSpouse = async (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        if (payload.palaces) delete payload.palaces;
        const validated = validateZiweiQuestion(payload);
        const result = evaluateFutureSpouse(validated);
        // Wait for Discord's wait=true confirmation before returning webhook status.
        const discord = await sendModuleRecord('紫微未來另一半', validated, result);
        res.json({ success: true, result, spouse: result, ...result, discord });
    } catch (error) { res.status(error.status || error.statusCode || 400).json({ success: false, error: error.message, code: error.code }); }
};
app.post('/api/ziwei/spouse', handleZiweiSpouse);
app.get('/api/ziwei/spouse', handleZiweiSpouse);

const handleTarotReading = async (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        const reading = drawCards(payload);
        const discord = await sendModuleRecord('塔羅', payload, reading);
        res.json({ success: true, reading, discord });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
app.post('/api/tarot/reading', handleTarotReading);
app.get('/api/tarot/reading', handleTarotReading);

const handleTarotNumerology = async (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        const birthDate = payload.birthDate || payload.birth_date || payload.date;
        const numerology = calculateTarotNumerology(birthDate);
        if (numerology.error) {
            return res.status(400).json({ success: false, error: numerology.error });
        }
        const discord = await sendModuleRecord('塔羅生命靈數', payload, numerology);
        res.json({ success: true, numerology, result: numerology, ...numerology, discord });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
app.post('/api/tarot/numerology', handleTarotNumerology);
app.get('/api/tarot/numerology', handleTarotNumerology);

const handleTarotCards = (req, res) => {
    try {
        const suit = req.query.suit || 'all';
        const cards = getAllTarotCards(suit);
        res.json({ success: true, count: cards.length, cards });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
app.get('/api/tarot/cards', handleTarotCards);

const handleFengshuiReport = async (req, res) => {
    try {
        const body = { ...(req.query || {}), ...(req.body || {}) };
        let report;
        if (body.mode === 'shaqi') {
            report = diagnoseShaqi(body.shaType || body.question);
        } else if (body.mode === 'zeri') {
            report = chooseZeri(body.matter, body.year, body.month);
        } else {
            let layoutObjects = body.layoutObjects;
            if (typeof layoutObjects === 'string') {
                try { layoutObjects = JSON.parse(layoutObjects); } catch (e) {
                    const err = new Error('layoutObjects JSON 格式無效');
                    err.code = 'INVALID_LAYOUT_OBJECTS';
                    err.field = 'layoutObjects';
                    throw err;
                }
            }
            let entryPath = body.entryPath;
            if (typeof entryPath === 'string') {
                try { entryPath = JSON.parse(entryPath); } catch (e) {
                    const err = new Error('entryPath JSON 格式無效');
                    err.code = 'INVALID_LAYOUT_OBJECTS';
                    err.field = 'entryPath';
                    throw err;
                }
            }
            report = calculateFengShui({
                ...body,
                layoutObjects,
                entryPath
            });
        }
        const discord = await sendModuleRecord('風水', body, report);
        res.json({ success: true, report, discord });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
            code: error.code || 'INVALID_FENGSHUI_INPUT',
            field: error.field || null
        });
    }
};
app.post('/api/fengshui/report', handleFengshuiReport);
app.get('/api/fengshui/report', handleFengshuiReport);

const handleEvaluateLayout = async (req, res) => {
    try {
        const body = { ...(req.query || {}), ...(req.body || {}) };
        let layoutObjects = body.layoutObjects;
        if (typeof layoutObjects === 'string') {
            try {
                layoutObjects = JSON.parse(layoutObjects);
            } catch (e) {
                const err = new Error('layoutObjects JSON 格式無效');
                err.code = 'INVALID_LAYOUT_OBJECTS';
                err.field = 'layoutObjects';
                throw err;
            }
        }
        if (!layoutObjects || typeof layoutObjects !== 'object' || Array.isArray(layoutObjects) || Object.keys(layoutObjects).length === 0) {
            throw validationError('evaluate-layout 必須提供至少一項 layoutObjects', 'INSUFFICIENT_LAYOUT_DATA', 'layoutObjects');
        }
        let entryPath = body.entryPath;
        if (typeof entryPath === 'string') {
            try { entryPath = JSON.parse(entryPath); } catch (e) {
                const err = new Error('entryPath JSON 格式無效');
                err.code = 'INVALID_LAYOUT_OBJECTS';
                err.field = 'entryPath';
                throw err;
            }
        }

        const report = calculateFengShui({
            ...body,
            layoutObjects,
            entryPath
        });
        const discord = await sendModuleRecord('風水佈局評估', body, report);

        res.json({
            success: true,
            discord,
            orientation: report.orientation || null,
            chart: {
                period: report.period,
                pattern: report.pattern,
                patternDesc: report.patternDesc,
                flyingStars: report.flyingStars,
                eightMansions: report.eightMansions
            },
            chartQualification: report.chartQualification || null,
            layoutEvaluation: report.layoutEvaluation || null,
            missingData: report.missingData || [],
            dataQuality: (report.missingData && report.missingData.length > 0) ? 'insufficient' : 'complete'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
            code: error.code || 'INVALID_LAYOUT_EVALUATION',
            field: error.field || null
        });
    }
};
app.post('/api/fengshui/evaluate-layout', handleEvaluateLayout);
app.get('/api/fengshui/evaluate-layout', handleEvaluateLayout);
app.get('/api/fengshui/shaqi-list', (req, res) => res.json({ success: true, list: getAllShaQiLibrary() }));
app.get('/api/fengshui/luantou', async (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        const list = payload.shaList ? (Array.isArray(payload.shaList) ? payload.shaList : String(payload.shaList).split(',')) : [payload.shaType || '天斬煞'];
        const result = diagnoseLuantou(list);
        const discord = await sendModuleRecord('風水巒頭診斷', payload, result);
        res.json({ success: true, result, discord });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
});
app.post('/api/fengshui/luantou', async (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        const list = payload.shaList ? (Array.isArray(payload.shaList) ? payload.shaList : String(payload.shaList).split(',')) : [payload.shaType || '天斬煞'];
        const result = diagnoseLuantou(list);
        const discord = await sendModuleRecord('風水巒頭診斷', payload, result);
        res.json({ success: true, result, discord });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
});

app.get('/api/solar-time', (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        if (!payload.date) return res.status(400).json({ success: false, error: '請提供 date (YYYY-MM-DD)' });
        const result = calculateTrueSolarTime({
            date: payload.date,
            hour: Number(payload.hour) || 12,
            minute: Number(payload.minute) || 0,
            place: payload.place,
            longitude: payload.longitude,
            latitude: payload.latitude,
            ziMode: payload.ziMode || 'early_late'
        });
        res.json({ success: true, result });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
});

const handleTimeRange = (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        const range = APITimeHandler.parseDateRange(payload);
        res.json({ success: true, range });
    } catch (error) {
        res.status(getHttpErrorStatus(error)).json({
            success: false,
            error: error.message,
            code: error.code || 'INVALID_DATE_RANGE',
            field: error.field || 'range'
        });
    }
};

const handleTimeBoundary = (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        const date = APITimeHandler.normalizeDateBoundary(payload.date || payload.datetime || payload.timestamp, {
            boundary: payload.boundary || 'start',
            timezone: payload.timezone,
            precision: payload.precision
        });
        res.json({
            success: true,
            boundary: payload.boundary || 'start',
            datetime: date.toISOString(),
            timestamp: date.getTime()
        });
    } catch (error) {
        res.status(getHttpErrorStatus(error)).json({
            success: false,
            error: error.message,
            code: error.code || 'INVALID_DATETIME',
            field: error.field || 'date'
        });
    }
};

app.get('/api/time/range', handleTimeRange);
app.post('/api/time/range', handleTimeRange);
app.get('/api/time/boundary', handleTimeBoundary);
app.post('/api/time/boundary', handleTimeBoundary);


const handleBaziChart = async (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        const chart = calculateBazi(payload);
        const discord = await sendModuleRecord('生辰八字2', payload, chart);
        res.json({ success: true, chart, discord });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
app.post('/api/bazi2/chart', handleBaziChart);
app.get('/api/bazi2/chart', handleBaziChart);

const handleYinyuanReading = async (req, res) => {
    try {
        const body = { ...(req.query || {}), ...(req.body || {}) };
        let result;
        const mode = body.mode || 'fortune';

        if (mode === 'bazi-match') {
            if (!body.firstDate && !body.secondDate && !body.date && !body.first?.date) {
                return res.status(400).json({ success: false, error: '請提供雙方出生日期以進行八字合婚' });
            }
            result = baziMatchFull(body.first || body, body.second || body);
        } else if (mode === 'zodiac') {
            const first = body.firstZodiac || body.firstYear || body.first;
            const second = body.secondZodiac || body.secondYear || body.second;
            if (!first || !second) {
                return res.status(400).json({ success: false, error: '請提供雙方生肖或出生年份以進行生肖配對' });
            }
            result = zodiacMatch(first, second);
        } else if (mode === 'fortune') {
            result = drawFortuneStick(body.question, body.name, body.seed, body.stickNum || body.fortuneStickNum);
        } else if (mode === 'ziwei-marriage' || mode === 'marriage-palace') {
            if (!body.birthDate && !body.date) {
                return res.status(400).json({ success: false, error: '請提供出生日期以分析紫微夫妻宮' });
            }
            result = ziweiMarriage(body);
        } else if (mode === 'peach-blossom' || mode === 'taohua-luck') {
            if (!body.firstYear && !body.birthDate && !body.taohuaBirthDate && !body.year && !body.date) {
                return res.status(400).json({ success: false, error: '請提供出生年份或生日以查詢桃花運勢' });
            }
            result = peachBlossomLuck(body.firstYear || body.birthDate || body.taohuaBirthDate || body.year || body.date, body.status, body.scope);
        } else if (mode === 'red-thread') {
            if (!body.birthDate && !body.date) {
                return res.status(400).json({ success: false, error: '請提供出生日期以推演紅線正緣畫像' });
            }
            result = redThreadFull(body);
        } else {
            result = drawFortuneStick(body.question, body.name, body.seed, body.stickNum || body.fortuneStickNum);
        }

        const discord = await sendModuleRecord('姻緣', body, result);
        res.json({ success: true, result, discord });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
app.post('/api/yinyuan/reading', handleYinyuanReading);
app.get('/api/yinyuan/reading', handleYinyuanReading);

const FENGSHUI_FACINGS = new Set([
    '南', '北', '東', '西', '東南', '西北', '東北', '西南',
    '壬山丙向', '子山午向', '癸山丁向', '丑山未向', '艮山坤向', '寅山申向',
    '甲山庚向', '卯山酉向', '乙山辛向', '辰山戌向', '巽山乾向', '巳山亥向',
    '丙山壬向', '午山子向', '丁山癸向', '未山丑向', '坤山艮向', '申山寅向',
    '庚山甲向', '酉山卯向', '辛山乙向', '戌山辰向', '乾山巽向', '亥山巳向'
]);
const YINYUAN_MODES = new Set(['fortune', 'zodiac', 'ziwei-marriage', 'peach-blossom', 'bazi-match', 'red-thread', 'marriage-palace', 'taohua-luck']);

function parseYear(value, field, { required = true } = {}) {
    if ((value === undefined || value === null || value === '') && !required) return undefined;
    const year = Number(value);
    if (!Number.isInteger(year) || year < 1 || year > 9999) {
        throw validationError(`${field} 必須是有效年份`, 'INVALID_YEAR', field);
    }
    return year;
}

function validateTarotQuestion(body) {
    const spread = body.spread || 'three';
    if (typeof spread !== 'string' || !Object.prototype.hasOwnProperty.call(TAROT_SPREADS, spread)) {
        throw validationError('不支援的塔羅牌陣', 'INVALID_SPREAD', 'spread');
    }
    return { ...body, spread };
}

function validateFengShuiQuestion(body) {
    const mode = body.mode || 'yangzhai';
    if (mode === 'yangzhai') {
        let facing = body.facing;
        let heading = body.heading;

        if (heading !== undefined && heading !== null && heading !== '') {
            const numHeading = Number(heading);
            if (!Number.isFinite(numHeading)) {
                throw validationError(`無效的角度數值: ${heading}`, 'INVALID_HEADING', 'heading');
            }
            const orientation = calculateMountainFromHeading(numHeading);
            if (facing && !FENGSHUI_FACINGS.has(facing)) {
                throw validationError('請提供有效的房屋朝向', 'INVALID_FACING', 'facing');
            }
            if (facing) {
                const matches = facing === orientation.facingMountain ||
                                facing === orientation.facingDir ||
                                facing === orientation.mountKey ||
                                orientation.mountKey.includes(facing);
                if (!matches) {
                    throw validationError(`提供的手機度數 (${heading}° -> ${orientation.mountKey}) 與朝向參數 (${facing}) 互相矛盾`, 'FACING_HEADING_CONFLICT', 'heading');
                }
            }
            if (!facing) {
                facing = orientation.mountKey;
            }
        } else {
            facing = facing || '南';
            if (!FENGSHUI_FACINGS.has(facing)) {
                throw validationError('請提供有效的房屋朝向', 'INVALID_FACING', 'facing');
            }
        }

        let layoutObjects = body.layoutObjects;
        if (typeof layoutObjects === 'string') {
            try {
                layoutObjects = JSON.parse(layoutObjects);
            } catch (e) {
                throw validationError('layoutObjects JSON 格式無效', 'INVALID_LAYOUT_OBJECTS', 'layoutObjects');
            }
        }
        let entryPath = body.entryPath;
        if (typeof entryPath === 'string') {
            try {
                entryPath = JSON.parse(entryPath);
            } catch (e) {
                throw validationError('entryPath JSON 格式無效', 'INVALID_LAYOUT_OBJECTS', 'entryPath');
            }
        }

        if (layoutObjects || entryPath || body.pathQuality) {
            try {
                validateLayoutInput(layoutObjects, entryPath, body.pathQuality);
            } catch (err) {
                throw validationError(err.message, err.code || 'INVALID_LAYOUT_OBJECTS', err.field || 'layoutObjects');
            }
        }

        return {
            ...body,
            mode,
            facing,
            heading: (heading !== undefined && heading !== null && heading !== '') ? Number(heading) : undefined,
            layoutObjects,
            entryPath,
            pathQuality: body.pathQuality,
            northReference: body.northReference,
            declination: body.declination,
            headingSource: body.headingSource,
            moveInYear: parseYear(body.moveInYear, 'moveInYear', { required: false }) || new Date().getFullYear(),
            residentYear: parseYear(body.residentYear, 'residentYear', { required: false }) || 1990,
            sex: body.sex === '男' ? '男' : '女',
            year: parseYear(body.year, 'year', { required: false }) || new Date().getFullYear()
        };
    }
    return {
        ...body,
        mode,
        year: parseYear(body.year || body.zeriYear, 'year', { required: false }) || new Date().getFullYear()
    };
}

function calculateFengshuiQuestion(input) {
    if (input.mode === 'shaqi') {
        return diagnoseShaqi(input.shaType || input.question);
    }
    if (input.mode === 'zeri') {
        return chooseZeri(input.matter, input.zeriYear || input.year, input.zeriMonth || input.month);
    }
    return calculateFengShui(input);
}

function validateBaziQuestion(body) {
    if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
        throw validationError('請提供出生日期（YYYY-MM-DD）', 'MISSING_BIRTH_DATE', 'date');
    }
    const [year, month, day] = body.date.split('-').map(Number);
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
        throw validationError('出生日期無效', 'INVALID_BIRTH_DATE', 'date');
    }
    const calendar = body.calendar || 'solar';
    if (!['solar', 'lunar'].includes(calendar)) {
        throw validationError('不支援的曆法', 'INVALID_CALENDAR', 'calendar');
    }
    if (body.sex !== undefined && !['男', '女'].includes(body.sex)) {
        throw validationError('請選擇性別', 'INVALID_SEX', 'sex');
    }
    const time = body.time || (body.shichen ? SHICHEN_TIME_MAP[body.shichen] : '12:00');
    return { ...body, calendar, time, sex: body.sex || '男' };
}

function resolveNameBirthLens(birthData) {
    if (birthData == null || birthData === '') return null;
    if (!birthData || typeof birthData !== 'object' || Array.isArray(birthData)) throw validationError('出生資料須為 JSON 物件', 'INVALID_BIRTH_DATA', 'birthData');
    if (!birthData.date || !['男', '女'].includes(birthData.sex)) throw validationError('八字參考需提供出生日期與排盤性別；若不提供性別，請留空整個出生資料區。', 'INCOMPLETE_BIRTH_DATA', 'birthData');
    const hasKnownTime = Boolean(birthData.time || birthData.shichen);
    if (!hasKnownTime && birthData.allowUnknownHour !== true) throw validationError('請提供出生時間或明確勾選未知時辰', 'MISSING_BIRTH_TIME', 'birthData');
    const validated = validateBaziQuestion({ ...birthData, allowUnknownHour: !hasKnownTime });
    if (!hasKnownTime) validated.time = '';
    const chart = calculateBazi(validated);
    const matches = String(chart.strengthAnalysis?.usefulGod || '').match(/\[([木火土金水])\]/g) || [];
    const usefulElements = [...new Set(matches.map((text) => text.slice(1, -1)))];
    return {
        usefulElements,
        summary: {
            sex: validated.sex,
            fourPillars: chart.fourPillars.map(({ label, value }) => ({ label, value })),
            dayMaster: chart.dayMaster,
            strength: chart.strengthAnalysis?.strength || null,
            strengthBasis: [chart.strengthAnalysis?.isDeLing, chart.strengthAnalysis?.deDi, chart.strengthAnalysis?.deShi].filter(Boolean),
            fiveElements: chart.fiveElements,
            usefulGod: chart.strengthAnalysis?.usefulGod || null,
            tabooGod: chart.strengthAnalysis?.tabooGod || null,
            startingLuckAge: chart.profile?.startYunAge || null,
            firstLuckCycle: chart.luckCycles?.[0]?.ganzhi || null
        },
        assumptions: {
            source: '本地 lib/bazi2.js 計算；不連線傳送出生資料',
            calendar: validated.calendar,
            lunarLeapMonth: validated.calendar === 'lunar' && Boolean(validated.leap),
            birthHour: hasKnownTime ? '使用者提供' : '未知；以三柱參考',
            ziMode: validated.ziMode || 'early_late',
            sexProvidedForCalculation: true,
            solarTimeCorrection: '未提供出生地座標，因此未作真太陽時校正'
        }
    };
}

function validateYinyuanQuestion(body) {
    const mode = body.mode || 'fortune';
    if (!YINYUAN_MODES.has(mode)) {
        throw validationError('請選擇可用的姻緣測算模式', 'INVALID_MODE', 'mode');
    }
    if ((mode === 'ziwei-marriage' || mode === 'marriage-palace') && !body.date && !body.birthDate) {
        throw validationError('請提供出生日期（YYYY-MM-DD）以排定紫微夫妻宮', 'MISSING_BIRTH_DATE', 'date');
    }
    if (mode === 'fortune' && (body.stickNum || body.fortuneStickNum)) {
        const num = Number(body.stickNum || body.fortuneStickNum);
        if (!Number.isInteger(num) || num < 1 || num > 100) {
            throw validationError('靈籤號碼需介於 1 到 100 之間', 'INVALID_STICK_NUM', 'stickNum');
        }
    }
    if (mode === 'zodiac' && (!body.firstZodiac && !body.firstYear) && (!body.secondZodiac && !body.secondYear)) {
        throw validationError('請提供雙方生肖或出生年份以進行生肖配對', 'MISSING_ZODIAC_INFO', 'firstZodiac');
    }
    if (mode === 'bazi-match') {
        const d1 = body.first?.date || body.date1 || body.firstDate;
        const d2 = body.second?.date || body.date2 || body.secondDate;
        if (!d1 || !d2) {
            throw validationError('請提供雙方出生日期以進行八字合婚', 'MISSING_BAZI_MATCH_INFO', 'first');
        }
    }
    if (mode === 'peach-blossom' && !body.firstYear && !body.birthDate && !body.date && !body.year) {
        throw validationError('請提供出生年份或生日以查詢桃花運勢', 'MISSING_PEACH_INFO', 'date');
    }
    if (mode === 'red-thread' && !body.date && !body.birthDate) {
        throw validationError('請提供出生日期以推演紅線正緣畫像', 'MISSING_RED_THREAD_INFO', 'date');
    }
    return {
        ...body,
        mode,
        status: body.status || '單身'
    };
}

function calculateYinyuanQuestion(input) {
    switch (input.mode) {
        case 'zodiac': return zodiacMatch(input.firstZodiac || input.firstYear, input.secondZodiac || input.secondYear);
        case 'fortune': return drawFortuneStick(input.question, input.name, input.seed, input.stickNum || input.fortuneStickNum);
        case 'ziwei-marriage':
        case 'marriage-palace': return ziweiMarriage(input);
        case 'peach-blossom':
        case 'taohua-luck': return peachBlossomLuck(input.firstYear || input.birthDate || input.taohuaBirthDate || input.year || input.date, input.status, input.scope);
        case 'bazi-match': return baziMatchFull(input.first || { date: input.date1 || input.firstDate }, input.second || { date: input.date2 || input.secondDate });
        case 'red-thread': return redThreadFull(input);
        default: return drawFortuneStick(input.question, input.name, input.seed, input.stickNum || input.fortuneStickNum);
    }
}

const ziweiQuestionHandler = createServiceQuestionHandler({
    moduleName: '紫微斗數',
    resultKey: 'chart',
    validate: validateZiweiQuestion,
    calculate: calculateZiweiChart,
    analyze: llmService.analyzeZiwei.bind(llmService),
    discord: discordWebhook
});
app.post('/api/ziwei-question', ziweiQuestionHandler);
app.get('/api/ziwei-question', ziweiQuestionHandler);

const tarotQuestionHandler = createServiceQuestionHandler({
    moduleName: '塔羅',
    resultKey: 'reading',
    validate: validateTarotQuestion,
    calculate: drawCards,
    analyze: llmService.analyzeTarot.bind(llmService),
    discord: discordWebhook
});
app.post('/api/tarot-question', tarotQuestionHandler);
app.get('/api/tarot-question', tarotQuestionHandler);

const fengshuiQuestionHandler = createServiceQuestionHandler({
    moduleName: '風水',
    resultKey: 'report',
    validate: validateFengShuiQuestion,
    calculate: calculateFengshuiQuestion,
    analyze: llmService.analyzeFengShui.bind(llmService),
    discord: discordWebhook
});
app.post('/api/fengshui-question', fengshuiQuestionHandler);
app.get('/api/fengshui-question', fengshuiQuestionHandler);

const bazi2QuestionHandler = createServiceQuestionHandler({
    moduleName: '生辰八字2',
    resultKey: 'chart',
    validate: validateBaziQuestion,
    calculate: calculateBazi,
    analyze: llmService.analyzeBazi2.bind(llmService),
    discord: discordWebhook
});
app.post('/api/bazi2-question', bazi2QuestionHandler);
app.get('/api/bazi2-question', bazi2QuestionHandler);

const yinyuanQuestionHandler = createServiceQuestionHandler({
    moduleName: '姻緣',
    resultKey: 'result',
    validate: validateYinyuanQuestion,
    calculate: calculateYinyuanQuestion,
    analyze: llmService.analyzeYinyuan.bind(llmService),
    discord: discordWebhook
});
app.post('/api/yinyuan-question', yinyuanQuestionHandler);
app.get('/api/yinyuan-question', yinyuanQuestionHandler);

const answerBookClient = new AnswerBookClient();
const answerbookQuestionHandler = createAnswerbookQuestionHandler({
    client: answerBookClient,
    analyze: llmService.analyzeAnswerbook.bind(llmService),
    discord: discordWebhook
});
app.post('/api/answerbook-question', answerbookQuestionHandler);
app.get('/api/answerbook-question', answerbookQuestionHandler);

const suiteModules = { ziwei: '紫微斗數', tarot: '塔羅', fengshui: '風水', bazi2: '生辰八字2', yinyuan: '姻緣', answerbook: '解答之書' };

const handleSuiteModuleLlmAnalysis = async (req, res) => {
    const moduleKey = req.params.module || (req.path && req.path.includes('/tarot/') ? 'tarot' : null);
    if (!moduleKey || !Object.prototype.hasOwnProperty.call(suiteModules, moduleKey)) {
        return res.status(404).json({ success: false, error: '不支援的服務模組' });
    }
    const moduleName = suiteModules[moduleKey];
    try {
        const { result, question = '', conversationHistory = [] } = req.body || {};
        if (!result) return res.status(400).json({ success: false, error: '缺少計算結果' });

        const aiResult = await llmService.analyzeService(moduleKey, result, {
            userQuestion: question,
            conversationHistory
        });

        if (!aiResult.success) {
            return res.status(500).json({ success: false, error: aiResult.error || '解讀失敗' });
        }

        const discord = await sendModuleRecord(moduleName, req.body, result, aiResult.analysis);
        res.json({
            success: true,
            analysis: aiResult.analysis,
            provider: aiResult.provider,
            model: aiResult.model,
            discord
        });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// 明確註冊 /api/tarot/llm-analysis 及通用參數路由 /api/:module/llm-analysis
app.post('/api/tarot/llm-analysis', (req, res, next) => { req.params.module = 'tarot'; next(); }, turnstileMiddleware({ action: ['llm_analysis', 'divination_analysis'] }), handleSuiteModuleLlmAnalysis);
app.post('/api/:module/llm-analysis', (req, res, next) => {
    if (!Object.prototype.hasOwnProperty.call(suiteModules, req.params.module)) {
        return next('route');
    }
    return turnstileMiddleware({ action: ['llm_analysis', 'divination_analysis'] })(req, res, next);
}, handleSuiteModuleLlmAnalysis);

// 對話紀錄 Email 寄送 API (透過 Resend API)
app.post('/api/conversation/send-email', turnstileMiddleware({ action: 'send_email' }), async (req, res) => {
    try {
        const { email, service, subject, history, chartSummary } = req.body || {};
        if (Array.isArray(history) && Buffer.byteLength(JSON.stringify(history), 'utf8') > 900 * 1024) {
            return res.status(413).json({ success: false, error: '寄送內容超過安全大小上限，請縮小結果後再寄送。' });
        }
        const result = await sendConversationEmail({
            to: email,
            serviceName: service || '奇門遁甲',
            subject: subject,
            history: history,
            chartSummary: chartSummary
        });

        if (!result.success) {
            return res.status(result.status || 400).json(result);
        }
        return res.json(result);
    } catch (err) {
        console.error('Email API 錯誤:', err);
        return res.status(500).json({
            success: false,
            error: '伺服器處理郵件發送時發生異常: ' + err.message
        });
    }
});

// 首頁 - 實時排盤
app.get('/', async (req, res) => {
    // 獲取時間參數（來自前端或使用伺服器時間）
    let date;
    try {
        date = parseCivilTime(req.query);
    } catch (error) {
        return res.type('text/plain').status(getHttpErrorStatus(error)).send('排盤錯誤: ' + error.message);
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
        const statusCode = getHttpErrorStatus(error);
        res.type('text/plain').status(statusCode).send('排盤錯誤: ' + error.message);
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

    let date;
    try {
        date = parseCivilTime({ date: dateStr, time: timeStr });
    } catch (error) {
        return res.type('text/plain').status(getHttpErrorStatus(error)).send('排盤錯誤: ' + error.message);
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
        const statusCode = getHttpErrorStatus(error);
        res.type('text/plain').status(statusCode).send('排盤錯誤: ' + error.message);
    }
});

// API接口 - 獲取奇門排盤數據
app.get('/api/qimen', async (req, res) => {
    // 獲取請求參數
    const type = req.query.type || '四柱';
    const method = req.query.method || '時家';
    const dateStr = req.query.date;
    const timeStr = req.query.time;
    const location = req.query.location || '默認位置';
    const purpose = req.query.purpose || '綜合';
    const timePrecisionMode = req.query.timePrecisionMode || 'advanced';

    let date;
    try {
        date = parseCivilTime({ date: dateStr, time: timeStr });
    } catch (error) {
        const statusCode = getHttpErrorStatus(error);
        return res.status(statusCode).json({
            error: statusCode === 400 ? '參數驗證失敗' : '排盤錯誤',
            message: error.message,
            code: error.code,
            field: error.field
        });
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
        const discord = await sendModuleRecord('奇門遁甲排盤', { type, method, date: dateStr, time: timeStr, location, purpose, timePrecisionMode }, result);
        res.json({ ...result, discord });
    } catch (error) {
        console.error('API排盤錯誤:', error);
        const statusCode = getHttpErrorStatus(error);
        res.status(statusCode).json({
            error: statusCode === 400 ? '參數驗證失敗' : '排盤錯誤',
            message: error.message,
            code: error.code,
            field: error.field
        });
    }
});

// 梅花易數起卦 API
app.post('/api/meihua/qigua', async (req, res) => {
    try {
        const {
            method = 'time',
            datetime = null,
            userDateTime = null,
            timestamp = null,
            timezoneOffset = null,
            num1 = null,
            num2 = null,
            num3 = null
        } = req.body || {};

        if (method === 'time') {
            const date = parseCivilTime({ userDateTime, datetime, timestamp, timezoneOffset });

            const result = meihua.qiguaByGregorianTime(date);
            result.texts = {
                bengua: meihuaText.getHexagramText(result.bengua.num),
                hugua: meihuaText.getHexagramText(result.hugua.num),
                biangua: meihuaText.getHexagramText(result.biangua.num),
                cuogua: meihuaText.getHexagramText(result.cuogua?.num),
                zonggua: meihuaText.getHexagramText(result.zonggua?.num)
            };
            const discord = await sendModuleRecord('梅花易數起卦', req.body || {}, result);
            return res.json({ success: true, data: result, discord });
        }

        if (method === 'number') {
            const parsedNum1 = Number.parseInt(num1, 10);
            const parsedNum2 = Number.parseInt(num2, 10);
            const parsedNum3 = num3 !== null && num3 !== undefined && num3 !== ''
                ? Number.parseInt(num3, 10)
                : null;

            if (!Number.isInteger(parsedNum1) || !Number.isInteger(parsedNum2)) {
                return res.status(400).json({ success: false, error: '數字起卦需要提供兩個整數' });
            }
            if (parsedNum3 !== null && !Number.isInteger(parsedNum3)) {
                return res.status(400).json({ success: false, error: '第三個數字必須為整數' });
            }

            const result = meihua.qiguaByNumbers(parsedNum1, parsedNum2, parsedNum3);
            result.texts = {
                bengua: meihuaText.getHexagramText(result.bengua.num),
                hugua: meihuaText.getHexagramText(result.hugua.num),
                biangua: meihuaText.getHexagramText(result.biangua.num),
                cuogua: meihuaText.getHexagramText(result.cuogua?.num),
                zonggua: meihuaText.getHexagramText(result.zonggua?.num)
            };
            const discord = await sendModuleRecord('梅花易數起卦', req.body || {}, result);
            return res.json({ success: true, data: result, discord });
        }

        if (method === 'text' || method === 'character') {
            const { text = '', hour = null } = req.body || {};
            if (!text || !String(text).trim()) {
                return res.status(400).json({ success: false, error: '漢字起卦需要提供文字' });
            }
            const currentHour = hour !== null && hour !== undefined && hour !== ''
                ? Number.parseInt(hour, 10)
                : new Date().getHours();
            const result = meihua.qiguaByText(String(text).trim(), currentHour);
            result.texts = {
                bengua: meihuaText.getHexagramText(result.bengua.num),
                hugua: meihuaText.getHexagramText(result.hugua.num),
                biangua: meihuaText.getHexagramText(result.biangua.num),
                cuogua: meihuaText.getHexagramText(result.cuogua?.num),
                zonggua: meihuaText.getHexagramText(result.zonggua?.num)
            };
            const discord = await sendModuleRecord('梅花易數起卦', req.body || {}, result);
            return res.json({ success: true, data: result, discord });
        }

        return res.status(400).json({ success: false, error: '不支援的起卦方式' });
    } catch (error) {
        console.error('梅花易數起卦 API 錯誤:', error);
        const statusCode = getHttpErrorStatus(error);
        return res.status(statusCode).json({
            success: false,
            error: statusCode === 400 ? '參數驗證失敗' : '起卦失敗',
            message: error.message,
            code: error.code,
            field: error.field
        });
    }
});

// LLM 解盤 API
app.post('/api/llm-analysis', turnstileMiddleware({ action: ['llm_analysis', 'qimen_question'] }), async (req, res) => {
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

            const date = parseCivilTime({ userDateTime, timestamp, timezoneOffset });

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
        const webhookContext = { purpose, conversationHistory, lang, userDateTime, timestamp, timezoneOffset, timePrecisionMode };

        // 如果有用戶問題，先發送到 Discord
        if (userQuestion && userQuestion.trim()) {
            const questionResult = await discordWebhook.sendUserQuestion(userQuestion.trim(), qimenData, webhookContext);
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
                userQuestion.trim(),
                webhookContext
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
        const statusCode = getHttpErrorStatus(error);
        const response = {
            error: statusCode === 400 ? '參數驗證失敗' : '分析失敗',
            message: error.message,
            code: error.code,
            field: error.field
        };
        if (statusCode === 500) {
            response.fallback = llmService.getFallbackAnalysis(resolvedQimenData || req.body?.qimenData || {});
        }
        res.status(statusCode).json(response);
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
                message: timeValidation.errors.join(', '),
                code: timeValidation.code,
                field: timeValidation.field
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
            const statusCode = getHttpErrorStatus(qimenError);
            return res.status(statusCode).json({
                success: false,
                error: statusCode === 400 ? '參數驗證失敗' : '排盤計算失敗',
                message: qimenError.message,
                code: qimenError.code,
                field: qimenError.field,
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
        const webhookContext = { datetime, mode, purpose, timezone, lang };
        const questionResult = await discordWebhook.sendUserQuestion(question.trim(), qimenPan, webhookContext);
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
                question.trim(),
                webhookContext
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

// 梅花易數 LLM 解卦 API
app.post('/api/meihua/llm-analysis', turnstileMiddleware({ action: ['llm_analysis', 'meihua_question'] }), async (req, res) => {
    try {
        const {
            meihuaData,
            userQuestion = '',
            purpose = '綜合',
            conversationHistory = [],
            lang = 'zh-tw'
        } = req.body;

        if (!meihuaData) {
            return res.status(400).json({ error: '缺少梅花易數數據' });
        }

        if (userQuestion && userQuestion.trim()) {
            const questionResult = await discordWebhook.sendUserQuestion(userQuestion.trim(), meihuaData, req.body || {});
            if (questionResult.success) {
                console.log('Meihua question sent to Discord successfully');
            } else if (questionResult.reason !== 'Discord webhook not configured') {
                console.warn('Failed to send Meihua question to Discord:', questionResult.reason);
            }
        }

        const analysisResult = await llmService.analyzeMeihua(meihuaData, {
            purpose,
            userQuestion,
            conversationHistory,
            language: lang
        });

        if (analysisResult.success && analysisResult.analysis) {
            const analysisDiscordResult = await discordWebhook.sendLLMAnalysis(
                analysisResult.analysis,
                meihuaData,
                userQuestion.trim(),
                req.body || {}
            );
            if (analysisDiscordResult.success) {
                console.log('Meihua analysis sent to Discord successfully');
            } else if (analysisDiscordResult.reason !== 'Discord webhook not configured') {
                console.warn('Failed to send Meihua analysis to Discord:', analysisDiscordResult.reason);
            }
        }

        res.json(analysisResult);
    } catch (error) {
        console.error('梅花易數 LLM 分析錯誤:', error);
        res.status(500).json({
            error: '分析失敗',
            message: error.message
        });
    }
});

// 梅花易數問答 API - 遠端 POST 請求接口
app.post('/api/meihua-question', async (req, res) => {
    try {
        const {
            question,
            method = 'time',
            datetime = null,
            num1 = null,
            num2 = null,
            num3 = null,
            purpose = '綜合',
            timezone = '+08:00',
            lang = 'zh-tw'
        } = req.body;

        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({
                success: false,
                error: '缺少必需參數',
                message: 'question 參數是必需的且不能為空'
            });
        }

        const timeValidation = APITimeHandler.validateTimeParams({ datetime, timezone });
        if (!timeValidation.valid) {
            return res.status(400).json({
                success: false,
                error: '參數驗證失敗',
                message: timeValidation.errors.join(', '),
                code: timeValidation.code,
                field: timeValidation.field
            });
        }

        let meihuaData;
        if (method === 'time') {
            const meihuaDate = APITimeHandler.generateQimenDateTime({ datetime, timezone });
            meihuaData = meihua.qiguaByGregorianTime(meihuaDate);
        } else if (method === 'number') {
            const parsedNum1 = Number.parseInt(num1, 10);
            const parsedNum2 = Number.parseInt(num2, 10);
            const parsedNum3 = num3 !== null && num3 !== undefined && num3 !== ''
                ? Number.parseInt(num3, 10)
                : null;

            if (!Number.isInteger(parsedNum1) || !Number.isInteger(parsedNum2)) {
                return res.status(400).json({
                    success: false,
                    error: '數字起卦需要提供兩個整數'
                });
            }

            if (parsedNum3 !== null && !Number.isInteger(parsedNum3)) {
                return res.status(400).json({
                    success: false,
                    error: '第三個數字必須為整數'
                });
            }

            meihuaData = meihua.qiguaByNumbers(parsedNum1, parsedNum2, parsedNum3);
        } else if (method === 'text' || method === 'character') {
            const text = req.body.text || req.body.char || req.body.word;
            if (!text || !String(text).trim()) {
                return res.status(400).json({
                    success: false,
                    error: '漢字起卦需要提供文字'
                });
            }
            const currentHour = req.body.hour !== null && req.body.hour !== undefined && req.body.hour !== ''
                ? Number.parseInt(req.body.hour, 10)
                : new Date().getHours();
            meihuaData = meihua.qiguaByText(String(text).trim(), currentHour);
        } else {
            return res.status(400).json({
                success: false,
                error: '無效的起卦方式'
            });
        }

        meihuaData.texts = {
            bengua: meihuaText.getHexagramText(meihuaData.bengua.num),
            hugua: meihuaText.getHexagramText(meihuaData.hugua.num),
            biangua: meihuaText.getHexagramText(meihuaData.biangua.num),
            cuogua: meihuaText.getHexagramText(meihuaData.cuogua?.num),
            zonggua: meihuaText.getHexagramText(meihuaData.zonggua?.num)
        };

        const questionResult = await discordWebhook.sendUserQuestion(question.trim(), meihuaData, req.body || {});
        let discordQuestionSent = false;
        if (questionResult.success) {
            discordQuestionSent = true;
            console.log('Meihua API question sent to Discord successfully');
        } else if (questionResult.reason !== 'Discord webhook not configured') {
            console.warn('Failed to send Meihua API question to Discord:', questionResult.reason);
        }

        const analysisResult = await llmService.analyzeMeihua(meihuaData, {
            purpose,
            userQuestion: question.trim(),
            language: lang
        });

        let discordAnalysisSent = false;
        if (analysisResult.success && analysisResult.analysis) {
            const analysisDiscordResult = await discordWebhook.sendLLMAnalysis(
                analysisResult.analysis,
                meihuaData,
                question.trim(),
                req.body || {}
            );
            if (analysisDiscordResult.success) {
                discordAnalysisSent = true;
                console.log('Meihua API analysis sent to Discord successfully');
            } else if (analysisDiscordResult.reason !== 'Discord webhook not configured') {
                console.warn('Failed to send Meihua API analysis to Discord:', analysisDiscordResult.reason);
            }
        }

        return res.json({
            success: analysisResult.success,
            question: question.trim(),
            answer: analysisResult.analysis || analysisResult.fallback || '抱歉，暫時無法提供分析',
            meihuaInfo: {
                ...APITimeHandler.formatTimeInfo(meihuaData.solar ? new Date(
                    meihuaData.solar.year,
                    meihuaData.solar.month - 1,
                    meihuaData.solar.day,
                    meihuaData.solar.hour
                ) : new Date(), timezone),
                method,
                purpose
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
        });
    } catch (error) {
        console.error('梅花易數問答 API 錯誤:', error);
        return res.status(500).json({
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
        models: llmService.models,
        supportedProviders: ['openai', 'anthropic', 'ollama', 'qwen'],
        discord: {
            enabled: discordWebhook.isEnabled(),
            configured: !!process.env.DISCORD_WEBHOOK_URL
        }
    });
});

// 測試 Discord webhook（僅限非生產環境）
app.get('/api/discord-test', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ success: false, message: 'Not found' });
    }
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

// 測試 LLM 連接（僅限非生產環境）
app.get('/api/llm-test', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ success: false, message: 'Not found' });
    }
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
        title: "奇門遁甲術數問答 API 文檔",
        version: "1.0",
        description: "提供奇門、梅花、塔羅、風水、生辰八字2、姻緣與解答之書服務的 RESTful API",
        baseUrl: `${req.protocol}://${req.get('host')}`,
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
                method: "POST", path: "/api/name-analysis-question", description: "重算驗名或命名結果；提供 question 且設定 LLM 時，姓名與確定性分析結果會傳至設定的 LLM；出生日期與時間不放入提示，派生五行摘要可能會傳入。",
                parameters: { mode: { type: "string", enum: ["verify", "generate"], default: "verify" }, name: { type: "string", required: false }, surname: { type: "string", required: false }, givenNameLength: { type: "integer", minimum: 1, maximum: 4 }, includeChars: { type: "array", items: "single Han character" }, excludeChars: { type: "array", items: "single Han character" }, desiredElements: { type: "array", items: ["木", "火", "土", "金", "水"] }, nameStyle: { type: "string", enum: ["auto", "feminine", "masculine", "neutral"], default: "auto" }, question: { type: "string", required: false, maxLength: 1000 }, profile: { type: "string", enum: ["taiwanKangxi", "modern"] }, birthData: { type: "object", required: false, description: "選填八字欄位；LLM 僅接收派生的五行摘要，不接收出生資料。" } },
                notes: ["未配置 LLM 或未提供 question 時只回傳確定性結果。", "缺失欄位不得推斷；三字以上名字使用標示的延伸五格算法。"]
            },
            nameMethodProfiles: { method: "GET", path: "/data/name-analysis/method-profiles.json", description: "姓名方法與來源版本清單。" },
            nameStyleProfiles: { method: "GET", path: "/data/name-analysis/name-style-profiles.json", description: "取名風格排序字表、風格組合與方法限制。" },
            nameCorpusProfile: { method: "GET", path: "/data/name-analysis/name-corpus-profile.json", description: "CCNC 中文姓名語料的性別標記字頻及名字相鄰字組聚合統計；不含完整姓名，僅作排序參考。" },
            qimenQuestion: {
                method: "POST",
                path: "/api/qimen-question",
                description: "提交問題並獲得基於奇門遁甲的分析回答",
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
                        model: "gpt-5.6-sol",
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
            },
            meihuaQuestion: {
                method: "POST",
                path: "/api/meihua-question",
                description: "提交問題並獲得基於梅花易數的分析回答",
                headers: {
                    "Content-Type": "application/json"
                },
                parameters: {
                    question: {
                        type: "string",
                        required: true,
                        description: "要詢問的問題"
                    },
                    method: {
                        type: "string",
                        required: false,
                        default: "time",
                        enum: ["time", "number", "text", "character"],
                        description: "起卦方式"
                    },
                    datetime: {
                        type: "string",
                        required: false,
                        description: "指定時間 (ISO 8601 格式)"
                    },
                    num1: {
                        type: "number",
                        required: false,
                        description: "數字起卦第一數"
                    },
                    num2: {
                        type: "number",
                        required: false,
                        description: "數字起卦第二數"
                    },
                    num3: {
                        type: "number",
                        required: false,
                        description: "數字起卦第三數 (動爻)"
                    },
                    text: {
                        type: "string",
                        required: false,
                        description: "漢字或詞語（text/character 起卦時使用）"
                    },
                    purpose: {
                        type: "string",
                        required: false,
                        default: "綜合",
                        description: "問事用途"
                    },
                    timezone: {
                        type: "string",
                        required: false,
                        default: "+08:00",
                        description: "時區偏移 (±HH:MM 格式)"
                    },
                    lang: {
                        type: "string",
                        required: false,
                        default: "zh-tw",
                        enum: ["zh-tw", "zh-cn"],
                        description: "回答語言"
                    }
                }
            },
            tarotQuestion: {
                method: "POST",
                path: "/api/tarot-question",
                description: "抽取塔羅牌並獲得模組化解讀",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    question: { type: "string", required: true, description: "要詢問的問題" },
                    spread: { type: "string", required: false, default: "three", enum: Object.keys(TAROT_SPREADS), description: "牌陣" },
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
                    facing: { type: "string", required: false, default: "南", enum: Array.from(FENGSHUI_FACINGS), description: "房屋朝向（8 大方位或 24 山）" },
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
                    shaType: { type: "string", required: false, enum: getAllShaQiLibrary().map(({ name }) => name), description: "形煞類型（shaqi 模式）" },
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
                    facing: { type: "string", required: false, enum: Array.from(FENGSHUI_FACINGS), description: "房屋朝向" },
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
                description: "獲取正統三合派紫微斗數排盤數據（十二宮、14主星、6吉6煞、四化、格局）",
                headers: { "Content-Type": "application/json" },
                parameters: {
                    date: { type: "string", required: true, description: "出生日期（YYYY-MM-DD）" },
                    time: { type: "string", required: false, description: "出生時間（HH:mm）" },
                    shichen: { type: "string", required: false, description: "傳統時辰地支" },
                    sex: { type: "string", required: false, enum: ["男", "女"], description: "性別" },
                    skipRecord: { type: "boolean", required: false, description: "true 時只計算並回傳命盤，不送出 Discord 紀錄。" }
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
                    sex: { type: "string", required: false, enum: ["男", "女"], description: "性別" }
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
                    mode: { type: "string", required: false, default: "fortune", enum: Array.from(YINYUAN_MODES), description: "姻緣測算模式" },
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

// 時區調試 API（僅限非生產環境）
app.get('/api/timezone-debug', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ success: false, message: 'Not found' });
    }
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
if (require.main === module) {
    app.listen(port, () => {
        console.log(`奇門遁甲在運行中 http://localhost:${port}`);
    });
}

module.exports = app;
