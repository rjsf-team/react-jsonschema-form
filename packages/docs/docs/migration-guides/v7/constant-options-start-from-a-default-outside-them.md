---
title: A constant oneOf or anyOf starts from a default outside its constants
description: "A constant `oneOf`/`anyOf` whose `default` names none of its constants started from the first constant; it now starts from the `default` as it is, as an `enum` does. Make the first constant the `default` to keep it."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, form-props]
schema: [any-of-one-of, defaults, enums]
affects: [data]
related: [constant-options-replace-a-value-outside-them-with-the-default, constant-options-start-from-an-ancestor-default-constant]
---

## Detect

- In your schema: a field whose `oneOf` or `anyOf` lists constants, with a `default` that names none of them, its own or one its object's `default` gives it (a `null` included).
- In your form data: no value for that field, or one the defaults replace: a `NaN`, or a `null` at the root or under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`.

## Change

Such a field started from the first constant, and now starts from the `default` as it is, as an `enum` does, and as a value outside the constants in the form data is replaced by it ([#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895)). With this schema and no `formData`, `getDefaultFormState()` and the form's starting data were `"red"` and are now `"blue"`:

```json
{ "type": "string", "default": "blue", "oneOf": [{ "const": "red" }, { "const": "green" }] }
```

The same goes for a `default` of `null`, for a list an `allOf` brings in, and for a select over object constants. Under `constAsDefaults: 'always'` the first constant still wins, as it wins over a value in the form data. Under `allOf: 'skipDefaults'`, a field with an `allOf` whose constants sit in an option of its own `anyOf`, such as `"anyOf": [{ "oneOf": [{ "const": … }] }]`, still starts from the first constant.

A field whose `type` doesn't allow `null` takes an ancestor's `null` too, as an `enum` does, where it took its first constant. With this schema and no `formData`, the result was `{ "c": "red" }` and is now `{ "c": null }`, which fails validation as the `enum` field's does:

```json
{
  "type": "object",
  "default": { "c": null },
  "properties": { "c": { "type": "string", "oneOf": [{ "const": "red" }, { "const": "green" }] } }
}
```

To start from the first constant again, make it the `default`:

```diff
-{ "type": "string", "default": "blue", "oneOf": [{ "const": "red" }, { "const": "green" }] }
+{ "type": "string", "default": "red", "oneOf": [{ "const": "red" }, { "const": "green" }] }
```

For an ancestor's `null`, give the field a `default` of its own. It wins over the ancestor's whatever `nestedDefaultsPrecedence` says, since the field's `type` can't hold the `null`:

```diff
-"c": { "type": "string", "oneOf": [{ "const": "red" }, { "const": "green" }] }
+"c": { "type": "string", "default": "red", "oneOf": [{ "const": "red" }, { "const": "green" }] }
```

## Verify

- The field starts from the value you expect when the form has no data for it.
- No field starts at a `null` its `type` rejects.
