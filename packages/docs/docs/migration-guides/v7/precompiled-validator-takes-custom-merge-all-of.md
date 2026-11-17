---
title: createPrecompiledValidator() takes the form's customMergeAllOf
description: A precompiled validator checked its root schema with the default `allOf` merge, so a form with `customMergeAllOf` could fail that check. Pass `{ customMergeAllOf }` to `createPrecompiledValidator()` so it resolves the root schema as the form does.
packages: ['@rjsf/validator-ajv8', '@rjsf/validator-ata']
uses: [custom-validator, form-props]
schema: [defaults]
kind: runtime
noticed: runtime-error
related: [custom-merge-all-of-applies-in-every-schema-function, precompiled-validator-takes-an-options-object, precompiled-validator-code-must-be-regenerated]
---

## Detect

- In your code, `createPrecompiledValidator()` from `@rjsf/validator-ajv8` or `@rjsf/validator-ata` used with a `Form` that sets `customMergeAllOf`.
- At runtime, the error "The schema associated with the precompiled validator differs from the rootSchema provided for validation", for a root schema with an `allOf`.

## Change

A precompiled validator is tied to one root schema compiled once, so it takes the form's `customMergeAllOf` at construction instead of per call:

```diff
-const validator = createPrecompiledValidator(validateFns, schema);
+const validator = createPrecompiledValidator(validateFns, schema, { customMergeAllOf });
```

It uses it when it resolves its own root schema to check the schema it is handed, so the error no longer comes from `validateFormData()`, nor from a schema function scoring `oneOf`/`anyOf` options or resolving a condition against that root schema. The third argument is an options object; see [createPrecompiledValidator() takes its localizer in an options object](./precompiled-validator-takes-an-options-object.md).

`compileSchemaValidators()` and `compileSchemaValidatorsCode()` take no `customMergeAllOf`: they compile the subschemas the root names, and a schema a merge makes is not compiled; see [Precompiled validator code must be regenerated](./precompiled-validator-code-must-be-regenerated.md).

## Verify

Under `liveValidate`, a form with `customMergeAllOf` and an `allOf` in its root schema validates without the "differs from the rootSchema" error.
