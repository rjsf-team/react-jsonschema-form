---
title: The Mantine layout grid option gutter is now gap
description: 'Mantine 9 renamed `Grid`''s `gutter` prop to `gap`, and `GridTemplate` maps `gutter` to `gap` only for backward compatibility. Rename `gutter` to `gap` in your `ui:row` and `ui:col` options.'
packages: ['@rjsf/mantine']
uses: [ui-schema]
schema: []
affects: [code]
deprecated: true
related: [mantine-requires-mantine-9-6-3]
---

## Detect

- `gutter` in a `ui:row` or `ui:col` option of a `uiSchema` rendered by `@rjsf/mantine`.

## Change

`GridTemplate` passes a `gutter` value to Mantine's `gap` prop. An explicit `gap` wins if both are set. Rename the option:

```diff
-'ui:row': { gutter: 'md' },
+'ui:row': { gap: 'md' },
```

## Verify

- No `ui:row` or `ui:col` option uses `gutter`.
- Grid spacing looks the same as before.
