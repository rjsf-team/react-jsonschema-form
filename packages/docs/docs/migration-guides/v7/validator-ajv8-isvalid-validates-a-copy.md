---
title: validator-ajv8 no longer writes defaults or coerced values into the data in isValid
description: With Ajv's `useDefaults`, `coerceTypes`, `removeAdditional` or a `modifying` keyword, `isValid()` used to change the form's data and now validates a copy. Code that relied on that change applies it through `validateFormData()` or the form's own defaults.
packages: ['@rjsf/validator-ajv8']
uses: [custom-validator]
schema: []
kind: runtime
noticed: review
related: [custom-validator-isvalid-must-not-change-data]
---

## Detect

- In your code: `customizeValidator()` with `ajvOptionsOverrides` setting `useDefaults`, `coerceTypes` or `removeAdditional`, or a custom keyword registered with `modifying: true`.
- Code or tests that expect the form's data, or the data passed to `isValid()`, to hold Ajv's defaults or coerced values, or to lose removed properties, after the form checked a condition or an option.

## Change

`isValid()` validates a copy of the data under those options. Ajv used to write defaults and coerced values into the form's data, and delete properties from it, while the form checked a condition or an option. `validateFormData()` and `rawValidation()` still validate the data itself, so they still apply those changes.

```ts
const validator = customizeValidator({ ajvOptionsOverrides: { useDefaults: true } });
const schema: RJSFSchema = { type: 'object', properties: { flag: { type: 'string', default: 'on' } } };
const formData = {};
validator.isValid(schema, formData, schema);
// Before: formData is { flag: 'on' }. After: formData is {}, and isValid() still returns true
```

Where you relied on `isValid()` filling the data, call `validateFormData()` on it, or let the form's defaults (`default` in the schema) fill it.

## Verify

- `isValid()` returns the same result as before and leaves the data you pass unchanged.
- Submitted data still holds what `validateFormData()` writes under `useDefaults` or `coerceTypes`.
