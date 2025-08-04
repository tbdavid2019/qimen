#!/usr/bin/env node

console.log('=== 時區修正測試 ===');

// 模擬台北時區的用戶
const now = new Date();
const timezoneOffset = -480; // 台北 UTC+8 = -480 分鐘

// 建立本地時間字串
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
const userDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

console.log('用戶本地時間:', now.toString());
console.log('用戶時間字串:', userDateTime);
console.log('時區偏移:', timezoneOffset);

// 模擬後端處理
console.log('\n=== 後端處理 (新方法) ===');
const parsedDate = new Date(userDateTime);
console.log('解析後的時間:', parsedDate.toString());

// 測試在 UTC 環境下的處理
console.log('\n=== Vercel (UTC) 環境模擬 ===');

// 模擬 VERCEL 環境變數
process.env.VERCEL = 'true';

// 使用時間戳 + 時區偏移的備用方法
const timestamp = now.getTime();
let adjustedDate = new Date(timestamp);

if (process.env.VERCEL) {
    const offsetDiff = -timezoneOffset; // 用戶偏移 vs UTC
    adjustedDate = new Date(adjustedDate.getTime() + offsetDiff * 60000);
}

console.log('時間戳方法 - 原始:', new Date(timestamp).toString());
console.log('時間戳方法 - 調整後:', adjustedDate.toString());

// 驗證結果
const expectedHour = now.getHours();
const actualHour = parsedDate.getHours();
const timestampHour = adjustedDate.getHours();

console.log('\n=== 驗證結果 ===');
console.log(`期望小時: ${expectedHour}`);
console.log(`userDateTime 方法小時: ${actualHour} ${actualHour === expectedHour ? '✅' : '❌'}`);
console.log(`timestamp 方法小時: ${timestampHour} ${timestampHour === expectedHour ? '✅' : '❌'}`);

if (actualHour === expectedHour) {
    console.log('\n🎉 時區修正成功！');
} else {
    console.log('\n❌ 時區修正失敗');
}
