#!/usr/bin/env node

// 時區測試腳本
console.log('=== 奇門遁甲時區測試 ===');

const now = new Date();

console.log('\n🕐 當前時間信息:');
console.log('本地時間:', now.toString());
console.log('UTC 時間:', now.toUTCString());
console.log('ISO 字串:', now.toISOString());
console.log('時間戳:', now.getTime());
console.log('時區偏移:', now.getTimezoneOffset(), '分鐘');

console.log('\n🌍 不同時區的時間:');
console.log('台北時間:', now.toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'}));
console.log('UTC 時間:', now.toLocaleString('en-US', {timeZone: 'UTC'}));
console.log('紐約時間:', now.toLocaleString('en-US', {timeZone: 'America/New_York'}));

console.log('\n🔧 模擬 Vercel 環境 (UTC):');
// 模擬 Vercel 服務器時間 (UTC)
const serverTime = new Date();
const userTimezoneOffset = -480; // 台北時區偏移 (UTC+8 = -480分鐘)
const serverOffset = serverTime.getTimezoneOffset();

console.log('服務器時區偏移:', serverOffset, '分鐘');
console.log('用戶時區偏移:', userTimezoneOffset, '分鐘');
console.log('時區差異:', serverOffset - userTimezoneOffset, '分鐘');

// 計算調整後的時間
const offsetDiff = serverOffset - userTimezoneOffset;
const adjustedTime = new Date(serverTime.getTime() + offsetDiff * 60000);

console.log('服務器時間:', serverTime.toISOString());
console.log('調整後時間:', adjustedTime.toISOString());
console.log('調整後本地:', adjustedTime.toString());

console.log('\n✅ 測試完成');

// 如果在 Node.js 環境中運行這個腳本
if (require.main === module) {
    console.log('\n💡 提示: 這個腳本可以幫助診斷時區問題');
    console.log('在部署到 Vercel 前，請確保本地測試正常');
}
