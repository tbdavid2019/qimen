/**
 * LLM 解盤服務
 * 將奇門遁甲數據轉換為 LLM 能理解的提示詞，並調用 LLM 進行解盤
 */

const axios = require('axios');
const meihuaText = require('./meihua-text');

const SERVICE_PROFILES = {
    tarot: {
        name: '塔羅',
        role: '塔羅心靈顧問',
        focus: '牌陣位置、正逆位、牌間關係與當下可行動的心理指引'
    },
    fengshui: {
        name: '風水',
        role: '堪輿風水顧問',
        focus: '八宅九星、九運流年、採光通風、動線與居住安全'
    },
    bazi2: {
        name: '生辰八字2',
        role: '子平命理顧問',
        focus: '四柱五行、十神、藏干、大運與流年趨勢'
    },
    yinyuan: {
        name: '姻緣',
        role: '情感關係顧問',
        focus: '生肖或命盤互動、籤詩象徵與可實踐的溝通建議'
    },
    answerbook: {
        name: '解答之書',
        role: '解答之書解讀顧問',
        focus: '原始答案的語意、象徵與對使用者問題的具體行動建議'
    }
};

class LLMAnalysisService {
    constructor(config = {}) {
        // 支援多種 LLM 服務
        this.provider = config.provider || 'openai'; // openai, anthropic, ollama, groq, 通義千問等
        this.apiKey = config.apiKey || process.env.LLM_API_KEY;
        this.baseURL = config.baseURL || this.getDefaultBaseURL();
        this.models = this.getConfiguredModels(config);
        this.model = this.models[0];
        this.maxTokens = config.maxTokens || 9999;
        this.temperature = config.temperature || 0.7;
    }

    /**
     * 取得模型 fallback 順序。
     *
     * 程式傳入的 models/model 優先，並保留環境變數的單模型設定相容性。
     * LLM_FALLBACK_MODELS 可用來在不改動主要模型時追加備援模型。
     */
    getConfiguredModels(config = {}) {
        const configuredModels = config.models
            || config.model
            || process.env.LLM_MODELS
            || [process.env.LLM_MODEL, process.env.LLM_FALLBACK_MODELS]
                .filter(Boolean)
                .join(',');

        const models = this.parseModels(configuredModels);
        return models.length > 0 ? models : [this.getDefaultModel()];
    }

