---
title: Retrieved schemas carry a provenance Symbol key, and retrieving one again gives it back unchanged
description: 'Every subschema `retrieveSchema()` hands out now carries the enumerable Symbol key `RJSF_PROVENANCE_KEY`, and retrieving one again returns it unchanged. Drop that key before a `toEqual()` comparison, and call `expandRefCycle()` to unroll a recursion further.'
packages: ['@rjsf/utils']
uses: [utils-api]
schema: []
affects: [code]
related: [retrieve-schema-leaves-nested-refs-unresolved, ref-cycle-expansion-uses-expand-ref-cycle]
---

## Detect

- In your tests: `expect(retrieveSchema(…)).toEqual({ … })`, or `toEqual()` on any subschema taken from a `retrieveSchema()` result, now fails on an extra Symbol-keyed property.
- In your code: the result of `retrieveSchema()`, or a spread copy of it, passed back into `retrieveSchema()` to unroll one more level of a recursive `$ref`.

## Change

Every subschema `retrieveSchema()` hands out carries a Symbol-keyed property, `RJSF_PROVENANCE_KEY`, recording where it came from. A spread copy keeps it. It is enumerable, so `toEqual()` sees it. Delete it from a copy before comparing:

```diff
+import { RJSF_PROVENANCE_KEY } from '@rjsf/utils';
+
-expect(retrieveSchema(context, schema, rootSchema)).toEqual(expected);
+const retrieved = { ...retrieveSchema(context, schema, rootSchema) };
+Reflect.deleteProperty(retrieved, RJSF_PROVENANCE_KEY);
+expect(retrieved).toEqual(expected);
```

Or register an equality tester that compares a stamped schema as the schema without the key, as RJSF's own test setup does:

```ts
import { RJSF_PROVENANCE_KEY } from '@rjsf/utils';

function withoutProvenance(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || !Object.hasOwn(value, RJSF_PROVENANCE_KEY)) {
    return value;
  }
  const copy = { ...value };
  Reflect.deleteProperty(copy, RJSF_PROVENANCE_KEY);
  return copy;
}

expect.addEqualityTesters([
  function equalsWithoutProvenance(a, b, customTesters) {
    const unstampedA = withoutProvenance(a);
    const unstampedB = withoutProvenance(b);
    return unstampedA === a && unstampedB === b ? undefined : this.equals(unstampedA, unstampedB, customTesters);
  },
]);
```

Retrieving such a subschema resolves it as the field it is. A recursive `$ref` is therefore flagged with `RJSF_REF_CYCLE_KEY` at the same place however many times a schema is retrieved, and retrieving a schema that `retrieveSchema()` returned gives it back unchanged:

```ts
const once = retrieveSchema(context, rootSchema, rootSchema, formData);
retrieveSchema(context, once, rootSchema, formData);
// Before: one more level of every recursive `$ref` is unrolled, still flagged as a cycle
// After: equal to `once`
```

Code that retrieved a result again to unroll one more level of a recursion gets no further level. Call `expandRefCycle()` on the flagged field's schema instead; see [Expanding a $ref cycle in a custom field uses expandRefCycle](./ref-cycle-expansion-uses-expand-ref-cycle.md). A schema without the Symbol, such as one built in code, is resolved from the top, as before. `RJSF_REF_KEY` and `RJSF_REF_CYCLE_KEY` are still added.

## Verify

- The `toEqual()` assertion passes once `RJSF_PROVENANCE_KEY` is left out of the comparison.
- Retrieving a retrieved schema returns a schema equal to it.
