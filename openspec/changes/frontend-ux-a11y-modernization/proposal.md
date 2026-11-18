# Proposal

## Why

A cross-framework audit (`impeccable`, `modern-web-guidance`, `design-taste-frontend`, and `hallmark`) of the 333 Divination Suite revealed systemic WCAG AA contrast failures introduced when `theme-atelier.css` overrode `--suite-primary` to bright saffron (`#ffb010`) without updating light-surface text or white-on-primary buttons (dropping as low as 1.5:1–1.9:1 across 58 desktop / 49 mobile instances). In addition, 8 views and `byok-modal.html` have skipped heading levels, 33 active `alert()` calls interrupt user flow, duplicate toast helpers inject raw HTML via `innerHTML`, `liuyao.js` lacks IME composition guarding on `Enter`, the homepage carousel lacks scroll-containment/ARIA semantics/reduced-motion JS handling and clips at the left edge, and legacy CSS/DOM patterns (`transition: all`, `outline: none`, global `0.01ms` reduced-motion kill, body-level `byok.css`, zero-width AdSense `TagError` across 4 slots, and `.innerHTML = ''`) degrade accessibility, stability, and polish.

## What Changes

- **Semantic Atelier Color & Theme Tokens**: Decouple interactive fill tokens (`--saffron` + `--deep-blue` ink) from text accent tokens (`--clay` / `--deep-blue`), remediate all WCAG AA contrast failures across all 13 routes, modals (`byok-modal.html`, `result-email.html`), and Qimen/Fengshui board labels (light and dark modes), and standardize `<meta name="color-scheme">` synchronization across pre-paint inline scripts, `theme.js`, and `webmcp.js`.
- **Suite-Wide Accessibility & Non-Blocking Feedback**: Fix skipped heading levels across views and shared partials (`byok-modal.html`), restore accessible `:focus-visible` `outline` rings across all stylesheets and custom interactive cells (`.fs-palace-cell`), replace the blanket `0.01ms` `prefers-reduced-motion` override with intentional reduced-motion fallbacks, add IME `isComposing` / `keyCode === 229` guards in `liuyao.js`, and unify toast notifications in `theme.js` using safe `textContent` while replacing all 33 active `alert()` calls.
- **Carousel, AdSense, Head CSS & Modern DOM Modernization**: Upgrade the homepage 8-card spotlight carousel with `overscroll-behavior-x: contain`, `touch-action: manipulation` on `#homeCarouselTrackWrapper`, inset padding (`edge-flush-cards` fix), full ARIA/live-status announcements, and JS reduced-motion + pause control; add idempotent visibility-gated initialization across all 4 AdSense slots (`ads-mobile.html`, `ads-bottom.html`); move `byok.css` from `footer` to `<head>`; replace `.innerHTML = ''` with `replaceChildren()` and safely adopt `toReversed()` with fallback.
- **Surface Clarity & Progressive Disclosure**: Flatten nested-card (`nested-cards`) and thick `border-left` (`side-tab`) noise on operational/utility containers while explicitly preserving `AGENTS.md` Punchy & Prominent styling on cross-module promo cards/banners, replace `transition: all` and `overflow-x: hidden` across all stylesheets with explicit properties and `overflow-x: clip`, align display typography (`1.25×` step + `text-wrap: balance`), and add bidirectional progressive category/direction filters for Fengshui's 24-mountain and 24-shaqi selectors while keeping existing form field names, compass sync, and WebMCP contracts intact.

## Capabilities

### New Capabilities
- `atelier-contrast-and-theming`: Semantic contrast token separation, WCAG AA text/control contrast across all 13 routes, modals, and light/dark themes, and `<meta name="color-scheme">` synchronization.
- `suite-accessibility-and-semantics`: Continuous heading hierarchy across views and partials, full-CSS `:focus-visible` outlines, intentional `prefers-reduced-motion`, IME-safe `Enter` handling, and unified `textContent`-safe non-blocking toast/inline error feedback.
- `modern-web-carousel-and-overlays`: Accessible scroll-snap spotlight carousel with wrapper overscroll containment, pause control, and JS reduced-motion support, idempotent zero-width AdSense slot initialization, `<head>` CSS loading, and `replaceChildren()` / fallback-safe `toReversed()` cleanup.
- `progressive-disclosure-and-surface-clarity`: Reduced utility card nesting and side-tab clutter (preserving `AGENTS.md` Punchy promo surfaces), sitewide explicit CSS transitions, `overflow-x: clip`, balanced `1.25×` display typography, and single-entry-synced progressive Fengshui mountain/shaqi filtering.

### Modified Capabilities
<!-- None: existing divination algorithm, API, CLI, WebMCP, and Fengshui compass/layout requirements remain unchanged. -->

## Impact

- **Views & Partials (`views/*.html`, `views/partials/*.html`)**: All 12 active module templates covering 13 routes (`/`, `/ziwei`, `/liuyao`, `/meihua`, `/bazi2`, `/saju`, `/fengshui`, `/tarot`, `/yinyuan`, `/answerbook`, `/name-analysis`, `/cezi`, `/wellness`), plus `site-footer.html`, `byok-modal.html`, `result-email.html`, `ads-mobile.html`, `ads-bottom.html`.
- **Stylesheets (`public/css/*.css`)**: `theme-atelier.css`, `divination-suite.css`, `style-new.css`, `style.css`, `dark-mode.css`, `name-analysis.css`, `liuyao.css`, `meihua.css`, `byok.css`.
- **Client Scripts (`public/js/*.js`)**: `theme.js`, `webmcp.js`, `app.js`, `liuyao.js`, `fengshui.js`, `cezi.js`, `wellness.js`, `divination-suite.js`, `meihua.js`.
- **Tests & Verification**: Existing `npm test` suite (including `test/service-question-routes.test.js`, `test/ui-layout-regression.test.js`, `test/webmcp.test.js`) extended with regression assertions, plus multi-viewport (`320px`, `390×844`, `767/768px`, `1200/1201px`, `1280×800`) rendered verification.
