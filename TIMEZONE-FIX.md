# 時區修正功能說明

## 問題背景
- Vercel 等雲端主機通常運行在 UTC 時區 (+0)
- 本機開發環境使用本地時區（如台北 +8）
- 導致生產環境和開發環境的時間計算不一致

## 解決方案（已優化）
採用前端獲取用戶本地時間，傳遞給後端計算的方式：

### 1. 前端時區檢測（增強版）
- 自動獲取用戶本地時間戳和時區偏移
- 智能檢測時區變化（夏令時切換等）
- 定期檢查時間戳是否過期（防止長時間使用導致的時間偏差）
- 通過 URL 參數傳遞給後端：`?timestamp=xxx&timezoneOffset=xxx`

### 2. 後端時間處理（強化版）
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

### 3. 自動重新載入（改進版）
- 首次訪問時檢測時區
- 時區偏移改變時自動更新
- 時間戳過期時自動刷新
- 避免無限重複載入

### 4. 調試和監控功能
- 時區狀態視覺指示器
- 詳細的調試日誌（開發環境）
- 時區調試 API：`/api/timezone-debug`
- 時區測試腳本：`node test-timezone.js`

## 使用方式
1. 用戶訪問任何頁面
2. JavaScript 自動檢測是否需要時區調整
3. 如需要，自動重新載入頁面並傳遞正確時間
4. 後續的模式切換會保持時區參數
5. 長時間使用會自動更新時間戳

## 調試信息
### 生產環境
- 頁面上顯示本地時間（顏色指示狀態）
- 時區參數自動處理，用戶無感知

### 開發環境
- 詳細的控制台日誌
- 時區調試 API 提供完整信息
- 測試腳本驗證時區計算

## 測試方法
```bash
# 運行時區測試
node test-timezone.js

# 訪問調試 API
curl http://localhost:3000/api/timezone-debug
```

## Vercel 部署配置
確保 `vercel.json` 包含：
```json
{
  "env": {
    "TZ": "UTC"
  }
}
```

## 優勢
- ✅ 完全自動化，用戶無感知
- ✅ 兼容任何時區的用戶
- ✅ 兼容任何時區的伺服器  
- ✅ 智能檢測時區變化
- ✅ 防止長時間使用的時間偏差
- ✅ 完整的調試和監控功能
- ✅ 不影響現有功能
- ✅ 支持靜心頁面和主頁面
