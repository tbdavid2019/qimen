const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('奇門頁在頁面程式前載入共用 renderer', () => {
    const html = read('views/index.html');
    const rendererIndex = html.indexOf('js/markdown-renderer.js');
    const appIndex = html.indexOf('js/app.js');

    assert.ok(rendererIndex >= 0, '缺少 markdown-renderer.js');
    assert.ok(rendererIndex < appIndex, 'renderer 必須先於 app.js 載入');
    assert.match(html, /id="llmAnalysisContent" class="[^"]*markdown-body/);
});

test('梅花頁在頁面程式前載入共用 renderer', () => {
    const html = read('views/meihua.html');
    const rendererIndex = html.indexOf('js/markdown-renderer.js');
    const appIndex = html.indexOf('js/meihua.js');

    assert.ok(rendererIndex >= 0, '缺少 markdown-renderer.js');
    assert.ok(rendererIndex < appIndex, 'renderer 必須先於 meihua.js 載入');
});

test('奇門初始分析與對話共用安全 renderer', () => {
    const source = read('public/js/app.js');

    assert.match(source, /MarkdownRenderer\.render\(response\.analysis\)/);
    assert.match(source, /MarkdownRenderer\.render\(msg\.content\)/);
    assert.match(source, /MarkdownRenderer\.escapeHtml\(msg\.content\)/);
});

test('梅花對話使用共用 renderer 並移除本地 parser', () => {
    const source = read('public/js/meihua.js');

    assert.match(source, /MarkdownRenderer\.render\(msg\.content\)/);
    assert.match(source, /MarkdownRenderer\.escapeHtml\(msg\.content\)/);
    assert.doesNotMatch(source, /function parseMarkdown/);
    assert.doesNotMatch(source, /function inlineMarkdown/);
});

test('共用樣式提供響應式表格且梅花不再重複定義 Markdown 樣式', () => {
    const sharedCss = read('public/css/style-new.css');
    const meihuaCss = read('public/css/meihua.css');

    assert.match(sharedCss, /\.markdown-table-wrapper\s*\{/);
    assert.match(sharedCss, /\.markdown-body table\s*\{/);
    assert.match(sharedCss, /\.markdown-body th[\s\S]*\.markdown-body td\s*\{/);
    assert.match(sharedCss, /min-width:\s*560px/);
    assert.doesNotMatch(meihuaCss, /\.markdown-body h1/);
});

test('深色模式有 Markdown 表格的配色與邊框', () => {
    const darkCss = read('public/css/dark-mode.css');

    assert.match(darkCss, /\[data-theme="dark"\] \.markdown-body table\s*\{/);
    assert.match(darkCss, /\[data-theme="dark"\] \.markdown-body th\s*\{/);
    assert.match(darkCss, /border-color:\s*#46535d/);
});
