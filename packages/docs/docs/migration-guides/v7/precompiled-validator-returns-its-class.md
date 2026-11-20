---
title: createPrecompiledValidator() returns its validator class
description: "`createPrecompiledValidator()` now returns `AJV8PrecompiledValidator` or `ATAPrecompiledValidator` where it returned `ValidatorType`. Annotate a variable you later reassign as `ValidatorType<S, F>`."
packages: ['@rjsf/validator-ajv8', '@rjsf/validator-ata']
uses: [custom-validator, typescript]
schema: []
affects: [code]
related: [precompiled-validator-takes-an-options-object, raw-validation-returns-validator-error-type]
---

## Detect

- Your code stores the result of `createPrecompiledValidator()` in a variable or state and later assigns it another validator, such as one from `customizeValidator()`.
- The type checker reports `TS2740: Type 'AJV8Validator<JSONSchema7, object>' is missing the following properties from type 'AJV8PrecompiledValidator<JSONSchema7, object>': rootSchema, validateFns, mainValidator, schemaContext, and 3 more` on that assignment.

## Change

`createPrecompiledValidator()` returns its class, `AJV8PrecompiledValidator` from `@rjsf/validator-ajv8` or `ATAPrecompiledValidator` from `@rjsf/validator-ata`. A variable or state it initializes takes that class as its type. Annotate the variable as `ValidatorType<S, F>`, or pass it as the type argument of `useState<ValidatorType>()`:

```diff
-let validator = createPrecompiledValidator(validateFns, schema);
+let validator: ValidatorType = createPrecompiledValidator(validateFns, schema);
 validator = customizeValidator();
```

## Verify

- The reassignment type-checks.
- The annotation types the `rawValidation()` errors as `unknown[]` again, where the class gives `ErrorObject[]`. See [rawValidation() returns the validator's error type](./raw-validation-returns-validator-error-type.md) if you read them.
