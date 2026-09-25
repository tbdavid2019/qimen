const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('紫微頁提供獨立免 AI 排盤按鈕，且只在一般排盤模式顯示', () => {
  const html = fs.readFileSync(path.join(root, 'views/ziwei.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'public/js/divination-suite.js'), 'utf8');
  assert.match(html, /id="ziweiChartOnlyBtn"[^>]*type="button"|type="button"[^>]*id="ziweiChartOnlyBtn"/);
  assert.match(html, /只排命盤（不使用 AI）/);
  assert.match(js, /fetch\('\/api\/ziwei\/chart'/);
  assert.match(js, /JSON\.stringify\(\{ \.\.\.payload, skipRecord: true \}\)/);
  assert.match(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), /const discord = skipRecord \? null : await sendModuleRecord\('紫微斗數', validated, chart\)/);
  assert.match(js, /if \(chartOnlyButton && mode !== 'chart'\) chartOnlyButton\.hidden = true/);
});

test('WebMCP 提供紫微純排盤工具', () => {
  const webmcp = fs.readFileSync(path.join(root, 'public/js/webmcp.js'), 'utf8');
  assert.match(webmcp, /ziwei_chart_only: createSuiteTool\([\s\S]*?"\/api\/ziwei\/chart"/);
  assert.match(webmcp, /toolDefinitions\.ziwei_chart_only/);
});

test('紫微頁載入安全 Markdown renderer，再載入服務邏輯', () => {
  const html = fs.readFileSync(path.join(root, 'views/ziwei.html'), 'utf8');
  const renderer = html.indexOf('/js/markdown-renderer.js');
  const suite = html.indexOf('/js/divination-suite.js');
  const js = fs.readFileSync(path.join(root, 'public/js/divination-suite.js'), 'utf8');
  assert.ok(renderer >= 0 && suite > renderer);
  assert.match(js, /window\.MarkdownRenderer\.render\(text\)/);
});
