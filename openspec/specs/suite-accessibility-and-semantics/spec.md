# suite-accessibility-and-semantics Specification

## Purpose

Guarantees semantic document outlines across views and partials, sitewide keyboard focus visibility, non-destructive reduced-motion behavior, IME-safe keyboard submission, and unified XSS-safe non-blocking feedback across all 12 divination modules.

## Requirements

### Requirement: Sequential Heading Hierarchy Across Module Views and Partials
All 12 active module views (`index.html`, `ziwei.html`, `liuyao.html`, `meihua.html`, `bazi2.html`, `fengshui.html`, `tarot.html`, `yinyuan.html`, `answerbook.html`, `name-analysis.html`, `cezi.html`, `wellness.html`) and included modal partials (`byok-modal.html`, `result-email.html`) SHALL maintain a sequential heading outline (`<h1>` -> `<h2>` -> `<h3>` -> `<h4>`) with no skipped heading levels while preserving existing visual sizing via CSS classes.

#### Scenario: Screen reader landmark navigation on module pages and modals
- **WHEN** assistive technology traverses headings on any of the 13 routes (including open BYOK or result-email modals)
- **THEN** no heading level jumps by more than one step (zero `skipped-heading` warnings)

### Requirement: Sitewide Focus-Visible Outlines and Non-Destructive Reduced Motion
Loaded stylesheets and inline styles SHALL NOT suppress `:focus-visible` outlines without an accessible `outline` replacement (>= 3:1 contrast, `outline-offset: 2px`), SHALL provide keyboard activation and `:focus-visible` rings on custom interactive elements (including `.fs-palace-cell`), and SHALL preserve functional state transitions under `@media (prefers-reduced-motion: reduce)` instead of applying a global `* { transition-duration: 0.01ms !important }` kill rule.

#### Scenario: Keyboard user tabs through controls, forms, and Fengshui palace cells
- **WHEN** a user navigates links, buttons, pills, inputs, and interactive `.fs-palace-cell` elements via keyboard `Tab`
- **THEN** every focused element displays an instant `outline` ring visible in both normal and `forced-colors: active` modes

#### Scenario: Reduced-motion user interacts with the site
- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** decorative transforms, coin flips, and auto-scroll animations are suppressed while focus indicators and state feedback remain perceptible

### Requirement: IME-Safe Enter Submission
Custom `keydown` listeners intercepting `Enter` on text inputs or textareas (including `#manualLinesInput` in `public/js/liuyao.js`) SHALL ignore events where `event.isComposing` is `true` or `event.keyCode === 229`.

#### Scenario: CJK IME candidate confirmation with Enter
- **WHEN** a user confirms a Chinese/Japanese/Korean IME composition candidate by pressing `Enter`
- **THEN** the custom `keydown` handler SHALL NOT trigger form or hexagram submission prematurely

### Requirement: Unified XSS-Safe Non-Blocking Toast and Inline Feedback
All active application scripts (`app.js`, `cezi.js`, `fengshui.js`, `wellness.js`, `divination-suite.js`, `meihua.js`, `liuyao.js`) SHALL NOT invoke blocking `window.alert()`, SHALL route notifications through a single shared `window.showToast` helper (`role="status"` / `aria-live="polite"`) that renders message strings via `textContent` (never `innerHTML`), and SHALL focus and associate inline field validation errors via `aria-describedby` where a specific input failed validation.

#### Scenario: Validation or server error with special characters occurs
- **WHEN** an API error or form validation failure containing HTML-like characters (`<script>`, `&`, `>`) triggers a toast or inline field error
- **THEN** the UI displays the literal text safely via `textContent` without blocking the thread or executing HTML markup, and moves focus/announcement appropriately for field validation errors
