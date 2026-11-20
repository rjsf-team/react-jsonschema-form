---
title: 'A LayoutGridField with no layout, or a cell or condition naming no field, renders nothing'
description: 'A `LayoutGridField` without a valid `ui:layoutGrid`, a cell naming no field, or a `ui:condition` with no `field` used to render every field or its children. Each now renders nothing and logs a warning; fix the layout.'
packages: ['@rjsf/core']
uses: [ui-schema]
schema: []
affects: [appearance, code]
related: []
---

## Detect

- In the console: a warning naming a `LayoutGridField` with no layout, an empty or unresolved cell, or a condition with no `field`. Each ends in `[layout-grid-renders-nothing]`.
- In your `uiSchema`: `ui:field: 'LayoutGridField'` with a missing, misspelled or non-object `ui:layoutGrid`.
- In your `ui:layoutGrid`: a cell such as `{}`, `{ name: '' }` or `{ render: 'Misspelled' }`, or a `ui:condition` with no `field` or a `field` of `''`.
- On the rendered page: fields, a column of a `ui:columns`, or a condition's children are missing.

## Change

A `LayoutGridField` with no `ui:layoutGrid` object rendered every field of its schema, as a plain object field does. It now renders nothing, as the [`ui:layoutGrid` reference](../../usage/layout-grid.md#uilayoutgrid) says, and logs a warning naming the field. A cell that names no field and whose `render` doesn't resolve rendered every field of the grid's schema again inside the grid, under the same ids. It now renders nothing too, logging a warning unless the cell is `null`. In a `ui:columns`, which renders a `GridTemplate` around each cell, its column is left empty.

A `ui:condition` with no `field` read no value, so a `none` condition such as `{ "ui:condition": { "operator": "none", "value": "x", "children": ["a"] } }` rendered its children. It is now never met, so it renders nothing and logs a warning.

To keep those fields, give the `LayoutGridField` its `ui:layoutGrid`, or drop its `ui:field` so it renders as a plain object field. Remove a cell that names no field, give it the `name` of the field it should render, or fix its `render`. Give a `ui:condition` the `field` it tests, or replace a condition that should always render with its children:

```diff
 {
-  "ui:condition": { "operator": "none", "value": "x", "children": ["a"] }
+  "ui:condition": { "field": "kind", "operator": "none", "value": "x", "children": ["a"] }
 }
```

## Verify

- The console logs no layout grid warnings, and every field you meant to show renders once. [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make the `layout-grid-renders-nothing` warnings throw.
