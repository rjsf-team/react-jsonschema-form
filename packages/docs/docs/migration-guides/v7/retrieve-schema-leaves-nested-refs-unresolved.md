---
title: retrieveSchema leaves a nested $ref unresolved
description: '`retrieveSchema()` now returns a `$ref` under `properties`, `items` or an `anyOf`/`oneOf` option as written, where it used to resolve it in place. Call `retrieveSchema()` again on the nested subschema before reading its keywords.'
packages: ['@rjsf/utils']
uses: [utils-api, custom-fields]
schema: [refs]
affects: [code]
related: [retrieved-schemas-carry-rjsf-provenance-key]
---

## Detect

- In your code: `retrieveSchema(` or `schemaUtils.retrieveSchema(`, followed by a read of `.properties.<key>`, `.items`, `.anyOf[…]` or `.oneOf[…]` on the result.
- At runtime: that nested subschema is `{ $ref: '…' }` where it used to be the definition, so code reading its `properties`, `type` or `enum` finds nothing.
- In your code or snapshots: a `$ref` key read on the retrieved schema of a definition whose `then` or `allOf` reaches a schema that merges the definition back in.

## Change

`retrieveSchema()` merges the schema's own `$ref`, `allOf`, `if`/`then`/`else`, `dependencies` and the patterns its properties match, as before. A `$ref` nested under `properties`, `items` or an `anyOf`/`oneOf` option is no longer resolved in place. It is handed out as written:

```ts
const rootSchema = {
  definitions: { address: { type: 'object', properties: { city: { type: 'string' } } } },
  type: 'object',
  properties: { home: { $ref: '#/definitions/address' } },
};
const retrieved = retrieveSchema(context, rootSchema, rootSchema);
// Before: retrieved.properties.home is the address definition, with its `properties`
// After: retrieved.properties.home is `{ $ref: '#/definitions/address' }`
const home = retrieveSchema(context, retrieved.properties.home, rootSchema);
// home is the address definition, with its `properties`
```

Retrieve the nested subschema again before you read it:

```diff
 const retrieved = retrieveSchema(context, schema, rootSchema, formData);
-const city = retrieved.properties.home.properties.city;
+const home = retrieveSchema(context, retrieved.properties.home, rootSchema, formData?.home);
+const city = home.properties.city;
```

A schema that merges itself back in no longer leaves a literal `$ref` on the result. For `Pet` with `then: { $ref: Cat }` and `Cat = { allOf: [{ $ref: Pet }, ...] }`, the merged `Pet` used to have a `$ref` key and now has none. `RJSF_REF_KEY` and `RJSF_REF_CYCLE_KEY` are still added.

## Verify

- Your code reads the definition's keywords from the second `retrieveSchema()` result.
- A form renders the same, since `SchemaField` and the other fields already retrieve each subschema they render.
- A snapshot of a self-merging definition's retrieved schema loses its `$ref` key.
