# 奇門遁甲 + 梅花易數整合專案 - 施作大綱

## 專案目標

將梅花易數占卜系統整合到現有的奇門遁甲專案中,並增強空間定位功能和深色模式支援。

---

## 🎯 核心設計理念

### **靜心問事的定位**
- ✅ 純粹的**靜心準備**頁面
- ✅ 幫助用戶進入占卜狀態
- ✅ 提供兩個系統的入口按鈕
- ❌ **不包含**問題輸入功能

### **問題輸入的位置**
- ✅ 在**排盤頁面**本身 (奇門遁甲 / 梅花易數)
- ✅ 先顯示排盤/起卦結果
- ✅ 下方提供 AI 問答區
- ✅ 用戶可選擇性輸入問題,由 LLM 讀取排盤數據分析

### **頁面結構對應**
```
靜心問事 (/start)
  ↓ 按鈕選擇
  ├─→ 奇門遁甲 (/)      [排盤結果 + AI問答區]
  └─→ 梅花易數 (/meihua) [起卦結果 + AI問答區]
```

---

## 階段一: 基礎功能增強 (優先處理)

### 1.1 深色模式實作 ⭐⭐⭐ (高優先級)

**目標**: 為整個網站添加深色模式切換功能

**任務清單**:
- [ ] 創建 `/public/css/dark-mode.css` 深色主題樣式
- [ ] 在 localStorage 中保存用戶偏好設定
- [ ] 添加深色模式切換按鈕到導航欄
- [ ] 為九宮格、卦象圖適配深色配色
- [ ] 測試所有頁面的深色模式顯示

**技術要點**:
```css
/* 使用 CSS 變數實現主題切換 */
:root {
  --bg-primary: #ffffff;
  --text-primary: #333333;
  --border-color: #dee2e6;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #e0e0e0;
  --border-color: #404040;
}
```

**預估時間**: 0.5 天



### 1.4 靜心問事頁面簡化 ⭐⭐

**目標**: 將靜心問事定位為純粹的靜心準備頁面

**任務清單**:
- [ ] 修改 `/views/start.html` 頁面
- [ ] **移除**問題輸入框
- [ ] **移除**占卜方式選擇卡片
- [ ] 保留呼吸引導動畫 (CSS animation)
- [ ] 保留靜心倒數計時器 (60秒)
- [ ] 添加兩個簡潔的跳轉按鈕
- [ ] 響應式設計

**頁面結構**:
```html
<!-- /views/start.html (簡化版) -->
<div class="meditation-page">
  <h1>🧘 靜心問事</h1>
  <p class="guide-text">
    請靜下心來,專注於您想詢問的事情。<br>
    心誠則靈,問題越具體,占卜結果越精準。
  </p>
  
  <!-- 呼吸引導動畫 -->
  <div class="breathing-circle">
    <div class="pulse"></div>
  </div>
  
  <p class="timer">建議靜心時間: <span id="countdown">60</span> 秒</p>
  
  <!-- 只有兩個跳轉按鈕 -->
  <div class="action-buttons">
    <button class="btn-qimen" onclick="location.href='/'">
      🎯 奇門遁甲排盤
    </button>
    <button class="btn-meihua" onclick="location.href='/meihua'">
      🌸 梅花易數起卦
    </button>
  </div>
  
  <p class="hint">
    💡 提示: 您也可以直接點擊上方導航欄進入排盤頁面
  </p>
</div>

<style>
/* 呼吸動畫 */
.breathing-circle {
  width: 200px;
  height: 200px;
  margin: 40px auto;
  position: relative;
}

.pulse {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.3), transparent);
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
}

/* 按鈕樣式 */
.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 30px;
}

.action-buttons button {
  padding: 15px 30px;
  font-size: 18px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-qimen {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-meihua {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.action-buttons button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.action-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

<script>
// 靜心倒數計時
let countdown = 60;
const countdownEl = document.getElementById('countdown');
const buttons = document.querySelectorAll('.action-buttons button');

// 初始禁用按鈕
buttons.forEach(btn => btn.disabled = true);

const timer = setInterval(() => {
  countdown--;
  countdownEl.textContent = countdown;
  
  if (countdown <= 0) {
    clearInterval(timer);
    // 啟用按鈕
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.classList.add('ready');
    });
    countdownEl.parentElement.textContent = '✅ 靜心完成,請選擇占卜方式';
  }
}, 1000);

// 允許用戶提前跳過 (點擊倒數文字)
countdownEl.parentElement.addEventListener('click', () => {
  if (countdown > 0) {
    countdown = 0;
  }
});
</script>
```

**預估時間**: 0.5 天

---

### 1.3 導航欄重新設計 ⭐⭐

**目標**: 設計簡潔的三入口並列導航結構

**任務清單**:
- [ ] 修改 `/views/partials/header.ejs` (如果有) 或主模板
- [ ] 添加深色模式切換器
- [ ] 調整語言切換器位置
- [ ] 響應式設計 (手機端收合為漢堡選單)
- [ ] 統一樣式風格

