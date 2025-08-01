# LLM 解盤功能說明

## 功能特點

1. **智能解盤**：使用 AI 大語言模型對奇門遁甲排盤結果進行深度解讀
2. **互動問答**：用戶可以針對排盤結果提出具體問題
3. **多種用途**：支援事業、財運、感情、健康等不同用途的專門分析
4. **多模型支援**：支援 OpenAI、Claude、通義千問、本地 Ollama 等多種 LLM 服務

## 設計架構

### 後端架構
- `lib/llm-analysis.js`：LLM 解盤服務核心類
- 支援多種 LLM 提供商的統一接口
- 智能提示詞生成，將奇門數據轉換為結構化描述
- 錯誤處理和備用分析機制

### 前端設計
- 解盤結果顯示在頁面最上方，用戶一進入就能看到 AI 解讀
- 互動式問答區域，支援實時提問
- 載入動畫和用戶體驗優化
- 響應式設計，適配各種設備

### API 接口
- `POST /api/llm-analysis`：LLM 解盤分析
- `GET /api/llm-config`：獲取 LLM 配置狀態
- `GET /api/llm-test`：測試 LLM 連接

## 配置方法

### 1. 環境變數設置
複製 `.env.example` 為 `.env`：
```bash
cp .env.example .env
```

### 2. 選擇 LLM 提供商

#### OpenAI (推薦)
```env
LLM_PROVIDER=openai
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_MODEL=gpt-4o-mini
```

#### Anthropic Claude
```env
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_MODEL=claude-3-haiku-20240307
```

#### 本地 Ollama (免費)
```env
LLM_PROVIDER=ollama
LLM_API_KEY=not_required
LLM_MODEL=llama3.1:latest
LLM_BASE_URL=http://localhost:11434/v1
```

#### 阿里通義千問
```env
LLM_PROVIDER=qwen
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_MODEL=qwen-turbo
```

## 使用方法

### 基本使用
1. 配置好 LLM 服務後，訪問首頁會自動顯示 AI 解盤結果
2. 解盤結果包含整體運勢、具體建議、方位指導等

### 互動問答
1. 在 AI 解盤區域下方有「有特定問題想問？」輸入框
2. 輸入您的問題，例如：
   - 今天適合投資嗎？
   - 感情運勢如何？
   - 換工作的時機好嗎？
3. 點擊「詢問」按鈕，AI 會基於當前排盤給出針對性建議

### 高級功能
- 可通過 URL 參數 `?llm=false` 暫時禁用 LLM 功能
- 支援不同用途的專門分析（綜合、事業、財運、感情、健康等）
- 多語言支援（繁體中文、簡體中文）

## 技術細節

### 提示詞工程
系統會將奇門遁甲數據轉換為結構化的提示詞：
- 基本資訊（時間、四柱、局數等）
- 九宮詳情（方位、九星、八門、八神等）
- 分析要求（用途、具體問題等）

### 錯誤處理
- API 調用失敗時會自動降級到基本分析
- 網路超時保護（30秒）
- 用戶友好的錯誤提示

### 性能優化
- 異步處理，不阻塞頁面加載
- 智能緩存機制
- 響應式用戶界面

## 故障排除

### 1. LLM 服務不可用
檢查：
- API Key 是否正確
- 網路連接是否正常
- 提供商服務是否正常

### 2. 本地 Ollama 連接問題
確認：
- Ollama 服務已啟動
- 模型已下載
- 端口未被占用

### 3. 解盤結果為空
可能原因：
- LLM 服務響應超時
- 提示詞過長被截斷
- 模型參數配置問題

## 擴展建議

1. **記憶功能**：保存用戶的問答歷史
2. **個性化**：根據用戶偏好調整解盤風格
3. **專家模式**：提供更詳細的技術分析
4. **語音交互**：支援語音問答
5. **分享功能**：一鍵分享解盤結果
