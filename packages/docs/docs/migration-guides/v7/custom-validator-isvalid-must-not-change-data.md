---
title: A custom validator's isValid must leave the data unchanged
description: '`getClosestMatchingOption()` now reuses a pick within one call without comparing the data again, so `ValidatorType.isValid()` must not change the data at any depth. A validator whose engine fills defaults, coerces or removes properties hands it a copy.'
packages: ['@rjsf/utils']
uses: [custom-validator]
schema: []
affects: [code]
related: [validator-ajv8-isvalid-validates-a-copy, get-closest-matching-option-always-returns-an-option]
---

## Detect

- In your code: a class or object implementing `ValidatorType` whose `isValid()` passes the data to an engine that fills in defaults, coerces values or removes properties while it validates.

## Change

`getClosestMatchingOption()` reuses a pick it made for some data during the same call without comparing the data again, so `isValid()` must not change the data it is handed, at any depth. Hand the engine a copy inside `isValid()`:

```diff
 isValid(schema, formData, rootSchema) {
-  return engine.validate(schema, formData, rootSchema);
+  return engine.validate(schema, structuredClone(formData), rootSchema);
 }
```

`@rjsf/validator-ajv8` now does this itself; see [validator-ajv8 no longer writes defaults or coerced values into the data in isValid](./validator-ajv8-isvalid-validates-a-copy.md). `@rjsf/validator-ata` already validated a copy, and `@rjsf/validator-cfworker` doesn't change the data.

## Verify

- Data you pass to `isValid()` is the same after the call, at every depth.
- Forms with `anyOf`/`oneOf` options show the option the data matches.
