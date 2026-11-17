---
title: The ref's validate() takes only the data
description: "`validate()` on a `Form` ref lost its `schema`, `altSchemaUtils` and `retrievedSchema` parameters. To validate against another schema, call that schema's validator with `validateFormData()` yourself."
packages: ['@rjsf/core']
uses: [form-ref]
schema: []
kind: removal
noticed: type-error
related: [form-ref-is-a-formref-handle, schema-functions-take-schema-context]
---

## Detect

- In your code, a call to `formRef.current.validate(data, ...)` that passes anything after the data.
- The type checker reports `Expected 1 arguments, but got 2.` (or `3`, `4`) on that call.

## Change

`validate()` now takes only the data to validate: `validate(formData)`. Its `schema`, `altSchemaUtils` and `retrievedSchema` parameters are gone. The ref is typed `FormRef<T>`; see [A ref to Form holds a FormRef handle](./form-ref-is-a-formref-handle.md).

To validate against another schema or validator, build the utilities for it and call its validator yourself, passing the form's `customValidate`, `transformErrors` and `uiSchema` as `validate()` did:

```diff
-const { errors } = formRef.current.validate(data, otherSchema, otherSchemaUtils);
+const { errors } = otherSchemaUtils
+  .getValidator()
+  .validateFormData(data, otherSchema, customValidate, transformErrors, uiSchema);
```

To hand `customValidate` the same defaults the form would, pass the trailing `getCustomValidateFormData` that [`validateFormData()` now takes](./custom-merge-all-of-applies-in-every-schema-function.md): `() => otherSchemaUtils.getDefaultFormState(otherSchema, data, true, undefined, uiSchema)`.

`validate()` also added the errors of `ui:required` fields on top. For those, merge `otherSchemaUtils.getUiRequiredErrorSchema(uiSchema, data)` into the result with `validationDataMerge()`.

## Verify

- The type checker accepts every `validate()` call.
- Validating against the other schema reports the same errors, `ui:required` ones included, that the old call did.
