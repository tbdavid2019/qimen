const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../app');

const root = path.join(__dirname, '..');
const resultPages = ['name-analysis', 'meihua', 'ziwei', 'bazi2', 'tarot', 'fengshui', 'yinyuan', 'answerbook'];

test('所有非奇門結果頁都有共用結果寄送視窗與腳本', () => {
  for (const page of resultPages) {
    const html = fs.readFileSync(path.join(root, 'views', `${page}.html`), 'utf8');
    assert.match(html, /partials\/result-email\.html/, `${page} 缺少寄送視窗`);
    assert.match(html, /js\/result-email\.js/, `${page} 缺少寄送腳本`);
  }
});

test('所有非奇門直達頁都能 render 並輸出可載入的共用寄送 UI', async (t) => {
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
    'name-analysis', 'tarot', 'ziwei', 'meihua', 'bazi2', 'fengshui', 'evaluate-layout', 'luantou', 'yinyuan', 'answerbook'
  ]) assert.ok(script.includes(endpoint), `結果寄送漏掉 ${endpoint}`);
  assert.ok(script.includes('tarot(?:\\/numerology'), '生命靈數 API 未納入結果偵測');
  assert.ok(script.includes('name-analysis(?:\\/(verify|generate)|-question)'), '姓名補充 API 未納入結果偵測');
  assert.ok(script.includes('\\/evaluate-layout|\\/luantou'), '風水格局／巒頭 API 未納入結果偵測');
  assert.ok(script.includes('ziwei(?:\\/chart'), '紫微純排盤 API 未納入結果偵測');
});
