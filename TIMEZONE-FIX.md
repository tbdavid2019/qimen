# 時區修正功能說明

## 問題背景
- Vercel 等雲端主機通常運行在 UTC 時區 (+0)
- 本機開發環境使用本地時區（如台北 +8）
- 導致生產環境和開發環境的時間計算不一致

## 解決方案
採用前端獲取用戶本地時間，傳遞給後端計算的方式：

### 1. 前端時區檢測
- 自動獲取用戶本地時間戳和時區偏移
- 通過 URL 參數傳遞給後端：`?timestamp=xxx&timezoneOffset=xxx`

### 2. 後端時間處理
```javascript
// 優先使用前端傳遞的時間戳
if (req.query.timestamp) {
    date = new Date(parseInt(req.query.timestamp));
} else {
    // 備用：調整伺服器時間到用戶時區
    const serverOffset = date.getTimezoneOffset();
    const userOffset = parseInt(req.query.timezoneOffset);
    if (serverOffset !== userOffset) {
        const offsetDiff = serverOffset - userOffset;
        date = new Date(date.getTime() + offsetDiff * 60000);
    }
}
```

### 3. 自動重新載入
- 首次訪問時檢測時區
- 如需調整，自動添加時間參數重新載入
- 避免無限重複載入

## 使用方式
1. 用戶訪問任何頁面
2. JavaScript 自動檢測是否需要時區調整
3. 如需要，自動重新載入頁面並傳遞正確時間
4. 後續的模式切換會保持時區參數

## 調試信息（僅開發環境）
- 頁面上顯示本地時間和計算時間對比
- 後端日誌顯示時區調整過程
- 生產環境自動隱藏調試信息

## 優勢
- ✅ 完全自動化，用戶無感知
- ✅ 兼容任何時區的用戶
- ✅ 兼容任何時區的伺服器
- ✅ 不影響現有功能
- ✅ 支持靜心頁面和主頁面
