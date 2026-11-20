---
title: An object const wins over the defaults beneath it
description: "A key's own `default` used to win over an object `const` above it, starting the form with data the `const` rejects; the `const` now wins at any depth. Pass the key's value in `formData`, or set `constAsDefaults: 'never'`, to start with the default."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, form-props]
schema: [defaults, enums]
affects: [data]
related: [optional-object-filled-only-by-const-starts-behind-add, all-of-const-takes-precedence-under-const-as-defaults-always]
---

## Detect

- In your schema, an object `const` whose keys have a `default` of their own: a declared property's, an `additionalProperties` or `patternProperties` default, or one nested deeper.
- In your tests or stored values, the starting data of such a form.

## Change

Under the default `nestedDefaultsPrecedence: 'descendantWins'`, the key's own default won over the parent's `const`, so the form started with data the `const` rejects. The `const` now wins at any depth, whatever `nestedDefaultsPrecedence` says. A nested object also starts with the keys an ancestor's `const` names for it that it declares no property for. With this schema, the form started as `{ "a": 2 }` and now starts as `{ "a": 1 }`:

```json
{ "type": "object", "const": { "a": 1 }, "properties": { "a": { "type": "number", "default": 2 } } }
```

A key whose `type` can't hold the `const`'s value still starts with its own default.

Under `emptyObjectFields: 'populateRequiredDefaults'` or `'skipDefaults'`, a key that a `const` two or more levels up names is now set as well, required or not, as a key its parent's `const` names already was. With this schema, the form started as `{ "p": {} }` and now starts as `{ "p": { "a": 1 } }`:

```json
{
  "type": "object",
  "const": { "p": { "a": 1 } },
  "properties": { "p": { "type": "object", "properties": { "a": { "type": "number" } } } }
}
```

The value an ancestor's `const` gives a nested field also takes the place of the field's own defaults where they were built from its parts. A tuple whose `const` value is shorter than its `items` no longer gets the item defaults past it. With this schema, the form started as `{ "t": [1, 5] }` and now starts as `{ "t": [1] }`, as it already did with the `const` on `t` itself:

```json
{
  "type": "object",
  "const": { "t": [1] },
  "properties": {
    "t": { "type": "array", "items": [{ "type": "number" }, { "type": "number", "default": 5 }] }
  }
}
```

A nested object with `anyOf` or `oneOf` starts in the option the `const`'s value matches, without the defaults of keys only that option declares. With this schema, the form started as `{ "o": { "kind": "x", "p": 1 } }` and now starts as `{ "o": { "kind": "y" } }`:

```json
{
  "type": "object",
  "const": { "o": { "kind": "y" } },
  "properties": {
    "o": {
      "type": "object",
      "oneOf": [
        { "properties": { "kind": { "const": "x" }, "p": { "type": "number", "default": 1 } } },
        { "properties": { "kind": { "const": "y" }, "q": { "type": "number", "default": 2 } } }
      ]
    }
  }
}
```

To start the form with the key's default, pass it in `formData`, or set [`constAsDefaults`](../../api-reference/form-props.md#constasdefaults) to `'never'`:

```diff
- <Form schema={schema} validator={validator} />
+ <Form schema={schema} validator={validator} formData={{ a: 2 }} />
```

## Verify

- The form starts with the values the `const` names, at every depth.
- `constAsDefaults: 'never'` still turns the `const` off, and form data still wins over it.
