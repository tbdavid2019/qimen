/**
 * Discord Webhook 工具模組
 */

const axios = require('axios');

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
            const compact = JSON.stringify({ input, result, analysis: analysis || undefined }, null, 2);
            const description = compact.length > 3900 ? `${compact.slice(0, 3897)}...` : compact;
            const response = await axios.post(this.webhookUrl, {
                username: `${moduleName}助手`,
                embeds: [{ title: `🔮 ${moduleName}完整記錄`, description: `\`\`\`json\n${description}\n\`\`\``, color: 0x8B5CF6, timestamp: new Date().toISOString() }]
            }, { timeout: 10000, headers: { 'Content-Type': 'application/json' } });
            return { success: true, status: response.status };
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
