---
title: A layout grid cell naming a property beside anyOf or oneOf, or of options with no discriminator, renders the field
description: A `{ name, render }` grid cell naming a property beside `anyOf`/`oneOf` or of non-discriminated options used to show `render`, and now renders the field. Set `name` to `''` to keep showing your component.
packages: ['@rjsf/core']
uses: [ui-schema]
schema: [any-of-one-of]
kind: runtime
noticed: review
related: [property-beside-options-read-from-beside]
---

## Detect

- Your `ui:layoutGrid` has a `{ name: 'a', render: Comp }` cell.
- In your schema, `a` is declared beside the `anyOf`/`oneOf`, or inside options that have no `discriminator`.
- On the rendered page, the cell now shows the field's input where it used to show `Comp`.

## Change

The grid used to read such a cell only from the selected option, found no schema for it and showed `Comp` ([#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392)). It now reads a property beside the options from there, and a property of the options from the option the form shows, so the cell renders the field and leaves `Comp` out, as [a cell naming a plain property does](../../usage/layout-grid.md).

To keep showing `Comp`, name no property:

```diff
-{ name: 'a', render: Comp }
+{ name: '', render: Comp }
```

## Verify

- The cell shows `Comp` again, or the field if that is what you want.
- A `LayoutGridField` on the schema that holds non-discriminated options is the exception. While `MultiSchemaField` renders the options beside the grid, the option renders its own properties, so a cell naming one of them still renders nothing, or its `render`. For `{ properties: { x: { type: 'string' } }, anyOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'number' } } }] }` with `{ a: 'q' }`, a row of `x` and `a` renders `root_x`, then the option selector and the option's `root_a`.
- A property declared both beside the options and in an option is read from beside them; see [this entry](./property-beside-options-read-from-beside.md).
