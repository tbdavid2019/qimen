## Why

Add a shortcut link to the "生辰八字" (Bazi) system (https://bazi.david888.com) in the navigation bar. This allows users to easily switch from the Qimen/Meihua system to the Bazi system, providing a better user experience for those interested in different divination tools.

## What Changes

Update the global navigation bar to include a "生辰八字" link to the right of "梅花易數". This change will be applied to both the main Qimen page (`/`) and the Meihua page (`/meihua`).

## Capabilities

### New Capabilities
- `bazi-link`: A direct link in the navigation bar pointing to https://bazi.david888.com with `target="_blank"`.

### Modified Capabilities
- `ui-navigation`: The navigation structure is expanded to include the new link.

## Impact

- `views/index.html`: Navigation bar update.
- `views/meihua.html`: Navigation bar update.
