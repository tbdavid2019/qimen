/**
 * LLM 解盤服務
 * 將奇門遁甲數據轉換為 LLM 能理解的提示詞，並調用 LLM 進行解盤
 */

const axios = require('axios');

class LLMAnalysisService {
    constructor(config = {}) {
        // 支援多種 LLM 服務
        this.provider = config.provider || 'openai'; // openai, anthropic, ollama, groq, 通義千問等
        this.apiKey = config.apiKey || process.env.LLM_API_KEY;
        this.baseURL = config.baseURL || this.getDefaultBaseURL();
        this.model = config.model || this.getDefaultModel();
        this.maxTokens = config.maxTokens || 1500;
        this.temperature = config.temperature || 0.7;
    }

    getDefaultBaseURL() {
        const urls = {
            'openai': 'https://api.openai.com/v1',
            'anthropic': 'https://api.anthropic.com/v1',
            'ollama': 'http://localhost:11434/v1',
            'groq': 'https://api.groq.com/openai/v1',
            'qwen': 'https://dashscope.aliyuncs.com/api/v1'
        };
        return urls[this.provider] || 'https://api.openai.com/v1';
    }

    getDefaultModel() {
        const models = {
            'openai': 'gpt-4.1-mini',
            'anthropic': 'claude-sonnet-4@20250514',
            'ollama': 'llama-4-scout-17b-16e-instruct',
            'groq': 'meta-llama/llama-4-scout-17b-16e-instruct',
            'qwen': 'qwen-max'
        };
        return models[this.provider] || 'gpt-4.1-mini';
    }

    /**
     * 將奇門遁甲數據格式化為 LLM 提示詞
     */
    formatQimenForLLM(qimenData, purpose = '綜合', userQuestion = '') {
        const prompt = `你是一位精通奇門遁甲(茅山派)的大師，請根據以下排盤資訊進行詳細解讀：

## 基本資訊
- 排盤時間：${qimenData.basicInfo?.date || ''} ${qimenData.basicInfo?.time || ''}
- 農曆：${qimenData.basicInfo?.lunarDate || ''}
- 四柱：${qimenData.siZhu ? `${qimenData.siZhu.year} ${qimenData.siZhu.month} ${qimenData.siZhu.day} ${qimenData.siZhu.time}` : ''}
- 旬首：${qimenData.xunShou || ''}
- 局數：${qimenData.juShu?.fullName || ''}
- 值符：${qimenData.zhiFuXing || ''}（${qimenData.zhiFuGong || ''}宮）
- 值使：${qimenData.zhiShiMen || ''}（${qimenData.zhiShiGong || ''}宮）

## 九宮詳情
${this.formatJiuGongForLLM(qimenData)}

## 分析要求
1. 請提供整體運勢分析
2. 針對"${purpose}"的具體建議
3. 最有利的方位和時機
4. 需要注意的事項
${userQuestion ? `5. 針對用戶問題"${userQuestion}"的專門解答` : ''}

請用繁體中文回答，語言要通俗易懂，避免過於深奧的術語。分析要具體實用，給出可操作的建議。

**重要：請以純文本格式回答，不要使用任何 HTML 標籤、Markdown 格式或特殊符號。直接用文字敘述即可。**`;

        return prompt;
    }

    /**
     * 格式化九宮資訊
     */
    formatJiuGongForLLM(qimenData) {
        if (!qimenData.jiuGongAnalysis) return '';
        
        let gongInfo = '';
        for (let i = 1; i <= 9; i++) {
            const gong = qimenData.jiuGongAnalysis[i];
            if (gong) {
                gongInfo += `${i}宮（${gong.gongName}）：
- 方位：${gong.direction}
- 九星：${gong.xing}${gong.xingAlias ? `(${gong.xingAlias})` : ''}
- 八門：${gong.men || ''}
- 八神：${gong.shen || ''}
- 三奇六儀：${qimenData.sanQiLiuYi?.[i] || ''}
- 吉凶：${gong.jiXiongText || '平'}
${gong.explain ? `- 解釋：${gong.explain}` : ''}

`;
            }
        }
        return gongInfo;
    }

