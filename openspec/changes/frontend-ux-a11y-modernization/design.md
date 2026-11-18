# Design

## Context

See [proposal.md](proposal.md) for the audit motivation and affected surface inventory, and `specs/*/spec.md` for behavioral contracts.

The 333 Divination Suite serves 13 live routes across 12 Express/EJS templates (`views/*.html`) plus shared partials (`views/partials/byok-modal.html`, `views/partials/result-email.html`, `views/partials/site-footer.html`, `views/partials/ads-mobile.html`, `views/partials/ads-bottom.html`). Styling flows through a layered cascade (`bootstrap.min.css` -> `style-new.css` -> `dark-mode.css` -> `divination-suite.css` -> module CSS -> `theme-atelier.css`), and client behavior spans `theme.js`, `app.js`, `divination-suite.js`, `liuyao.js`, `meihua.js`, `fengshui.js`, `cezi.js`, `wellness.js`, and `webmcp.js`. Per `AGENTS.md`, all UI updates must preserve existing WebMCP declarative attributes, form field `name`/`id` contracts, and the Punchy & Prominent + Saffron-Atelier brand identity.

## Goals / Non-Goals

**Goals:**
- Eliminate all WCAG AA contrast failures (`low-contrast`) across all 13 live routes and shared modals (`byok-modal.html`, `result-email.html`) in both light and dark modes.
- Achieve sequential heading outlines (`h1` -> `h2` -> `h3` -> `h4`) across templates and modal partials, sitewide `:focus-visible` `outline` rings (including `.fs-palace-cell`), intentional `prefers-reduced-motion` behavior, IME-safe `Enter` handling, and zero blocking `alert()` calls via one unified XSS-safe toast helper.
- Modernize the homepage spotlight carousel (ARIA, live announcements, pause control, wrapper overscroll containment, JS reduced-motion), idempotent AdSense slot initialization across all 4 slots, `<head>` CSS loading, `<meta name="color-scheme">` sync, and safe container clearing / array reversal.
- Reduce nested utility card and side-tab noise without altering `AGENTS.md` Punchy promo surfaces, replace `transition: all` / `overflow-x: hidden` sitewide, and add single-entry-synced progressive disclosure for Fengshui selectors.

**Non-Goals:**
- Removing Bootstrap 3 or jQuery across all 12 views, or migrating Bootstrap `.modal` overlays (`#customPanModal`, `#helpModal`, `#emailConversationModal`, `#byokModal`) to native `<dialog>` in this pass (`result-email.html` already uses native `<dialog>`).
- Stripping the Saffron-Atelier warm cream canvas (`#fcf5e5`), domain emojis, Chinese middle-dot (`·`) subtitles, or `AGENTS.md` Punchy & Prominent gradients/glows on cross-module promo cards and banners.
- Claiming full Trusted Types CSP compliance across unrelated dynamic HTML renderers; DOM clearing work is scoped specifically to replacing `.innerHTML = ''` with `.replaceChildren()` and switching toast message rendering to `textContent`.
- Changing divination algorithms, backend Node endpoints, or LLM prompt logic.

## Decisions

### 1. Semantic Split of `--suite-primary` vs. Interactive Fill / Text Accent
- **Choice**: Keep `--saffron: #ffb010` as the signature brand highlight/button fill paired strictly with `--deep-blue: #17324d` ink, while introducing/remapping light-mode text accent tokens (`--suite-text-accent: #923a14` / `--clay: #a9471d` or `--deep-blue`) and overriding `--suite-primary` usage where it appears as text on `#fffcf2`/`#fff9e8` or as background behind `#ffffff` (`#startLLMAnalysis`, `.fs-cat-btn.active`, `.cross-link-btn.btn-malesize`, `.mode-card-badge`, `byok-modal.html` muted text).
- **Alternatives Considered**: Reverting `--suite-primary` back to `#CC6B49` everywhere would discard the Saffron-Atelier identity (`theme-atelier.css`); darkening `#ffb010` globally into muddy brown would dull primary CTAs. Splitting fill ink from text accent preserves the visual identity while guaranteeing >= 4.5:1 AA contrast.

