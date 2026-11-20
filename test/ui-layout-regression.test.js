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

const ALL_VIEWS = [
  'views/index.html',
  'views/bazi2.html',
  'views/fengshui.html',
  'views/liuyao.html',
  'views/meihua.html',
  'views/name-analysis.html',
  'views/tarot.html',
  'views/wellness.html',
  'views/answerbook.html',
  'views/cezi.html',
  'views/yinyuan.html',
  'views/ziwei.html'
];

test('全站 12 個頁面模板均在 head 正確載入 color-scheme 與 byok.css（footer 不重複載入）', () => {
  for (const file of ALL_VIEWS) {
    const html = read(file);
    const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
    assert.ok(headMatch, `${file} 應包含 <head>`);
    const head = headMatch[1];
    assert.match(head, /<meta name="color-scheme" content="light dark">/i, `${file} 缺少 color-scheme meta`);
    const byokIdx = head.indexOf('byok.css');
    const atelierIdx = head.indexOf('theme-atelier.css');
    assert.ok(byokIdx !== -1, `${file} 的 <head> 應載入 byok.css`);
    assert.ok(atelierIdx !== -1 && byokIdx < atelierIdx, `${file} 的 byok.css 應位於 theme-atelier.css 之前`);
  }
  const footerHtml = read('views/partials/site-footer.html');
  assert.doesNotMatch(footerHtml, /byok\.css/, 'site-footer.html 不應再於 body 尾端載入 byok.css');
});

test('全站頁面與共用 Modal 的標題層級順序連貫（無跳階 h1->h3/h4）', () => {
  for (const file of ALL_VIEWS) {
    const html = read(file).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    const levels = Array.from(html.matchAll(/<h([1-6])\b/gi)).map(m => Number(m[1]));
    assert.ok(levels.length > 0 && levels[0] === 1, `${file} 第一個標題應為 h1`);
    for (let i = 1; i < levels.length; i++) {
      assert.ok(levels[i] - levels[i - 1] <= 1, `${file} 存在跳階標題: h${levels[i - 1]} -> h${levels[i]}`);
    }
  }
  const byokModal = read('views/partials/byok-modal.html');
  assert.match(byokModal, /<h2\b[^>]*id="byokModalTitle"/);
  assert.doesNotMatch(byokModal, /<h4\b/);
  const emailModal = read('views/partials/result-email.html');
  assert.match(emailModal, /<h2\b/);
});

test('專案 CSS 與 inline style 已移除 transition: all 與 outline: none，並保留促銷卡視覺識別', () => {
  const cssFiles = [
    'public/css/bootstrap.min.css',
    'public/css/theme-atelier.css',
    'public/css/style-new.css',
    'public/css/style.css',
    'public/css/divination-suite.css',
    'public/css/meihua.css',
    'public/css/liuyao.css',
    'public/css/byok.css',
    'public/css/name-analysis.css'
  ];
  for (const file of cssFiles) {
    const css = read(file);
    assert.doesNotMatch(css, /transition:\s*all\b/i, `${file} 不應含 transition: all`);
    if (file !== 'public/css/bootstrap.min.css') {
      assert.doesNotMatch(css, /outline:\s*none\b/i, `${file} 不應含 outline: none`);
    }
  }
  for (const file of ALL_VIEWS) {
    const html = read(file);
    assert.doesNotMatch(html, /transition:\s*all\b/i, `${file} inline style 不應含 transition: all`);
    assert.doesNotMatch(html, /outline:\s*none\b/i, `${file} inline style 不應含 outline: none`);
  }
});

