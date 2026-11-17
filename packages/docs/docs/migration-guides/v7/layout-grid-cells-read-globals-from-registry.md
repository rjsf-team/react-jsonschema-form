---
title: LayoutGridField cells no longer copy ui:globalOptions into their uiSchema
description: '`LayoutGridField` used to copy the global options into each cell''s uiSchema, and now copies none, so a cell''s own option beats the global one. Components in a cell read `registry.globalUiOptions` or `getUiOptions(uiSchema, registry.globalUiOptions)`.'
packages: ['@rjsf/core']
uses: [ui-schema, custom-widgets, custom-templates]
schema: []
kind: runtime
noticed: review
related: [ui-global-options-hold-only-global-options, get-ui-options-returns-field-options-alone]
---

## Detect

- Your custom field, widget or template inside a `ui:layoutGrid` cell reads a global from its `uiSchema['ui:globalOptions']` or `options.globalOptions`.
- A nested grid's uiSchema sets `ui:globalOptions`.
- A cell sets `ui:label: true` (or another option) under a global `label: false` (or other global) and expected the global to win.

## Change

`LayoutGridField` no longer copies the globals into each cell's uiSchema, which gave a cell's components globals no field outside a grid got. A cell's `ui:options` hold its own options and the `ui:layoutGrid` entry's props, and the cell carries no `ui:globalOptions`, so its widget's `options` no longer hold a `globalOptions` key. Read globals from the registry, as a component outside a grid does:

```diff
-const label = uiSchema?.['ui:globalOptions']?.label;
+const { label } = getUiOptions(uiSchema, registry.globalUiOptions);
```

Only the root uiSchema's `ui:globalOptions` are read, so move one set on a nested grid's uiSchema to the root.

## Verify

- A cell's own option, given as `ui:<name>` or in `ui:options`, now beats the global one: a cell with `ui:label: true` shows its label under a global `label: false`.
- Components in cells see the same globals as components outside a grid.