### 2. Calibrated Five-Element & Flying-Star Colors per Color Scheme
- **Choice**: Darken Qimen Five-Element (`wuxing-mu`, `wuxing-huo`, `wuxing-tu`, `wuxing-jin`, `wuxing-shui`), luck labels (`.label-da_ji`, `.label-xiao_ji`, `.label-da_xiong`), and Fengshui flying-star preview colors (`#2563eb` -> `#1d4ed8`, `#dc2626` -> `#b91c1c`, `#a59a86` -> `#5c5140`) in light mode so text on tinted palace cells (`#cce3cc`, `#f2c4c4`, `#faf8f2`) still clears 4.5:1, while retaining luminous equivalents inside `[data-theme="dark"]` and auditing `result-email.html` dark-mode surfaces.

### 3. Single Unified XSS-Safe Toast Helper in `theme.js`
- **Choice**: Existing files (`app.js:2`, `meihua.js:4`, `liuyao.js:286`, `divination-suite.js:58`) already define separate `showToast` / `showSuiteToast` helpers, and three of them assemble `toast.innerHTML` directly with `message` (allowing HTML injection on server errors like `cezi.js:429`). Consolidate into one canonical `window.showToast(message, type)` in `public/js/theme.js` (loaded on all 12 templates) that builds DOM nodes safely via `document.createElement` + `textContent` inside a `role="status"` `aria-live="polite"` container, route `app.js`, `meihua.js`, `liuyao.js`, `divination-suite.js`, `cezi.js`, `fengshui.js`, and `wellness.js` through it, and focus/link inline validation errors via `aria-describedby` where a specific input fails validation.
- **Alternatives Considered**: Creating a new `<script>` partial and updating all 12 views; rejected to avoid extra HTTP requests and load-order races.

### 4. Fengshui Progressive Disclosure with Single Sync Entry Point
- **Choice**: Because `public/js/fengshui.js:220` updates `selectEl.selectedIndex = i` directly without firing `change`, introduce a single `syncFengshuiSelectorFilters()` entry point invoked by: (a) quick-filter pill clicks, (b) native `<select>` `change` events, (c) `syncHiddenInputs()` after compass sensor/manual degree updates and lock/unlock, and (d) WebMCP execution hooks. Switching quick-filter category pills adjusts visible/grouped options or jumps focus without clearing or mutating an already-selected value, preserving all 32 facing values, 24 shaqi values, `toolname`/`toolparamdescription`, and `webmcp.js` enums.

### 5. Color-Scheme Meta Precedence, Carousel JS Reduced-Motion, and Idempotent 4-Slot AdSense Guard
- **Choice**:
  - **Color-Scheme Precedence**: Declare `<meta name="color-scheme" content="light dark">` in `<head>` of all 12 templates. The inline pre-paint script, `theme.js`, and `webmcp.js` follow one deterministic precedence: valid `localStorage` (`"light"` | `"dark"`) -> explicit `"light"`/`"dark"` meta + `data-theme`; otherwise follow OS `prefers-color-scheme` for `data-theme` while keeping `<meta name="color-scheme" content="light dark">` (and gracefully falling back to `"light"` if `localStorage`/`matchMedia` throw or hold invalid values). All theme updates also sync `#darkModeToggle` (`aria-pressed`, label, `title`).
  - **Head Stylesheets**: Move `<link rel="stylesheet" href="/css/byok.css">` out of `views/partials/site-footer.html` into `<head>` across the 12 templates (testing cascade precedence against `theme-atelier.css` and `dark-mode.css`).
  - **Carousel**: Place `overscroll-behavior-x: contain`, `touch-action: manipulation`, and horizontal inset padding on `#homeCarouselTrackWrapper` (the scrollable element); add `aria-roledescription="carousel"`, slide `role="group"`/`aria-label`, a visible Pause/Play toggle, and polite `role="status"` announcements in `app.js` (silenced during unattended auto-rotation); check `matchMedia('(prefers-reduced-motion: reduce)')` in JS (plus live `change` listener) to disable auto-rotation and use `behavior: 'auto'`.
  - **AdSense 4-Slot Guard**: Track `ins.dataset.adsInitialized = 'true'` across all 4 slots (`ads-mobile.html` 1 slot + `ads-bottom.html` 3 slots), push only when `ins.offsetWidth > 0`, and attach a single shared `ResizeObserver` (disconnected per slot once initialized) to handle `767/768px` and `1200/1201px` breakpoint transitions cleanly without duplicate pushes or errors when AdSense is blocked.
  - **Targeted Utility Flattening & Browser Compatibility**: Only flatten non-promo operational containers (`.bazi-tool-card`, `.fs-compass-card`, `.fs-step2-card`, `.fs-manual-slider-box`, `.fs-menzhuzao-inputs`, `.liuyao-cluster`, `.time-mode-selector`, `.panel` inside `.suite-card`) and neutral `side-tab` stripes; keep `AGENTS.md` Punchy promo cards/banners intact. Guard `.toReversed()` with `typeof arr.toReversed === 'function' ? arr.toReversed() : [...arr].reverse()`.

