require('dotenv').config();
const qimen = require('./lib/qimen');
const LLMAnalysisService = require('./lib/llm-analysis');

async function testLLMAnalysis() {
    console.log('=================================');
    console.log('測試AI解盤對兩種模式的識別能力');
    console.log('=================================');

    const testTime = new Date('2025-08-04T14:25:00');
    
    // 檢查環境配置
    console.log('LLM配置：');
    console.log('- Provider:', process.env.LLM_PROVIDER);
    console.log('- API Key存在:', process.env.LLM_API_KEY ? '是' : '否');
    console.log('- Model:', process.env.LLM_MODEL);
    console.log('');

    const llm = new LLMAnalysisService({
        provider: process.env.LLM_PROVIDER || 'groq',
        apiKey: process.env.LLM_API_KEY,
        model: process.env.LLM_MODEL
    });

    // 測試傳統模式
    console.log('【傳統模式排盤】');
    const traditionalResult = qimen.calculate(testTime, { 
        method: '時家', 
        timePrecisionMode: 'traditional' 
    });
    
    console.log('值符宮:', traditionalResult.zhiFuGong, '宮 -', traditionalResult.zhiFuXing);
    console.log('值使宮:', traditionalResult.zhiShiGong, '宮 -', traditionalResult.zhiShiMen);
    console.log('時間精度模式:', traditionalResult.basicInfo.timePrecisionMode);
    console.log('');

    // 測試進階模式
    console.log('【進階模式排盤】');
    const advancedResult = qimen.calculate(testTime, { 
        method: '時家', 
        timePrecisionMode: 'advanced' 
    });
    
    console.log('值符宮:', advancedResult.zhiFuGong, '宮 -', advancedResult.zhiFuXing);
    console.log('值使宮:', advancedResult.zhiShiGong, '宮 -', advancedResult.zhiShiMen);
    console.log('時間精度模式:', advancedResult.basicInfo.timePrecisionMode);
    console.log('時間段:', '第' + advancedResult.timePrecision.segment + '段');
    console.log('宮位調整:', advancedResult.segmentAdjustment + '宮');
    console.log('');

    // 測試AI解盤提示詞差異
    console.log('【AI提示詞對比】');
    const traditionalPrompt = llm.formatQimenForLLM(traditionalResult, '綜合');
    const advancedPrompt = llm.formatQimenForLLM(advancedResult, '綜合');
    
    console.log('傳統模式提示詞特點:');
    console.log('- 包含"傳統模式":', traditionalPrompt.includes('傳統模式') ? '✓' : '✗');
    console.log('- 包含"九宮拆補":', traditionalPrompt.includes('九宮拆補') ? '✓' : '✗');
    console.log('- 值符宮位:', traditionalPrompt.match(/值符：.*?（(\d)宮）/)?.[1] || '未找到');
    console.log('');
    
    console.log('進階模式提示詞特點:');
    console.log('- 包含"進階模式":', advancedPrompt.includes('進階模式') ? '✓' : '✗');
    console.log('- 包含"九宮拆補":', advancedPrompt.includes('九宮拆補') ? '✓' : '✗');
    console.log('- 包含"時辰細分":', advancedPrompt.includes('時辰細分') ? '✓' : '✗');
    console.log('- 包含"段落調整":', advancedPrompt.includes('段落調整') ? '✓' : '✗');
    console.log('- 值符宮位:', advancedPrompt.match(/值符：.*?（(\d)宮）/)?.[1] || '未找到');
    console.log('');

    // 實際調用AI（如果有API Key）
    if (process.env.LLM_API_KEY) {
        console.log('【實際AI解盤測試】');
        console.log('正在調用AI進行解盤...（可能需要幾秒鐘）');
        
        try {
            // 傳統模式AI解盤
            console.log('\n--- 傳統模式AI解盤 ---');
            const traditionalAI = await llm.analyzeQimen(traditionalResult, { 
                purpose: '綜合', 
                userQuestion: '請比較分析當前的排盤特點' 
            });
            
            if (traditionalAI.success) {
                console.log('AI解盤成功');
                console.log('解盤結果（前200字）:', traditionalAI.analysis.substring(0, 200) + '...');
            } else {
                console.log('AI解盤失敗:', traditionalAI.error);
            }

            // 進階模式AI解盤
            console.log('\n--- 進階模式AI解盤 ---');
            const advancedAI = await llm.analyzeQimen(advancedResult, { 
                purpose: '綜合', 
                userQuestion: '請特別說明進階模式的時間精度對分析的影響' 
            });
            
            if (advancedAI.success) {
                console.log('AI解盤成功');
                console.log('解盤結果（前200字）:', advancedAI.analysis.substring(0, 200) + '...');
                
                // 檢查AI是否識別出進階模式
                const mentionsAdvanced = advancedAI.analysis.includes('進階模式') || 
                                       advancedAI.analysis.includes('九宮拆補') ||
                                       advancedAI.analysis.includes('時間段') ||
                                       advancedAI.analysis.includes('細分');
                console.log('AI是否識別進階模式:', mentionsAdvanced ? '✓ 是' : '✗ 否');
            } else {
                console.log('AI解盤失敗:', advancedAI.error);
            }
            
        } catch (error) {
            console.log('AI調用錯誤:', error.message);
        }
    } else {
        console.log('【跳過AI調用】沒有設置API Key');
    }

    console.log('\n測試完成！');
}

// 執行測試
testLLMAnalysis().catch(console.error);
