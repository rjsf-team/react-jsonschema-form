---
title: Expand Cycle reveals one level per click, and some recursions collapse at a different depth
description: 'Each Expand Cycle click now reveals one level of a recursive `$ref`, and some recursions start collapsed one level higher or lower. Update tests and snapshots to the new field ids and click once per level they need.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, markup]
schema: [refs]
kind: runtime
noticed: test
related: [recursive-ref-defaults-stop-at-the-cycle, ref-cycle-expansion-uses-expand-ref-cycle]
---

## Detect

- In your tests: a click on an Expand Cycle button id such as `#root_child_child__expand`, followed by a query for the next button or the fields below it.
- In your tests or snapshots: the ids of the fields rendered below a recursion, or of its `…__expand` button.
- In your schema: a recursive definition reached through a percent-escaped `$ref` such as `'#/definitions/%41'`, through a definition that is only `{ $ref: … }` (an alias), or through an array's `items`.

## Change

`@rjsf/utils` parses each root schema once into a graph of its subschemas, and the form stops a recursive `$ref` by one rule. A `$ref` is compared by the subschema it reaches, so two spellings of one target are one `$ref`. A field stops, with an Expand Cycle button, where the first `$ref` it enters is already on the way down to it, or where any `$ref` it enters already occurs twice on that way.

`expandRefCycle()` returns the schema of a flagged field resolved one level further, which `CyclicSchemaField` renders when its Expand Cycle button is clicked (see [Expanding a $ref cycle in a custom field uses expandRefCycle](./ref-cycle-expansion-uses-expand-ref-cycle.md)). One click now reveals one more level of the recursion, whatever the recursion goes through:

- `{ type: 'object', properties: { child: { $ref: '#' } } }`, after clicking `#root_child_child__expand`. Before: the next button is `#root_child_child_child_child__expand`. After: it is `#root_child_child_child__expand`.
- `pl = { type: 'object', properties: { a: { type: 'string' }, child: { $ref: pl } } }` with a root `$ref` to `pl`, after clicking `#root_child__expand`. Before: the next button is `#root_child_child_child__expand`. After: it is `#root_child_child__expand`.
- A recursion through a `then` or an `allOf`, which used to overflow the stack or run out of memory, now renders and reveals one level per click as well.

These recursions now stop at a different place:

- The first row of an array under a root `$ref` stops a recursive property where every other row does. With `node = { properties: { name, kids: { type: 'array', items: { $ref: node } }, best: { $ref: node } } }`, a root `$ref` to `node` and the data `{ kids: [{}] }`: before, `root_kids_0_best` rendered and `root_kids_0_best_best` was collapsed. After, `root_kids_0_best` is collapsed, as it already was for deeper rows and under a root that is not a `$ref`.
- A `$ref` spelled `#/definitions/%41` is the same target as `#/definitions/A`. With `A = { properties: { name, child: { $ref: '#/definitions/%41' } } }` and a root `$ref` to `A`: before, `root_child_child` was collapsed. After, `root_child` is collapsed, as it is when `child` is written `{ $ref: '#/definitions/A' }`.
- A recursion through a chain of aliases stops at the first alias, since each alias is compared by the definition it reaches. With `node = { type: 'object', properties: { n: { type: 'string' }, c: { $ref: A1 } } }`, `A1 = { $ref: A2 }`, `A2 = { $ref: node }` and a root `$ref` to `node`: before, `root_c_n` rendered and `root_c_c` was collapsed. After, `root_c` is collapsed.
- Each row of an array that the data holds renders the rows the data has below it, under any root. With `node = { properties: { v, kids: { $ref: list } } }`, `list = { type: 'array', items: { $ref: node } }`, a root that is `node` written out in place of a `$ref` to it, and the data `{ v: 'a', kids: [{ v: 'b', kids: [{ v: 'c', kids: [{ v: 'd' }] }] }] }`: before, `root_kids_0_kids` was collapsed, hiding `c` and `d`. After, every row renders, down to `root_kids_0_kids_0_kids_0_v`, as it already did under a root `$ref` to `node`.
- A row added to an array of a recursive definition gets the defaults the form's first row got. With `A = { properties: { v, b: { $ref: B } } }`, `B = { type: 'array', minItems: 1, items: { $ref: A } }` and a root `$ref` to `A`, after clicking `#root_b__add`: before, the new row was filled five levels deep, down to `root_b_1_b_0_b_0_b_0_b_0_v`. After, it is filled as `root_b_0` is, down to `root_b_1_b_0_b_0_v`.

Update tests to click once per level they need, and update snapshots and field-id selectors to the new depths, clicking Expand Cycle where a level now starts collapsed. The defaults of such a recursion stop at the same place; see [Defaults of a recursive $ref stop where the form shows Expand Cycle](./recursive-ref-defaults-stop-at-the-cycle.md).

## Verify

- After each click the next Expand Cycle button sits one level deeper, `…_child__expand` then `…_child_child__expand`.
- The fields render down to the depths listed above, and the Expand Cycle button appears where the recursion first comes back round.
