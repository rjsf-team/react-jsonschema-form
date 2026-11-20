---
title: rawValidation() takes no type argument and returns each validator's own error type
description: '`rawValidation()` no longer takes a type argument: each validator returns its engine''s error type, and a bare `ValidatorType` returns `unknown[]`. Drop the type argument and type a stored result as `RawValidationResult<E>`.'
packages: ['@rjsf/utils', '@rjsf/validator-ajv8', '@rjsf/validator-ata', '@rjsf/validator-cfworker']
uses: [typescript, custom-validator]
schema: []
affects: [code]
related: []
---

## Detect

- In your code: `rawValidation<…>(…)` called with a type argument; the type checker reports `Expected 0 type arguments, but got 1.` (TS2558).
- In your code: a result of `rawValidation()` stored in state or a variable with a type you wrote out, such as `{ errors?: ErrorObject[] }`.
- In a custom validator: a `rawValidation()` with its own `Result` type parameter that hands back another validator's `rawValidation()`.

## Change

Each validator returns the errors of its engine, from `customizeValidator()`, the default export and `createPrecompiledValidator()` alike: `ErrorObject` from Ajv for `@rjsf/validator-ajv8`, `ValidationError` from `ata-validator` for `@rjsf/validator-ata`, and `CFWorkerValidationError` for `@rjsf/validator-cfworker`. Each validator package exports its error type, so an app that doesn't depend on the engine itself can import it from there. To type a stored result, use `RawValidationResult` from `@rjsf/utils`:

```diff
-import type { ErrorObject } from 'ajv';
+import type { RawValidationResult } from '@rjsf/utils';
+import type { ErrorObject } from '@rjsf/validator-ajv8';

-const [result, setResult] = useState<{ errors?: ErrorObject[] }>();
-setResult(validator.rawValidation<ErrorObject>(schema, formData));
+const [result, setResult] = useState<RawValidationResult<ErrorObject>>();
+setResult(validator.rawValidation(schema, formData));
```

That diff needs `validator` to have a concrete type, as `customizeValidator()`, the default export and `createPrecompiledValidator()` give it. Code that holds it as `ValidatorType`, as `Form` and `Registry` do, has only `unknown[]` errors, so assert the engine you know you have: `setResult(validator.rawValidation(schema, formData) as RawValidationResult<ErrorObject>)`.

A custom validator that hands back another validator's `rawValidation()` drops its own `Result` type parameter, since that call's errors are no longer `Result[]`.

## Verify

- The type checker accepts your `rawValidation()` calls and stored results.
- Nothing changes at runtime.