test('前端 JS 已清除阻斷式 alert() 並具備完整 IME 防護、表單錯誤聚焦與 toReversed fallback', () => {
  const jsFiles = fs.readdirSync(path.join(__dirname, '..', 'public', 'js'))
    .filter(f => f.endsWith('.js') && f !== 'ie-emulation-modes-warning.js');
  for (const f of jsFiles) {
    const code = read(path.join('public/js', f));
    assert.doesNotMatch(code, /\balert\(/, `public/js/${f} 不應保留阻塞式 alert()`);
  }
  const liuyaoJs = read('public/js/liuyao.js');
  assert.match(liuyaoJs, /e\.isComposing\s*\|\|\s*e\.keyCode\s*===\s*229/);
  assert.match(liuyaoJs, /typeof\s+\w+\.lines\.toReversed\s*===\s*'function'/);
  const appJs = read('public/js/app.js');
  assert.match(appJs, /#userQuestion'\)\.on\('keydown'/);
  assert.match(appJs, /oe\.isComposing/);
  assert.match(appJs, /window\.showSuiteFieldError\(/);
  const meihuaJs = read('public/js/meihua.js');
  assert.match(meihuaJs, /window\.showSuiteFieldError\(/);
});

test('theme.js 的 applySuiteTheme 與 showToast 具備 XSS 防護與 color-scheme 同步', () => {
  const prevWin = global.window;
  const prevDoc = global.document;
  const prevLS = global.localStorage;
  const store = new Map();
  const rootAttrs = new Map();
  const metaEl = { attrs: new Map([['content', 'light dark']]), setAttribute(k, v) { this.attrs.set(k, v); } };
  const btnEl = {
    attrs: new Map(),
    setAttribute(k, v) { this.attrs.set(k, v); },
    getAttribute(k) { return this.attrs.get(k) ?? null; },
    querySelector: () => null,
    addEventListener: () => {}
  };
  const createdNodes = [];
  function makeNode(tag) {
    const node = {
      tagName: tag.toUpperCase(),
      className: '',
      children: [],
      attrs: new Map(),
      _text: '',
      _innerHtmlWasSet: false,
      setAttribute(k, v) { this.attrs.set(k, v); },
      appendChild(c) { this.children.push(c); return c; },
      addEventListener() {},
      classList: { contains: () => false, add() {} },
      set innerHTML(v) { this._innerHtmlWasSet = true; },
      set textContent(v) { this._text = String(v); },
      get textContent() { return this._text; }
    };
    createdNodes.push(node);
    return node;
  }
  const bodyChildren = [];
  global.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  global.window = {
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    addEventListener: () => {}
  };
  global.document = {
    readyState: 'complete',
    documentElement: {
      setAttribute: (k, v) => rootAttrs.set(k, v),
      getAttribute: (k) => rootAttrs.get(k) ?? null,
      removeAttribute: (k) => rootAttrs.delete(k)
    },
    body: { appendChild: (el) => { bodyChildren.push(el); return el; } },
    querySelector: (sel) => sel === 'meta[name="color-scheme"]' ? metaEl : null,
    getElementById: (id) => {
      if (id === 'darkModeToggle') return btnEl;
      return createdNodes.find(n => n.id === id) || null;
    },
    querySelectorAll: () => [],
    createElement: makeNode,
    addEventListener: () => {}
  };

  try {
    delete require.cache[require.resolve('../public/js/theme.js')];
    require('../public/js/theme.js');
    global.window.applySuiteTheme('dark', { persist: true });
    assert.equal(rootAttrs.get('data-theme'), 'dark');
    assert.equal(metaEl.attrs.get('content'), 'dark');
    assert.equal(btnEl.attrs.get('aria-pressed'), 'true');
    assert.equal(store.get('theme'), 'dark');

    global.window.showToast('<script>alert(1)</script>', 'warning');
    const textSpan = createdNodes.find(n => n.className === 'toast-text');
    assert.ok(textSpan, 'showToast 應建立 .toast-text 元素');
    assert.equal(textSpan.textContent, '<script>alert(1)</script>');
    assert.equal(textSpan._innerHtmlWasSet, false, 'showToast 不得透過 innerHTML 寫入訊息');
  } finally {
    if (prevWin === undefined) delete global.window; else global.window = prevWin;
    if (prevDoc === undefined) delete global.document; else global.document = prevDoc;
    if (prevLS === undefined) delete global.localStorage; else global.localStorage = prevLS;
  }
});

test('首頁輪播、AdSense 防護與風水漸進式篩選維持規格完整性', () => {
  const indexHtml = read('views/index.html');
  assert.match(indexHtml, /aria-roledescription="carousel"/);
  assert.match(indexHtml, /id="homeCarouselPause"/);
  assert.match(indexHtml, /id="homeCarouselStatus"[^>]*role="status"/);

  const adsMobile = read('views/partials/ads-mobile.html');
  const adsBottom = read('views/partials/ads-bottom.html');
  assert.match(adsMobile, /__initSuiteAds/);
  assert.match(adsMobile, /dataset\.adsInitialized/);
  assert.match(adsBottom, /__initSuiteAds/);

  const fengshuiHtml = read('views/fengshui.html');
  const facingSelect = fengshuiHtml.match(/<select[^>]*id="fengshuiFacing"[\s\S]*?<\/select>/)?.[0] || '';
  const facingOptions = facingSelect.match(/<option\s+value=/g) || [];
  assert.equal(facingOptions.length, 32, '房屋朝向須完整保留 8 方位 + 24 山共 32 個選項');
  const shaSelect = fengshuiHtml.match(/<select[^>]*id="shaType"[\s\S]*?<\/select>/)?.[0] || '';
  const shaOptions = shaSelect.match(/<option\s+value=/g) || [];
  assert.equal(shaOptions.length, 24, '煞氣形態須完整保留外局 14 + 內局 10 共 24 個選項');
  const fengshuiJs = read('public/js/fengshui.js');
  assert.match(fengshuiJs, /syncFengshuiSelectorFilters/);
});

test('AdSense 冪等懶加載僅在可見寬度 > 0 時建立 ins 並在斷點切換或錯誤時安全恢復', () => {
  const vm = require('node:vm');
  const adsMobile = read('views/partials/ads-mobile.html');
  const scriptSrc = adsMobile.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(scriptSrc, 'ads-mobile.html 應包含內嵌初始化腳本');

  let slotVisible = false;
  let throwOnPush = false;
  let pushedCount = 0;
  const resizeListeners = [];
  const slotChildren = [];
  const slotEl = {
    dataset: {},
    attrs: new Map([
      ['data-ad-style', 'display:block'],
      ['data-ad-client', 'ca-pub-test'],
      ['data-ad-slot', '12345']
    ]),
    get offsetWidth() { return slotVisible ? 320 : 0; },
    getBoundingClientRect() { return { width: slotVisible ? 320 : 0 }; },
    getAttribute(k) { return this.attrs.get(k) || ''; },
    appendChild(node) { node.parentNode = this; slotChildren.push(node); },
    removeChild(node) {
      const i = slotChildren.indexOf(node);
      if (i !== -1) slotChildren.splice(i, 1);
      node.parentNode = null;
    }
  };
  slotEl.parentElement = { id: 'ad-mobile-wrap' };

  const sandbox = {
    window: {
      adsbygoogle: {
        push() {
          if (throwOnPush) throw new Error('blocked');
          pushedCount++;
        }
      },
      addEventListener(ev, fn) { if (ev === 'resize') resizeListeners.push(fn); },
      removeEventListener(ev, fn) {
        const i = resizeListeners.indexOf(fn);
        if (i !== -1) resizeListeners.splice(i, 1);
      }
    },
    document: {
      querySelectorAll: (sel) => sel === '.suite-ad-slot' ? [slotEl] : [],
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        attrs: new Map(),
        setAttribute(k, v) { this.attrs.set(k, v); }
      })
    },
    Set
  };
  sandbox.window.window = sandbox.window;

  vm.runInNewContext(scriptSrc, sandbox);
  // 隱藏狀態不應建立 ins 也不得 push
  assert.equal(slotChildren.length, 0);
  assert.equal(pushedCount, 0);
  assert.equal(resizeListeners.length, 1);

  // 若 push 拋錯，不得留下殘留 ins 或鎖死 adsInitialized
  slotVisible = true;
  throwOnPush = true;
  resizeListeners[0]();
  assert.equal(slotChildren.length, 0);
  assert.equal(slotEl.dataset.adsInitialized, undefined);
  assert.equal(pushedCount, 0);

  // 恢復正常後切換可見斷點只建立 1 個 ins 並 push 1 次，且自動移除監聽
  throwOnPush = false;
  resizeListeners[0]();
  assert.equal(slotChildren.length, 1);
  assert.equal(slotEl.dataset.adsInitialized, '1');
  assert.equal(pushedCount, 1);
  assert.equal(resizeListeners.length, 0);

  // 重複呼叫不會重複 push
  sandbox.window.__initSuiteAds();
  assert.equal(pushedCount, 1);
});

test('風水漸進式篩選切換不會清空既有選項且支援選單/羅盤雙向同步膠囊', async () => {
  const vm = require('node:vm');
  const fengshuiJs = read('public/js/fengshui.js');
  const makeBtn = (group) => {
    const attrs = new Map([['data-fs-target', 'fengshuiFacing'], ['data-fs-group', group]]);
    const cls = new Set(group === 'all' ? ['active'] : []);
    return {
      getAttribute: (k) => attrs.get(k) || null,
      setAttribute: (k, v) => attrs.set(k, v),
      closest: () => filterBar,
      addEventListener(ev, fn) { if (ev === 'click') this._onClick = fn; },
      classList: {
        toggle: (c, f) => f ? cls.add(c) : cls.delete(c),
        contains: (c) => cls.has(c)
      },
      _attrs: attrs
    };
  };
  const btns = [makeBtn('all'), makeBtn('常用 8 大朝向'), makeBtn('精確 24 山坐向')];
  const filterBar = { querySelectorAll: () => btns };
  const makeOpt = (val, group, sel) => ({ value: val, selected: !!sel, hidden: false, parentElement: group });
  const g8 = { tagName: 'OPTGROUP', hidden: false, getAttribute: () => '常用 8 大朝向', querySelectorAll: () => g8Opts };
  const g24 = { tagName: 'OPTGROUP', hidden: false, getAttribute: () => '精確 24 山坐向', querySelectorAll: () => g24Opts };
  const g8Opts = [makeOpt('南', g8, true), makeOpt('北', g8, false)];
  const g24Opts = [makeOpt('子山午向', g24, false)];
  const allOpts = [...g8Opts, ...g24Opts];
  const selectEl = {
    options: allOpts,
    selectedIndex: 0,
    querySelectorAll: (sel) => sel === 'optgroup' ? [g8, g24] : [],
    addEventListener(ev, fn) { if (ev === 'change') this._onChange = fn; }
  };

  let readyCb = null;
  const sandbox = {
    window: {},
    document: {
      readyState: 'loading',
      addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') readyCb = fn; },
      getElementById: (id) => id === 'fengshuiFacing' ? selectEl : null,
      querySelector: (sel) => sel === '[data-fs-target="fengshuiFacing"]' ? btns[0] : null,
      querySelectorAll: (sel) => sel === '.fs-selector-filter-btn' ? btns : []
    },
    fetch: async () => ({ ok: false }),
    Array, Set, Map, JSON, Math, Number, Infinity, Promise, console, setTimeout, clearTimeout
  };
  vm.runInNewContext(fengshuiJs, sandbox);
  if (readyCb) await readyCb();

  // 先選「子山午向」（位於 24 山群組），再點選「常用 8 大方位」篩選膠囊：既有選擇不得清空且必須保持可見
  g8Opts[0].selected = false;
  g24Opts[0].selected = true;
  selectEl.selectedIndex = 2;
  btns[1]._onClick();
  assert.equal(selectEl.selectedIndex, 2);
  assert.equal(g24Opts[0].hidden, false, '已選取項目不得因切換篩選而被隱藏');
  assert.equal(btns[1].classList.contains('active'), true);

  // 原生下拉選單變更事件應反向將活躍膠囊同步回選中項目所屬群組「精確 24 山坐向」
  selectEl._onChange();
  assert.equal(btns[2].classList.contains('active'), true);
  assert.equal(btns[1].classList.contains('active'), false);
});

test('全站共用 footer 包含右下角功能錯誤通報按鈕導向 david888.com 且與寄送結果浮動鈕避讓', () => {
  const footer = read('views/partials/site-footer.html');
  const bugPartial = read('views/partials/bug-report.html');
  const atelierCss = read('public/css/theme-atelier.css');

  assert.match(footer, /include\('bug-report\.html'\)/);
  assert.match(bugPartial, /id="suiteBugReportBtn"/);
  assert.match(bugPartial, /href="https:\/\/david888\.com"/);
  assert.match(bugPartial, /target="_blank"/);
  assert.match(bugPartial, /rel="noopener noreferrer"/);
  assert.match(bugPartial, /功能錯誤通報/);

  for (const file of ALL_VIEWS) {
    assert.match(read(file), /partials\/site-footer\.html/, `${file} 應載入 site-footer.html`);
  }

  assert.match(atelierCss, /\.suite-bug-report-btn\s*\{[^}]*position:\s*fixed/s);
  assert.match(atelierCss, /body\.has-suite-email-result\s+\.suite-bug-report-btn\s*\{[^}]*bottom:\s*calc\(74px/s);
});

test('result-email FallbackFormatter 產出可被伺服器 isRawJsonPayload 辨識並美化的純 JSON 字串', () => {
  const { isRawJsonPayload, formatHumanReadableReport } = require('../lib/email-formatter');
  const resultEmailJs = read('public/js/result-email.js');
  const fnMatch = resultEmailJs.match(/formatHumanReadableReport\(_service,\s*data,\s*opts\s*=\s*\{\}\)\s*\{[\s\S]*?\n\s*\},/);
  assert.ok(fnMatch, '應存在 FallbackFormatter.formatHumanReadableReport');

  const payload = { date: '2026-11-20', time: '14:00', summary: '測試結果' };
  const fallbackFn = new Function('service', 'data', 'opts = {}', fnMatch[0].replace(/^formatHumanReadableReport\([^)]*\)\s*\{/, '').replace(/\},$/, ''));
  const output = fallbackFn('奇門遁甲', payload, {});
  assert.equal(isRawJsonPayload(output), true);
  assert.match(formatHumanReadableReport('奇門遁甲', output), /測試結果/);
});
