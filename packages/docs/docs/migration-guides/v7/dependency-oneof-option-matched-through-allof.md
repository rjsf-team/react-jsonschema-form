---
title: A dependency's oneOf option is matched by the property it declares in an allOf, $ref, then, else or dependencies
description: 'A dependency''s `oneOf` option used to match only on its own `properties` or its `$ref` target''s, and now also on an `allOf`, `then`/`else` or `dependencies` inside it. Make the options'' declarations of the property disjoint so exactly one matches each value.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [defaults, any-of-one-of]
kind: runtime
noticed: runtime-error
related: [option-scoring-reads-options-as-json-schema, defaults-fill-more-then-dependency-and-ref-option-shapes]
---

## Detect

- In your schema: `dependencies: { <key>: { oneOf: [ … ] } }` whose options declare `<key>` inside an `allOf` entry, a `then`/`else`, a `$ref` target or a nested `dependencies` schema, such as `{ allOf: [{ properties: { <key>: … } }], … }`.
- Console warning: `ignoring oneOf in dependencies` now appears for a schema where it didn't, or disappears for one where it did.
- On the rendered page: the dependent fields appear or disappear for the same value.

## Change

A `dependencies` schema's `oneOf` option is applied when the property the dependency names fits what the option declares for it. That declaration is now found in the same scope option scoring reads (see [getFirstMatchingOption and getClosestMatchingOption match an option as JSON Schema reads it](./option-scoring-reads-options-as-json-schema.md)): the option's own `properties`, or those of its `$ref` target, its `allOf` entries, its `then`/`else` and its `dependencies` schemas. Before, only its own `properties` or its `$ref` target's counted, so an option declaring the property only in an `allOf` entry never applied:

```ts
const schema: RJSFSchema = {
  type: 'object',
  properties: { k: { type: 'string', enum: ['a', 'b'] } },
  dependencies: {
    k: {
      oneOf: [
        { allOf: [{ properties: { k: { enum: ['a'] } } }], properties: { ka: { type: 'string', default: 'A' } } },
        { allOf: [{ properties: { k: { enum: ['b'] } } }], properties: { kb: { type: 'string', default: 'B' } } },
      ],
    },
  },
};
getDefaultFormState(context, { schema, rootSchema: schema, formData: { k: 'b' } });
// before: { k: 'b' }, the form shows `k` alone and warns "ignoring oneOf in dependencies"
// after:  { k: 'b', kb: 'B' }, the form shows `k` and `kb`
```

The same reading can make a second option apply where one did, and the dependency then applies neither, since exactly one option has to match:

```ts
const schema: RJSFSchema = {
  type: 'object',
  properties: { k: { type: 'string', enum: ['a', 'b'] } },
  dependencies: {
    k: {
      oneOf: [
        { allOf: [{ properties: { k: { enum: ['a', 'b'] } } }], properties: { ka: { type: 'string', default: 'A' } } },
        { properties: { k: { enum: ['b'] }, kb: { type: 'string', default: 'B' } } },
      ],
    },
  },
};
getDefaultFormState(context, { schema, rootSchema: schema, formData: { k: 'b' } });
// before: { k: 'b', kb: 'B' }, the form shows `k` and `kb`
// after:  { k: 'b' }, the form shows `k` alone and warns "ignoring oneOf in dependencies"
```

Make the options' declarations of the property disjoint so exactly one matches each value. In the second schema, that means narrowing the first option's `enum` to `['a']`:

```diff
-        { allOf: [{ properties: { k: { enum: ['a', 'b'] } } }], properties: { ka: { type: 'string', default: 'A' } } },
+        { allOf: [{ properties: { k: { enum: ['a'] } } }], properties: { ka: { type: 'string', default: 'A' } } },
```

## Verify

- For each value of the property, one option's fields render.
- No `ignoring oneOf in dependencies` warning is logged.
