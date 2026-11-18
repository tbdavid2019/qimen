# progressive-disclosure-and-surface-clarity Specification

## Purpose

Improves operational surface clarity, CSS hygiene, and Fengshui selector scanability while strictly preserving `AGENTS.md` Punchy & Prominent promo card styling, WebMCP schemas, and existing form contracts.

## Requirements

### Requirement: Operational Container Simplification Without Regressing Brand Promo Cards
Non-promo operational containers nested inside `.suite-card` and decorative `border-left: 3px–5px` (`side-tab`) stripes on neutral blocks SHALL use spacing, hairline dividers, or subtle surface tint shifts, whereas `AGENTS.md`-mandated Punchy & Prominent promo cards, carousel cards, mode switcher cards, and feature banners SHALL retain their vibrant gradients, saturated borders, and ambient glow.

#### Scenario: Visual audit of operational forms vs. Punchy promo cards
- **WHEN** a user opens `/`, `/bazi2`, `/saju`, `/liuyao`, or `/fengshui`
- **THEN** utility panels (`.bazi-tool-card`, `.fs-compass-card`, `.fs-step2-card`, `.fs-manual-slider-box`, `.fs-menzhuzao-inputs`, `.liuyao-cluster`, `.time-mode-selector`, `.panel` wrappers) avoid double-card borders while Punchy surfaces (`home-carousel-card`, `ziwei-mode-card`, `tarot-mode-card`, `sajuBanner`, `zipingBanner`, `spouse-banner`) preserve their gradients, borders, and glow

### Requirement: Sitewide CSS Transition, Overflow, and Typographic Scale Hygiene
Project stylesheets (`theme-atelier.css`, `divination-suite.css`, `style-new.css`, `style.css`, `liuyao.css`, `meihua.css`, `byok.css`) and inline styles SHALL list explicit transitioned properties instead of `transition: all`, use `overflow-x: clip` instead of `overflow-x: hidden` on page/board wrappers, apply `text-wrap: balance` to display headings, and maintain a >= `1.25×` visual scale step from body (`16px`) -> `<h2>` (`>= 20px`) -> `<h1>` (`>= 25px`).

#### Scenario: Display heading and sticky layout across narrow and wide viewports
- **WHEN** any module page renders at `320px`, `390×844`, `767/768px`, `1200/1201px`, or `1280×800`
- **THEN** display headings wrap cleanly (`text-wrap: balance`) with clear typographic hierarchy over body text and no horizontal overflow or broken sticky behavior

### Requirement: Single-Entry-Synced Progressive Disclosure for Fengshui Selectors
`views/fengshui.html` SHALL present progressive quick-filter controls ahead of `#fengshuiFacing` and `#shaType` backed by a single synchronization handler in `public/js/fengshui.js` without clearing an already-selected value, while preserving all 32 facing values, 24 shaqi values, `name`/`id` attributes, and WebMCP schema contracts.

#### Scenario: Compass lock and WebMCP execution stay synchronized with quick-filters
- **WHEN** a user clicks a direction/category filter (8 directions vs. 24 mountains; 外局 vs. 內局), the electronic compass locks a sitting-facing value via `selectedIndex`, or WebMCP updates `#fengshuiFacing` / `#shaType`
- **THEN** the single sync handler updates the quick-filter UI without overwriting the selected option, and form submission preserves the exact canonical mountain or shaqi value
