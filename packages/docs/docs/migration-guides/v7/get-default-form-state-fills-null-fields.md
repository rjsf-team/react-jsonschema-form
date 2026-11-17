---
title: getDefaultFormState fills a missing null-typed value as null
description: '`getDefaultFormState()` now fills in a missing `type: ''null''` value as `null`, and its return type includes `null`. Handle the `null` in the result and in your types.'
packages: ['@rjsf/utils']
uses: [utils-api, typescript]
schema: [defaults]
kind: runtime
noticed: review
related: [defaults-are-filled-in-without-onchange]
---

## Detect

- Calls to `getDefaultFormState()` or `schemaUtils.getDefaultFormState()` in your code, on a schema with a `type: 'null'` property.
- Code that assigns the result to a type that excludes `null`.

## Change

`getDefaultFormState()` now fills in a missing `type: 'null'` value as `null`, the same as the form does (see [Form no longer calls onChange on mount for defaults or null fields](./defaults-are-filled-in-without-onchange.md)). The exception is a value inside an `anyOf`/`oneOf` option that is rendered. Its return type now includes `null`, so narrow the result before you use it:

```diff
-const defaults: MyData = schemaUtils.getDefaultFormState(schema, formData);
+const defaults = schemaUtils.getDefaultFormState(schema, formData) ?? {};
```

## Verify

- The type checker accepts each use of the result.
- Code that tests for a missing `type: 'null'` key now expects the key to hold `null`.
