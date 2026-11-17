---
title: Defaults of a recursive $ref stop where the form shows Expand Cycle
description: '`getDefaultFormState()` now fills a recursive `$ref` once past where the form shows Expand Cycle, and some recursions get defaults one level shallower. Update tests and data that expect defaults at the old depth, or put deeper values in the form data.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, utils-api]
schema: [refs, defaults]
kind: runtime
noticed: review
related: [expand-cycle-reveals-one-level-per-click, defaults-fill-more-then-dependency-and-ref-option-shapes]
---

## Detect

- In your schema: a definition that refers back to itself through a property, an array's `items`, `additionalProperties` or a `patternProperties` entry, with defaults below it.
- In your schema: a recursion reached through a percent-escaped `$ref` such as `'#/definitions/%41'`, or through a chain of definitions that are only `{ $ref: … }` (aliases).
- In your tests or code: `getDefaultFormState()` results, or the form's initial data, compared at a given depth of such a recursion, or `getDefaultFormState()` called again on its own result.

## Change

`getDefaultFormState()` reads the same schema graph as `retrieveSchema()`. A recursive `$ref` stops where the form shows an Expand Cycle button. Its defaults are filled one level further, once, as if that button had been clicked. The form stops in the same places; see [Expand Cycle reveals one level per click, and some recursions collapse at a different depth](./expand-cycle-reveals-one-level-per-click.md).

These defaults change:

- An array whose `minItems` sits in an `allOf` is filled to the depth the same array with `minItems` beside its `items` is. With `pl = { properties: { a: { default: 'x' }, child: { $ref: pl } } }` and `arr: { type: 'array', items: { $ref: pl }, allOf: [{ minItems: 1 }] }` under `allOf: 'populateDefaults'`: before `{ arr: [{ a: 'x', child: { a: 'x', child: { a: 'x' } } }] }`, after `{ arr: [{ a: 'x', child: { a: 'x' } }] }`.
- Extra keys of the data are filled down to where the schema stops recursing. With `map = { type: 'object', properties: { name: { default: 'm' } }, additionalProperties: { $ref: map } }`, a root `$ref` to `map` and the data `{ k: { j: { i: {} } } }`: before `{ name: 'm', k: { name: 'm', j: { name: 'm', i: { name: 'm' } } } }`, after `{ name: 'm', k: { name: 'm', j: { i: {} } } }`. The data below is kept as it is, and the form still renders every level.
- Keys a `patternProperties` pattern matches stop the same way. With `node = { type: 'object', properties: { n: { default: 'n' } }, patternProperties: { '^c': { $ref: node } } }`, a root `$ref` to `node` and the data `{ c1: { c2: { c3: { c4: {} } } } }`: before `{ n: 'n', c1: { n: 'n', c2: { n: 'n', c3: { n: 'n', c4: { n: 'n' } } } } }`, after `{ n: 'n', c1: { n: 'n', c2: { c3: { c4: {} } } } }`.
- The keys a `default` object names no longer grow on every call. With the same `map` and `default: { k: {} }`, the first call gives `{ name: 'm', k: { name: 'm' } }`, as before. Before, each further call on that result added one more level. After, every call gives the same result.
- A `$ref` spelled `#/definitions/%41` is the same recursion as `#/definitions/A`. With `A = { properties: { name: { default: 'n' }, child: { $ref: '#/definitions/%41' } } }` and a root `$ref` to `A`: before `{ name: 'n', child: { name: 'n', child: { name: 'n' } } }`, after `{ name: 'n', child: { name: 'n' } }`.
- A chain of aliases stops at its first alias the same way. With `node = { properties: { n: { default: 'n' }, c: { $ref: A1 } } }`, `A1 = { $ref: A2 }`, `A2 = { $ref: node }` and a root `$ref` to `node`: before `{ n: 'n', c: { n: 'n', c: { n: 'n' } } }`, after `{ n: 'n', c: { n: 'n' } }`.

Update tests that expect the old depth. If deeper levels need their defaults, put them in the form data you pass.

## Verify

- `getDefaultFormState()` gives the results above for those shapes.
- Calling `getDefaultFormState()` on its own result for a recursive `additionalProperties` schema returns an equal object.
- Clicking Expand Cycle fills the next level's defaults.
