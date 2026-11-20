---
title: ValidatorType and customizeValidator() take the schema as their first type argument
description: "`ValidatorType` and `customizeValidator()` used to take the form data type first, and now take `<S, F>` with the data type on `validateFormData<T>()`. Drop the form data type argument."
packages: ['@rjsf/utils', '@rjsf/validator-ajv8', '@rjsf/validator-ata', '@rjsf/validator-cfworker']
uses: [custom-validator, typescript]
schema: []
affects: [code]
related: []
---

## Detect

- Your code passes a form data type to `customizeValidator<MyData>()` or `ValidatorType<MyData>`.
- The type checker reports one of these, depending on `MyData`:
  - `TS2559: Type 'MyData' has no properties in common with type 'JSONSchema7'` at the declaration, when `MyData` shares no keys with `JSONSchema7`.
  - `TS2344: Type 'MyData' does not satisfy the constraint 'JSONSchema7'` at the declaration, when a shared key has a conflicting type.
  - `TS2322: Type 'JSONSchema7' is not assignable to type 'MyData'` on the `schema` prop of a `Form` that infers its types from the validator, or `TS2741: Property '…' is missing in type 'JSONSchema7' but required in type 'MyData'` when `MyData` also has a required key that `JSONSchema7` lacks. This happens when the declaration compiles with the schema typed as `MyData`, such as for a `title: string`.
- A `Form<MyData>` may report nothing, since the validator's methods are checked bivariantly. Search your code for the type argument.

## Change

`ValidatorType<S, F>` puts the form data type on `validateFormData<T>()`, since a validator checks data of any shape against a schema. The default export of `@rjsf/validator-ajv8`, `@rjsf/validator-ata` and `@rjsf/validator-cfworker` fits every `Form`, and `customizeValidator()` takes only `<S, F>`. In every case, drop the type argument:

```diff
-const validator = customizeValidator<MyData>();
+const validator = customizeValidator();

 <Form<MyData> schema={schema} validator={validator} />
```

## Verify

- No `customizeValidator<…>()` or `ValidatorType<…>` in your code names a form data type.
- The type checker reports none of the errors above.
