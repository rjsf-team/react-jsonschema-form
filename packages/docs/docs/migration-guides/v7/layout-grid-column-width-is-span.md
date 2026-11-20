---
title: A layout grid column takes its width as span
description: "Core's `GridTemplate` now takes a column's width as `span` and adds `rjsf-grid-row` and `rjsf-grid-column` itself. Replace `className: 'col-xs-4'` with `span: 4` and drop `className: 'row'`."
packages: ['@rjsf/core']
uses: [ui-schema]
schema: []
affects: [appearance]
related: [bootstrap-3-markup-moved-to-bootstrap3]
---

## Detect

- `ui:col` entries in your `uiSchema` with a Bootstrap 3 class such as `className: 'col-xs-4'`, or `ui:row` entries with `className: 'row'`, rendered by `@rjsf/core`.
- The rendered page: grid columns no longer take their widths.

## Change

The `GridTemplate` takes a column's width as a `span` prop (`'ui:col': { span: 4 }`) in place of a `col-xs-4` class, and adds `rjsf-grid-row` and `rjsf-grid-column` itself:

```diff
 'ui:row': {
-  className: 'row',
   children: [
-    { 'ui:col': { className: 'col-xs-4', children: ['first'] } },
+    { 'ui:col': { span: 4, children: ['first'] } },
   ],
 },
```

A layout grid that stays on Bootstrap 3 through `@rjsf/bootstrap3` keeps its `className: 'row'` and `className: 'col-xs-*'` properties, see [Bootstrap 3 moved](./bootstrap-3-markup-moved-to-bootstrap3.md).

## Verify

- With `@rjsf/core/rjsf.css` loaded, each column takes the width its `span` gives.
