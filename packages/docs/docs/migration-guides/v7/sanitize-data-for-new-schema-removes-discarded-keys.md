---
title: sanitizeDataForNewSchema removes discarded keys and leaves out objects the data doesn't hold
description: '`sanitizeDataForNewSchema()` used to keep discarded keys as `undefined` and write `{}` for missing object properties, and now removes both. Use its result on its own, not spread over the old data, and fill optional objects with `getDefaultFormState()`.'
packages: ['@rjsf/utils']
uses: [utils-api]
schema: []
affects: [code, data]
related: [sanitize-keeps-or-drops-values-by-field-tree]
---

## Detect

- In your code: calls to `sanitizeDataForNewSchema()` or `schemaUtils.sanitizeDataForNewSchema()` whose result you read, spread over the old data, or assert in tests.

`Form` and its `anyOf`/`oneOf` switch already handle the new shape; see [Form keeps or drops a value by comparing the field trees before and after a change](./sanitize-keeps-or-drops-values-by-field-tree.md).

## Change

These placeholders it used to write are gone, at every level of the data:

- A key the old schema declares and the new one doesn't, or declares with another type, is removed. Before, it was kept holding `undefined`.
- An object property the data doesn't hold, or holds as `null` where neither its type list nor `nullable: true` allows `null`, is left out. Before, it was written as `{}` wherever its schema declares `properties`, and a `null` was kept where it declares none.
- A key the new schema still declares but whose value it rejects, through its `const`, its `enum`, a `readOnly` `default` or a prefix item the array can't hold, is removed, so the defaults fill it in. An array keeps the items past its prefix that its new items allow, and drops the rest. Before, the key was set to `undefined`, which kept the defaults from reaching it.
- A key the data already holds as `undefined` keeps it where the old schema declares the same type, `const`, `enum` or constant options, `maxItems` and `default` for it, the `default` the object declares for it included. Otherwise it is removed too, unless a value replaces it, as a top-level clear is when `anyOf`/`oneOf` options are switched.

With `old = { type: 'object', properties: { x: { type: 'object', properties: { p: { type: 'string' } } } } }`, `newSchema` the same with `q` in place of `p`, and the data `{ x: { p: 'v' } }`:

```diff
-{ x: { p: undefined } }
+{ x: {} }
```

With `newSchema = { type: 'object', properties: { k: { type: 'string' }, opt: { type: 'object', properties: { x: { type: 'string' } } } } }` and the data `{ k: 'a' }`:

```diff
-{ k: 'a', opt: {} }
+{ k: 'a' }
```

If you spread the result over the old data to clear what it discarded, the spread no longer clears those keys. Use the result on its own:

```diff
-const next = { ...oldData, ...schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, oldData) };
+const next = schemaUtils.sanitizeDataForNewSchema(newSchema, oldSchema, oldData);
```

If you need the objects for a schema's optional object properties, fill them in with `getDefaultFormState()`, as a mount does.

## Verify

- In tests that assert the result, the expected value has no `undefined` keys or `{}` placeholders. `toEqual()` already treats a key holding `undefined` as absent, but it doesn't ignore a `{}`.
- Keys the new schema discards are gone from the data you build from the result.