    parseModels(models) {
        const values = Array.isArray(models) ? models : String(models || '').split(/[\n,]/);
        return [...new Set(values.map((model) => String(model).trim()).filter(Boolean))];
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
     * 將奇門遁甲數據格式化為 LLM 提示詞（融入正統用神定位與主客動靜體系）
     */
    formatQimenForLLM(qimenData, purpose = '綜合', userQuestion = '') {
        let timePrecisionInfo = '';
        if (qimenData.basicInfo?.timePrecisionMode === 'advanced' && qimenData.timePrecision) {
            const tp = qimenData.timePrecision;
            timePrecisionInfo = `
- 時間精度模式：進階九宮拆補13分鐘法（第${tp.segment}段/共${tp.totalSegments}段，順轉${qimenData.segmentAdjustment || 0}宮）`;
        }

        let gejuSummary = '';
        if (qimenData.geju && qimenData.geju.allPatterns && qimenData.geju.allPatterns.length > 0) {
            const patternsText = qimenData.geju.allPatterns.map(p => `- 【第${p.gong}宮】${p.name}（${p.type}）：${p.desc}`).join('\n');
            gejuSummary = `\n## ⚡ 計算所得十干克應與特殊格局\n${patternsText}\n`;
        }

        let yongshenSummary = '';
        if (qimenData.yongshen) {
            const ys = qimenData.yongshen;
            yongshenSummary = `\n## 🎯 專題用神鎖定與主客動靜 (對齊 FANzR-arch 規範)\n- 事項類別：【${ys.category || purpose}】\n- 主用神：【${ys.mainYongshen}】（落【第${ys.targetGong}宮】）\n- 輔助用神：【${ys.secondaryYongshen}】\n- 主客動靜利弊：${ys.hostGuestDynamic}\n`;
        }

        const prompt = `你是一位精通奇門遁甲的國學堪輿宗師。請依據以下排盤數據與「用神取用規則」進行深度的專業解盤：

## 🧭 排盤基本資訊
- 占問時間：${qimenData.basicInfo?.date || ''} ${qimenData.basicInfo?.time || ''}（農曆：${qimenData.basicInfo?.lunarDate || ''}）
- 四柱干支：${qimenData.siZhu ? `${qimenData.siZhu.year} ${qimenData.siZhu.month} ${qimenData.siZhu.day} ${qimenData.siZhu.time}` : ''}${timePrecisionInfo}
- 局數立極：${qimenData.juShu?.fullName || ''}（旬首：${qimenData.xunShou || ''}）
- 直符天星：${qimenData.zhiFuXing || ''}（落【${qimenData.zhiFuGong || ''}】宮）
- 直使人門：${qimenData.zhiShiMen || ''}（落【${qimenData.zhiShiGong || ''}】宮）
${yongshenSummary}
## 🏛️ 九宮全局分佈
${this.formatJiuGongForLLM(qimenData)}
${gejuSummary}
## 🎯 求測事項與問題
- 占問類別：【${purpose}】
- 具體提問：【${userQuestion || '請全面剖析當前局象、用神落宮、主客關係與吉凶決策建議'}】

## 📜 宗師解盤結構要求
請嚴格使用繁體中文、以結構清晰的 Markdown 格式進行詳盡剖析：
1. **【主用神鎖定與落宮剖析】**：
   - 根據事項類型鎖定主用神（如求財看生門與甲子戊、工作看開門與值符、感情看乙庚六合、考試看景門天輔等）。
   - 分析用神落宮之五行旺衰、是否空亡、入墓、擊刑或得奇得使。
2. **【星·門·神·儀與十干克應格局】**：
   - 解析主用神宮與日干、時干落宮的天盤三奇六儀、地盤奇儀、八門吉凶、九星得令、八神庇護及形成的經典吉凶格局。
3. **【主客動靜與利弊辨析】**：
   - 辨析當前局勢「利主（宜靜守等待）」還是「利客（宜主動作為）」；誰掌握局勢主導權。
4. **【吉方時機與破局策略】**：
   - 指明全盤最佳生氣方位、避忌凶方（如五黃、死門、刑衝方位），以及具體的應期節點。
5. **【大師決策錦囊】**：
   - 給出 2~3 項具體可落地的現實行動建議，理性客觀，強調事在人為。`;

        return prompt;
    }

    /**
     * 將梅花易數資料格式化為 LLM 提示詞（五卦全息、動爻爻辭、四季旺衰與應期）
     */
    formatMeihuaForLLM(meihuaData, purpose = '綜合', userQuestion = '') {
        const dongYaoInfo = meihuaData.bengua?.dongYaoInfo;
        const timing = meihuaData.timing;

        const prompt = `你是一位精通邵雍《梅花易數》與《易經》象數理占的易學大師。請依據以下起卦數據進行「本、互、變、錯、綜」五卦全息解讀：

## 🔮 起卦資訊
- 起卦方式：${meihuaData.method === 'time' ? '時間起卦' : meihuaData.method === 'text' ? `漢字報字起卦（「${meihuaData.text}」）` : '數字起卦'}
- 農曆時間：${meihuaData.lunar ? `${meihuaData.lunar.year}年${meihuaData.lunar.month}月${meihuaData.lunar.day}日 ${meihuaData.shichen?.name || ''}時` : '未提供'}

## ☯️ 五卦全息盤面
1. **本卦（現狀基礎）**：第 ${meihuaData.bengua?.num} 卦【${meihuaData.bengua?.name} ${meihuaData.bengua?.symbol || ''}】（上${meihuaData.bengua?.upperGua?.name}下${meihuaData.bengua?.lowerGua?.name}）
   - **動爻**：第【${meihuaData.bengua?.dongYao}】爻生變
   - **動爻爻辭**：${dongYaoInfo ? `「${dongYaoInfo.text}」—— 白話：${dongYaoInfo.vernacular}` : ''}
2. **互卦（過程演變）**：第 ${meihuaData.hugua?.num} 卦【${meihuaData.hugua?.name} ${meihuaData.hugua?.symbol || ''}】
3. **變卦（最終趨勢）**：第 ${meihuaData.biangua?.num} 卦【${meihuaData.biangua?.name} ${meihuaData.biangua?.symbol || ''}】
4. **錯卦（對立盲點/危機）**：第 ${meihuaData.cuogua?.num} 卦【${meihuaData.cuogua?.name} ${meihuaData.cuogua?.symbol || ''}】
5. **綜卦（換位思考/顛倒視角）**：第 ${meihuaData.zonggua?.num} 卦【${meihuaData.zonggua?.name} ${meihuaData.zonggua?.symbol || ''}】

## ⚖️ 體用五行與四季得時
- **體卦（自身）**：${meihuaData.tigua?.name}（屬${meihuaData.tigua?.element} · 象${meihuaData.tigua?.nature}）
- **用卦（事態/對方）**：${meihuaData.yonggua?.name}（屬${meihuaData.yonggua?.element} · 象${meihuaData.yonggua?.nature}）
- **體用生剋**：${meihuaData.wuxing?.relation}（判定：${meihuaData.wuxing?.judgement}）
- **四季旺衰**：${meihuaData.wuxing?.tiStatus || ''}，${meihuaData.wuxing?.yongStatus || ''}
- **生剋斷語**：${meihuaData.wuxing?.detail || ''}

## 🎯 求測事項與提問
- 分析目的：【${purpose}】
- 使用者問題：【${userQuestion || '請進行全盤卦象象意剖析、體用生剋、吉凶應期與行動指引'}】

## 📜 大師解卦結構要求
請使用繁體中文、以結構分明的 Markdown 格式開示：
1. **【卦象象意與核心意境】**：解析本卦卦名、卦德與當前處境，結合互卦說明事情中間發展過程，以變卦點出最終走向。
2. **【體用生剋與四季旺相評定】**：剖析自身（體卦）實力是否得令，外在（用卦）是生助、耗洩還是克制，推演事情阻力與助力。
3. **【動爻爻辭之微言大義】**：重點解讀動爻爻辭對目前關鍵節點的警示或轉機。
4. **【錯綜透鏡：盲點與逆向思考】**：透過錯卦揭示容易忽略的反向危機，透過綜卦站在對立面或長遠視角審視。
5. **【應期推斷與行動方針】**：參考先天八卦數（${timing?.timingDesc || ''}），指明關鍵應驗時機與本週具體應對策略。`;

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
                model: response.model || this.model,
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
        return this.callWithModelFallback((model) => {
            const headers = this.getHeaders();
            const payload = this.buildPayload(prompt, model);

            return axios.post(
                this.getEndpoint(),
                payload,
                { headers, timeout: 30000 }
            ).then((response) => this.extractResponse(response.data));
        });
    }

    /**
     * 調用 LLM API（帶對話歷史，支援續問）
     */
    async callLLMWithHistory(prompt, conversationHistory = [], systemMessage = null) {
        return this.callWithModelFallback((model) => {
            const headers = this.getHeaders();
            const payload = this.buildPayloadWithHistory(prompt, conversationHistory, systemMessage, model);

            return axios.post(
                this.getEndpoint(),
                payload,
                { headers, timeout: 60000 }  // 續問可能需要更長時間
            ).then((response) => this.extractResponse(response.data));
        });
    }

    /**
     * 依序嘗試模型。所有模型都失敗時，將最後一次錯誤交給上層處理，
     * 由 analyzeQimen/analyzeMeihua 使用既有的本地備用分析。
     */
    async callWithModelFallback(operation) {
        let lastError;

        for (const model of this.models) {
            try {
                const response = await operation(model);
                const content = typeof response === 'string' ? response : response?.content;

                if (!content || !content.trim()) {
                    throw new Error(`模型 ${model} 回傳空白內容`);
                }

                this.model = model;
                return typeof response === 'object'
                    ? { ...response, model }
                    : { content: response, model };
            } catch (error) {
                lastError = error;
                console.warn(`LLM 模型 ${model} 呼叫失敗，嘗試下一個模型:`, error.message);
            }
        }

        throw lastError || new Error('沒有可用的 LLM 模型');
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

    buildPayload(prompt, model = this.model) {
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
                    model,
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
                    model,
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
                    model,
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
    buildPayloadWithHistory(prompt, conversationHistory = [], systemMessageOverride = null, model = this.model) {
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
                    model,
                    messages: messages
                };
            case 'anthropic':
                // Anthropic 不支援 system role 在 messages 中，需要特殊處理
                return {
                    ...basePayload,
                    model,
                    system: systemMessage.content,
                    messages: messages.filter(m => m.role !== 'system')
                };
            case 'qwen':
                return {
                    ...basePayload,
                    model,
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
                model: response.model || this.model,
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

    /**
     * 分析塔羅、風水、生辰八字與姻緣等專題服務。
     */
    async analyzeService(serviceKey, data, options = {}) {
        const profile = SERVICE_PROFILES[serviceKey];
        if (!profile) {
            return { success: false, error: `不支援的服務：${serviceKey}`, fallback: '' };
        }

        const {
            purpose = '綜合',
            userQuestion = '',
            conversationHistory = [],
            language = 'zh-tw'
        } = options;

        const { prompt, systemMessage } = this.formatServiceForLLM(serviceKey, data, purpose, userQuestion, language);

        try {
            const response = await this.callLLMWithHistory(prompt, conversationHistory, systemMessage);
            const analysisText = typeof response === 'string' ? response : response?.content || '';
            const finishReason = typeof response === 'object' ? response.finishReason || null : null;
            if (!analysisText || !analysisText.trim()) {
                return { success: false, error: 'AI 返回空白內容', fallback: this.getServiceFallback(serviceKey, data) };
            }

            const truncated = finishReason === 'length';
            return {
                success: true,
                analysis: truncated
                    ? `${analysisText}\n\n[系統提示] AI 回應達到長度上限，若想獲得更完整的內容，請再試一次或縮短問題描述。`
                    : analysisText,
                timestamp: new Date().toISOString(),
                provider: this.provider,
                model: response?.model || this.model,
                finishReason,
                truncated
            };
        } catch (error) {
            console.error(`${profile.name} LLM 分析失敗:`, error.message);
            return {
                success: false,
                error: error.message,
                fallback: this.getServiceFallback(serviceKey, data)
            };
        }
    }

    async analyzeTarot(data, options = {}) {
        return this.analyzeService('tarot', data, options);
    }

    async analyzeFengShui(data, options = {}) {
        return this.analyzeService('fengshui', data, options);
    }

    async analyzeBazi2(data, options = {}) {
        return this.analyzeService('bazi2', data, options);
    }

    async analyzeYinyuan(data, options = {}) {
        return this.analyzeService('yinyuan', data, options);
    }

    async analyzeAnswerbook(data, options = {}) {
        return this.analyzeService('answerbook', data, options);
    }

    formatServiceForLLM(serviceKey, data, purpose = '綜合', userQuestion = '', language = 'zh-tw') {
        const profile = SERVICE_PROFILES[serviceKey];
        if (!profile) throw new Error(`不支援的服務：${serviceKey}`);

        if (serviceKey === 'yinyuan') {
            return this.formatYinyuanPrompt(data, userQuestion);
        }
        if (serviceKey === 'bazi2') {
            return this.formatBazi2Prompt(data, userQuestion);
        }
        if (serviceKey === 'fengshui') {
            return this.formatFengShuiPrompt(data, userQuestion);
        }
        if (serviceKey === 'tarot') {
            return this.formatTarotPrompt(data, userQuestion);
        }

        const systemMessage = `你是一位${profile.role}。請以繁體中文專業、清晰、富有智慧地解讀以下數據，給出具體可行的建議。`;
        const prompt = `分析目的：${purpose}\n使用者提問：${userQuestion || '請提供整體解讀與指引'}\n\n計算數據：\n${JSON.stringify(data, null, 2)}`;
        return { prompt, systemMessage };
    }

    formatYinyuanPrompt(data, userQuestion = '') {
        const systemMessage = `你是一位精通中華傳統命理與情感心理學的姻緣大師，人稱「賽博月老」。你融合八字合婚、紫微斗數夫妻宮、生肖五行合沖、月老靈籤與紅線測算等術數。
你的解讀風格：
1. 溫暖通透、幽默風趣、引經據典，既有傳統文化底蘊，又具備現代情感溝通智慧。
2. 核心原則：娛樂為主，理性參考。不說宿命斷語，不製造焦慮恐慌，把凶象化為「需要注意的磨合點」與「具體經營錦囊」。
3. 全文結構清晰，使用 Markdown 格式排版，多用精美表情與條列式指引。
4. 結尾必須附上月老專屬叮嚀（「姻緣天注定，幸福自己爭」）。`;

        const prompt = `🏮 賽博月老姻緣測算請求：

使用者想請教的問題：【${userQuestion || '請為我進行全盤深度姻緣解析與行動指引'}】

【系統計算之姻緣測算數據】
${JSON.stringify(data, null, 2)}

請月老根據上述結構化數據，為善男信女進行詳盡開示：
1. 【籤詩/格局意境品讀】（深入解構籤詩、生肖合沖、夫妻宮主星或八字合婚之象徵意義）
2. 【核心特質與相處默契】（剖析雙方吸引力來源、正緣特徵或命盤情感格局）
3. 【潛在挑戰與通關錦囊】（點出可能面臨的摩擦與具體、可落地的溝通化解方案）
4. 【時機節點與開運行動】（指引近期桃花吉方、最佳行動時機或提升個人魅力之法）
5. 【月老寄語】（溫暖鼓勵，強調珍惜當下與用心經營）

請直接以繁體中文、賽博月老的口吻親切開示！`;

        return { prompt, systemMessage };
    }

    formatBazi2Prompt(data, userQuestion = '') {
        const systemMessage = `你是一位精通子平八字命理的命理宗師，熟讀《窮通寶鑑》《三命通會》《滴天髓》《淵海子平》《子平真詮》《千里命稿》等九大經典典籍。
你的論命風格：
1. 嚴謹專業、引經據典（如引用《窮通寶鑑》調候原則、《子平真詮》格局成敗、《滴天髓》五行生剋），但語言通俗易懂。
2. 結構清晰，從日主旺衰、格局用神、十神六親、命帶神煞、大運流年循序漸進。
3. 提出 2~3 個過往關鍵轉折年份（如某步大運/流年）的歷史事件驗證點，供求測者核對。
4. 提供事業、財運、感情、健康方面的具體建設性建議，避免宿命恐嚇。`;

        const prompt = `📜 四柱八字命理深度解盤請求：

求測者提問：【${userQuestion || '請進行全盤深度格局、用神喜忌、大運流年與人生指引解析'}】

【系統計算之八字命盤數據】
${JSON.stringify(data, null, 2)}

請宗師依據經典法理進行全方位剖析：
1. 【日主旺衰與心性特質】（分析日干得令、得地、得勢情況，身旺/身弱判定及性格優勢與盲點）
2. 【格局成敗與喜用神判定】（依月令藏干透出判定正官/七殺/財星/印星/食傷等格局，指明喜用神五行與忌神）
3. 【十神六親與命局配置】（分析年月日時十神互動，家庭、事業、人際與財富承載力）
4. 【命帶神煞吉凶詳解】（剖析命盤命中的天乙貴人、文昌、驛馬、桃花、華蓋、祿神、羊刃等具體影響）
5. 【大運走勢與流年吉凶】（分析當前所處大運及未來 1-3 年流年趨勢）
6. 【人生關鍵階段校準驗證】（根據大運干支交接點，提出 2-3 個過去關鍵年份的狀態特徵供求測者驗證）
7. 【事業·財運·婚姻·健康具體建議】（包含吉祥方位、五行助運色與日常修養錦囊）

請以繁體中文、宗師風範詳盡論述。`;

        return { prompt, systemMessage };
    }

    formatFengShuiPrompt(data, userQuestion = '') {
        const systemMessage = `你是江南三元派第七代傳人「堪輿子」，祖上自清道光年間研習《宅經》《葬書》《沈氏玄空學》《地理五訣》《協紀辨方書》。
你的學術立場與風格：
1. 「巒頭為體，理氣為用；巒頭差，理氣無用；理氣差，巒頭吉地亦減分。」
2. 引經據典（常引《玄空秘旨》《宅經》《地理五訣》），但以現代白話清晰解說。
3. 堅決不推銷商業化風水擺件，主張「移形易位」、空間動線優化、採光通風與五行制化。
4. 坦承「風水為輔，人為為主」，不說宿命恐嚇之語。`;

        const prompt = `🏡 傳統堪輿風水顧問診斷請求：

求測者提問：【${userQuestion || '請為我分析陽宅玄空飛星格局、八宅吉凶與空間佈局建議'}】

【系統計算之風水盤面數據】
${JSON.stringify(data, null, 2)}

請堪輿子先生為該宅出具專業風水報告：
1. 【宅基信息與元運立極】（分析坐向、九運當令旺衰、格局判定如旺山旺向/雙星到向/上山下水）
2. 【九宮飛星與流年星曜解讀】（詳解當令旺星分佈，特別點出五黃大煞、二黑病符所在宮位與化解方案）
3. 【八宅明鏡與宅命相配】（分析八方遊年四吉四凶位，對照居住者命卦之契合度）
4. 【空間功能分區佈局建議】（針對大門、主臥、客廳、廚房、衛生間、書房給出具體方位配置與動線優化）
5. 【煞氣化解或擇日要點】（以移形易位為首選，結合五行生剋制化）
6. 【堪輿子寄語】（「地善則苗茂，宅吉則人榮，風水能助吉避凶，關鍵仍在居者修德行善與用心經營」）

請以繁體中文、堪輿子先生之嚴謹專業口吻作答。`;

        return { prompt, systemMessage };
    }

    formatTarotPrompt(data, userQuestion = '') {
        const systemMessage = `你是一位專業的塔羅心靈顧問，融合韋特、托特與現代心理學原型。
你的占卜哲學：
1. 「塔羅是鏡子，不是水晶球；把牌面轉成自我觀察和可選擇的下一步，不宣判固定命運。」
2. 嚴格遵循四維透鏡（鏡子=現狀、窗戶=盲點、門=行動、錨=固定信念）。
3. 深入挖掘牌間關係（大阿卡納佔比、元素相生相剋、經典組合對位）。
4. 反巴納姆廢話，建議必須具體到時間與動作（例如「本週五前主動溝通某件事」）。
5. 結尾給出 3-4 字能量總結詞，並以開放式問題把主權交還求測者。`;

        const prompt = `🔮 塔羅牌陣深度心靈與行動解讀請求：

求測者問題：【${userQuestion || '請給予我當前最清晰的心靈透鏡與行動指引'}】

【系統開牌與牌間關係數據】
${JSON.stringify(data, null, 2)}

請顧問進行四維透鏡與敘事弧解讀：
1. 【牌陣整體能量概覽】（大阿卡納佔比解讀、四大元素分佈與主導/缺失能量分析）
2. 【逐牌透鏡深入解析】（依牌陣位置，結合牌面正逆位、心理原型與深層象徵進行剖析）
3. 【牌間動態關聯推演】（分析相鄰牌的因果/對話/遞進/轉折，以及元素生剋與經典組合對話）
4. 【核心敘事弧】（起點 -> 張力 -> 轉折 -> 出口 -> 回響）
5. 【本週具體可落地行動清單】（具體、清晰、可執行的下一步）
6. 【能量總結詞與心靈啟發問句】（3-4 字能量詞，加上交還主權的結尾提問）

請以繁體中文、溫暖清醒且富啟發性的風格解答。`;

        return { prompt, systemMessage };
    }

    getServiceFallback(serviceKey, data) {
        if (!data) return '';
        if (serviceKey === 'tarot') {
            const cards = Array.isArray(data.cards) ? data.cards.map((card) => `${card.position || ''}：${card.name || ''}（${card.orientation || ''}）`) : [];
            return [`牌陣：${data.spreadName || data.spread || '未指定'}`, ...cards].filter(Boolean).join('\n');
        }
        if (serviceKey === 'fengshui') {
            return [`房屋朝向：${data.facing || ''}`, `宅向：${data.eightMansions?.house || ''}`, `居住者命卦：${data.resident?.mingGua?.name || ''}卦`].join('\n');
        }
        if (serviceKey === 'bazi2') {
            const pillars = Array.isArray(data.fourPillars) ? data.fourPillars.map((pillar) => `${pillar.label}：${pillar.value}`).join('\n') : '';
            return [`日主：${data.dayMaster?.stem || ''}${data.dayMaster?.element ? `（${data.dayMaster.element}）` : ''}`, pillars].filter(Boolean).join('\n');
        }
        if (serviceKey === 'yinyuan') {
            return data.summary || data.relationship || (data.title ? `${data.title}：${data.poem || ''}` : '請以真誠溝通與尊重彼此為關係基礎。');
        }
        if (serviceKey === 'answerbook') {
            return data.answer ? `解答之書原始答案：${data.answer}` : '請將解答之書的文字視為提醒，結合現況審慎判斷。';
        }
        return '';
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
