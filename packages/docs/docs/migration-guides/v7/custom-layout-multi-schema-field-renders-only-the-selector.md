---
title: 'A custom LayoutMultiSchemaField renders only the selector and gets no options prop'
description: 'A field registered as `LayoutMultiSchemaField` now renders inside the `FieldTemplate` `SchemaField` renders, and grid cells no longer receive an `options` prop. Render only the selector, and read options from `schema.oneOf`/`schema.anyOf`.'
packages: ['@rjsf/core']
uses: [custom-fields]
schema: [any-of-one-of]
kind: removal
noticed: review
related: [layout-grid-discriminated-cell-renders-a-field-wrapper, anyof-oneof-field-options-are-already-retrieved]
---

## Detect

- In your `fields`: a component registered as `LayoutMultiSchemaField` that renders its own `FieldTemplate`.
- In a custom `ui:field` inside a `oneOf`/`anyOf` layout grid cell without a discriminator: a read of the `options` or `baseType` prop.
- On the rendered page: such a cell shows two field wrappers, or a field with no options.
- In the console: a warning that a discriminated cell names another field, ending in `[layout-grid-cell-field-ignored]`.

## Change

A field registered as `LayoutMultiSchemaField` is rendered within the `FieldTemplate` that `SchemaField` renders, so one that rendered its own now renders two. Render only the selector, and take `disabled`, `readonly`, `required`, `hideError` and `presentation` from its props, which `SchemaField` has resolved from the cell's `uiSchema`.

The grid names the field in the cell's `ui:field`, in place of any field the cell or its `ui:definitions` entry names, which a discriminated cell has never rendered and about which the console now warns once. It sets [`ui:fieldReplacesAnyOrOneOf`](../../api-reference/uiSchema.md#uifieldreplacesanyoroneof) beside it, so the options give way to the selector.

`LayoutMultiSchemaField` reads its options from the schema's `oneOf`/`anyOf` and no longer reads an `options` prop, which only the grid passed, or the undeclared `baseType`. The grid no longer passes `options` to any cell, so a custom `ui:field` that received them through `SchemaField` reads them from the schema:

```diff
-const { options } = props;
+const options = props.schema.oneOf ?? props.schema.anyOf ?? [];
```

Named outside a grid, `LayoutMultiSchemaField` no longer throws. Without `ui:fieldReplacesAnyOrOneOf: true` the options render beside it with a selector of their own, and with it nothing renders the selected option's properties.

## Verify

- Each cell renders one wrapper around one selector, and your field lists the schema's options.
- The console shows no `layout-grid-cell-field-ignored` warning about another field named in a discriminated cell. [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make it throw.
