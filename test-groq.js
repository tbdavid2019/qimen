const LLMAnalysis = require('./lib/llm-analysis');

// 測試 Groq 配置
const testGroq = () => {
    const llm = new LLMAnalysis('groq', 'test-key');
    
    console.log('=== Groq 提供商測試 ===');
    console.log('Base URL:', llm.getDefaultBaseURL());
    console.log('Default Model:', llm.getDefaultModel());
    console.log('Endpoint:', llm.getEndpoint());
    console.log('Headers:', JSON.stringify(llm.getHeaders(), null, 2));
    
    // 測試 payload 構建
    const payload = llm.buildPayload('測試訊息');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    console.log('✅ Groq 配置測試完成');
};

testGroq();
