---
title: A cleared field takes the default of the field that replaces it
description: 'A field the user cleared now takes the new default when its schema changes, and a constant `anyOf`/`oneOf` with a `default` now stays cleared under `useDefaultIfFormDataUndefined`. Restore the old result from `transformChange` if you relied on it.'
packages: ['@rjsf/core']
uses: [form]
schema: [defaults, any-of-one-of, enums]
affects: [data]
related: [refuse-or-rewrite-edits-in-transform-change, transform-change-keeps-cleared-keys, set-field-value-fills-in-defaults]
---

## Detect

- In your schema, a field whose `type`, `const`, `enum` (or the constants of its `anyOf`/`oneOf`), `maxItems` or `default` changes through an `if`/`then`, an option switch or a new `schema` prop.
- In your schema, an `anyOf`/`oneOf` of constants with a `default`, used under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`.
- On the rendered page, a field the user cleared that now fills in, or stays empty, after one of those changes.

## Change

Two cases of a field the user cleared behave differently now, and neither can be turned off:

- When a field's `type`, `const`, `enum` (or the constants of its `anyOf`/`oneOf`), `maxItems` or `default` changes, a clear of it gives way to the new field's default under every `mergeDefaultsIntoFormData`. The field used to stay empty. A `disabled` or `readonly` form keeps and gives way to its clears the same way, and so does any other key holding `undefined`. Every value stays as it is, including a `null` item the user didn't clear.
- Under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`, an `anyOf`/`oneOf` field of constants with a `default` stays cleared, as any other field does. Its default used to come back.

If your form relied on the old result, restore it from [`transformChange`](./refuse-or-rewrite-edits-in-transform-change.md), which gets the data an edit settled on. Write `undefined` back for a field that has to stay empty, or the `default` for one that has to take it again:

```tsx
const transformChange = (next) => (next?.kind === 'other' ? { ...next, detail: undefined } : next);
```

A new `schema` prop runs no `transformChange`, so a field that has to stay empty through one needs its data set after the change, with `setFieldValue()`.

## Verify

- After an `if`/`then` switch, an option switch or a new `schema` prop, cleared fields show the result your form expects.
- A `transformChange` that writes `undefined` back keeps the key, see [A transformChange that drops a cleared key loses the clear](./transform-change-keeps-cleared-keys.md).

## If you can't preserve it

Neither case has an option to turn it off. The only way back to the old result is to set the data yourself, from `transformChange` for edits or with `setFieldValue()` after a new `schema` prop.
