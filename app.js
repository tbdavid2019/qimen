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
const { drawCards, SPREADS: TAROT_SPREADS } = require('./lib/tarot');
const { calculateFengShui, diagnoseShaqi, diagnoseLuantou, getAllShaQiLibrary, chooseZeri } = require('./lib/fengshui');
const { calculateBazi } = require('./lib/bazi2');
const { calculateZiweiChart } = require('./lib/ziwei');
const { zodiacMatch, drawFortuneStick, ziweiMarriage, peachBlossomLuck, baziMatchFull, redThreadFull } = require('./lib/yinyuan');
const { calculateTrueSolarTime, resolveCoordinates } = require('./lib/solar-time');
const { createServiceQuestionHandler, validationError } = require('./lib/service-question');
const { AnswerBookClient, createAnswerbookQuestionHandler } = require('./lib/answerbook');

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

// 設置視圖引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// 靜態文件服務
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 中介軟體：WebMCP 權限政策
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'tools=(self)');
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
    
    next();
});

// 路由
app.get('/ziwei', (req, res) => res.render('ziwei', { enableLLM: !!process.env.LLM_API_KEY, activePage: 'ziwei' }));
app.get('/tarot', (req, res) => res.render('tarot', { enableLLM: !!process.env.LLM_API_KEY, activePage: 'tarot' }));
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
        const chart = calculateZiweiChart(payload);
        const discord = await sendModuleRecord('紫微斗數', payload, chart);
        res.json({ success: true, chart, discord });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
app.post('/api/ziwei/chart', handleZiweiChart);
app.get('/api/ziwei/chart', handleZiweiChart);

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

const handleFengshuiReport = async (req, res) => {
    try {
        const body = { ...(req.query || {}), ...(req.body || {}) };
        let report;
        if (body.mode === 'shaqi') {
            report = diagnoseShaqi(body.shaType || body.question);
        } else if (body.mode === 'zeri') {
            report = chooseZeri(body.matter, body.year, body.month);
        } else {
            report = calculateFengShui(body);
        }
        const discord = await sendModuleRecord('風水', body, report);
        res.json({ success: true, report, discord });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
app.post('/api/fengshui/report', handleFengshuiReport);
app.get('/api/fengshui/report', handleFengshuiReport);
app.get('/api/fengshui/shaqi-list', (req, res) => res.json({ success: true, list: getAllShaQiLibrary() }));
app.get('/api/fengshui/luantou', (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        const list = payload.shaList ? (Array.isArray(payload.shaList) ? payload.shaList : String(payload.shaList).split(',')) : [payload.shaType || '天斬煞'];
        const result = diagnoseLuantou(list);
        res.json({ success: true, result });
    } catch (error) { res.status(400).json({ success: false, error: error.message }); }
});
app.post('/api/fengshui/luantou', (req, res) => {
    try {
        const payload = { ...(req.query || {}), ...(req.body || {}) };
        const list = payload.shaList ? (Array.isArray(payload.shaList) ? payload.shaList : String(payload.shaList).split(',')) : [payload.shaType || '天斬煞'];
        const result = diagnoseLuantou(list);
        res.json({ success: true, result });
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
        const facing = body.facing || '南';
        if (!FENGSHUI_FACINGS.has(facing)) {
            throw validationError('請提供有效的房屋朝向', 'INVALID_FACING', 'facing');
        }
        return {
            ...body,
            mode,
            facing,
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

const SHICHEN_TIME_MAP = {
    子: '00:00', 丑: '02:00', 寅: '04:00', 卯: '06:00', 辰: '08:00', 巳: '10:00',
    午: '12:00', 未: '14:00', 申: '16:00', 酉: '18:00', 戌: '20:00', 亥: '22:00'
};

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

function validateZiweiQuestion(body) {
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

app.post('/api/:module/llm-analysis', async (req, res, next) => {
    const modules = { ziwei: '紫微斗數', tarot: '塔羅', fengshui: '風水', bazi2: '生辰八字2', yinyuan: '姻緣', answerbook: '解答之書' };
    const moduleName = modules[req.params.module];
    if (!moduleName) return next();
    try {
        const { result, question = '', conversationHistory = [] } = req.body || {};
        if (!result) return res.status(400).json({ success: false, error: '缺少計算結果' });

        const aiResult = await llmService.analyzeService(req.params.module, result, {
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
});

// 首頁 - 實時排盤
app.get('/', async (req, res) => {
    // 獲取時間參數（來自前端或使用伺服器時間）
    let date;
    try {
        date = parseCivilTime(req.query);
    } catch (error) {
        return res.status(getHttpErrorStatus(error)).send('排盤錯誤: ' + error.message);
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
        res.status(statusCode).send('排盤錯誤: ' + error.message);
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
        return res.status(getHttpErrorStatus(error)).send('排盤錯誤: ' + error.message);
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
        res.status(statusCode).send('排盤錯誤: ' + error.message);
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
        res.json(result);
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
app.post('/api/meihua/qigua', (req, res) => {
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
            return res.json({ success: true, data: result });
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
            return res.json({ success: true, data: result });
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
            return res.json({ success: true, data: result });
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

// 梅花易數 LLM 解卦 API
app.post('/api/meihua/llm-analysis', async (req, res) => {
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
            const questionResult = await discordWebhook.sendUserQuestion(userQuestion.trim(), null);
            if (questionResult.success) {
                console.log('Meihua question sent to Discord successfully');
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
                null,
                userQuestion.trim()
            );
            if (analysisDiscordResult.success) {
                console.log('Meihua analysis sent to Discord successfully');
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

        const questionResult = await discordWebhook.sendUserQuestion(question.trim(), null);
        let discordQuestionSent = false;
        if (questionResult.success) {
            discordQuestionSent = true;
            console.log('Meihua API question sent to Discord successfully');
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
                null,
                question.trim()
            );
            if (analysisDiscordResult.success) {
                discordAnalysisSent = true;
                console.log('Meihua API analysis sent to Discord successfully');
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
        title: "奇門遁甲術數問答 API 文檔",
        version: "1.0",
        description: "提供奇門、梅花、塔羅、風水、生辰八字2、姻緣與解答之書服務的 RESTful API",
        baseUrl: `${req.protocol}://${req.get('host')}`,
        endpoints: {
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
                    answer: "準時\\nBE ON TIME",
                    analysis: "請依問題與現況安排可執行的下一步。",
                    analysisSuccess: true
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
if (require.main === module) {
    app.listen(port, () => {
        console.log(`奇門遁甲在運行中 http://localhost:${port}`);
    });
}

module.exports = app;
