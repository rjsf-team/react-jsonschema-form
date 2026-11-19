---
title: Keywords beside a $ref are merged with its target as an allOf
description: 'Keywords beside a `$ref` used to override its target keyword by keyword, and are now merged with the target as an `allOf` under every draft. Expect the target''s fields, `required` and defaults to apply too, or write the field without the `$ref`.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [refs, defaults]
affects: [data, appearance]
related: [recursive-ref-defaults-stop-at-the-cycle, option-scoring-reads-options-as-json-schema]
---

## Detect

- In your schema: an object holding `$ref` and also `properties`, `required`, `items`, `type`, `enum` or another keyword that asserts something, such as `cat: { $ref: Pet, properties: { meow: … } }`, including one reached through another `$ref`.
- In your schema: `{ $ref: …, default: … }` where the target declares a `default` too, inside a recursive definition, an alias definition, a draft-07 tuple `items`, `additionalItems` or an `anyOf`/`oneOf` option.
- On the rendered page: such a field now also renders the fields of the schema the `$ref` names, and that schema's `required` applies.
- In your form data: the defaults and the output of `omitExtraData`/`liveOmit` now include the target's properties.

## Change

A `$ref` with keywords beside it is read as JSON Schema reads it, under every draft, in the form, the defaults, option scoring and `omitExtraData()`: as the `allOf` of those keywords and of the schema the `$ref` names. Before, the keywords beside a field's own `$ref` overrode the schema it names keyword by keyword under every draft, and under draft-07 and earlier a `$ref` reached through another `$ref` dropped the keywords beside it.

With `Pet = { type: 'object', properties: { name: { type: 'string', default: 'n' } }, required: ['name'] }` and `cat: { $ref: Pet, properties: { meow: { type: 'string', default: 'm' } } }`:

- the form renders `root_cat_meow` beside `root_cat_name`, where it rendered `root_cat_meow` alone, and `Pet`'s `required` applies to `cat`;
- the defaults are `{ cat: { meow: 'm', name: 'n' } }`, where they were `{ cat: { meow: 'm' } }`. The keywords beside a `$ref` are no `allOf` the schema declares, so they are filled whatever the `allOf` defaults behavior;
- `omitExtraData()`, which the `omitExtraData` and `liveOmit` props run, keeps `{ cat: { name: 'x', meow: 'y' } }` of the data `{ cat: { name: 'x', meow: 'y', z: 1 } }`, where it kept `{ cat: { meow: 'y' } }`.

The same holds where another `$ref` reaches such a `$ref`, as `v: { $ref: M }` reaches `M = { $ref: O, properties: { b: { type: 'string', default: 'b' } } }` with `O = { properties: { a: { type: 'string', default: 'a' } } }`. Under draft-07 the form renders `root_v_b` beside `root_v_a`, where it rendered `root_v_a` alone, and the defaults are `{ v: { b: 'b', a: 'a' } }`, where they were `{ v: { a: 'a' } }`. With the options `[{ type: 'object', properties: { a: { type: 'string' } } }, { $ref: M }]` and no selected option, `getClosestMatchingOption()` picks the second option for `{ b: 'y' }`, where with `@rjsf/validator-ajv8` and `@rjsf/validator-cfworker` it matched no option and returned the selected option, `-1` (`@rjsf/validator-ata` already picked the second). It picks the first for `{ a: 'y' }`, as before. The rest of option scoring is in [getFirstMatchingOption and getClosestMatchingOption match an option as JSON Schema reads it](./option-scoring-reads-options-as-json-schema.md).

The keywords beside a recursive `$ref` apply at every level, as they do in the form. With `node = { properties: { name: { default: 'n' }, child: { $ref: node, properties: { own: { default: 'o' } } } } }` and a root `$ref` to `node`, the defaults were `{ name: 'n', child: { name: 'n', child: { own: 'o' } } }` and are `{ name: 'n', child: { own: 'o', name: 'n', child: { own: 'o' } } }`. Where that recursion stops is in [Defaults of a recursive $ref stop where the form shows Expand Cycle](./recursive-ref-defaults-stop-at-the-cycle.md).

The keywords beside the `$ref` come first in the merge, so a field renders them first, and where both sides declare an annotation, theirs wins. A `customMergeAllOf` merges the two as it merges an `allOf`, in the form, the defaults, option scoring and `omitExtraData()` alike.

Annotations are read as before: a `$ref` whose only other keywords are `title`, `description`, `default`, `examples`, `readOnly`, `writeOnly`, `deprecated`, `$comment`, `$id`, `$anchor`, `$defs`, `definitions` and `$schema` reads as the schema it names, with the annotations beside it over its own. So `{ $ref: Status, default: 'active' }` defaults to `'active'` whatever `Status` declares. A `$ref` beside nothing but `$defs` now fills its target's defaults: with `$defs: { a: { $defs: { n: { type: 'number', default: 7 } }, $ref: '#/$defs/a/$defs/n' } }` and `properties: { l: { $ref: '#/$defs/a' } }`, the defaults are `{ l: 7 }` where they were `{}`.

A `default` beside a `$ref` overrides the referenced schema's wherever it stands, as it already did on a property, an array's `items` or the root. `{ properties: { status: { $ref: Status, default: 'active' } } }` with `Status = { type: 'string', default: 'draft' }` gives `{ status: 'active' }` before and after. With `s = { type: 'string', default: 'target' }`:

- In a recursion, `node = { properties: { v: { $ref: s, default: 'beside' }, child: { $ref: node } } }` and a root `$ref` to `node`: before `{ v: 'beside', child: { v: 'target' } }`, after `{ v: 'beside', child: { v: 'beside' } }`.
- Along a chain of aliases, with `alias = { $ref: s, default: 'alias' }` and `inner: { $ref: alias }`: before `{ inner: 'target' }`, after `{ inner: 'alias' }`.
- `computeDefaults()` on `{ $ref: s, default: 'beside' }`: before `'target'`, after `'beside'`.
- In a draft-07 tuple position, `arr: { type: 'array', items: [{ $ref: s, default: 'beside' }, { $ref: s }] }`: before `{ arr: ['target', 'target'] }`, after `{ arr: ['beside', 'target'] }`, and the form's first input shows `beside`.
- In `additionalItems`, `arr: { type: 'array', minItems: 2, items: [{ type: 'string' }], additionalItems: { $ref: s, default: 'beside' } }`: before `{ arr: [undefined, 'target'] }`, after `{ arr: [undefined, 'beside'] }`.

If you relied on the keywords beside a `$ref` replacing the target's, write the field without the `$ref`, or move what should not apply out of the target:

```diff
-cat: { $ref: '#/definitions/Pet', properties: { meow: { type: 'string' } } },
+cat: { type: 'object', properties: { meow: { type: 'string' } } },
```

If the target's `default` is the one you want, remove the `default` beside the `$ref`.

## Verify

- The field renders the fields beside the `$ref` first, then the target's, and the target's `required` is enforced on submit.
- The defaults and the data `omitExtraData` keeps hold both sides' keys.
- Each field's initial value is the `default` written beside its `$ref`, at every depth.
