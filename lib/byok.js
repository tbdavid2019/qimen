/**
 * BYOK (Bring Your Own Key) 自備金鑰模組
 * 支援動態模型清單拉取、零知識連線轉發與請求層生命週期管理
 */

const axios = require('axios');
const LLMAnalysisService = require('./llm-analysis');

// 供應商預設模型（使用者留空時使用，防止污染伺服器環境變數 LLM_MODEL）
const PROVIDER_DEFAULT_MODELS = {
    'openai': 'gpt-4o-mini',
    'groq': 'llama-3.3-70b-versatile',
    'gemini': 'gemini-2.0-flash',
    'xai': 'grok-2',
    'anthropic': 'claude-3-5-haiku-20241022',
    'custom': 'default',
    'ollama': 'default',
    'qwen': 'qwen-max'
};

/**
 * 嚴格 SSRF 網址防護驗證器
 * 阻擋私有網段、localhost、內網保留位址、IPv6 環回與雲端元數據服務
 */
function validateBaseURL(rawUrl) {
    if (!rawUrl || !String(rawUrl).trim()) return null;
    let parsed;
    try {
        parsed = new URL(String(rawUrl).trim());
    } catch {
        throw new Error('自訂端點網址格式不正確');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('端點網址協議僅支援 http 或 https');
    }

    // 正規化 hostname: 移除 IPv6 中括號與 FQDN 結尾點
    let hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');

    // 展開 IPv4-mapped IPv6 位址 (例如 ::ffff:7f00:1 -> 127.0.0.1)
    if (hostname.startsWith('::ffff:')) {
        const hex = hostname.slice(7);
        const parts = hex.split(':');
        if (parts.length === 2) {
            const high = parseInt(parts[0], 16);
            const low = parseInt(parts[1], 16);
            if (!isNaN(high) && !isNaN(low)) {
                hostname = `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`;
            }
        }
    }

    // 阻擋 localhost、環回位址及十進位 IP
    if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname === '::' ||
        hostname.startsWith('127.') ||
        hostname.includes('127.0.0.1')
    ) {
        throw new Error('禁止將端點指向本地主機 (localhost / 127.0.0.1)');
    }

    // 阻擋私有保留 IP 範圍與雲端 metadata IP (IPv4 + IPv6)
    if (
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('169.254.') || // link-local metadata (AWS/GCP/Azure)
        hostname === 'metadata.google.internal' ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
        hostname.startsWith('fc') || // IPv6 Unique Local Address (fc00::/7)
        hostname.startsWith('fd') ||
        hostname.startsWith('fe80') // IPv6 Link-Local (fe80::/10)
    ) {
        throw new Error('禁止將端點指向私有或保留內部網路位址');
    }

    // 阻擋十進位整數 IP
    if (/^\d+$/.test(hostname)) {
        throw new Error('禁止使用純數字 IP 位址格式');
    }

    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
}

/**
 * 依據使用者傳入的 BYOK 憑證動態拉取可用模型清單
 */