**新導航結構** (簡潔版):
```html
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <div class="container-fluid">
    <!-- Logo -->
    <a class="navbar-brand" href="/">
      🔮 道家占卜系統
    </a>
    
    <!-- 手機端漢堡選單 -->
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
      <span class="navbar-toggler-icon"></span>
    </button>
    
    <!-- 主導航 -->
    <div class="collapse navbar-collapse" id="navbarMain">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link" href="/start">🧘 靜心問事</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/">🎯 奇門遁甲</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/meihua">🌸 梅花易數</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/guide">📚 使用說明</a>
        </li>
      </ul>
      
      <!-- 右側工具 -->
      <div class="d-flex align-items-center gap-2">
        <!-- 深色模式切換 -->
        <button id="darkModeToggle" class="btn btn-sm btn-outline-light">
          <span class="dark-mode-icon">🌙</span>
        </button>
        
        <!-- 語言切換 -->
        <select id="langSwitch" class="form-select form-select-sm" style="width: auto;">
          <option value="zh-tw">繁體</option>
          <option value="zh-cn">简体</option>
        </select>
      </div>
    </div>
  </div>
</nav>

<script>
// 深色模式切換邏輯
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeIcon = document.querySelector('.dark-mode-icon');

// 從 localStorage 讀取設定
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
darkModeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

darkModeToggle.addEventListener('click', () => {
  const theme = document.documentElement.getAttribute('data-theme');
  const newTheme = theme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  darkModeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// 語言切換邏輯 (已有,保持不變)
</script>
```

**設計理念**:
- ✅ 三個主要功能並列,一目了然
- ✅ 靜心問事作為第一個入口,引導新用戶
- ✅ 奇門遁甲和梅花易數並列,方便快速訪問
- ✅ 深色模式和語言切換在右側,不干擾主導航

**預估時間**: 0.5 天

---

### 2.1 梅花易數計算引擎 (JavaScript 移植) ⭐⭐⭐

**目標**: 將 Python 版本的梅花易數計算邏輯移植為 JavaScript

**任務清單**:
- [ ] 創建 `/lib/meihua.js` 核心計算模組
- [ ] 實作八卦數據結構和對應關係
- [ ] 實作時間起卦算法
- [ ] 實作數字起卦算法
- [ ] 實作體用分析邏輯
- [ ] 實作互卦、變卦計算
- [ ] 實作五行生克分析
- [ ] 單元測試 (對照 Python 版本結果)

**核心模組結構**:
```javascript
// lib/meihua.js

// 先天八卦數對應
const BAGUA = {
  1: { name: '乾', symbol: '☰', binary: '111', element: '金' },
  2: { name: '兌', symbol: '☱', binary: '011', element: '金' },
  // ... 8個卦
};

// 六十四卦對照表
const HEXAGRAMS = {
  '1-1': { num: 1, name: '乾為天' },
  // ... 64個卦
};

// 時間起卦
function qiguaByTime(lunarYear, lunarMonth, lunarDay, hour) {
  // 計算上卦、下卦、動爻
  // 返回卦象分析
}

// 數字起卦
function qiguaByNumbers(num1, num2, num3 = null) {
  // 計算卦象
}

// 體用分析
function analyzeTiYong(upperGua, lowerGua, dongYao) {
  // 判斷體卦、用卦
  // 分析五行生克
  // 返回吉凶判斷
}

// 獲取互卦
function getHuGua(hexagramBinary) {
  // 取2-4爻為下互，3-5爻為上互
}

// 獲取變卦
function getBianGua(hexagramBinary, dongYao) {
  // 動爻陰陽互換
}

module.exports = {
  qiguaByTime,
  qiguaByNumbers,
  analyzeTiYong,
  getHuGua,
  getBianGua,
  BAGUA,
  HEXAGRAMS
};
```

**預估時間**: 2 天

---

### 2.2 梅花易數多語言支援 ⭐

**目標**: 為梅花易數添加繁簡中文支援

**任務清單**:
- [ ] 在 `/lang/zh-tw.json` 添加梅花易數術語
- [ ] 在 `/lang/zh-cn.json` 添加簡體對照
- [ ] 卦名、爻辭、術語翻譯
- [ ] 整合到現有 i18n 系統

**新增術語示例**:
```json
{
  "meihua": {
    "title": "梅花易數",
    "qigua": "起卦",
    "bengua": "本卦",
    "tigua": "體卦",
    "yonggua": "用卦",
    "hugua": "互卦",
    "biangua": "變卦",
    "dongyao": "動爻",
    "wuxing": {
      "sheng": "生",
      "ke": "克",
      "bihe": "比和"
    }
  }
}
```

**預估時間**: 0.5 天

---

### 2.3 梅花易數主頁面開發 ⭐⭐⭐ (重點)

**目標**: 創建梅花易數的單一主頁面 (模仿奇門遁甲結構)

**任務清單**:
- [ ] 創建 `/views/meihua.html` **單一主頁面**
- [ ] 起卦方式切換 (時間/數字/測字)
- [ ] 動態輸入面板切換
- [ ] 卦象顯示區
- [ ] **AI 問答區** (與奇門遁甲相同結構)
- [ ] 對話歷史管理
- [ ] 創建 `/public/css/meihua.css` 專用樣式
- [ ] 創建 `/public/js/meihua.js` 前端邏輯
- [ ] 響應式設計

