# Spec Delta

## Purpose

Modernizes the homepage spotlight carousel (including JS reduced-motion, pause control, and live announcements), idempotent AdSense slot initialization across all 4 slots, `<head>` stylesheet loading, and safe DOM clearing / non-mutating array reversal.

## ADDED Requirements

### Requirement: Carousel ARIA Semantics, Live Status, and Edge Inset
The homepage feature spotlight carousel (`#homeCarouselTrackWrapper` / `#homeCarouselTrack`) SHALL expose semantic carousel ARIA attributes (`aria-roledescription="carousel"`, slide `role="group"` + `aria-roledescription="slide"` + localized position `aria-label`, and a visually hidden `role="status"` `aria-live="polite"` region updated on slide navigation), and `#homeCarouselTrackWrapper` SHALL apply horizontal inset padding so cards do not clip at rest (`edge-flush-cards`).

#### Scenario: User or screen reader navigates carousel slides
- **WHEN** a user activates Previous, Next, a slide indicator dot, or scrolls to a new card
- **THEN** `aria-current` updates on the active indicator (calculated accurately across single- and multi-card desktop widths) and the polite live region announces the active slide position without interrupting during unattended auto-rotation

### Requirement: Carousel Scroll Containment, Pause Control, and JS Reduced-Motion Support
The scrolling container `#homeCarouselTrackWrapper` SHALL set `overscroll-behavior-x: contain` and `touch-action: manipulation`; the carousel controller in `public/js/app.js` SHALL provide a visible Pause/Play toggle button, pause auto-rotation on hover/focus/touch/hidden document, and dynamically honor `prefers-reduced-motion: reduce` (including live `MediaQueryList` changes) by disabling auto-rotation and passing `behavior: 'auto'` instead of `'smooth'`.

#### Scenario: Mobile swipe and reduced-motion carousel behavior
- **WHEN** a mobile user swipes horizontally inside `#homeCarouselTrackWrapper`, or a user enables `prefers-reduced-motion: reduce` or activates the Pause button
- **THEN** horizontal swipes remain contained within the carousel track, auto-rotation stops, and slide transitions jump without forced smooth scrolling

### Requirement: Idempotent Visibility-Gated AdSense Slot Initialization
All AdSense partial slots (`ads-mobile.html` and the 3 slots in `ads-bottom.html`) SHALL initialize each `<ins class="adsbygoogle">` at most once (`data-ads-initialized`), skipping zero-width hidden slots and observing breakpoint/resize transitions so newly visible slots initialize cleanly without `TagError` exceptions.

#### Scenario: Responsive breakpoint change across desktop and mobile
- **WHEN** any page loads or resizes across `767/768px` or `1200/1201px`, or when an ad blocker blocks the AdSense script
- **THEN** only visible slots (`offsetWidth > 0`) invoke `adsbygoogle.push({})` once per slot, hidden slots produce zero `TagError: No slot size for availableWidth=0` console exceptions, and blocked ad scripts fail silently

### Requirement: Head Stylesheet Placement and Safe Container Clearing / Array Reversal
Component stylesheets (including `/css/byok.css`) SHALL be linked inside `<head>` rather than inside `<footer>`, client scripts SHALL clear empty dynamic containers with `element.replaceChildren()` instead of `.innerHTML = ''`, and array reversals in `public/js/liuyao.js` SHALL use `toReversed()` when supported with a `[...arr].reverse()` fallback for pre-ES2023 environments.

#### Scenario: Page stylesheet loading and dynamic container updates
- **WHEN** a page loads or updates conversation/carousel/meihua/liuyao containers dynamically
- **THEN** `/css/byok.css` loads from `<head>`, containers clear via `replaceChildren()`, and `liuyao.js` renders reversed line order cleanly even on browsers lacking `Array.prototype.toReversed`
