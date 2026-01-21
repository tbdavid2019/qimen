/**
 * LLM 解盤服務
 * 將奇門遁甲數據轉換為 LLM 能理解的提示詞，並調用 LLM 進行解盤
 */

const axios = require('axios');
const meihuaText = require('./meihua-text');

class LLMAnalysisService {
    constructor(config = {}) {
        // 支援多種 LLM 服務
        this.provider = config.provider || 'openai'; // openai, anthropic, ollama, groq, 通義千問等
        this.apiKey = config.apiKey || process.env.LLM_API_KEY;
        this.baseURL = config.baseURL || this.getDefaultBaseURL();
        this.model = config.model || this.getDefaultModel();
        this.maxTokens = config.maxTokens || 9999;
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
            'groq': 'moonshotai/kimi-k2-instruct-0905',
            'qwen': 'qwen-max'
        };
        return models[this.provider] || 'gpt-4.1-mini';
    }

    /**
     * 將奇門遁甲數據格式化為 LLM 提示詞
     */
    formatQimenForLLM(qimenData, purpose = '綜合', userQuestion = '') {
        // 構建時間精度模式信息
        let timePrecisionInfo = '';
        if (qimenData.basicInfo?.timePrecisionMode === 'advanced' && qimenData.timePrecision) {
            const tp = qimenData.timePrecision;
            timePrecisionInfo = `
- 時間精度模式：進階模式（九宮拆補13分鐘法）
- 時辰細分：第${tp.segment}段/共${tp.totalSegments}段（${tp.segmentTime}）
- 段落調整：順轉${qimenData.segmentAdjustment || 0}宮
- 特殊說明：此排盤採用九宮拆補法，將時辰細分為9段，每段約${tp.segmentDuration}分鐘，提供更精確的時間分析`;
        } else {
            timePrecisionInfo = `
- 時間精度模式：傳統模式（以時辰起盤）`;
        }

        const prompt = `你是一位精通奇門遁甲(茅山派)的大師，請根據以下排盤資訊進行詳細解讀：

## 基本資訊
- 排盤時間：${qimenData.basicInfo?.date || ''} ${qimenData.basicInfo?.time || ''}
- 農曆：${qimenData.basicInfo?.lunarDate || ''}
- 四柱：${qimenData.siZhu ? `${qimenData.siZhu.year} ${qimenData.siZhu.month} ${qimenData.siZhu.day} ${qimenData.siZhu.time}` : ''}${timePrecisionInfo}
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
${qimenData.basicInfo?.timePrecisionMode === 'advanced' ? '5. 請特別說明進階模式下此時間段的特殊意義和影響' : ''}
${userQuestion ? `${qimenData.basicInfo?.timePrecisionMode === 'advanced' ? '6' : '5'}. 針對用戶問題"${userQuestion}"的專門解答` : ''}

${qimenData.basicInfo?.timePrecisionMode === 'advanced' ? 
`**進階模式特別提醒**：此排盤採用九宮拆補法，將每個時辰細分為9段，當前為第${qimenData.timePrecision?.segment || 1}段，請在分析中考慮這種精細時間劃分對吉凶判斷的影響。` : ''}

請用繁體中文回答，語言要通俗易懂，避免過於深奧的術語。分析要具體實用，給出可操作的建議。

**重要：請以純文本格式回答，不要使用任何 HTML 標籤、Markdown 格式或特殊符號。直接用文字敘述即可。**`;

        return prompt;
    }

    /**
     * 將梅花易數資料格式化為 LLM 提示詞
     */
    formatMeihuaForLLM(meihuaData, purpose = '綜合', userQuestion = '') {
        const fullYaoci = meihuaText.getYaociRaw();
        const benguaText = meihuaData.texts?.bengua;
        const huguaText = meihuaData.texts?.hugua;
        const bianguaText = meihuaData.texts?.biangua;

        const prompt = `你是一位精通梅花易數的大師，請根據以下起卦資料與卦象進行詳盡分析：

## 起卦資訊
- 起卦方式：${meihuaData.method === 'time' ? '時間起卦' : '數字起卦'}
- 西曆時間：${meihuaData.solar ? `${meihuaData.solar.year}-${String(meihuaData.solar.month).padStart(2, '0')}-${String(meihuaData.solar.day).padStart(2, '0')} ${String(meihuaData.solar.hour).padStart(2, '0')}:00` : '未提供'}
- 農曆時間：${meihuaData.lunar ? `${meihuaData.lunar.year}年${meihuaData.lunar.month}月${meihuaData.lunar.day}日` : '未提供'}
- 時辰：${meihuaData.shichen ? `${meihuaData.shichen.name} (${meihuaData.shichen.num})` : ''}

## 起卦計算過程
- 年數：${meihuaData.calculations?.yearSum ?? ''}
- 月數：${meihuaData.calculations?.month ?? ''}
- 日數：${meihuaData.calculations?.day ?? ''}
- 時辰數：${meihuaData.calculations?.shichenNum ?? ''}
- 上卦：${meihuaData.calculations?.upperSum ?? ''} mod 8 = ${meihuaData.calculations?.upperGua ?? ''}
- 下卦：${meihuaData.calculations?.lowerSum ?? ''} mod 8 = ${meihuaData.calculations?.lowerGua ?? ''}
- 動爻：${meihuaData.calculations?.lowerSum ?? ''} mod 6 = ${meihuaData.calculations?.dongYao ?? ''}

## 卦象資訊
### 本卦
- 卦名：${meihuaData.bengua?.num || ''} ${meihuaData.bengua?.name || ''}
- 上卦：${meihuaData.bengua?.upperGua?.name || ''} ${meihuaData.bengua?.upperGua?.symbol || ''}
- 下卦：${meihuaData.bengua?.lowerGua?.name || ''} ${meihuaData.bengua?.lowerGua?.symbol || ''}
- 二進位：${meihuaData.bengua?.binary || ''}
- 動爻：第${meihuaData.bengua?.dongYao || ''}爻

### 互卦
- 卦名：${meihuaData.hugua?.num || ''} ${meihuaData.hugua?.name || ''}
- 二進位：${meihuaData.hugua?.binary || ''}

### 變卦
- 卦名：${meihuaData.biangua?.num || ''} ${meihuaData.biangua?.name || ''}
- 二進位：${meihuaData.biangua?.binary || ''}

### 體用與五行
- 體卦：${meihuaData.tigua?.name || ''}（${meihuaData.tigua?.element || ''}）
- 用卦：${meihuaData.yonggua?.name || ''}（${meihuaData.yonggua?.element || ''}）
- 生克關係：${meihuaData.wuxing?.relation || ''}（${meihuaData.wuxing?.judgement || ''}）
- 斷語：${meihuaData.wuxing?.detail || ''}

## 本卦卦辭與爻辭摘要
${benguaText ? `- 卦辭：${benguaText.guaCi || ''}\n` : ''}${benguaText ? benguaText.yaoci.map((item) => `- ${item.position || `第${item.index}爻`}：${item.text || ''}（${item.plain || ''}）`).join('\n') : ''}

## 互卦卦辭摘要
${huguaText ? `- 卦辭：${huguaText.guaCi || ''}` : ''}

## 變卦卦辭摘要
${bianguaText ? `- 卦辭：${bianguaText.guaCi || ''}` : ''}

## 卦辭/爻辭全文（全部內容）
${fullYaoci}

## 分析要求
1. 整體運勢與局勢判斷
2. 體用生克的重點解讀與建議
3. 本卦、互卦、變卦的發展脈絡
4. 動爻對事件的具體影響
5. 如果問題與"${purpose}"相關，請給出具體建議
${userQuestion ? `6. 針對用戶問題「${userQuestion}」給出直接回應` : ''}

請用繁體中文回答，語氣穩定清晰，重點分明，避免空泛。`;

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
        const { purpose = '綜合', userQuestion = '', conversationHistory = [], language = 'zh-tw' } = options;
        
        try {
            const prompt = this.formatQimenForLLM(qimenData, purpose, userQuestion);
            const response = await this.callLLMWithHistory(prompt, conversationHistory);
            
            // 從回應物件中提取內容（相容舊版字串格式和新版物件格式）
            let analysisText = '';
            let finishReason = null;
            
            if (typeof response === 'string') {
                // 相容舊版：直接返回字串的情況
                analysisText = response;
            } else if (response && typeof response === 'object') {
                // 新版：返回物件 { content, finishReason }
                analysisText = response.content || '';
                finishReason = response.finishReason || null;
            }
            
            // 如果分析結果為空，視為失敗
            if (!analysisText || !analysisText.trim()) {
                console.error('LLM 返回空內容');
                return {
                    success: false,
                    error: 'AI 返回空白內容',
                    fallback: this.getFallbackAnalysis(qimenData)
                };
            }
            
            const isTruncated = finishReason === 'length';
            
            return {
                success: true,
                analysis: isTruncated 
                    ? `${analysisText}\n\n[系統提示] AI 回應達到長度上限，若想獲得更完整的內容，請再試一次或縮短問題描述。`
                    : analysisText,
                timestamp: new Date().toISOString(),
                provider: this.provider,
                model: this.model,
                finishReason: finishReason,
                truncated: isTruncated
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
     * 調用 LLM API（不帶歷史）
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

    /**
     * 調用 LLM API（帶對話歷史，支援續問）
     */
    async callLLMWithHistory(prompt, conversationHistory = [], systemMessage = null) {
        const headers = this.getHeaders();
        const payload = this.buildPayloadWithHistory(prompt, conversationHistory, systemMessage);

        const response = await axios.post(
            this.getEndpoint(),
            payload,
            { headers, timeout: 60000 }  // 續問可能需要更長時間
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

    /**
     * 構建帶對話歷史的 payload（支援續問）
     */
    buildPayloadWithHistory(prompt, conversationHistory = [], systemMessageOverride = null) {
        const basePayload = {
            max_tokens: this.maxTokens,
            temperature: this.temperature
        };

        // 系統提示詞
        const systemMessage = {
            role: 'system',
            content: systemMessageOverride || '你是一位精通奇門遁甲(茅山派)的大師。用戶會基於一個奇門盤向你提問，你需要根據盤面資訊給出專業、具體的解答。請用繁體中文回答，語言要通俗易懂。如果用戶在續問，請記住之前的對話脈絡。'
        };

        // 構建訊息陣列
        let messages = [systemMessage];
        
        // 加入對話歷史
        if (conversationHistory && conversationHistory.length > 0) {
            messages = messages.concat(conversationHistory);
        }
        
        // 加入當前用戶問題（包含盤面資訊）
        messages.push({
            role: 'user',
            content: prompt
        });

        switch (this.provider) {
            case 'openai':
            case 'ollama':
            case 'groq':
                return {
                    ...basePayload,
                    model: this.model,
                    messages: messages
                };
            case 'anthropic':
                // Anthropic 不支援 system role 在 messages 中，需要特殊處理
                return {
                    ...basePayload,
                    model: this.model,
                    system: systemMessage.content,
                    messages: messages.filter(m => m.role !== 'system')
                };
            case 'qwen':
                return {
                    ...basePayload,
                    model: this.model,
                    input: {
                        messages: messages
                    }
                };
        }
    }

    /**
     * 梅花易數解卦
     */
    async analyzeMeihua(meihuaData, options = {}) {
        const { purpose = '綜合', userQuestion = '', conversationHistory = [], language = 'zh-tw' } = options;

        try {
            const prompt = this.formatMeihuaForLLM(meihuaData, purpose, userQuestion);
            const systemMessage = '你是一位精通梅花易數的大師。用戶會基於卦象向你提問，你需要根據卦象、體用、生克關係、卦辭爻辭給出具體解答。請用繁體中文回答，語言清楚直接。';
            const response = await this.callLLMWithHistory(prompt, conversationHistory, systemMessage);

            let analysisText = '';
            let finishReason = null;

            if (typeof response === 'string') {
                analysisText = response;
            } else if (response && typeof response === 'object') {
                analysisText = response.content || '';
                finishReason = response.finishReason || null;
            }

            if (!analysisText || !analysisText.trim()) {
                return {
                    success: false,
                    error: 'AI 返回空白內容',
                    fallback: this.getMeihuaFallbackAnalysis(meihuaData)
                };
            }

            const isTruncated = finishReason === 'length';

            return {
                success: true,
                analysis: isTruncated
                    ? `${analysisText}\n\n[系統提示] AI 回應達到長度上限，若想獲得更完整的內容，請再試一次或縮短問題描述。`
                    : analysisText,
                timestamp: new Date().toISOString(),
                provider: this.provider,
                model: this.model,
                finishReason,
                truncated: isTruncated
            };
        } catch (error) {
            console.error('LLM 梅花易數分析失敗:', error);
            return {
                success: false,
                error: error.message,
                fallback: this.getMeihuaFallbackAnalysis(meihuaData)
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
        let finishReason = null;
        switch (this.provider) {
            case 'openai':
            case 'ollama':
            case 'groq':
                response = data.choices?.[0]?.message?.content || '';
                finishReason = data.choices?.[0]?.finish_reason || null;
                break;
            case 'anthropic':
                response = data.content?.[0]?.text || '';
                finishReason = data.stop_reason || null;
                break;
            case 'qwen':
                response = data.output?.text || '';
                finishReason = data.output?.finish_reason || null;
                break;
        }
        
        // 清理可能的 HTML 標籤，保持純文本格式
        return {
            content: this.cleanHtmlTags(response),
            finishReason
        };
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

    getMeihuaFallbackAnalysis(meihuaData) {
        const analysis = [];

        if (meihuaData?.bengua) {
            analysis.push(`本卦：${meihuaData.bengua.num} ${meihuaData.bengua.name}`);
        }

        if (meihuaData?.tigua && meihuaData?.yonggua) {
            analysis.push(`體卦：${meihuaData.tigua.name}，用卦：${meihuaData.yonggua.name}`);
        }

        if (meihuaData?.wuxing?.summary) {
            analysis.push(`五行生克：${meihuaData.wuxing.summary}`);
        } else if (meihuaData?.wuxingRelation) {
            analysis.push(`五行生克：${meihuaData.wuxingRelation}`);
        }

        if (meihuaData?.wuxing?.detail) {
            analysis.push(`斷語：${meihuaData.wuxing.detail}`);
        }

        if (meihuaData?.hugua?.name) {
            analysis.push(`互卦：${meihuaData.hugua.name}`);
        }

        if (meihuaData?.biangua?.name) {
            analysis.push(`變卦：${meihuaData.biangua.name}`);
        }

        return analysis.join('\n');
    }
}

module.exports = LLMAnalysisService;
