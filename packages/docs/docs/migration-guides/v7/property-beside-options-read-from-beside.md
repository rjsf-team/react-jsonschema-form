---
title: A property declared beside anyOf or oneOf and in an option is read from beside them
description: '`findFieldInSchema()` and layout grid cells used to read a property declared both beside `anyOf`/`oneOf` and in an option from the option, and now read it from beside them. Declare it in one place, or add it to the `required` list beside the options.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [utils-api, ui-schema]
schema: [any-of-one-of]
kind: runtime
noticed: review
related: [layout-grid-cell-beside-options-renders-the-field]
---

## Detect

- Your schema declares the same property in `properties` beside its `anyOf`/`oneOf` and again inside an option.
- You call `schemaUtils.findFieldInSchema()` for that property, or a `LayoutGridField` cell names it.

## Change

Both used to read the property from the option and now read it from beside the options ([#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392)). For `{ properties: { kind: { enum: ['a', 'b'] } }, oneOf: [{ properties: { kind: { const: 'a' } }, required: ['kind'] }, { properties: { kind: { const: 'b' } } }] }` with `{ kind: 'a' }`, `findFieldInSchema()` returned `{ const: 'a' }` as required. It now returns the `enum` as not required, and a grid cell renders the `enum`.

Declare the property in one place, or add it to the `required` list beside the options:

```diff
 {
   properties: { kind: { enum: ['a', 'b'] } },
+  required: ['kind'],
   oneOf: [
     { properties: { kind: { const: 'a' } }, required: ['kind'] },
     { properties: { kind: { const: 'b' } } },
   ],
 }
```

## Verify

- `findFieldInSchema()` reports the property as required again, and the grid cell shows the required marker.
- A property that only an option declares is read as before.
