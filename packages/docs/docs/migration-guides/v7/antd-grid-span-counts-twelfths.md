---
title: antd's GridTemplate reads a column's span as twelfths
description: "`@rjsf/antd`'s `GridTemplate` used to pass a layout grid column's `span` to `Col` as antd 24ths and now reads it as twelfths, doubling it. Halve each `span` in `ui:col` and `ui:columns`."
packages: ['@rjsf/antd']
uses: [ui-schema]
schema: []
kind: runtime
noticed: review
related: [antd-grid-column-own-width-drops-span, layout-grid-row-without-template-uses-12-tracks]
---

## Detect

- In your uiSchema: a `ui:col` or `ui:columns` with a `span` under `ui:layoutGrid`, rendered by `@rjsf/antd`.
- In the console: a warning that a column's `span` is more than 12 and should be halved, ending in `[antd-span-twelfths]`.
- On the rendered page: grid columns twice as wide as before, such as a `span: 12` column that fills the whole row.

## Change

A layout grid's `span` now counts twelfths of a row in every theme, so `@rjsf/antd`'s `GridTemplate` doubles it into antd's 24 columns instead of handing it to `Col` as is. Halve each `span`. An odd number becomes a half step, which antd's 24 columns still lay out exactly:

```diff
 'ui:row': {
   children: [
-    { 'ui:col': { span: 9, children: ['address'] } },
-    { 'ui:col': { span: 15, children: ['employment'] } },
+    { 'ui:col': { span: 4.5, children: ['address'] } },
+    { 'ui:col': { span: 7.5, children: ['employment'] } },
   ],
 },
```

Only a `span` over 12, which only an unmigrated column can have, logs the warning. [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make it throw. One of 12 or under looks the same migrated or not, so check those yourself.

antd's breakpoint props, such as `xs` or `md`, still take antd's 24ths. See [`span` in each theme](../../usage/layout-grid.md#span-in-each-theme).

## Verify

- Each column takes the share of the row it did before.
- The console shows no warning that a `span` is more than 12.