    /**
     * 調用 LLM 進行解盤
     */
    async analyzeQimen(qimenData, options = {}) {
        const { purpose = '綜合', userQuestion = '', language = 'zh-tw' } = options;
        
        try {
            const prompt = this.formatQimenForLLM(qimenData, purpose, userQuestion);
            const response = await this.callLLM(prompt);
            
            return {
                success: true,
                analysis: response,
                timestamp: new Date().toISOString(),
                provider: this.provider,
                model: this.model
            };
        } catch (error) {
            console.error('LLM 解盤失敗:', error);
            return {
                success: false,
                error: error.message,
                fallback: this.getFallbackAnalysis(qimenData)
            };
        }
    }

    /**
     * 調用 LLM API
     */
    async callLLM(prompt) {
        const headers = this.getHeaders();
        const payload = this.buildPayload(prompt);

        const response = await axios.post(
            this.getEndpoint(),
            payload,
            { headers, timeout: 30000 }
        );

        return this.extractResponse(response.data);
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        switch (this.provider) {
            case 'openai':
            case 'ollama':
            case 'groq':
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                break;
            case 'anthropic':
                headers['x-api-key'] = this.apiKey;
                headers['anthropic-version'] = '2023-06-01';
                break;
            case 'qwen':
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                break;
        }

        return headers;
    }

    buildPayload(prompt) {
        const basePayload = {
            max_tokens: this.maxTokens,
            temperature: this.temperature
        };

        switch (this.provider) {
            case 'openai':
            case 'ollama':
            case 'groq':
                return {
                    ...basePayload,
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                };
            case 'anthropic':
                return {
                    ...basePayload,
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                };
            case 'qwen':
                return {
                    ...basePayload,
                    model: this.model,
                    input: {
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ]
                    }
                };
        }
    }

    getEndpoint() {
        switch (this.provider) {
            case 'openai':
            case 'ollama':
            case 'groq':
                return `${this.baseURL}/chat/completions`;
            case 'anthropic':
                return `${this.baseURL}/messages`;
            case 'qwen':
                return `${this.baseURL}/services/aigc/text-generation/generation`;
        }
    }

    extractResponse(data) {
        let response = '';
        switch (this.provider) {
            case 'openai':
            case 'ollama':
            case 'groq':
                response = data.choices?.[0]?.message?.content || '';
                break;
            case 'anthropic':
                response = data.content?.[0]?.text || '';
                break;
            case 'qwen':
                response = data.output?.text || '';
                break;
        }
        
        // 清理可能的 HTML 標籤，保持純文本格式
        return this.cleanHtmlTags(response);
    }

    /**
     * 清理 HTML 標籤，保持純文本格式
     */
    cleanHtmlTags(text) {
        if (!text) return '';
        
        // 移除 HTML 標籤
        return text
            .replace(/<br\s*\/?>/gi, '\n')  // 將 <br> 轉換為換行
            .replace(/<[^>]*>/g, '')        // 移除所有其他 HTML 標籤
            .replace(/&nbsp;/g, ' ')        // 轉換 HTML 實體
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    }

    /**
     * 備用分析（當 LLM 不可用時）
     */
    getFallbackAnalysis(qimenData) {
        const analysis = [];
        
        // 基於值符值使的基本分析
        if (qimenData.zhiFuGong && qimenData.zhiShiGong) {
            analysis.push(`值符落${qimenData.zhiFuGong}宮，值使落${qimenData.zhiShiGong}宮。`);
        }

        // 整體吉凶
        if (qimenData.analysis?.overallJiXiongText) {
            analysis.push(`整體運勢：${qimenData.analysis.overallJiXiongText}`);
        }

        // 最佳方位
        if (qimenData.analysis?.bestGong) {
            const bestGong = qimenData.jiuGongAnalysis?.[qimenData.analysis.bestGong];
            if (bestGong) {
                analysis.push(`最有利方位：${bestGong.direction}（${bestGong.gongName}宮）`);
            }
        }

        return analysis.join('\n');
    }
}

module.exports = LLMAnalysisService;
