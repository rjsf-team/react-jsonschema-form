---
title: isFormDataAvailable returns true for an empty object
description: '`isFormDataAvailable()` used to return `false` for `{}` and now returns `true`, so only `undefined` and `null` count as no data. To tell an empty object from a filled one, check `Object.keys(formData).length > 0` yourself.'
packages: ['@rjsf/utils']
uses: [utils-api]
schema: []
kind: runtime
noticed: review
related: [optional-object-holding-empty-object-renders-open]
---

## Detect

- Your code calls `isFormDataAvailable()` from `@rjsf/utils` and relies on it returning `false` for `{}`.

## Change

Check the keys yourself where you need to tell an empty object from a filled one:

```diff
-if (isFormDataAvailable(formData)) {
+if (isFormDataAvailable(formData) && Object.keys(formData).length > 0) {
```

## Verify

- Your code takes the same branch for `{}` as before.
- The built-in Optional Data Controls follow the new result; see [An optional object holding an empty object renders open](./optional-object-holding-empty-object-renders-open.md).
