const axios = require('axios');

async function testMeihuaLLM() {
    const baseUrl = process.env.MEIHUA_API_BASE || 'http://localhost:3000';

    console.log('=== 梅花易數 LLM 測試 ===');
    console.log(`Base URL: ${baseUrl}`);

    if (!process.env.LLM_API_KEY) {
        console.log('⚠️ 未設定 LLM_API_KEY，跳過測試');
        return;
    }

    try {
        const now = new Date();
        const userDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const qiguaResponse = await axios.post(`${baseUrl}/api/meihua/qigua`, {
            method: 'time',
            userDateTime: userDateTime,
            timestamp: now.getTime(),
            timezoneOffset: now.getTimezoneOffset()
        });

        if (!qiguaResponse.data?.success) {
            console.log('❌ 起卦失敗，無法測試 LLM');
            return;
        }

        console.log('✅ 起卦成功，開始 LLM 分析...');

        const llmResponse = await axios.post(`${baseUrl}/api/meihua/llm-analysis`, {
            meihuaData: qiguaResponse.data.data,
            userQuestion: '請根據本卦給出整體運勢與行動建議',
            conversationHistory: [],
            purpose: '綜合',
            lang: 'zh-tw'
        });

        if (llmResponse.data?.success) {
            console.log('✅ LLM 分析成功');
            console.log(`回應預覽: ${llmResponse.data.analysis.substring(0, 120)}...`);
        } else {
            console.log('❌ LLM 分析失敗:', llmResponse.data);
        }
    } catch (error) {
        console.error('LLM 測試錯誤:', error.message);
    }

    try {
        console.log('\n[對外 API 測試] /api/meihua-question');
        const questionResponse = await axios.post(`${baseUrl}/api/meihua-question`, {
            question: '這個卦象對事業有何提醒？',
            method: 'time',
            datetime: now.toISOString(),
            purpose: '事業',
            timezone: '+08:00',
            lang: 'zh-tw'
        });

        if (questionResponse.data?.success) {
            console.log('✅ meihua-question 成功');
            console.log(`回應預覽: ${questionResponse.data.answer.substring(0, 120)}...`);
        } else {
            console.log('❌ meihua-question 失敗:', questionResponse.data);
        }
    } catch (error) {
        console.error('meihua-question 測試錯誤:', error.message);
    }
}

testMeihuaLLM().catch((error) => {
    console.error('測試失敗:', error);
});
