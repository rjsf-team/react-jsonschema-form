---
title: IconButton draws only its five built-in icons
description: Core's `IconButton` now draws an inline SVG only for `plus`, `copy`, `arrow-up`, `arrow-down` and `remove`, and no icon for any other name. Pass any other icon as an element.
packages: ['@rjsf/core']
uses: [custom-templates]
schema: []
affects: [appearance, code]
related: []
---

## Detect

- `IconButton` from `@rjsf/core` rendered in your custom templates with an `icon` string other than `plus`, `copy`, `arrow-up`, `arrow-down` or `remove`, such as a glyphicon name.
- The rendered page: such a button shows no icon.

## Change

`IconButton` used to render a glyphicon for any name. It now renders an inline SVG for its five built-in names and no icon for any other. Pass the icon you want as an element:

```diff
-<IconButton icon='star' {...props} />
+<IconButton icon={<StarIcon />} {...props} />
```

## Verify

- Every custom button shows its icon.
- Buttons using the five built-in names show core's SVG icons.
