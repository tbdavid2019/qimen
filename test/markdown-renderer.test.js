const assert = require('node:assert/strict');
const test = require('node:test');

const MarkdownRenderer = require('../public/js/markdown-renderer');

test('將正式站格式的 GFM 表格轉成語意化 HTML', () => {
    const source = `# 一、整體運勢概覽

| 項目 | 解析 |
| --- | --- |
| 卦象 | **天（乾）上／風（巽）下** |
| 卦辭 | 女壯，勿用取女。 |`;

    const html = MarkdownRenderer.render(source);

    assert.match(html, /<h1>一、整體運勢概覽<\/h1>/);
    assert.match(html, /<div class="markdown-table-wrapper"><table>/);
    assert.match(html, /<thead><tr><th>項目<\/th><th>解析<\/th><\/tr><\/thead>/);
    assert.match(html, /<tbody>/);
    assert.match(html, /<strong>天（乾）上／風（巽）下<\/strong>/);
    assert.match(html, /<td>女壯，勿用取女。<\/td>/);
});

test('表格 delimiter 的冒號會轉成對齊 class', () => {
    const html = MarkdownRenderer.render(`| 左 | 中 | 右 |
| :--- | :---: | ---: |
| A | B | C |`);

    assert.match(html, /<th class="text-left">左<\/th>/);
    assert.match(html, /<th class="text-center">中<\/th>/);
    assert.match(html, /<th class="text-right">右<\/th>/);
    assert.match(html, /<td class="text-center">B<\/td>/);
});

test('保留標題、清單、強調與程式碼功能', () => {
    const html = MarkdownRenderer.render(`## 建議

- 保持 **彈性**
- 使用 \`小步驟\`

1. 先觀察
2. 再行動

\`\`\`
const answer = 42;
\`\`\``);

    assert.match(html, /<h2>建議<\/h2>/);
    assert.match(html, /<ul><li>保持 <strong>彈性<\/strong><\/li><li>使用 <code>小步驟<\/code><\/li><\/ul>/);
    assert.match(html, /<ol><li>先觀察<\/li><li>再行動<\/li><\/ol>/);
    assert.match(html, /<pre><code>const answer = 42;<\/code><\/pre>/);
});

test('不完整的表格語法維持一般文字', () => {
    const html = MarkdownRenderer.render(`| 項目 | 解析 |
| 這不是 delimiter |`);

    assert.doesNotMatch(html, /<table>/);
    assert.match(html, /<p>\| 項目 \| 解析 \|<\/p>/);
});

test('原始 HTML 與事件屬性會被 escape', () => {
    const html = MarkdownRenderer.render('<script>alert(1)</script><img src=x onerror=alert(2)>');

    assert.doesNotMatch(html, /<script|<img/i);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.match(html, /&lt;img src=x onerror=alert\(2\)&gt;/);
});
