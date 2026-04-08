## Context

The current navigation bar is implemented using Bootstrap 3 in EJS templates (`views/index.html` and `views/meihua.html`). It currently features links for "靜心問事", "奇門遁甲", and "梅花易數". The user wants to add a fourth link for their Bazi system.

## Goals / Non-Goals

**Goals:**
- Add a new navigation item "生辰八字" to the right of "梅花易數".
- Link should point to `https://bazi.david888.com/`.
- Link must open in a new tab (`target="_blank"`).
- Implementation must be consistent in both `index.html` and `meihua.html`.

**Non-Goals:**
- Modifying the styling of the navigation bar.
- Adding dropdowns or other complex UI elements.

## Decisions

- **Placement**: The link will follow the "梅花易數" list item.
- **Implementation**: We will add a new `<li>` element with an `<a>` tag.
- **Targeting**: `target="_blank"` will be used to ensure the user stays on the current site while opening the linked application.

## Risks / Trade-offs

- **Mobile View**: Adding another link might crowd the navigation bar on very small screens before it collapses into the hamburger menu. However, standard Bootstrap handles this gracefully.