**頁面結構** (完整版):
```html
<!-- /views/meihua.html -->
<!DOCTYPE html>
<html>
<head>
  <title>梅花易數起卦</title>
  <link rel="stylesheet" href="/css/meihua.css">
</head>
<body>
  <div class="container">
    <h1>🌸 梅花易數</h1>
    
    <!-- 起卦方式選擇 -->
    <div class="qigua-method-tabs">
      <button class="tab-btn active" data-method="time">⏰ 時間起卦</button>
      <button class="tab-btn" data-method="number">🔢 數字起卦</button>
      <button class="tab-btn" data-method="cezi">📝 測字起卦</button>
    </div>
    
    <!-- 起卦輸入區 (動態切換) -->
    <div class="qigua-input-panels">
      <!-- 時間起卦面板 -->
      <div id="panel-time" class="input-panel active">
        <h3>以時間起卦</h3>
        <div class="form-group">
          <label>
            <input type="radio" name="timeMode" value="current" checked>
            使用當前時間
          </label>
          <label>
            <input type="radio" name="timeMode" value="custom">
            自定義時間
          </label>
        </div>
        <div id="customTimeInput" style="display:none;">
          <input type="datetime-local" id="customDateTime">
        </div>
        <p class="hint">當前時間: <span id="currentTime"></span></p>
      </div>
      
      <!-- 數字起卦面板 -->
      <div id="panel-number" class="input-panel">
        <h3>以數字起卦</h3>
        <p class="hint">請心中默想問題,然後報出兩個數字</p>
        <input type="number" id="num1" placeholder="第一個數字" min="1">
        <input type="number" id="num2" placeholder="第二個數字" min="1">
        <input type="number" id="num3" placeholder="第三個數字 (可選,用於指定動爻)" min="1">
      </div>
      
      <!-- 測字起卦面板 -->
      <div id="panel-cezi" class="input-panel">
        <h3>測字起卦</h3>
        <p class="hint">請寫下一個字</p>
        <input type="text" id="ceziChar" maxlength="1" placeholder="輸入一個字">
      </div>
    </div>
    
    <!-- 起卦按鈕 -->
    <button id="qiguaBtn" class="btn-primary">🌸 起卦</button>
    
    <!-- 卦象結果區 -->
    <div id="hexagram-result" class="result-section" style="display:none;">
      <h2>卦象結果</h2>
      
      <div class="hexagram-grid">
        <!-- 本卦 -->
        <div class="gua-card bengua-card">
          <h3>本卦</h3>
          <div class="gua-name" id="benguaName"></div>
          <div class="gua-visual" id="benguaVisual">
            <!-- 六爻圖形 -->
          </div>
          <div class="gua-info">
            <p>上卦: <span id="shangGua"></span></p>
            <p>下卦: <span id="xiaGua"></span></p>
            <p>動爻: <span id="dongYao"></span></p>
          </div>
        </div>
        
        <!-- 體用分析 -->
        <div class="gua-card tiyong-card">
          <h3>體用分析</h3>
          <div class="tiyong-info">
            <p>體卦: <span id="tiGua"></span></p>
            <p>用卦: <span id="yongGua"></span></p>
            <p class="relation" id="wuxingRelation"></p>
          </div>
          <div class="fortune-badge" id="fortuneBadge"></div>
        </div>
        
        <!-- 互卦 -->
        <div class="gua-card hugua-card">
          <h3>互卦 (發展過程)</h3>
          <div class="gua-name" id="huguaName"></div>
        </div>
        
        <!-- 變卦 -->
        <div class="gua-card biangua-card">
          <h3>變卦 (最終結果)</h3>
          <div class="gua-name" id="bianguaName"></div>
        </div>
      </div>
    </div>
    
    <!-- AI 問答區 (與奇門遁甲相同結構) -->
    <div id="ai-section" class="ai-section" style="display:none;">
      <h2>💬 AI 大師解卦</h2>
      
      <!-- 對話歷史顯示 -->
      <div id="conversationHistory" class="conversation-history"></div>
      
      <!-- 問題輸入 -->
      <div class="question-input-area">
        <textarea 
          id="userQuestion" 
          placeholder="有任何問題嗎? 例如: 這個卦象對我的事業有什麼建議?"
          rows="3"
        ></textarea>
        <div class="input-actions">
          <button id="askAI" class="btn-primary">
            🤖 AI 大師解卦
          </button>
          <button id="clearHistory" class="btn-secondary">
            🗑️ 清除對話
          </button>
        </div>
      </div>
      
      <!-- AI 回答顯示 -->
      <div id="aiResponse" class="ai-response"></div>
    </div>
  </div>
  
  <script src="/js/meihua.js"></script>
</body>
</html>
```

**前端 JavaScript** (`/public/js/meihua.js`):
```javascript
// 起卦方式切換
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    // 切換 active 狀態
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    // 切換輸入面板
    const method = this.dataset.method;
    document.querySelectorAll('.input-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${method}`).classList.add('active');
  });
});

// 時間模式切換
document.querySelectorAll('input[name="timeMode"]').forEach(radio => {
  radio.addEventListener('change', function() {
    const customInput = document.getElementById('customTimeInput');
    customInput.style.display = this.value === 'custom' ? 'block' : 'none';
  });
});

