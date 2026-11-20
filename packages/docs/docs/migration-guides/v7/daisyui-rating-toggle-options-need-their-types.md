---
title: daisyUI ignores a size, color or colorGradient option of another type
description: "daisyUI's `RatingWidget` and `ToggleWidget` now read `size` and `color` only as strings, and draw the gradient only for `colorGradient: true`. Write `size` and `color` as strings and `colorGradient` as a boolean."
packages: ['@rjsf/daisyui']
uses: [ui-schema]
schema: []
affects: [appearance]
related: []
---

## Detect

- Your uiSchema gives a `@rjsf/daisyui` `RatingWidget` or `ToggleWidget` a non-string `size` or `color`, such as `size: 5`.
- Your uiSchema gives a `RatingWidget` a `colorGradient` other than `true`, such as `1`, `'true'` or `'false'`.
- On the rendered page, the widget loses its `toggle-5` or `rating-5` class, its color, or its gradient.

## Change

`RatingWidget` and `ToggleWidget` read a `size` or `color` option only as a string, trimmed, and fall back to the default for any other type or a blank string. `RatingWidget` draws its color gradient only for a `colorGradient` of `true`, where any truthy value used to draw it. Write the options with those types:

```diff
- 'ui:options': { size: 5, colorGradient: 'true' },
+ 'ui:options': { size: '5', colorGradient: true },
```

## Verify

- The widget has the size class you set, such as `toggle-5` or `rating-5`, and the color you set.
- The gradient shows only where `colorGradient` is `true`.
