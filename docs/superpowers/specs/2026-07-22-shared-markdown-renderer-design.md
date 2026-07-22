# Shared Markdown Renderer Design

## Goal

Render LLM answers consistently on the Qimen and Meihua pages, including the GFM-style tables shown in production, without changing any API request or response contract.

## Root Cause

The project has no Markdown package. Meihua uses a local `parseMarkdown()` implementation that supports headings, lists, fenced code, and basic inline emphasis but treats table rows as paragraphs. Qimen uses separate string replacements that only strip HTML and convert newlines to `<br>`. The two paths therefore produce different and incomplete output.

## Options Considered

1. **Shared dependency-free renderer (chosen).** Extract the safe subset already used by Meihua, add GFM tables, and expose the same renderer to Node tests and both browser pages. This has the smallest deployment and supply-chain surface.
2. **Marked plus DOMPurify.** Provides broader CommonMark/GFM support, but this project has no frontend bundler and would need vendored browser distributions or a runtime CDN dependency.
3. **Server-side Markdown HTML.** Centralizes conversion but adds HTML to API responses and complicates conversation history, making it a larger API and architecture change.

## Architecture

Create `public/js/markdown-renderer.js` as a small UMD-style module:

```js
MarkdownRenderer.render(markdown)
MarkdownRenderer.escapeHtml(text)
```

In a browser it is available as `window.MarkdownRenderer`. Under Node.js it is exported with `module.exports`, allowing the exact production renderer to be tested without jsdom or a duplicate implementation.

The renderer supports:

- headings levels 1 through 4;
- paragraphs and blank-line spacing;
- ordered and unordered lists;
- fenced code blocks and inline code;
- bold and italic emphasis;
- GFM pipe tables with delimiter rows and optional alignment markers.

Raw HTML, links, and images remain unsupported in this focused change. All source text is HTML-escaped before Markdown markup is generated, so LLM output cannot inject tags, event handlers, or scripts.

## Table Rendering

A table is recognized only when a pipe-containing header row is immediately followed by a valid delimiter row such as:

```markdown
| 項目 | 解析 |
| --- | --- |
```

The renderer produces semantic `<table>`, `<thead>`, `<tbody>`, `<th>`, and `<td>` elements inside `.markdown-table-wrapper`. Cells retain inline emphasis and code formatting. Malformed table-like text remains a normal paragraph rather than being guessed into a table.

## UI Integration

Both `views/index.html` and `views/meihua.html` load `markdown-renderer.js` before their page script.

- Qimen initial analysis, follow-up answers, and fallback content call the shared renderer.
- Meihua conversation answers call the shared renderer, and the old local parser is removed.
- User-authored questions continue to use `escapeHtml` and are never interpreted as Markdown.

Shared `.markdown-body` styles live in `public/css/style-new.css`, which both pages already load. Tables use full available width, visible cell borders, distinct header background, comfortable padding, and a horizontal scroll wrapper on narrow screens. Dark-mode colors are defined in `public/css/dark-mode.css`.

## Testing

Automated tests import the browser renderer directly and verify:

- the production table example becomes semantic table HTML;
- headings, lists, emphasis, and fenced code continue to work;
- malformed table syntax remains text;
- `<script>`, `<img onerror>`, and other raw HTML are escaped;
- both templates load the shared renderer before their page-specific JavaScript;
- Qimen and Meihua scripts call the shared renderer and no longer contain independent Markdown conversions.

The complete existing test suite must continue to pass. After Git deployment, production HTML must reference the shared renderer, the JavaScript asset must return HTTP 200, and a browser verification should confirm the table layout when the browser surface is available.

## Non-goals

- Rendering arbitrary raw HTML from LLM responses.
- Supporting Markdown links, images, footnotes, task lists, or nested tables.
- Changing LLM prompts, API schemas, or conversation-history payloads.
- Redesigning the surrounding panels, navigation, typography, or application layout.