// 起卦按鈕
document.getElementById('qiguaBtn').addEventListener('click', async () => {
  const activeMethod = document.querySelector('.tab-btn.active').dataset.method;
  
  let requestData = { method: activeMethod };
  
  if (activeMethod === 'time') {
    const timeMode = document.querySelector('input[name="timeMode"]:checked').value;
    if (timeMode === 'current') {
      requestData.datetime = new Date().toISOString();
    } else {
      requestData.datetime = document.getElementById('customDateTime').value;
    }
  } else if (activeMethod === 'number') {
    requestData.num1 = document.getElementById('num1').value;
    requestData.num2 = document.getElementById('num2').value;
    requestData.num3 = document.getElementById('num3').value || null;
  } else if (activeMethod === 'cezi') {
    requestData.character = document.getElementById('ceziChar').value;
  }
  
  // 調用統一起卦 API
  const response = await fetch('/api/meihua/qigua', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  
  const result = await response.json();
  
  if (result.success) {
    // 顯示卦象結果
    displayHexagram(result.data);
    
    // 顯示 AI 問答區
    document.getElementById('ai-section').style.display = 'block';
    
    // 保存卦象數據供 AI 使用
    window.currentMeihuaData = result.data;
  } else {
    alert('起卦失敗: ' + result.error);
  }
});

// 顯示卦象結果
function displayHexagram(data) {
  document.getElementById('hexagram-result').style.display = 'block';
  
  // 填充本卦信息
  document.getElementById('benguaName').textContent = data.bengua.name;
  document.getElementById('shangGua').textContent = data.bengua.upper;
  document.getElementById('xiaGua').textContent = data.bengua.lower;
  document.getElementById('dongYao').textContent = `第${data.bengua.dongYao}爻`;
  
  // 填充體用信息
  document.getElementById('tiGua').textContent = `${data.tigua.name} (${data.tigua.element})`;
  document.getElementById('yongGua').textContent = `${data.yonggua.name} (${data.yonggua.element})`;
  document.getElementById('wuxingRelation').textContent = data.wuxingRelation;
  
  // 填充互卦、變卦
  document.getElementById('huguaName').textContent = data.hugua.name;
  document.getElementById('bianguaName').textContent = data.biangua.name;
  
  // 繪製六爻圖形
  drawHexagramLines('benguaVisual', data.bengua.binary, data.bengua.dongYao);
}

// 繪製六爻
function drawHexagramLines(containerId, binary, dongYao) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  // 從下往上繪製 (第1爻在最下)
  for (let i = 5; i >= 0; i--) {
    const line = document.createElement('div');
    line.className = 'yao-line';
    
    if (binary[i] === '1') {
      line.classList.add('yao-yang'); // 陽爻 ━━━
    } else {
      line.classList.add('yao-yin');  // 陰爻 ━ ━
    }
    
    if (6 - i === dongYao) {
      line.classList.add('yao-changing'); // 動爻標記
    }
    
    container.appendChild(line);
  }
}

// AI 問答
document.getElementById('askAI').addEventListener('click', async () => {
  const question = document.getElementById('userQuestion').value;
  
  if (!question.trim()) {
    alert('請輸入您的問題');
    return;
  }
  
  const response = await fetch('/api/meihua/llm-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meihuaData: window.currentMeihuaData,
      userQuestion: question,
      conversationHistory: window.conversationHistory || []
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // 顯示 AI 回答
    displayAIResponse(question, result.analysis);
    
    // 更新對話歷史
    updateConversationHistory(question, result.analysis);
    
    // 清空輸入框
    document.getElementById('userQuestion').value = '';
  } else {
    alert('AI 分析失敗: ' + result.error);
  }
});

// 清除對話
document.getElementById('clearHistory').addEventListener('click', () => {
  window.conversationHistory = [];
  document.getElementById('conversationHistory').innerHTML = '';
  document.getElementById('aiResponse').innerHTML = '';
});
```

**不再需要**:
- ❌ 多個獨立頁面 (meihua-time.html, meihua-number.html, meihua-cezi.html)
- ❌ 起卦方式選擇頁面
- ❌ 複雜的頁面跳轉

**預估時間**: 2 天

---

### 2.4 梅花易數 API 路由 ⭐⭐⭐

**目標**: 在 Express 中添加梅花易數的 API 端點

**任務清單**:
- [ ] 在 `app.js` 中添加梅花易數頁面路由
- [ ] 實作統一起卦 API (`POST /api/meihua/qigua`)
- [ ] 實作 LLM 解卦 API (`POST /api/meihua/llm-analysis`)
- [ ] **實作外部調用 API (`POST /api/meihua-question`)** ⭐⭐⭐
- [ ] 返回標準化 JSON 格式
- [ ] 錯誤處理和驗證
- [ ] Discord 通知整合

**路由設計**:
```javascript
// app.js 中添加

const meihua = require('./lib/meihua');

// ========== 梅花易數頁面路由 ==========

app.get('/meihua', (req, res) => {
  res.render('meihua', {
    title: '梅花易數',
    enableLLM: !!process.env.LLM_API_KEY
  });
});

// ========== 梅花易數內部 API (供網頁使用) ==========