async function fetchProviderModels({ provider, apiKey, baseURL }) {
    const trimmedKey = (apiKey || '').trim();
    if (!trimmedKey) {
        throw new Error('請提供 API Key');
    }

    const providerKey = (provider || '').trim().toLowerCase();
    const safeBaseURL = validateBaseURL(baseURL);
    let url = '';
    const headers = {};

    switch (providerKey) {
        case 'openai':
            url = `${(safeBaseURL || 'https://api.openai.com/v1')}/models`;
            headers['Authorization'] = `Bearer ${trimmedKey}`;
            break;
        case 'groq':
            url = `${(safeBaseURL || 'https://api.groq.com/openai/v1')}/models`;
            headers['Authorization'] = `Bearer ${trimmedKey}`;
            break;
        case 'xai':
            url = `${(safeBaseURL || 'https://api.x.ai/v1')}/models`;
            headers['Authorization'] = `Bearer ${trimmedKey}`;
            break;
        case 'gemini':
            url = 'https://generativelanguage.googleapis.com/v1beta/models';
            headers['x-goog-api-key'] = trimmedKey;
            break;
        case 'anthropic':
            url = `${(safeBaseURL || 'https://api.anthropic.com/v1')}/models`;
            headers['x-api-key'] = trimmedKey;
            headers['anthropic-version'] = '2023-06-01';
            break;
        case 'custom':
        case 'ollama':
            url = `${(safeBaseURL || 'http://localhost:11434/v1')}/models`;
            headers['Authorization'] = `Bearer ${trimmedKey}`;
            break;
        default:
            throw new Error(`不支援的供應商: ${provider}`);
    }

    try {
        const response = await axios.get(url, { headers, timeout: 15000, maxRedirects: 0 });
        const data = response.data;
        let modelList = [];

        if (providerKey === 'gemini') {
            if (Array.isArray(data.models)) {
                modelList = data.models
                    .map(m => (m.name || '').replace(/^models\//, ''))
                    .filter(name => !name.includes('embedding') && !name.includes('aqa'));
            }
        } else if (Array.isArray(data.data)) {
            modelList = data.data.map(m => m.id).filter(Boolean);
        } else if (Array.isArray(data.models)) {
            modelList = data.models.map(m => m.id || m.name).filter(Boolean);
        }

        const uniqueModels = [...new Set(modelList)].sort();
        return uniqueModels;
    } catch (err) {
        const errorMsg = err.response?.data?.error?.message
            || err.response?.data?.message
            || err.message;
        throw new Error(`取得模型清單失敗 (${err.response?.status || 'Network Error'}): ${errorMsg}`);
    }
}

/**
 * 從請求中解析 BYOK 設定，若有則建立單次運算之 LLM 實例
 * 實施嚴格無痕轉發規範：完整提取各項參數後立即從 req.body 刪除敏感欄位，避免流入 Webhook 與日誌
 */
function resolveLlmService(req, defaultService) {
    if (!req) return defaultService;

    // 順序修正：先完整解析 Header 與 Body 欄位
    const bodyByok = req.body?.byok || {};
    const byokKey = (req.headers?.['x-byok-key'] || bodyByok.apiKey || '').trim();

    const byokProvider = (req.headers?.['x-byok-provider'] || bodyByok.provider || 'openai').trim().toLowerCase();
    const rawModel = (req.headers?.['x-byok-model'] || bodyByok.model || '').trim();
    const rawBaseURL = (req.headers?.['x-byok-baseurl'] || bodyByok.baseURL || '').trim();

    // 無痕轉發防護：從 req.body 刪除敏感 byok 物件，防止後續 Discord 紀錄或錯誤傾印捕捉
    if (req.body && req.body.byok) {
        delete req.body.byok;
    }

    if (!byokKey) {
        return defaultService;
    }

    const safeBaseURL = validateBaseURL(rawBaseURL);
    // 未指定模型時使用該供應商之獨立預設模型，不污染伺服器環境變數
    const chosenModel = rawModel || PROVIDER_DEFAULT_MODELS[byokProvider] || 'gpt-4o-mini';

    return new LLMAnalysisService({
        provider: byokProvider,
        apiKey: byokKey,
        model: chosenModel,
        models: [chosenModel],
        baseURL: safeBaseURL || undefined
    });
}

// 記憶體輕量級 Rate Limiter：防止公開 BYOK 端點被惡意輪詢或充當開放代理
const byokRateLimitMap = new Map();
function byokRateLimiter(req, res, next) {
    const ip = req.headers['cf-connecting-ip'] ||
               req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 20;

    let record = byokRateLimitMap.get(ip);
    if (!record || (now - record.resetTime) > windowMs) {
        record = { count: 1, resetTime: now };
        byokRateLimitMap.set(ip, record);
    } else {
        record.count++;
        if (record.count > maxRequests) {
            return res.status(429).json({
                success: false,
                error: '請求過於頻繁，請於一分鐘後再試 (Too Many Requests)'
            });
        }
    }

    if (byokRateLimitMap.size > 2000) {
        for (const [key, value] of byokRateLimitMap.entries()) {
            if (now - value.resetTime > windowMs) {
                byokRateLimitMap.delete(key);
            }
        }
    }

    next();
}

module.exports = {
    fetchProviderModels,
    resolveLlmService,
    validateBaseURL,
    PROVIDER_DEFAULT_MODELS,
    byokRateLimiter
};
