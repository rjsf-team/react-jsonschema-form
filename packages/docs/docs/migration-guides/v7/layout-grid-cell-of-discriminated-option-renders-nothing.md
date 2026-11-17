---
title: A layout grid cell naming a discriminated option's property renders nothing while the options render beside the grid
description: A grid cell naming a property of discriminated `anyOf`/`oneOf` options used to render a second input sharing the option's id, and now renders nothing. Set `ui:fieldReplacesAnyOrOneOf` to lay out the option's properties, or remove the cell.
packages: ['@rjsf/core']
uses: [ui-schema, markup]
schema: [any-of-one-of]
kind: runtime
noticed: test
related: [layout-grid-cell-beside-options-renders-the-field]
---

## Detect

- Your `ui:field: 'LayoutGridField'` sits on a schema with a `discriminator` and `anyOf`/`oneOf` options, and its uiSchema has no `ui:fieldReplacesAnyOrOneOf`.
- A grid cell names a property of one of the options.
- In tests or on the page, the cell no longer renders an input; the option beside the grid renders the property alone.

## Change

The cell for the selected option's property used to render while `MultiSchemaField` rendered the options beside the grid, so two inputs shared an id ([#5747](https://github.com/rjsf-team/react-jsonschema-form/issues/5747)). The cell now renders nothing, or its `render`, as it does for [options with no discriminator](./layout-grid-cell-beside-options-renders-the-field.md). For `{ discriminator: { propertyName: 'kind' }, properties: { x: { type: 'string' } }, oneOf: [{ properties: { kind: { const: 'a' }, a: { type: 'string' } } }, { properties: { kind: { const: 'b' }, b: { type: 'number' } } }] }` with `{ kind: 'a', a: 'q' }`, a row of `x` and `a` renders `root_x`, then the option selector and the option's `root_a`.

To have the grid lay out the option's properties, set [`ui:fieldReplacesAnyOrOneOf`](../../api-reference/uiSchema.md#uifieldreplacesanyoroneof) so the grid replaces the options:

```diff
 {
   'ui:field': 'LayoutGridField',
+  'ui:fieldReplacesAnyOrOneOf': true,
   'ui:layoutGrid': { /* ... */ },
 }
```

Otherwise remove a cell that names only the property, since it renders nothing. A `{ name, render }` cell still shows its `render`.

## Verify

- Each input id appears once on the page.
- With `ui:fieldReplacesAnyOrOneOf`, the grid renders no option selector. The data decides which option its cells read when the form gets it, and that holds while the user edits a cell, as it does outside a grid, so a user can't choose another option.
- With `ui:fieldReplacesAnyOrOneOf`, a row without the selected option's properties shows nothing: a row without `b` shows nothing for `{ b: 1 }`.
