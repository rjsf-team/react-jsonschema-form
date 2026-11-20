---
title: A value outside a constant oneOf or anyOf takes the field's default
description: 'A constant `oneOf`/`anyOf` used to keep a value none of its constants is, where an `enum` replaced it with the `default`; both now replace it. Add the value to the options to keep it.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [any-of-one-of, defaults, enums]
affects: [data]
related: [constant-options-start-from-an-ancestor-default-constant, constant-options-start-from-a-default-outside-them, defaults-drop-object-data-a-non-object-schema-holds]
---

## Detect

- In your schema: a field whose `oneOf` or `anyOf` lists constants, with a `default` of its own or one an ancestor's `default` gives it.
- In your form data or stored values: a value for that field that none of the constants is.

## Change

An `enum` field already replaced such a value with its `default`, while a constant `oneOf`/`anyOf` kept it, on the field itself or through an `allOf` ([#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895)). Both now replace it. With this schema and `formData` of `"blue"`, `getDefaultFormState()` and the form's starting data were `"blue"` and are now `"red"`:

```json
{ "type": "string", "default": "red", "oneOf": [{ "const": "red" }, { "const": "green" }] }
```

The same goes for a property with no `default` of its own whose object's `default` gives it one. With `{ "type": "object", "default": { "c": "green" }, "properties": { "c": { "type": "string", "oneOf": [{ "const": "red" }, { "const": "green" }] } } }` and `formData` of `{ "c": "blue" }`, the result was `{ "c": "blue" }` and is now `{ "c": "green" }`.

A field with no `default` of its own or inherited keeps a value that is no object, as it does for an `enum`, unless it has a `ui:initialValue`, which replaces the value on the first pass. Object data a select over object constants doesn't offer is left out instead, for a constant `oneOf`/`anyOf` as for an `enum`, as [Defaults drop object data held by a field whose schema doesn't allow an object](./defaults-drop-object-data-a-non-object-schema-holds.md) describes. A `null` value, and a value in an array's `items` or a tuple's entries, keep it too, as they do for an `enum`.

A `NaN` takes the `default` too, the constant it names rather than the first one, as for an `enum`. With `{ "type": "number", "default": 4, "oneOf": [{ "const": 3 }, { "const": 4 }] }` and `formData` of `NaN`, the result was `3` and is now `4`.

To keep such a value, add it to the options:

```diff
-"oneOf": [{ "const": "red" }, { "const": "green" }]
+"oneOf": [{ "const": "red" }, { "const": "green" }, { "const": "blue" }]
```

## Verify

- A form seeded with a value outside the constants starts with the value you expect: the `default`, or the value itself where you added it to the options.
