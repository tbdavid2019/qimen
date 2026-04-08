const axios = require('axios');

async function testMeihuaApi() {
    const baseUrl = process.env.MEIHUA_API_BASE || 'http://localhost:3000';

    console.log('=== 梅花易數 API 測試 ===');
    console.log(`Base URL: ${baseUrl}`);

    try {
        console.log('\n[時間起卦] 發送請求...');
        const timeResponse = await axios.post(`${baseUrl}/api/meihua/qigua`, {
            method: 'time',
            datetime: new Date().toISOString()
        });

        if (timeResponse.data?.success) {
            const data = timeResponse.data.data;
            console.log('✅ 時間起卦成功');
            console.log(`本卦: ${data.bengua.num} ${data.bengua.name}`);
            console.log(`互卦: ${data.hugua.name}`);
            console.log(`變卦: ${data.biangua.num} ${data.biangua.name}`);
            console.log(`體用: ${data.tigua.name}/${data.yonggua.name} ${data.wuxingRelation}`);
        } else {
            console.log('❌ 時間起卦失敗:', timeResponse.data);
        }
    } catch (error) {
        console.error('時間起卦 API 錯誤:', error.message);
    }

    try {
        console.log('\n[數字起卦] 發送請求...');
        const numberResponse = await axios.post(`${baseUrl}/api/meihua/qigua`, {
            method: 'number',
            num1: 6,
            num2: 8,
            num3: 3
        });

        if (numberResponse.data?.success) {
            const data = numberResponse.data.data;
            console.log('✅ 數字起卦成功');
            console.log(`本卦: ${data.bengua.num} ${data.bengua.name}`);
            console.log(`互卦: ${data.hugua.name}`);
            console.log(`變卦: ${data.biangua.num} ${data.biangua.name}`);
            console.log(`體用: ${data.tigua.name}/${data.yonggua.name} ${data.wuxingRelation}`);
        } else {
            console.log('❌ 數字起卦失敗:', numberResponse.data);
        }
    } catch (error) {
        console.error('數字起卦 API 錯誤:', error.message);
    }
}

testMeihuaApi().catch((error) => {
    console.error('測試失敗:', error);
});
