# Shared Markdown Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render safe, responsive GFM-style tables and the existing Markdown subset consistently in Qimen and Meihua LLM answers.

**Architecture:** Add one dependency-free UMD renderer under `public/js` so Node tests and both browser pages execute identical code. Replace the two page-specific rendering paths, centralize `.markdown-body` styles, and keep API payloads unchanged.

**Tech Stack:** Browser JavaScript, CommonJS-compatible UMD, Node.js built-in test runner, jQuery, Bootstrap 3, Vercel Git deployment

---

### Task 1: Build the safe renderer with TDD

**Files:**
- Create: `test/markdown-renderer.test.js`
- Create: `public/js/markdown-renderer.js`

- [x] **Step 1: Write failing renderer tests**

Import `../public/js/markdown-renderer` and assert the production-shaped input:

```js
const source = `# 一、整體運勢概覽

| 項目 | 解析 |
| --- | --- |
| 卦象 | **天（乾）上／風（巽）下** |
| 卦辭 | 女壯，勿用取女。 |`;

const html = MarkdownRenderer.render(source);
assert.match(html, /<h1>一、整體運勢概覽<\/h1>/);
assert.match(html, /<div class="markdown-table-wrapper"><table>/);
assert.match(html, /<thead><tr><th>項目<\/th><th>解析<\/th><\/tr><\/thead>/);
assert.match(html, /<strong>天（乾）上／風（巽）下<\/strong>/);
```

Add separate tests for ordered/unordered lists, fenced/inline code, malformed table-like text remaining a paragraph, `:---:` alignment classes, and HTML escaping:

```js
const unsafe = MarkdownRenderer.render('<script>alert(1)</script><img src=x onerror=alert(2)>');
assert.doesNotMatch(unsafe, /<script|<img/i);
assert.match(unsafe, /&lt;script&gt;/);
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `node --test test/markdown-renderer.test.js`

Expected: FAIL because `public/js/markdown-renderer.js` does not exist.

- [x] **Step 3: Implement the renderer**

Create a UMD module that exports the same API to browsers and Node:

```js
(function(root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.MarkdownRenderer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function() {
    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function render(markdown) {
        return renderBlocks(String(markdown || '').split(/\r?\n/));
    }

    return { escapeHtml: escapeHtml, render: render };
}));
```

Implement block parsing for fenced code, valid header/delimiter pipe tables, headings, consecutive ordered/unordered lists, and paragraphs. Escape input before inserting it. Apply inline code, bold, and italic only to escaped text. Table delimiter cells must match `^:?-{3,}:?$`; emit `text-left`, `text-center`, or `text-right` classes from colon markers.

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `node --test test/markdown-renderer.test.js`

Expected: all renderer and XSS assertions pass.

### Task 2: Integrate both pages with TDD

**Files:**
- Create: `test/markdown-integration.test.js`
- Modify: `views/index.html`
- Modify: `views/meihua.html`
- Modify: `public/js/app.js`
- Modify: `public/js/meihua.js`

- [x] **Step 1: Write failing integration assertions**

Read the templates and page scripts as text. Assert both templates contain `js/markdown-renderer.js` before their page-specific script; assert Qimen analysis and conversation calls `MarkdownRenderer.render`; assert Meihua calls it and no longer declares `function parseMarkdown`.

```js
assert.ok(indexHtml.indexOf('js/markdown-renderer.js') < indexHtml.indexOf('js/app.js'));
assert.ok(meihuaHtml.indexOf('js/markdown-renderer.js') < meihuaHtml.indexOf('js/meihua.js'));
assert.match(appJs, /MarkdownRenderer\.render\(response\.analysis\)/);
assert.match(meihuaJs, /MarkdownRenderer\.render\(msg\.content\)/);
assert.doesNotMatch(meihuaJs, /function parseMarkdown/);
```

- [x] **Step 2: Run integration tests and verify RED**

Run: `node --test test/markdown-integration.test.js`

Expected: FAIL because neither template loads the renderer and the scripts still use independent conversions.

- [x] **Step 3: Replace Qimen rendering paths**

Load `js/markdown-renderer.js` immediately before `js/app.js`. Add `markdown-body` to `#llmAnalysisContent`. Use `MarkdownRenderer.render(response.analysis)` for the initial answer and assistant conversation messages, `MarkdownRenderer.render(response.fallback || '請稍後再試。')` for fallback text, and `MarkdownRenderer.escapeHtml(msg.content)` for user messages.

