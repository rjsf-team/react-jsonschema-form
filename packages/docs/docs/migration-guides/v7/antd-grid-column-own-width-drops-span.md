---
title: antd's GridTemplate drops a column's span when the column sets its own width
description: "An `@rjsf/antd` layout grid column with a `flex` prop or a `flex`, `flexBasis` or `width` style used to hand `Col` its `span` too, and now drops the `span` and logs a warning. Keep one of the two widths on each column."
packages: ['@rjsf/antd']
uses: [ui-schema]
schema: []
kind: runtime
noticed: runtime-error
related: [antd-grid-span-counts-twelfths]
---

## Detect

- In your uiSchema: a `ui:col` or `ui:columns` under `ui:layoutGrid` with both a `span` and a `flex` prop, or a `style` with `flex`, `flexBasis` or `width`.
- In the console: a warning that a layout grid column's `span` is ignored because the column has a width of its own, ending in `[antd-span-own-width]`.

## Change

Such a column now keeps its own width and drops its `span`, where `Col` used to get both. Remove whichever width you don't want:

```diff
 { 'ui:col': {
-  span: 6,
   flex: '1 1 200px',
   children: ['address'],
 } },
```

To size the column by `span` instead, remove the `flex` prop or style, and halve the `span` as [antd's GridTemplate reads a column's span as twelfths](./antd-grid-span-counts-twelfths.md) describes.

## Verify

- The column has the width you kept, and the console logs no warning that its `span` is ignored. [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make the `antd-span-own-width` warning throw.
