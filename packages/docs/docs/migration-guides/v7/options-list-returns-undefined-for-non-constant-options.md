---
title: optionsList returns undefined instead of throwing for options that aren't constants
description: '`optionsList()` used to throw on an `anyOf`/`oneOf` that isn''t made of constants, and `getRenderedOptionSchema()` now flags an object parent''s option. Handle an `undefined` result and treat the flagged option as offering no extra keys.'
packages: ['@rjsf/utils']
uses: [utils-api]
schema: [any-of-one-of]
affects: [code, experience]
related: [property-names-like-proto-are-read-as-own-keys]
---

## Detect

- In your code, a call to `optionsList()` from `@rjsf/utils` on an `anyOf`/`oneOf` schema, especially inside a `try`/`catch`.
- In your code, a call to `getRenderedOptionSchema()` from `@rjsf/utils`, or tests that compare its result.
- On the rendered page, an untitled object or array option labelled `[object Object]`.

## Change

`optionsList()` returns `undefined` instead of throwing when the `anyOf`/`oneOf` it reads isn't made of constants and no selector field names where the values are. Check for `undefined` in place of catching the error:

```diff
-let options;
-try {
-  options = optionsList(schema, uiSchema);
-} catch {
-  options = undefined;
-}
+const options = optionsList(schema, uiSchema);
```

An option with no title and an object or array value is labelled with its JSON instead of `[object Object]`.

`getRenderedOptionSchema()` marks the option of an object parent with a Symbol flag, beside the `required` list and type it already took. Its field then offers no extra key beside the parent's, even where the form reads an absent `additionalProperties` as allowing any key. Tests that compare its result with `toEqual` may need updating.

## Verify

- Your code handles an `undefined` options list.
- Object and array options show readable labels.