- [x] **Step 4: Replace Meihua rendering paths**

Load `js/markdown-renderer.js` immediately before `js/meihua.js`. Replace `parseMarkdown(msg.content)` with `MarkdownRenderer.render(msg.content)`, replace local user escaping with `MarkdownRenderer.escapeHtml(msg.content)`, then remove the local `escapeHtml`, `parseMarkdown`, and `inlineMarkdown` functions.

- [x] **Step 5: Run integration and renderer tests**

Run: `node --test test/markdown-renderer.test.js test/markdown-integration.test.js`

Expected: both test files pass.

### Task 3: Add shared responsive table styling with TDD

**Files:**
- Modify: `test/markdown-integration.test.js`
- Modify: `public/css/style-new.css`
- Modify: `public/css/meihua.css`
- Modify: `public/css/dark-mode.css`

- [x] **Step 1: Add failing CSS integration assertions**

Assert `style-new.css` contains shared selectors for `.markdown-body table`, `.markdown-body th`, `.markdown-body td`, and `.markdown-table-wrapper`; assert dark mode defines table header/cell colors; assert the old general `.markdown-body` block has been removed from `meihua.css`.

- [x] **Step 2: Run the integration test and verify RED**

Run: `node --test test/markdown-integration.test.js`

Expected: FAIL because shared table styles do not exist.

- [x] **Step 3: Centralize Markdown styles**

Move the existing heading, paragraph, list, code, and preformatted styles from `meihua.css` into `style-new.css`. Add:

```css
.markdown-table-wrapper { width: 100%; overflow-x: auto; margin: 12px 0; }
.markdown-body table { width: 100%; min-width: 560px; border-collapse: collapse; background: #fff; }
.markdown-body th,
.markdown-body td { border: 1px solid #d7dce1; padding: 10px 12px; vertical-align: top; }
.markdown-body th { background: #eef3f7; font-weight: 700; white-space: nowrap; }
```

Use existing Bootstrap alignment classes emitted by the renderer. Add dark-mode table background and border overrides. Do not alter surrounding panel or navigation styles.

- [x] **Step 4: Run focused and complete tests**

Run: `node --test test/markdown-renderer.test.js test/markdown-integration.test.js`

Run: `npm test`

Run: `TZ=UTC npm test`

Expected: all tests pass in both host timezones.

### Task 4: Document, publish, and verify production

**Files:**
- Modify: `docs/2026-07-22-refactoring-todo.md`
- Modify: `docs/changelog.md`
- Modify: `docs/superpowers/plans/2026-07-22-shared-markdown-renderer.md`

- [x] **Step 1: Record P1.5 completion**

Add the shared renderer, GFM table, responsive layout, and XSS regression evidence to TODO and changelog. Record exact test totals.

- [x] **Step 2: Run final verification**

Run syntax checks for all changed JavaScript files, `npm audit --audit-level=low`, and `git diff --check`. Re-run the complete suite immediately before commit.

- [ ] **Step 3: Commit and push `main`**

Commit only intended renderer, integration, styling, test, and documentation files. Push `origin main` to trigger Vercel.

- [ ] **Step 4: Verify Vercel**

Confirm `/js/markdown-renderer.js`, `/`, and `/meihua` return HTTP 200. Confirm both production HTML pages load the shared renderer before their page script. If the browser surface is available, render or trigger the production table example and inspect layout plus console errors; otherwise report the visual-browser limitation separately from the verified asset and integration evidence.
