---
title: A prefixItems array renders as a tuple
description: 'An array declaring `prefixItems` rendered "Missing items definition" or a plain list; it now renders a field per position, read from `uiSchema.prefixItems`. Move the uiSchema of the positions out of `uiSchema.items`.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, ui-schema, utils-api]
schema: [arrays]
affects: [appearance, data]
related: [tuple-copy-shows-from-last-fixed-item, array-default-items-ignore-additional-items]
---

## Detect

- In your schema: an array with `prefixItems`, or a field declaring only `items` whose `anyOf`/`oneOf` option declares `prefixItems`.
- In your uiSchema: a `uiSchema.items` on such an array.
- In your code: calls to `getItemUiSchemaForItem()`, `getStaticItemsUiSchema()`, `isFilesArray()` or `isMultiSelect()` on such an array.

## Change

An array declaring `prefixItems` rendered the unsupported-field template ("Missing items definition") where it declared no `items`, and otherwise a plain list of `items` fields that gave the `prefixItems` positions no field of their own. It now renders a field for each `prefixItems` position, as a tuple `items` does. Its `items` describe the rows past them, as `additionalItems` does beside a tuple `items`: Add shows only where `items` is a schema, and only those rows can be moved or removed.

Its defaults fill each position as a tuple's do, so an empty array starts with one empty item per position. A `false` position, which allows no item, ends the array: the fields stop before it, the defaults (`minItems` padding included) fill only the positions before it, and no Add shows. An item the data already holds at or past it still renders, with a Remove button, so it can be removed.

An `items` listing `enum` values beside `prefixItems` with `uniqueItems` no longer renders a multi-select, and an `items` of `data-url` strings beside it no longer renders the files widget.

Under the default `allOf` merge, a single `items` in an `allOf` now also constrains each `prefixItems` position, and the `prefixItems` of several entries are met position by position, so a position renders with the keywords every entry gives it. A `customMergeAllOf` merges them as it chooses.

The uiSchema mirrors the schema keywords: a position reads its entry in `uiSchema.prefixItems`, and `uiSchema.items` applies only to the rows past the positions. Move what applied to the positions:

```diff
  const uiSchema = {
-   items: { 'ui:widget': 'textarea' },
+   prefixItems: [{ 'ui:widget': 'textarea' }, { 'ui:widget': 'textarea' }],
  };
```

The same applies to a field that declares only `items` when one of its `anyOf`/`oneOf` options declares `prefixItems`. The selected option renders as a tuple, its positions take the field's `items` schema but read `uiSchema.prefixItems`, and the field's `uiSchema.items` applies only to the rows past them. Add an entry per position:

```diff
  const schema = { type: 'array', items: { type: 'string' }, oneOf: [{ prefixItems: [{ minLength: 1 }] }] };
  const uiSchema = {
    items: { 'ui:widget': 'textarea' },
+   prefixItems: [{ 'ui:widget': 'textarea' }],
  };
```

To keep rendering a list, write the array with `items` alone. The default `@rjsf/validator-ajv8` validator is draft-07, which ignores `prefixItems`; see [Tuples with `prefixItems`](../../json-schema/arrays.md#tuples-with-prefixitems).

The `@rjsf/utils` functions change with it:

- `getDefaultFormState()` fills a `prefixItems` tuple position by position, with each position's `uiSchema.prefixItems` entry, and the items past it from the `items` beside it with `uiSchema.items`, as it fills a tuple `items` and its `additionalItems`. It read every item against `items` alone.
- `getItemUiSchemaForItem()` and `getStaticItemsUiSchema()` take an optional array `schema` last, which picks the uiSchema key the item reads: the `uiSchema.prefixItems` entry at a `prefixItems` position, and `uiSchema.additionalItems` past a tuple `items`. Without it they read `uiSchema.items` for every item, as before.
- `getRenderedOptionSchema()` meets a single `items` on one side, beside no `prefixItems`, into each `prefixItems` position on the other, and keeps it as the `items` past those positions, met with the other side's own `items` where it declares one.
- `isFilesArray()` and `isMultiSelect()` return `false` for a `prefixItems` tuple, whose `items` describe only the items past it, unless the uiSchema asks for the `files` widget.
- `omitExtraData()` reads a `prefixItems` tuple position by position, and the items past it by the `items` beside it, dropping them where it declares none. A `false` position ends the array: the elements at and past it are dropped.
- `retrieveSchema()` merges an `allOf` holding `prefixItems` position by position, as it merges a tuple `items`: a single `items` beside no `prefixItems` meets each position and the `items` past them, and a position only some entries declare meets the `items` beside the others. This applies to the default merge only.

## Verify

- Each `prefixItems` position renders its own field, with the uiSchema its `uiSchema.prefixItems` entry gives it.
- Add, Move and Remove show only on the rows past the positions.
