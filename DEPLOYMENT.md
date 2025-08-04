# Vercel 部署指南

## 為什麼選擇 Vercel

✅ **適合原因：**
- 原生支援 Node.js 和 Express 應用
- 簡單安全的環境變數管理
- 自動 GitHub 集成部署
- 免費額度充足（每月 100GB 流量）
- 優秀的 CDN 和效能

❌ **不適合 GitHub Pages：**
- GitHub Pages 只支援靜態網站
- 無法運行 Node.js 後端服務
- 無法安全處理 API keys

## 部署步驟

### 1. 準備工作
確保專案根目錄有以下檔案：
- `vercel.json` - Vercel 配置檔案 ✅
- `package.json` - 已更新 start 腳本 ✅

### 2. Vercel 部署
1. 前往 [vercel.com](https://vercel.com)
2. 使用 GitHub 帳號登入
3. 點擊「New Project」
4. 選擇您的 `qimen` 專案
5. **Framework Preset: 選擇 "Other"** ✅
6. **Root Directory: 保持預設 "./"** ✅
7. Vercel 會使用 `vercel.json` 配置自動部署

### 3. 環境變數設定
在 Vercel 專案設定中添加環境變數：

```
LLM_PROVIDER=openai
LLM_API_KEY=your_api_key_here
LLM_MODEL=gpt-4o-mini
PORT=3000
```

**支援的 LLM 提供商：**
- OpenAI: `LLM_PROVIDER=openai`
- Anthropic: `LLM_PROVIDER=anthropic`  
- Groq: `LLM_PROVIDER=groq`
- 通義千問: `LLM_PROVIDER=qwen`
- 本地 Ollama: `LLM_PROVIDER=ollama` (不適用於 Vercel)

### 4. 部署完成
- Vercel 會自動建構和部署
- 提供 `https://your-project.vercel.app` 網址
- 每次 push 到 GitHub 都會自動重新部署

## 替代方案：Hugging Face Spaces

如果想嘗試 Hugging Face Spaces，需要：

### 優點：
- 免費 GPU 運算資源
- ML 社群展示平台
- 支援 Docker 部署

### 缺點：
- 需要 Docker 容器化
- 主要設計給 ML 模型
- Node.js 支援有限

### Dockerfile 範例：
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 7860

CMD ["npm", "start"]
```

## 建議

**推薦使用 Vercel**，因為：
1. 零配置 Node.js 支援
2. 環境變數管理簡單
3. 自動 HTTPS 和 CDN
4. 優秀的開發者體驗

這個奇門遁甲應用完全適合 Vercel 的架構！

## 疑難排解

### Framework Preset 選擇
- ✅ **選擇 "Other"** - 適用於純 Node.js/Express 應用
- ❌ 不要選擇 Next.js、Nuxt.js 等框架
- 📝 Vercel 會使用 `vercel.json` 配置檔案

### 常見問題
1. **靜態檔案 404**：確保 `vercel.json` 中的路由配置正確
2. **環境變數未生效**：在 Vercel Dashboard 中檢查環境變數設定
3. **LLM API 錯誤**：確認 API Key 格式和提供商設定正確

### 測試部署
部署完成後，可以測試以下端點：
- `/` - 主頁面
- `/api/llm-test` - LLM 連接測試
- `/api/llm-analysis` - LLM 解盤 API
