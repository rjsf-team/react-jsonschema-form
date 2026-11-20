---
title: Defaults now fill then branches, dependency chains and anyOf or oneOf options written as a $ref
description: 'Defaults now come from a `then` branch on an untyped property, from a whole `dependencies` chain in one call, and from a `$ref` option merged with its field''s `default`. Check the form''s initial data and drop any repeated `getDefaultFormState()` calls.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [defaults, any-of-one-of, refs]
affects: [data]
related: [recursive-ref-defaults-stop-at-the-cycle, all-of-defaults-behavior-reaches-more-shapes, dependency-oneof-option-matched-through-allof]
---

## Detect

- In your schema: a property with no `type` of its own whose `if`/`then` branch holds a `$ref` with a `default`, or a `$ref` to a schema with an object `default`, such as `p: { if: …, then: { $ref: …, default: … } }`.
- In your schema: `dependencies` where a default of one property qualifies a dependency that adds another property with a default, and so on.
- In your schema: a field with a `default` whose `anyOf`/`oneOf` options are `$ref`s, such as `{ default: …, anyOf: [{ $ref: … }] }`.
- In your schema: root `dependencies` keyed by a property that has a `default`, and a `Form` given `formData` without that property.
- In your code: a loop or a second `getDefaultFormState()` call that only exists to fill a chain of dependencies.

## Change

Each field's schema is merged from its `$ref`, its `allOf` (under `allOf: 'populateDefaults'`, or where the field has an `if`), its `then`/`else` and its `dependencies`, as the form renders the field. The `dependencies` are applied again until the defaults bring no new key that qualifies another one. These defaults change:

- A `then` gives a property without a `type` the default its branch declares, as the form renders it. With `p: { if: {}, then: { $ref: S, default: 'sib' } }` and `S = { type: 'string', default: 'def' }`: before `{}`, after `{ p: 'sib' }`. With `p: { if: {}, then: { $ref: O, required: ['a'] } }` and `O = { type: 'object', properties: { a, b }, default: { a: 'da', b: 'db' } }`: before `{}`, after `{ p: { a: 'da', b: 'db' } }`.
- A chain of `dependencies` is filled in one call. With `k0` having a default and each `k(i-1)` a dependency adding `k(i)` with a default, nine keys long: before, the first call gave `{ k0, k1 }` and each further call added one key. After, the first call gives `k0` to `k8`.
- An `anyOf`/`oneOf` option written as a `$ref` is merged with its field's `default` as an option written in place is. With `O = { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } } }`, `o: { default: { a: 1 }, anyOf: [{ $ref: O }] }` and the data `{ o: { b: 2 } }`: before `{ o: { b: 2 } }`, after `{ o: { a: 1, b: 2 } }`, which the option written in place already gave.
- With `S = { type: 'string', default: 'child' }` and `s: { default: 'parent', anyOf: [{ $ref: S }] }` under `nestedDefaultsPrecedence: 'ancestorWins'`: before `{ s: 'parent' }`, after `{ s: 'child' }`, as for `S` written in place.
- An option `{ $ref: s, default: 'beside' }`, with `s = { type: 'string', default: 'target' }`, gives `'beside'` where it gave `'target'`.
- A root `dependencies` entry counts a default as its property's value whatever else the form data holds, as a nested one already did. With `properties: { animal: { default: 'Cat' }, other: { type: 'string' } }` and `dependencies: { animal: { properties: { food: { default: 'meat' } } } }`, for the form data `{ other: 'x' }`: before `{ animal: 'Cat', other: 'x' }`, after `{ animal: 'Cat', other: 'x', food: 'meat' }`.

Remove any loop or repeated `getDefaultFormState()` call that existed only to fill a dependency chain. If a property should start empty, remove the `default` from its branch or option. A dependency's `oneOf` options are also matched in more places; see [A dependency's oneOf option is matched by the property it declares in an allOf, $ref, then, else or dependencies](./dependency-oneof-option-matched-through-allof.md).

## Verify

- The form's initial data holds the branch, option and dependency defaults listed above.
- One `getDefaultFormState()` call fills every key of a dependency chain.
