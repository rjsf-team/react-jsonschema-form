---
title: Mantine's ColorWidget reads colorFormat instead of format
description: "`@rjsf/mantine`'s `ColorWidget` used to read `ui:options.format` for `ColorInput`'s format and now reads `colorFormat`, ignoring `format`. Rename `format` to `colorFormat` on every color field."
packages: ['@rjsf/mantine']
uses: [ui-schema]
schema: []
affects: [code, appearance]
related: []
---

## Detect

- In the type checker: a typed uiSchema with a color `format` such as `'rgba'` fails with `TS2322: Type '"rgba"' is not assignable to type 'DateElementFormat | undefined'`, because `format` takes only a date order (`'DMY'`, `'MDY'` or `'YMD'`).
- In your uiSchema, including one loaded as JSON: `ui:options.format` or `ui:format` on a field rendered by `ColorWidget`. An untyped uiSchema gives no error.
- On the rendered page: the color input shows Mantine's default format, or your theme's, instead of the one you set.

## Change

`format` is the name the alt-date widgets read for their order of date parts, so `ColorWidget` now reads `colorFormat`. Rename it in both its `ui:options.format` and `ui:format` spellings:

```diff
  color: {
-   'ui:options': { format: 'rgba' },
+   'ui:options': { colorFormat: 'rgba' },
  },
```

## Verify

- The type checker accepts the uiSchema.
- The color input shows and stores colors in the format you set. Without a `colorFormat`, `ColorInput` uses Mantine's default or your theme's.
