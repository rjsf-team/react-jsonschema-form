---
title: A constant oneOf or anyOf starts from the constant its object's default names
description: "A property with constant `oneOf`/`anyOf` options and no `default` of its own started from the first constant, even where its object's `default` named another; it now starts from the named one. Give the property a `default` to keep the first."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [any-of-one-of, defaults, enums]
affects: [data]
related: [constant-options-replace-a-value-outside-them-with-the-default, constant-options-start-from-a-default-outside-them]
---

## Detect

- In your schema: a property whose `oneOf` or `anyOf` lists constants, with no `default` of its own, inside an object whose `default` names one of those constants for it.
- In your form data: no value for that property.

## Change

Such a property started from the first constant, and now starts from the one its object's `default` names, as an `enum` does ([#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895)). With this schema and no `formData`, the result was `{ "n": 3 }` and is now `{ "n": 4 }`:

```json
{
  "type": "object",
  "default": { "n": 4 },
  "properties": { "n": { "type": "number", "oneOf": [{ "const": 3 }, { "const": 4 }] } }
}
```

An inherited `default` that names none of the constants is taken as it is, as [A constant oneOf or anyOf starts from a default outside its constants](./constant-options-start-from-a-default-outside-them.md) describes.

To start from the first constant again, give the property that constant as its `default`:

```diff
-"n": { "type": "number", "oneOf": [{ "const": 3 }, { "const": 4 }] }
+"n": { "type": "number", "default": 3, "oneOf": [{ "const": 3 }, { "const": 4 }] }
```

## Verify

- The property starts from the constant you expect when the form has no data for it.