## Risks / Trade-offs

- **CSS Specificity Battles (`!important` Cascade)** → Moving `byok.css` to `<head>` and overriding `style-new.css`/`divination-suite.css` could shift specificity. Mitigation: place `byok.css` before `theme-atelier.css` in `<head>` and verify computed contrast/focus styles across all 13 routes.
- **Test String Breakage (`test/service-question-routes.test.js`)** → Existing route/UI tests may match exact HTML classes (`service-question-routes.test.js:360`, `ui-layout-regression.test.js`). Mitigation: audit test regexes before altering markup classes, keep existing hook classes intact, and extend `ui-layout-regression.test.js` / `webmcp.test.js` with concrete Node/DOM assertions.
- **AdSense Breakpoint Initialization** → Slots hidden at `1280px` (`.ad-mobile`) or `< 1200px` (`.ad-sidebar`) must initialize if the user resizes or rotates without double-pushing. Mitigation: enforce `data-ads-initialized` per `<ins>` element and disconnect `ResizeObserver` immediately after pushing.

## Rollback & Verification Plan

1. **Batch Isolation & Rollback Triggers**:
   - Execute in 4 independent, revertible commits/batches matching `tasks.md` Sections 1–4.
   - Stop and roll back a batch if: any `npm test` suite fails, any form/WebMCP submission mutates canonical field values, any visible AdSense slot fails to trigger `push({})` once, or any Punchy promo card loses required contrast/layout.
2. **Automated Node & DOM Tests (`npm test`)**:
   - Extend `test/ui-layout-regression.test.js` and `test/webmcp.test.js` to assert: `<meta name="color-scheme">` and `<head>` `byok.css` across all 12 views, sequential heading order across views and partials, zero active `alert()` calls, `textContent` toast safety, IME `isComposing` guard in `liuyao.js`, Fengshui 32 facing + 24 shaqi sync & WebMCP parity, and zero `transition: all` / `outline: none` regressions.
3. **Rendered Multi-Viewport Verification**:
   - Verify on local server across all **13 live routes** (`/`, `/ziwei`, `/liuyao`, `/meihua`, `/bazi2`, `/saju`, `/fengshui`, `/tarot`, `/yinyuan`, `/answerbook`, `/name-analysis`, `/cezi`, `/wellness`) × **both light & dark modes** × **5 viewports** (`320×568`, `390×844`, `767×800`, `1200×800`, `1280×800`) including interactive BYOK modal, result-email `<dialog>`, Fengshui compass/filter sync, and carousel states, using `impeccable detect --json`, `modern-web-guidance legacy-scan`, and `sloplint.mjs`.
4. **Documentation Sync**:
   - Update `CHANGELOG.md` (and `README.md` if UI shortcuts/accessibility notes apply) per `AGENTS.md`.
