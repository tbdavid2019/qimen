# Spec Delta

## Purpose

Ensures all 333 Divination Suite views, modals, and dark/light themes meet WCAG AA color contrast ratios while preserving the Saffron-Atelier palette and synchronizing browser color-scheme hints consistently across all initialization paths.

## ADDED Requirements

### Requirement: Semantic Separation of Fill and Text Accent Tokens
The system SHALL define distinct CSS tokens for bright saffron interactive fills (`--saffron: #ffb010` paired with dark ink `--deep-blue: #17324d`) versus light-surface text accents (`--clay: #a9471d` / `--deep-blue`), and SHALL NOT expose `--saffron` (`#ffb010`) as foreground text on cream/white surfaces or as a background behind `#ffffff` text.

#### Scenario: Primary buttons and active category pills in light mode
- **WHEN** a user views `#startLLMAnalysis`, `.btn-primary`, `.suite-btn-primary`, `.fs-cat-btn.active`, or `.cross-link-btn.btn-malesize` in light mode
- **THEN** the button text and background combination SHALL achieve at least a 4.5:1 WCAG AA contrast ratio

#### Scenario: Accent headings, summaries, and compass readouts on cream cards
- **WHEN** a user views collapsible `<summary>` elements (`bazi2.html`, `cezi.html`, `wellness.html`), `#compassDegreeDisplay`, `span.fs-badge-feature`, or `.bazi-tool-header` headings on light cream surfaces
- **THEN** the foreground text color SHALL achieve at least a 4.5:1 WCAG AA contrast ratio (3:1 minimum for large display numbers)

### Requirement: Domain Palette and Modal Contrast Compliance
The system SHALL maintain WCAG AA contrast (4.5:1 for normal text, 3:1 for large text) across all 13 live routes, domain chart elements, placeholders, and shared modal partials (`byok-modal.html`, `result-email.html`) in both light and dark modes.

#### Scenario: Qimen Nine-Palace and Fengshui star readability
- **WHEN** Qimen Nine-Palace Five-Element labels (`.wuxing-*`), luck badges (`.label-da_ji`, `.label-xiao_ji`, `.label-da_xiong`, `#overallLuck`), or Fengshui flying-star previews (`.fs-pstar-m`, `.fs-pstar-f`, `.fs-empty-hint`) render in light or dark theme
- **THEN** all element, star, and status texts SHALL meet WCAG AA contrast against their computed cell background

#### Scenario: Shared modals, mode badges, and placeholder readability
- **WHEN** a user visits any of the 13 routes (`/`, `/ziwei`, `/liuyao`, `/meihua`, `/bazi2`, `/saju`, `/fengshui`, `/tarot`, `/yinyuan`, `/answerbook`, `/name-analysis`, `/cezi`, `/wellness`), opens `#byokModal` or `#suiteResultEmailDialog`, or views placeholders
- **THEN** mode card badges, muted helper labels, inputs, and placeholders SHALL meet WCAG AA contrast against their computed surfaces

### Requirement: Synchronized Color-Scheme Meta and Precedence
All 12 active module templates SHALL declare `<meta name="color-scheme" content="light dark">` in `<head>`, and theme initialization/toggling SHALL resolve precedence deterministically (`localStorage` valid `"light"`/`"dark"` override -> OS `prefers-color-scheme` -> `"light"` fallback), updating `data-theme`, `<meta name="color-scheme">`, and `#darkModeToggle` state.

#### Scenario: Pre-paint load and theme toggle without FOUC
- **WHEN** a page loads with stored `"dark"`/`"light"` preference or unavailable storage, or when `theme.js` / `webmcp.js` toggles the theme
- **THEN** `data-theme`, `<meta name="color-scheme">` (`"light"`/`"dark"` on override or `"light dark"` on OS default), CSS `color-scheme`, and `#darkModeToggle` (`aria-pressed`, label, `title`) all stay synchronized
