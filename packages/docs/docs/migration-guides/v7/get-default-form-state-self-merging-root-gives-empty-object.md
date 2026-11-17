---
title: getDefaultFormState gives an empty object for a root that merges itself back in, and resolves refs without a rootSchema
description: '`getDefaultFormState()` now returns `{}` where it returned `undefined` for a root that merges itself back in, and without a `rootSchema` it resolves `$ref`s against the schema whatever the data. Update checks for `undefined` and drop workarounds for the throw.'
packages: ['@rjsf/utils']
uses: [utils-api]
schema: [refs, defaults]
kind: runtime
noticed: test
related: []
---

## Detect

- In your code: `getDefaultFormState(` with no `rootSchema`, or `rootSchema: undefined`, on a schema with local `$ref`s.
- Thrown error, before the upgrade: `Could not find a definition for #/definitions/a.` from such a call.
- In your schema: a definition that merges a schema which merges it back in, such as `Pet` with `then: { $ref: Cat }` and `Cat = { allOf: [{ $ref: Pet }, … ] }`, taken as the root through `{ $ref: Cat }`.
- In your code or tests: a check that `getDefaultFormState()` returned `undefined` for such a root with no data.

## Change

Without a `rootSchema`, the schema is its own root whatever the data. Before, a `$ref` resolved against the schema only while the form data was empty. With `{ definitions: { a: { type: 'string', default: 'x' } }, properties: { p: { $ref: '#/definitions/a' }, q: { type: 'string' } } }`: before, every call threw `Could not find a definition for #/definitions/a.`. After, it gives `{ p: 'x' }`, and `{ p: 'x', q: '1' }` for the data `{ q: '1' }`. A `$ref` in a `dependencies` entry that the data qualifies resolves too, where it threw. Remove any `try`/`catch` you added only to survive that throw.

A definition that merges a schema which merges it back in, taken as the root schema with no data, gives `{}` where it gave `undefined`. With `Pet = { type: 'object', properties: { petType: { type: 'string' } }, if: { properties: { petType: { const: 'cat' } } }, then: { $ref: Cat } }`, `Cat = { allOf: [{ $ref: Pet }, { type: 'object', properties: { hunts: { type: 'boolean' } } }] }` and a root `$ref` to `Cat`: before `undefined`, after `{}`. Update a check or test that expects `undefined`:

```diff
-expect(getDefaultFormState(context, { schema, rootSchema: schema })).toBeUndefined();
+expect(getDefaultFormState(context, { schema, rootSchema: schema })).toEqual({});
```

## Verify

- A call without `rootSchema` returns defaults with the `$ref` targets filled.
- A self-merging root with no data gives `{}`.
