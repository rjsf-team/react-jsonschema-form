---
title: The allOf defaults behavior and customMergeAllOf apply to each field as the schema declares it
description: 'The `allOf` defaults behavior now reaches an extra key''s `$ref`, a nested `dependencies` and a chosen option, and a `customMergeAllOf` no longer changes which defaults a field gets. Set `allOf: ''populateDefaults''` where you relied on the old fill.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form-props]
schema: [defaults, refs, any-of-one-of]
affects: [data]
related: [defaults-fill-more-then-dependency-and-ref-option-shapes]
---

## Detect

- In your `Form` props: `defaultFormStateBehavior={{ allOf: … }}`, or none (the default is `allOf: 'skipDefaults'`), or `customMergeAllOf=`.
- In your schema: `additionalProperties: { $ref: A }` or a `patternProperties` entry, where `A` is `{ allOf: [ … ] }` with defaults inside.
- In your schema: below the root, an `allOf` holding a `dependencies` entry, or an entry with a default and a later entry with an `anyOf`/`oneOf` that declares the same key.
- In your `Form` props: a `customMergeAllOf` that also flattens nested `allOf`s, such as `createDeepAllOfMerge` from `@x0k/json-schema-merge`, or one that rewrites `anyOf`/`oneOf` options.
- In your form data: those fields start with different values.

## Change

Each field's defaults are computed from the field as the schema declares it. These defaults change:

- An `allOf` behind the `$ref` of an extra key of the data follows the `allOf` defaults behavior, as one behind a property's `$ref` does. With `A = { allOf: [{ type: 'object', properties: { a: { type: 'string', default: 'a' } } }] }`, `{ type: 'object', additionalProperties: { $ref: A } }` and the data `{ k: {} }`, under the default `allOf: 'skipDefaults'`: before `{ k: { a: 'a' } }`, and `a` showed in the form, after `{ k: {} }`. A key a `patternProperties` pattern matches changes the same way. Before, only an `additionalProperties` of the root schema was filled: under a property, `p: { type: 'object', additionalProperties: { $ref: A } }` with `{ p: { k: {} } }` gave `{ p: { k: {} } }` before and after. The keywords beside a `$ref` are no such `allOf`: under 2019-09 and 2020-12, with `M = { $ref: O, properties: { b: { default: 'b' } } }` used as `additionalProperties: { $ref: M }`, the defaults are `{ k: { b: 'b', a: 'a' } }` before and after.
- Under `allOf: 'populateDefaults'`, a `dependencies` entry inside an `allOf` is filled when a default qualifies it, as one beside `properties` is. With `p: { allOf: [{ dependencies: { a: { properties: { c: { type: 'string', default: 'c' } } } } }, { type: 'object', properties: { a: { type: 'string', default: 'x' } } }] }` and no data: before `{ p: { a: 'x' } }`, after `{ p: { a: 'x', c: 'c' } }`, and the form's `c` input shows `c`. The same `allOf` at the root already gave `c`.
- Under `allOf: 'populateDefaults'`, the option an `allOf` entry chooses gives its defaults over an earlier entry's, nested as at the root. With `o: { type: 'object', allOf: [{ properties: { c: { type: 'string', default: 'm0' } } }, { oneOf: [{ properties: { c: { type: 'string', default: 'opt' } } }, { properties: { z: { type: 'number' } } }] }] }`: before `{ o: { c: 'm0' } }`, after `{ o: { c: 'opt' } }`. The same object at the root already gave `{ c: 'opt' }`, and the form renders `c` from the chosen option. A field's schemas are merged in a fixed order (its own, its `$ref`, its `allOf`, the `then`/`else`, `dependencies`, patterns, then the option), and a later one's `default` wins, as a matching `then`'s already does. Where the option declares no default for the key, the earlier entry's still applies. In such shapes the option's keys can also come first in the defaults object; the values are the same.
- Under `allOf: 'skipDefaults'`, a deep `customMergeAllOf` no longer fills a property's `allOf` defaults. A merger that also flattens the `allOf` of the properties inside the `allOf` it merges no longer exempts those properties from `skipDefaults`. With `animalInfo: { properties: { animal: { default: 'Cat' } }, allOf: [{ if: { properties: { animal: { const: 'Cat' } } }, then: { properties: { food: { default: 'meat' } } } }] }` and an `allOf` beside it at the root: before `{ animalInfo: { animal: 'Cat', food: 'meat' } }`, after `{ animalInfo: { animal: 'Cat' } }`, as without that merger.
- `getDefaultFormState()` scores a field's options as the schema declares them, so a parent's `customMergeAllOf` no longer reaches the option its children choose for their defaults.

To keep the `allOf` defaults of an extra key or of a property's `allOf`, set `allOf: 'populateDefaults'`, which gives `{ k: { a: 'a' } }` in the first example and fills `food` in the `animalInfo` one:

```diff
-<Form schema={schema} validator={validator} customMergeAllOf={merge} />
+<Form
+  schema={schema}
+  validator={validator}
+  customMergeAllOf={merge}
+  defaultFormStateBehavior={{ allOf: 'populateDefaults' }}
+/>
```

To keep an earlier `allOf` entry's default over a chosen option's, drop the `default` from the option. If a merger's rewrite of the options made the right option win, write the options in the schema the way the merger produced them.

## Verify

- Under `skipDefaults` an extra key's and a property's `allOf` defaults are absent, with or without the merger; under `populateDefaults` they are present.
- Under `populateDefaults`, an option an `allOf` entry chooses gives its `default` over an earlier entry's, as in the `o` example.
