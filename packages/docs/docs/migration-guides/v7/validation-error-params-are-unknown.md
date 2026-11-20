---
title: RJSFValidationError.params is optional with unknown values
description: '`RJSFValidationError.params` used to be `any` and is now an optional `Record<string, unknown>`. Narrow each value before using it, and spread an interface-typed value you set as `params` or declare it with `type`.'
packages: ['@rjsf/utils']
uses: [typescript, form-props, custom-validator]
schema: []
affects: [code]
related: []
---

## Detect

- In your code: `error.params` read in a `transformErrors`, an error list template or a custom validator.
- The type checker reports `'error.params' is possibly 'undefined'.` (TS18048), or `Type 'unknown' is not assignable to type '…'.` (TS2322) where you use one of its values.
- In a custom validator: `params` set to a value typed with an `interface`, which the type checker rejects with TS2322 because an interface has no index signature.

## Change

`params` can be missing and its values are `unknown`, so narrow a value before using it:

```diff
-const missing: string = error.params.missingProperty;
+const missing = error.params?.missingProperty;
+if (typeof missing === 'string') { … }
```

For an interface-typed value, spread it as `params: { ...params }`, or declare its type with `type` instead of `interface`.

## Verify

- The type checker accepts your reads and writes of `params`.
- Code that reads `params` handles an error that has none.