// 統一起卦 API
app.post('/api/meihua/qigua', (req, res) => {
  try {
    const { method, datetime, num1, num2, num3, character, timezone } = req.body;
    
    let result;
    
    if (method === 'time') {
      // 時間起卦
      const date = new Date(datetime);
      const lunar = Lunar.fromDate(date);
      
      result = meihua.qiguaByTime(
        lunar.getYear(),
        lunar.getMonth(),
        lunar.getDay(),
        date.getHours()
      );
    } else if (method === 'number') {
      // 數字起卦
      result = meihua.qiguaByNumbers(
        parseInt(num1),
        parseInt(num2),
        num3 ? parseInt(num3) : null
      );
    } else if (method === 'cezi') {
      // 測字起卦
      result = meihua.ceziQigua(character);
    } else {
      return res.status(400).json({
        success: false,
        error: '無效的起卦方式'
      });
    }
    
    res.json({
      success: true,
      data: result,
      method: method,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('起卦錯誤:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// LLM 解卦 API
app.post('/api/meihua/llm-analysis', async (req, res) => {
  try {
    const { 
      meihuaData, 
      userQuestion = '', 
      purpose = '綜合',
      conversationHistory = [], 
      lang = 'zh-tw' 
    } = req.body;
    
    if (!meihuaData) {
      return res.status(400).json({ error: '缺少梅花易數數據' });
    }

    // 發送問題到 Discord
    if (userQuestion && userQuestion.trim()) {
      const questionResult = await discordWebhook.sendUserQuestion(
        userQuestion.trim(), 
        { ...meihuaData, type: 'meihua' }
      );
      if (questionResult.success) {
        console.log('Meihua question sent to Discord successfully');
      }
    }

    // LLM 分析
    const analysisResult = await llmService.analyzeMeihua(meihuaData, {
      purpose,
      userQuestion,
      conversationHistory,
      language: lang
    });

    // 發送分析結果到 Discord
    if (analysisResult.success && analysisResult.analysis) {
      const analysisDiscordResult = await discordWebhook.sendLLMAnalysis(
        analysisResult.analysis, 
        { ...meihuaData, type: 'meihua' },
        userQuestion.trim()
      );
      if (analysisDiscordResult.success) {
        console.log('Meihua analysis sent to Discord successfully');
      }
    }

    res.json(analysisResult);
  } catch (error) {
    console.error('梅花易數 LLM 分析錯誤:', error);
    res.status(500).json({ 
      error: '分析失敗', 
      message: error.message
    });
  }
});

// ========== 梅花易數外部 API (供其他 app 調用) ==========

/**
 * 梅花易數問答 API - 遠端 POST 請求接口
 * 對應奇門遁甲的 POST /api/qimen-question
 * ⚠️ 不可修改奇門遁甲 API,此為獨立新 API
 */
app.post('/api/meihua-question', async (req, res) => {
  try {
    const {
      question,
      method = 'time',      // 起卦方式: time/number/cezi
      datetime = null,
      num1 = null,
      num2 = null,
      num3 = null,
      character = null,
      purpose = '綜合',
      timezone = '+08:00',
      lang = 'zh-tw'
    } = req.body;

    // 驗證必需參數
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: '缺少必需參數',
        message: 'question 參數是必需的且不能為空'
      });
    }

    // 設定語言
    const supportedLangs = ['zh-tw', 'zh-cn'];
    if (supportedLangs.includes(lang)) {
      i18n.setLanguage(lang);
    } else {
      i18n.setLanguage('zh-tw');
    }

    // 根據起卦方式進行計算
    let meihuaData;
    try {
      if (method === 'time') {
        // 時間起卦
        const qimenDate = APITimeHandler.generateQimenDateTime({ datetime, timezone });
        const lunar = Lunar.fromDate(qimenDate);
        
        meihuaData = meihua.qiguaByTime(
          lunar.getYear(),
          lunar.getMonth(),
          lunar.getDay(),
          qimenDate.getHours()
        );
        
        meihuaData.qiguaInfo = APITimeHandler.formatTimeInfo(qimenDate, timezone);
        
      } else if (method === 'number') {
        // 數字起卦
        if (!num1 || !num2) {
          return res.status(400).json({
            success: false,
            error: '參數驗證失敗',
            message: '數字起卦需要 num1 和 num2 參數'
          });
        }
        
        meihuaData = meihua.qiguaByNumbers(
          parseInt(num1),
          parseInt(num2),
          num3 ? parseInt(num3) : null
        );
        
      } else if (method === 'cezi') {
        // 測字起卦
        if (!character) {
          return res.status(400).json({
            success: false,
            error: '參數驗證失敗',
            message: '測字起卦需要 character 參數'
          });
        }
        
        meihuaData = meihua.ceziQigua(character);
        
      } else {
        return res.status(400).json({
          success: false,
          error: '無效的起卦方式',
          message: 'method 必須是 time, number 或 cezi'
        });
      }
    } catch (meihuaError) {
      console.error('起卦計算錯誤:', meihuaError);
      return res.status(500).json({
        success: false,
        error: '起卦計算失敗',
        message: meihuaError.message
      });
    }

    // 發送問題到 Discord
    const questionResult = await discordWebhook.sendUserQuestion(
      question.trim(), 
      { ...meihuaData, type: 'meihua', method }
    );
    let discordQuestionSent = false;
    if (questionResult.success) {
      discordQuestionSent = true;
      console.log('API meihua question sent to Discord successfully');
    }

    // LLM 分析
    let analysisResult;
    try {
      analysisResult = await llmService.analyzeMeihua(meihuaData, {
        purpose,
        userQuestion: question.trim(),
        language: lang
      });
    } catch (llmError) {
      console.error('LLM 分析錯誤:', llmError);
      return res.status(500).json({
        success: false,
        error: 'LLM 分析失敗',
        message: llmError.message,
        meihuaInfo: {
          method,
          bengua: meihuaData.bengua?.name || '未知'
        },
        discordSent: discordQuestionSent
      });
    }

    // 發送 LLM 結果到 Discord
    let discordAnalysisSent = false;
    if (analysisResult.success && analysisResult.analysis) {
      const analysisDiscordResult = await discordWebhook.sendLLMAnalysis(
        analysisResult.analysis,
        { ...meihuaData, type: 'meihua' },
        question.trim()
      );
      if (analysisDiscordResult.success) {
        discordAnalysisSent = true;
        console.log('API meihua analysis sent to Discord successfully');
      }
    }

    // 構建返回結果
    const response = {
      success: analysisResult.success,
      question: question.trim(),
      answer: analysisResult.analysis || analysisResult.fallback || '抱歉，暫時無法提供分析',
      meihuaInfo: {
        method: method,
        bengua: meihuaData.bengua?.name || '未知',
        tigua: meihuaData.tigua?.name || '未知',
        yonggua: meihuaData.yonggua?.name || '未知',
        wuxingRelation: meihuaData.wuxingRelation || '未知',
        purpose: purpose,
        ...(meihuaData.qiguaInfo || {})
      },
      metadata: {
        provider: analysisResult.provider || null,
        model: analysisResult.model || null,
        language: lang,
        apiVersion: '1.0'
      },
      discord: {
        questionSent: discordQuestionSent,
        analysisSent: discordAnalysisSent,
        enabled: discordWebhook.isEnabled()
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('梅花易數問答 API 錯誤:', error);
    res.status(500).json({
      success: false,
      error: '服務器內部錯誤',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

**API 對比**:

| 特性 | POST /api/qimen-question | POST /api/meihua-question |
|------|-------------------------|--------------------------|
| 用途 | 奇門遁甲問答 | 梅花易數問答 |
| 必需參數 | question | question |
| 起卦方式 | 固定時間排盤 | time/number/cezi |
| 時間參數 | datetime, timezone, mode | datetime, timezone |
| 數字參數 | - | num1, num2, num3 |
| 測字參數 | - | character |
| 返回數據 | qimenInfo | meihuaInfo |
| **不可修改** | ✅ 保持原樣 | ✅ 新建獨立 API |

**使用範例**:

```bash
# 時間起卦
curl -X POST http://localhost:3000/api/meihua-question \
  -H "Content-Type: application/json" \
  -d '{
    "question": "今天適合投資嗎？",
    "method": "time",
    "purpose": "財運"
  }'

# 數字起卦
curl -X POST http://localhost:3000/api/meihua-question \
  -H "Content-Type: application/json" \
  -d '{
    "question": "這個項目會成功嗎？",
    "method": "number",
    "num1": 6,
    "num2": 8,
    "purpose": "事業"
  }'

# 測字起卦
curl -X POST http://localhost:3000/api/meihua-question \
  -H "Content-Type: application/json" \
  -d '{
    "question": "我的運勢如何？",
    "method": "cezi",
    "character": "道",
    "purpose": "綜合"
  }'
```

**預估時間**: 1.5 天

---

### 2.5 梅花易數 LLM 解盤整合 ⭐⭐⭐

**目標**: 為梅花易數創建專門的 AI 解盤 prompt

**任務清單**:
- [ ] 在 `/lib/llm-analysis.js` 中添加梅花易數 prompt 模板
- [ ] 整合梅花易數的參考資料 (SKILL.md, 64gua.md 等)
- [ ] 實作梅花易數專用的 LLM API 端點
- [ ] 支援續問功能
- [ ] Discord 通知整合

**Prompt 設計**:
```javascript
// lib/llm-analysis.js 中添加

function generateMeihuaPrompt(meihuaData, userQuestion, purpose, lang) {
  const { bengua, tigua, yonggua, hugua, biangua, wuxingRelation } = meihuaData;
  
  const systemPrompt = `你是一位精通梅花易數的專業占卜師。

# 梅花易數核心原則
1. 先看爻辭,再看體用
2. 體用生克決定吉凶
3. 考慮卦氣旺衰
4. 依理推斷,不可機械套用

# 當前卦象
本卦: ${bengua.name} (第${bengua.num}卦)
- 上卦: ${bengua.upper} (${bengua.upperElement})
- 下卦: ${bengua.lower} (${bengua.lowerElement})
- 動爻: 第${bengua.dongYao}爻

體用分析:
- 體卦: ${tigua.name} (${tigua.element})
- 用卦: ${yonggua.name} (${yonggua.element})
- 生克關係: ${wuxingRelation}

互卦: ${hugua.name} (發展過程)
變卦: ${biangua.name} (最終結果)

# 用戶問題
${userQuestion}

# 占卜用途
${purpose}

請根據以上卦象,提供專業的梅花易數解讀。`;

  return systemPrompt;
}

// 新增 API 端點
app.post('/api/meihua/llm-analysis', async (req, res) => {
  try {
    const { meihuaData, userQuestion, purpose, conversationHistory } = req.body;
    
    const prompt = generateMeihuaPrompt(meihuaData, userQuestion, purpose, i18n.getCurrentLanguage());
    
    const analysis = await callLLM(prompt, conversationHistory);
    
    // Discord 通知
    if (process.env.DISCORD_WEBHOOK_URL) {
      await sendDiscordNotification({
        type: 'meihua',
        question: userQuestion,
        bengua: meihuaData.bengua.name,
        analysis: analysis
      });
    }
    
    res.json({
      success: true,
      analysis: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

**預估時間**: 1.5 天

---

## 階段三: 進階功能開發

### 3.1 測字占卜功能 ⭐⭐

**目標**: 實作梅花易數的測字法

**任務清單**:
- [ ] 研究 `meihua-yishu/references/cezi-method.md`
- [ ] 實作測字起卦算法 (筆畫、部首、字形分析)
- [ ] 創建測字輸入界面
- [ ] 整合 LLM 進行字形分析
- [ ] 支援繁簡體字

**核心邏輯**:
```javascript
// lib/meihua-cezi.js

function ceziQigua(character) {
  // 1. 計算筆畫數
  const strokes = getStrokeCount(character);
  
  // 2. 分析部首和字形
  const structure = analyzeCharacterStructure(character);
  
  // 3. 根據筆畫起卦
  const upperGua = (strokes.left || strokes.total) % 8 || 8;
  const lowerGua = (strokes.right || strokes.total) % 8 || 8;
  const dongYao = strokes.total % 6 || 6;
  
  // 4. 結合字義分析
  const meaning = getCharacterMeaning(character);
  
  return {
    character,
    strokes,
    structure,
    upperGua,
    lowerGua,
    dongYao,
    meaning
  };
}
```

**預估時間**: 2 天

---

### 3.2 外應分析功能 ⭐

**目標**: 實作環境徵兆分析 (十應)

**任務清單**:
- [ ] 研究 `shiying-guide.md` 和 `waiying-guide.md`
- [ ] 創建外應輸入界面 (聲音、顏色、人物等)
- [ ] 實作外應起卦邏輯
- [ ] 支援照片上傳分析 (使用 LLM Vision API)
- [ ] 整合到解卦流程

**照片分析功能**:
```javascript
// 使用 GPT-4 Vision 或 Claude Vision
async function analyzePhotoWaiying(imageBase64) {
  const prompt = `請分析這張照片中的外應徵兆:
  1. 主要顏色 (對應五行)
  2. 人物特徵 (老人/少女/中年男等)
  3. 動物 (如有)
  4. 物品形狀 (圓/方/尖等)
  5. 整體氛圍
  
  根據梅花易數的外應理論,提取可用於起卦的信息。`;
  
  const result = await callVisionLLM(prompt, imageBase64);
  return result;
}
```

**預估時間**: 1.5 天

---

### 3.3 方位分析頁面 (奇門遁甲) ⭐⭐

**目標**: 為奇門遁甲創建專門的方位分析功能

**任務清單**:
- [ ] 創建 `/views/location-analysis.html`
- [ ] 實作地圖顯示 (使用 Leaflet.js 或 Google Maps)
- [ ] 在地圖上標記八方位吉凶
- [ ] 提供最佳行動方向建議
- [ ] 整合到 LLM 分析

**頁面設計**:
```html
<div class="location-analysis">
  <!-- 地圖顯示 -->
  <div id="map" style="height: 400px;"></div>
  
  <!-- 方位吉凶表 -->
  <table class="direction-table">
    <tr>
      <th>方位</th>
      <th>對應宮位</th>
      <th>吉凶</th>
      <th>建議</th>
    </tr>
    <tr>
      <td>正北 ↑</td>
      <td>坎宮</td>
      <td class="ji">吉</td>
      <td>適合求財、談判</td>
    </tr>
    <!-- ... 其他方位 -->
  </table>
  
  <!-- AI 方位建議 -->
  <div class="ai-direction-advice">
    <h3>🧭 AI 方位建議</h3>
    <p id="directionAdvice"></p>
  </div>
</div>
```

**預估時間**: 1.5 天

---

### 3.4 歷史記錄功能 ⭐

**目標**: 保存用戶的排盤和占卜記錄

**任務清單**:
- [ ] 使用 localStorage 保存記錄 (前端)
- [ ] 或使用 SQLite/MongoDB 保存 (後端,可選)
- [ ] 創建歷史記錄頁面
- [ ] 支援記錄搜索和篩選
- [ ] 支援導出為 PDF 或圖片

**數據結構**:
```javascript
const record = {
  id: uuid(),
  type: 'qimen' | 'meihua',
  timestamp: new Date(),
  question: '今天適合投資嗎?',
  result: { /* 排盤結果 */ },
  aiAnalysis: '...',
  location: { lat, lng, city },
  tags: ['財運', '投資']
};
```

**預估時間**: 1 天

---

## 階段四: 優化與測試

### 4.1 UI/UX 優化 ⭐⭐

**任務清單**:
- [ ] 統一視覺風格 (奇門遁甲 + 梅花易數)
- [ ] 添加載入動畫和過渡效果
- [ ] 優化手機端體驗
- [ ] 添加引導教程 (首次使用)
- [ ] 改進錯誤提示和用戶反饋

**預估時間**: 1 天

---

### 4.2 性能優化 ⭐

**任務清單**:
- [ ] 代碼分割和懶加載
- [ ] 壓縮 CSS/JS 資源
- [ ] 圖片優化
- [ ] API 響應緩存
- [ ] 減少不必要的計算

**預估時間**: 0.5 天

---

### 4.3 測試與除錯 ⭐⭐⭐

**任務清單**:
- [ ] 單元測試 (梅花易數計算邏輯)
- [ ] 整合測試 (API 端點)
- [ ] 瀏覽器兼容性測試
- [ ] 手機端測試
- [ ] 壓力測試 (LLM API 限流)
- [ ] 修復發現的 bug

**預估時間**: 1.5 天

---

### 4.4 文檔撰寫 ⭐

**任務清單**:
- [ ] 更新 README.md
- [ ] 撰寫使用說明頁面
- [ ] API 文檔
- [ ] 開發者文檔
- [ ] 部署指南

**預估時間**: 1 天

---

## 總時間預估

| 階段 | 預估時間 |
|------|---------|
| 階段一: 基礎功能增強 | 2.5 天 |
| 階段二: 梅花易數核心開發 | 8 天 |
| 階段三: 進階功能開發 | 6 天 |
| 階段四: 優化與測試 | 4 天 |
| **總計** | **20.5 天** |

---

## 階段劃分說明

### 階段一重點 (2.5天)
- 深色模式 (0.5天)
- 導航欄設計 (0.5天)
- 靜心問事簡化 (0.5天)

### 階段二重點 (8天)
- 梅花易數計算引擎 (2天) ⭐
- 多語言支援 (0.5天)
- **主頁面開發** (2天) ⭐⭐⭐
- **API 路由 (含外部 API)** (1.5天) ⭐⭐⭐
- LLM 解盤整合 (1.5天)
- 測字功能 (0.5天,基礎版)

### 階段三重點 (6天)
- 測字占卜完整版 (2天)
- 外應分析 (1.5天)
- 方位分析 (1.5天)
- 歷史記錄 (1天)

### 階段四重點 (4天)
- UI/UX 優化 (1天)
- 性能優化 (0.5天)
- 測試除錯 (1.5天)
- 文檔撰寫 (1天)

---

## 技術棧總覽

### 後端
- Node.js + Express.js
- lunar-javascript (農曆轉換)
- LLM APIs (OpenAI/Claude/Groq/Ollama)
- Discord Webhook

### 前端
- EJS 模板引擎
- Bootstrap 5
- jQuery
- Leaflet.js (地圖)
- Chart.js (可選,用於數據視覺化)

### 新增依賴
```json
{
  "leaflet": "^1.9.4",        // 地圖顯示
  "uuid": "^9.0.0",           // 生成唯一 ID
  "canvas": "^2.11.2"         // 生成卦象圖片 (可選)
}
```

---

## 風險與挑戰

### 技術風險
1. **農曆轉換準確性**: 需要仔細測試邊界情況
2. **LLM API 穩定性**: 需要錯誤處理和重試機制


### 解決方案
1. 使用成熟的 lunar-javascript 庫,並添加單元測試
2. 實作 API 降級和備用分析
3. 允許用戶手動輸入位置

---

## 部署檢查清單

- [ ] 環境變數配置 (.env)
- [ ] LLM API Key 設定
- [ ] Discord Webhook 設定 (可選)
- [ ] 域名和 SSL 證書
- [ ] CDN 配置 (靜態資源)
- [ ] 錯誤監控 (Sentry 等)
- [ ] 備份策略

---

## 後續擴展方向

1. **更多占卜系統**: 六爻、紫微斗數、八字等
2. **社群功能**: 用戶分享占卜結果
3. **付費功能**: 高級 AI 解盤、專家諮詢
4. **移動 App**: React Native 或 Flutter
5. **API 開放平台**: 提供給第三方開發者

---

## 參考資料

- [lunar-javascript 文檔](https://github.com/6tail/lunar-javascript)
- [梅花易數 SKILL.md](meihua-yishu/SKILL.md)
- [Bootstrap 5 文檔](https://getbootstrap.com/)
- [Leaflet.js 文檔](https://leafletjs.com/)
- [OpenAI API 文檔](https://platform.openai.com/docs)

---

**版本**: v1.0  
**更新日期**: 2026-01-20  
**負責人**: David

---

## 🛑 已知問題與失敗嘗試 (Known Issues & Failed Attempts)

### 3.1 LLM 數據流脆弱性 (LLM Data Flow Fragility)
- **問題描述**: 對 `app.js` 或 `views/index.html` 進行細微修改時，極易導致 LLM 無法讀取到排盤數據 (`qimenData`)，後端日誌顯示 `qimenData` 為 undefined 或 missing。
- **失敗嘗試**: 
  - 試圖調整 body-parser 大小限制 (50mb) 但未完全解決。
  - 試圖通過前端 `console.log` 調試，發現數據在傳輸過程中丟失。
  - 需要非常謹慎地處理 `express.json()` 和 `express.urlencoded()` 的配置順序。

### 3.2 字體文件缺失 (Font 404 Errors)
- **問題描述**: 專案依賴 Bootstrap 的 Glyphicons，但 `public/fonts` 目錄缺失，導致控制台出現大量 404 錯誤 (`glyphicons-halflings-regular.woff2` 等)。
- **暫時解決方案**: 將所有 `glyphicon` 類替換為 Unicode Emoji (如 ❤️, ✨, 👁️)。
- **待解決**: 若要恢復 Glyphicons 樣式，必須重新下載並配置正確的字體文件。
