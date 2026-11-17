---
title: mergeObjects and mergeSchemas throw when the first argument is null or undefined
description: '`mergeObjects()` and `mergeSchemas()` used to treat an `undefined` or `null` first argument as `{}`, and now throw a `TypeError` when the second has keys. Pass `maybeObject ?? {}`.'
packages: ['@rjsf/utils']
uses: [utils-api]
schema: []
kind: runtime
noticed: runtime-error
related: []
---

## Detect

- In your code: calls to `mergeObjects()` or `mergeSchemas()` from `@rjsf/utils` whose first argument can be `undefined` or `null`, such as one typed `any` or cast past the checker.
- A `TypeError` thrown from one of them at runtime.

## Change

Their signatures always asked for an object, so this affects only code that called them with a value TypeScript didn't check. Pass `{}` instead:

```diff
-mergeObjects(maybeDefaults, overrides);
+mergeObjects(maybeDefaults ?? {}, overrides);
```

## Verify

- The calls no longer throw.
- Where the left-hand value at a key is a primitive or an array and the right-hand one is an object, the right-hand object now replaces it, as a falsy left-hand value already did. Check results that relied on the old merge at such a key.
