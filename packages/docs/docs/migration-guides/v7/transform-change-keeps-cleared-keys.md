---
title: A transformChange that drops a cleared key loses the clear
description: 'Under `useDefaultIfFormDataUndefined`, a clear now holds only while the key is there holding `undefined`, and a missing key no longer counts as cleared. Pass the `undefined` through in `transformChange`, and copy with `structuredClone()`.'
packages: ['@rjsf/core']
uses: [form-props]
schema: [defaults]
affects: [data, code]
related: [refuse-or-rewrite-edits-in-transform-change, cleared-field-takes-a-changed-fields-default]
---

## Detect

- `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'` in your `defaultFormStateBehavior`.
- A `transformChange` in your code that removes keys holding `undefined`, for example by destructuring them away.
- A `transformChange` that copies with `JSON.parse(JSON.stringify(next))`.
- On the rendered page, a field the user cleared that fills its default back in.

## Change

A clear holds only while the key is there holding `undefined`. A missing key used to count as cleared too. Pass the `undefined` through to keep it:

```diff
-const transformChange = ({ code, ...rest }) => (code ? { ...rest, code: code.toUpperCase() } : rest);
+const transformChange = (next) => (next.code === undefined ? next : { ...next, code: next.code.toUpperCase() });
```

`JSON.parse(JSON.stringify(next))` drops every `undefined`. Copy with `structuredClone()` instead:

```diff
-const copy = JSON.parse(JSON.stringify(next));
+const copy = structuredClone(next);
```

## Verify

- A field the user cleared stays empty after the next edit elsewhere in the form.
- See [Refusing or rewriting an edit moves from onChange to transformChange](./refuse-or-rewrite-edits-in-transform-change.md) for the other rules `transformChange` has to follow.
