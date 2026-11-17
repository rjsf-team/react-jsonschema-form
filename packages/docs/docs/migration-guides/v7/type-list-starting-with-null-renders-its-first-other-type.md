---
title: A type list renders the first type other than null that JSON Schema defines
description: A `type` list such as `['null', 'string', 'number']` used to render `NullField`, and an unknown type name could win; it now renders the first JSON Schema type other than `null`. Check those fields and drop `Array.isArray()` checks on `getSchemaType()`.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, utils-api]
schema: [type-lists]
kind: runtime
noticed: review
related: [fallback-ui-renders-type-lists-with-a-type-selector, typeless-constant-options-render-a-select]
---

## Detect

- In your schema, a `type` list of three or more entries that starts with `null`, such as `['null', 'string', 'number']`.
- In your schema, a `type` list naming a type JSON Schema doesn't define, such as `['foo', 'string']`.
- In your schema, a `type` list with a `ui:widget` that only a later listed type has, such as a `textarea` on `['number', 'string']`.
- In your code, an `Array.isArray()` check on the result of `getSchemaType()`.

## Change

`getSchemaType()` resolves a list to its first type other than `null`, as it already did for a two-entry nullable list, and prefers a type JSON Schema defines. `['null', 'foo', 'string']` and `['foo', 'string']` both resolve to `string`, so the field renders `StringField` instead of `NullField` or the unsupported-field box.

`getDefaultFormState()` fills such a field in as that type. A required list whose first type other than `null` is `boolean` starts at `false`, and one whose first is `object` or `array` gets that type's computed defaults.

Without [useFallbackUiForUnsupportedType](../../api-reference/form-props.md#usefallbackuiforunsupportedtype) there is still no type selector, so a list renders one field for that type. A `ui:widget` that only another listed `string`, `number`, `integer` or `boolean` type has renders that type's field instead, so a `textarea` on a `['number', 'string']` renders `StringField` where v6 threw. A `format` picks no other type's field. A list paired with an `anyOf` or `oneOf` still renders one type.

The return type of `getSchemaType()` narrows from `string | string[] | undefined` to `string | undefined`, since it never returned an array ([#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331)):

```diff
 const type = getSchemaType(schema);
-const first = Array.isArray(type) ? type[0] : type;
+const first = type;
```

A typeless schema with a falsy `const` also changes type: see [A oneOf or anyOf of constants renders a select, with or without a type](./typeless-constant-options-render-a-select.md).

## Verify

- Such fields render an input for their first defined type other than `null`, and their initial data has that type.
- To let users switch among the listed types, see [The fallback UI renders type lists and unconstrained properties with a type selector](./fallback-ui-renders-type-lists-with-a-type-selector.md).
