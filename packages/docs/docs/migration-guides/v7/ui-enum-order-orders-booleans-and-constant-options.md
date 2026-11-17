---
title: 'ui:enumOrder now orders boolean options and constant anyOf or oneOf options'
description: '`ui:enumOrder` used to be ignored on a boolean without `ui:enumNames` and on a constant `anyOf`/`oneOf`; it now orders them and drops values it doesn''t list. List every value or add `''*''`, or remove the order.'
packages: ['@rjsf/core']
uses: [ui-schema]
schema: [enums, any-of-one-of]
kind: runtime
noticed: review
related: [boolean-enum-values-labelled-yes-no]
---

## Detect

- In your `uiSchema`: `ui:enumOrder` on a `type: 'boolean'` field, a two-value boolean `enum`, or beside an `anyOf`/`oneOf` made entirely of constants.
- On the rendered page: options missing from that field, or a field with no options at all.

## Change

`ui:enumOrder` now orders the options of an `anyOf` or `oneOf` made entirely of constants, as it orders `enum` values, where 6.x ignored it there ([#4298](https://github.com/rjsf-team/react-jsonschema-form/issues/4298)). It also orders a boolean's Yes/No options, those of a two-value `enum` and the implicit `true` and `false` of a plain `{ "type": "boolean" }`, where it used to ignore them unless `ui:enumNames` was set.

As for any `enum`, the order drops a value it doesn't list unless it has `'*'`. A `"ui:enumOrder": ["b"]` beside a constant `oneOf` of `a`, `b` and `c` now leaves only `b`. On a boolean, `"ui:enumOrder": [true]` leaves only Yes, and an empty `"ui:enumOrder": []` leaves no options.

Options keep their schema order when any of them is read through a discriminator or `ui:optionsSchemaSelector`.

List every value, add `'*'` to an order meant only to put one first, or remove an order that was never meant to apply:

```diff
 const uiSchema = {
-  agree: { 'ui:enumOrder': [true] },
+  agree: { 'ui:enumOrder': [true, '*'] },
 };
```

## Verify

- Each field shows all its options in the order you meant.
