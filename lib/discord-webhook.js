/**
 * Discord Webhook 工具模組
 */

const axios = require('axios');
const FormData = require('form-data');

const INPUT_LABELS = {
    mode: '模式',
    spread: '牌陣',
    seed: '抽牌種子',
    facing: '房屋朝向',
    moveInYear: '入住／建造年份',
    residentYear: '居住者出生年',
    sex: '性別',
    year: '分析流年',
    date: '出生日期',
    time: '出生時間',
    calendar: '曆法',
    name: '姓名',
    formerName: '曾用名',
    place: '出生地點',
    firstYear: '第一位出生年',
    secondYear: '第二位出生年',
    status: '感情狀態',
    lang: '語言'
};

function clipText(value, limit = 1024) {
    const text = String(value ?? '').trim() || '（未提供）';
    return text.length <= limit ? text : `${text.slice(0, Math.max(1, limit - 1))}…`;
}

function humanizeValue(value, depth = 0) {
    if (value === null || value === undefined || value === '') return '（未提供）';
    if (typeof value === 'boolean') return value ? '是' : '否';
    if (typeof value !== 'object') return String(value);
    if (depth >= 2) return Array.isArray(value) ? `（${value.length} 項）` : '（結構化資料）';
    if (Array.isArray(value)) return value.slice(0, 8).map((item) => humanizeValue(item, depth + 1)).join('、') || '（空）';
    return Object.entries(value).slice(0, 6).map(([key, item]) => `${INPUT_LABELS[key] || key}：${humanizeValue(item, depth + 1)}`).join('；') || '（空）';
}

