const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('塔羅模式卡片網格可收縮並容納較長徽章文字', () => {
  const css = read('public/css/divination-suite.css');
  const html = read('views/tarot.html');
  assert.match(html, /class="tarot-mode-grid"/);
  assert.match(css, /\.tarot-mode-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.tarot-mode-card\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.tarot-mode-badge\s*\{[^}]*white-space:\s*normal/s);
  assert.match(css, /@media\s*\(max-width:\s*768px\)\s*\{\s*\.tarot-mode-grid\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
});

test('紫微排盤與純排盤採相同大小且依模式切換單雙欄', () => {
  const html = read('views/ziwei.html');
  const js = read('public/js/divination-suite.js');
  const css = read('public/css/divination-suite.css');
  assert.match(html, /id="ziweiSubmitActions" class="ziwei-submit-actions single-action suite-submit-container"/);
  assert.doesNotMatch(html, /ziweiChartOnlyBtn[^>]*style=/);
  assert.match(css, /\.ziwei-submit-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.ziwei-submit-actions\s*>\s*\.btn\s*\{[^}]*min-height:\s*58px/s);
  assert.match(js, /actionRow\?\.classList\.toggle\('single-action',\s*mode\s*!==\s*'chart'\)/);
});

test('姓名分析導覽列沿用全站共用導航順序與結構', () => {
  const nameHtml = read('views/name-analysis.html');
  const tarotHtml = read('views/tarot.html');
  const nav = (html) => html.match(/<nav\b[\s\S]*?<\/nav>/)?.[0]
    .replace(/\sclass="active"/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  assert.ok(nav(nameHtml), '姓名頁應包含全站 navbar');
  assert.equal(nav(nameHtml), nav(tarotHtml));
});

test('紫微模式卡在長文字與窄螢幕下不會撐破容器', () => {
  const css = read('public/css/divination-suite.css');
  assert.match(css, /\.ziwei-mode-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.ziwei-mode-card\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.mode-card-desc\s*\{[^}]*white-space:\s*normal/s);
  assert.match(css, /\.mode-card-desc\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});

test('姓名頁沒有重複導覽留白、載入 AdSense 並提供手機廣告位', () => {
  const css = read('public/css/name-analysis.css');
  const html = read('views/name-analysis.html');
  const js = read('public/js/name-analysis.js');
  assert.match(css, /\.name-analysis\s*\{[^}]*margin:\s*0\s+auto/s);
  assert.match(html, /include\('partials\/ads-head\.html'\)/);
  assert.match(html, /include\('partials\/ads-mobile\.html'\)/);
  assert.match(html, /include\('partials\/ads-bottom\.html'\)/);
  assert.doesNotMatch(js, /\$\{esc\(style\.notice\)\}/);
  assert.match(js, /不限制可選名字，也不判斷個人性別/);
});
