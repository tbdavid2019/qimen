const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../app');

const root = path.join(__dirname, '..');
const resultPages = ['name-analysis', 'meihua', 'ziwei', 'bazi2', 'tarot', 'fengshui', 'yinyuan', 'liuyao'];

test('所有非奇門（除解答之書外）結果頁都有共用結果寄送視窗與腳本', () => {
  for (const page of resultPages) {
    const html = fs.readFileSync(path.join(root, 'views', `${page}.html`), 'utf8');
    assert.match(html, /partials\/result-email\.html/, `${page} 缺少寄送視窗`);
    assert.match(html, /js\/result-email\.js/, `${page} 缺少寄送腳本`);
  }
});

test('解答之書 views/answerbook.html 不包含寄信模組', () => {
  const html = fs.readFileSync(path.join(root, 'views/answerbook.html'), 'utf8');
  assert.ok(!html.includes('partials/result-email.html'), 'answerbook 不應包含 result-email partial');
  assert.ok(!html.includes('result-email.js'), 'answerbook 不應包含 result-email.js');
});

test('所有非奇門（除解答之書外）直達頁都能 render 並輸出可載入的共用寄送 UI', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const page of resultPages) {
    const response = await fetch(`${base}/${page}`);
    const html = await response.text();
    assert.equal(response.status, 200, `${page} 無法直接開啟`);
    assert.match(html, /suiteResultEmailDialog/, `${page} 未 render 寄送視窗`);
    assert.match(html, /src="\/js\/result-email\.js"/, `${page} 寄送腳本不是根路徑`);
  }
});

test('共用結果寄送沿用 send_email Turnstile 並記錄完整 API 結果', () => {
  const partial = fs.readFileSync(path.join(root, 'views/partials/result-email.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'public/js/result-email.js'), 'utf8');
  assert.match(partial, /action: 'send_email'/);
  assert.match(partial, /suiteResultEmailOpen/);
  assert.match(script, /\/api\/conversation\/send-email/);
  assert.match(script, /cf-turnstile-response/);
  assert.match(script, /window\.lastSuiteResult = report/);
  assert.match(script, /delete safe\.discord/);
});

test('結果寄送辨識姓名、生命靈數、純紫微盤與各服務結果端點', () => {
  const script = fs.readFileSync(path.join(root, 'public/js/result-email.js'), 'utf8');
  for (const endpoint of [
    'name-analysis', 'tarot', 'ziwei', 'meihua', 'liuyao', 'bazi2', 'fengshui', 'evaluate-layout', 'luantou', 'yinyuan', 'answerbook'
  ]) assert.ok(script.includes(endpoint), `結果寄送漏掉 ${endpoint}`);
  assert.ok(script.includes('tarot(?:\\/numerology'), '生命靈數 API 未納入結果偵測');
  assert.ok(script.includes('name-analysis(?:\\/(verify|generate)|-question)'), '姓名補充 API 未納入結果偵測');
  assert.ok(script.includes('\\/evaluate-layout|\\/luantou'), '風水格局／巒頭 API 未納入結果偵測');
  assert.ok(script.includes('ziwei(?:\\/chart'), '紫微純排盤 API 未納入結果偵測');
});

test('所有非奇門（除解答之書外）8 個模組皆包含內嵌 .js-open-result-email 寄信按鈕', () => {
  for (const page of resultPages) {
    const html = fs.readFileSync(path.join(root, 'views', `${page}.html`), 'utf8');
    assert.match(html, /js-open-result-email/, `${page} 缺少內嵌 js-open-result-email 寄信按鈕`);
  }
});

test('result-email.js 支援多輪對話歷史匯出 (conversationHistory / meihuaConversationHistory / buildSuiteEmailExportHistory) 與全域事件代理', () => {
  const script = fs.readFileSync(path.join(root, 'public/js/result-email.js'), 'utf8');
  assert.match(script, /buildSuiteEmailExportHistory/, '缺少 buildSuiteEmailExportHistory 函式或掛載');
  assert.match(script, /window\.conversationHistory/, '缺少 window.conversationHistory 對話歷史讀取');
  assert.match(script, /window\.meihuaConversationHistory/, '缺少 window.meihuaConversationHistory 對話歷史讀取');
  assert.match(script, /openSuiteResultEmailDialog/, '缺少 openSuiteResultEmailDialog 函式掛載');
  assert.match(script, /\.js-open-result-email/, '缺少 .js-open-result-email 事件代理');
});