function formatInputSummary(input = {}) {
    const lines = Object.entries(input)
        .filter(([key, value]) => key !== 'question' && key !== 'conversationHistory' && value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${INPUT_LABELS[key] || key}：${humanizeValue(value)}`);
    if (Array.isArray(input.conversationHistory) && input.conversationHistory.length) {
        lines.push(`對話歷史：${input.conversationHistory.length} 則`);
    }
    return clipText(lines.join('\n') || '（無其他參數）');
}

function formatResultSummary(moduleName, result = {}) {
    if (!result || typeof result !== 'object') return clipText(result);

    if (moduleName === '塔羅' && Array.isArray(result.cards)) {
        return clipText([
            result.spreadName ? `牌陣：${result.spreadName}` : '',
            ...result.cards.map((card) => `${card.position || '牌位'}：${card.name || '未命名'}（${card.orientation || '未標示'}）`)
        ].filter(Boolean).join('\n'));
    }

    if (moduleName === '風水') {
        const resident = result.resident || {};
        const mansion = result.eightMansions || {};
        const stars = result.flyingStars || {};
        return clipText([
            result.facing ? `朝向：${result.facing}` : '',
            mansion.house ? `宅向：${mansion.house}` : '',
            resident.mingGua?.name ? `居住者命卦：${resident.mingGua.name}` : '',
            stars.year ? `流年：${stars.year}` : '',
            result.period ? `運：第${result.period}運` : ''
        ].filter(Boolean).join('\n'));
    }

    if (moduleName === '生辰八字2') {
        const pillars = Array.isArray(result.fourPillars) ? result.fourPillars : [];
        const counts = result.fiveElements?.counts;
        return clipText([
            pillars.length ? `四柱：${pillars.map((pillar) => `${pillar.label}${pillar.value}`).join('、')}` : '',
            result.dayMaster ? `日主：${result.dayMaster.stem || ''}${result.dayMaster.element || ''}` : '',
            counts ? `五行：${Object.entries(counts).map(([key, value]) => `${key}${value}`).join('、')}` : '',
            Array.isArray(result.luckCycles) && result.luckCycles.length ? `大運：${result.luckCycles.slice(0, 3).map((cycle) => cycle.ganzhi).join('、')}` : ''
        ].filter(Boolean).join('\n'));
    }

    if (moduleName === '姻緣') {
        return clipText([
            result.mode ? `模式：${result.mode}` : '',
            result.title ? `籤等：${result.title}` : '',
            result.poem ? `籤詩：${result.poem}` : '',
            result.relationship ? `關係：${result.relationship}` : '',
            result.score !== undefined ? `分數：${result.score}` : '',
            result.favorableDirection ? `桃花方位：${result.favorableDirection}` : '',
            result.summary ? `摘要：${result.summary}` : ''
        ].filter(Boolean).join('\n'));
    }

    if (moduleName === '解答之書') {
        return clipText([
            result.mode ? `模式：${result.mode}` : '',
            result.answer ? `答案：${result.answer}` : ''
        ].filter(Boolean).join('\n'));
    }

    return clipText(Object.entries(result).slice(0, 8).map(([key, value]) => `${key}：${humanizeValue(value)}`).join('\n'));
}

function buildDivinationRecordPayload(moduleName, input = {}, result = null, analysis = '', timestamp = new Date()) {
    const recordedAt = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
    const record = {
        module: moduleName,
        recordedAt,
        input: input || {},
        result: result ?? null,
        analysis: analysis || null
    };
    const json = JSON.stringify(record, null, 2);
    const filename = `divination-record-${recordedAt.replace(/[^0-9]/g, '').slice(0, 14)}.json`;
    const question = input?.question || input?.userQuestion || result?.question || '（直接默念／未提供問題）';
    const payload = {
        username: `${moduleName}助手`,
        allowed_mentions: { parse: [] },
        embeds: [{
            title: `🔮 ${moduleName}｜完整紀錄`,
            description: '以下先顯示易讀摘要；完整原始資料已附加為 JSON 檔案。',
            color: 0x8B5CF6,
            timestamp: recordedAt,
            fields: [
                { name: '❓ 使用者問題', value: clipText(question), inline: false },
                { name: '🧾 請求參數', value: formatInputSummary(input), inline: false },
                { name: '📊 計算摘要', value: formatResultSummary(moduleName, result), inline: false },
                { name: '🤖 AI 解讀', value: clipText(analysis || '（未產生 AI 解讀）'), inline: false }
            ],
            footer: { text: `完整資料附件：${filename}` }
        }]
    };
    return { payload, record, json, filename };
}

class DiscordWebhook {
    constructor(webhookUrl = null) {
        this.webhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
        this.enabled = !!this.webhookUrl;
    }

    /**
     * 檢查 Discord webhook 是否已配置
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * 發送用戶問題到 Discord
     */
    async sendUserQuestion(question, qimenData = null) {
        if (!this.enabled) {
            return { success: false, reason: 'Discord webhook not configured' };
        }

        try {
            const embed = {
                title: "📝 用戶問題",
                description: question,
                color: 0x5865F2, // Discord 藍色
                timestamp: new Date().toISOString(),
                fields: []
            };

            // 如果有奇門盤數據，添加基本信息
            if (qimenData && qimenData.basicInfo) {
                embed.fields.push({
                    name: "📅 排盤時間",
                    value: `${qimenData.basicInfo.date || ''} ${qimenData.basicInfo.time || ''}`,
                    inline: true
                });

                if (qimenData.basicInfo.lunarDate) {
                    embed.fields.push({
                        name: "🗓️ 農曆",
                        value: qimenData.basicInfo.lunarDate,
                        inline: true
                    });
                }

                if (qimenData.basicInfo.timePrecisionMode) {
                    embed.fields.push({
                        name: "⚙️ 模式",
                        value: qimenData.basicInfo.timePrecisionMode === 'advanced' ? '進階模式' : '傳統模式',
                        inline: true
                    });
                }
            }

            const payload = {
                username: "奇門遁甲助手",
                avatar_url: "https://cdn.discordapp.com/emojis/1234567890123456789.png", // 可以自定義頭像
                embeds: [embed]
            };

            const response = await axios.post(this.webhookUrl, payload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return { 
                success: true, 
                message: 'User question sent to Discord successfully',
                status: response.status 
            };

        } catch (error) {
            console.error('Discord webhook error (user question):', error.message);
            return { 
                success: false, 
                error: error.message,
                reason: 'Failed to send to Discord' 
            };
        }
    }

    /**
     * 發送 LLM 解盤結果到 Discord
     */
    async sendLLMAnalysis(analysis, qimenData = null, userQuestion = '') {
        if (!this.enabled) {
            return { success: false, reason: 'Discord webhook not configured' };
        }

        try {
            // 截取分析內容，Discord embed 有字符限制
            let shortAnalysis = analysis;
            if (analysis.length > 1000) {
                shortAnalysis = analysis.substring(0, 997) + '...';
            }

            const embed = {
                title: userQuestion ? "🤖 AI 問答解答" : "🔮 AI 解盤結果",
                description: shortAnalysis,
                color: 0xFFD700, // 金色
                timestamp: new Date().toISOString(),
                fields: []
            };

            // 如果是針對用戶問題的回答
            if (userQuestion) {
                embed.fields.push({
                    name: "❓ 用戶問題",
                    value: userQuestion.length > 100 ? userQuestion.substring(0, 97) + '...' : userQuestion,
                    inline: false
                });
            }

            // 如果有奇門盤數據，添加基本信息
            if (qimenData && qimenData.basicInfo) {
                embed.fields.push({
                    name: "📅 排盤時間",
                    value: `${qimenData.basicInfo.date || ''} ${qimenData.basicInfo.time || ''}`,
                    inline: true
                });

                if (qimenData.basicInfo.lunarDate) {
                    embed.fields.push({
                        name: "🗓️ 農曆",
                        value: qimenData.basicInfo.lunarDate,
                        inline: true
                    });
                }
            }

            const payload = {
                username: "奇門遁甲 AI 大師",
                avatar_url: "https://cdn.discordapp.com/emojis/1234567890123456789.png", // 可以自定義頭像
                embeds: [embed]
            };

            const response = await axios.post(this.webhookUrl, payload, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return { 
                success: true, 
                message: 'LLM analysis sent to Discord successfully',
                status: response.status 
            };

        } catch (error) {
            console.error('Discord webhook error (LLM analysis):', error.message);
            return { 
                success: false, 
                error: error.message,
                reason: 'Failed to send to Discord' 
            };
        }
    }

    /** Send a complete structured record for a non-Qimen divination module. */
    async sendDivinationRecord(moduleName, input, result, analysis = '') {
        if (!this.enabled) return { success: false, reason: 'Discord webhook not configured' };
        try {
            const built = buildDivinationRecordPayload(moduleName, input, result, analysis);
            const form = new FormData();
            form.append('payload_json', JSON.stringify(built.payload));
            form.append('files[0]', Buffer.from(built.json, 'utf8'), {
                filename: built.filename,
                contentType: 'application/json'
            });
            const response = await axios.post(this.webhookUrl, form, {
                timeout: 10000,
                headers: form.getHeaders(),
                maxBodyLength: 25 * 1024 * 1024,
                maxContentLength: 25 * 1024 * 1024
            });
            return { success: true, status: response.status, attachment: built.filename };
        } catch (error) {
            console.error(`Discord webhook error (${moduleName}):`, error.message);
            return { success: false, error: error.message, reason: 'Failed to send to Discord' };
        }
    }

    /**
     * 發送測試消息到 Discord
     */
    async sendTestMessage() {
        if (!this.enabled) {
            return { success: false, reason: 'Discord webhook not configured' };
        }

        try {
            const embed = {
                title: "✅ Discord Webhook 測試",
                description: "奇門遁甲系統 Discord webhook 配置成功！",
                color: 0x00FF00, // 綠色
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: "🔗 系統狀態",
                        value: "正常運行",
                        inline: true
                    },
                    {
                        name: "📋 功能",
                        value: "用戶問題和 AI 解盤結果將會發送到此頻道",
                        inline: false
                    }
                ]
            };

            const payload = {
                username: "奇門遁甲系統",
                embeds: [embed]
            };

            const response = await axios.post(this.webhookUrl, payload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return { 
                success: true, 
                message: 'Test message sent to Discord successfully',
                status: response.status 
            };

        } catch (error) {
            console.error('Discord webhook test error:', error.message);
            return { 
                success: false, 
                error: error.message,
                reason: 'Failed to send test message to Discord' 
            };
        }
    }
}

module.exports = DiscordWebhook;
module.exports.buildDivinationRecordPayload = buildDivinationRecordPayload;
