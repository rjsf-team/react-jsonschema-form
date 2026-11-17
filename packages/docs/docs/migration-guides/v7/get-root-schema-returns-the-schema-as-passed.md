---
title: createSchemaUtils keeps the root schema as given, without rewriting its $refs against its $id
description: '`createSchemaUtils()` used to rewrite every `$ref` of a 2020-12 root against its `$id`, and now keeps the root as passed. Read each `$ref` as written, and retrieve it with `schemaUtils.retrieveSchema()` to get the schema it names.'
packages: ['@rjsf/utils']
uses: [utils-api, custom-fields, custom-templates]
schema: [refs]
kind: runtime
noticed: review
related: [ui-definitions-keyed-by-ref-as-written, make-all-references-absolute-removed]
---

## Detect

- In your code: `schemaUtils.getRootSchema()` or `registry.rootSchema`, read on a draft 2020-12 root that has an `$id`.
- In your code or tests: a `$ref` compared with, or split from, an absolute URI such as `'https://example.com/root.json#/$defs/s'`.
- In your schema: a nested resource with its own `$id` whose `$defs` shadow the root's.

## Change

`createSchemaUtils()` used to rewrite every `$ref` of a draft 2020-12 root against the root's `$id` and keep that copy as its root schema. It now keeps the root schema it is given, and each `$ref` is resolved once, against the `$id`s around it, where it is looked up ([#5529](https://github.com/rjsf-team/react-jsonschema-form/issues/5529)). `getRootSchema()`, and with it a form's `registry.rootSchema`, is the schema you passed:

```ts
const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/root.json',
  $defs: { s: { type: 'string' } },
  type: 'object',
  properties: { a: { $ref: '#/$defs/s' } },
};
const schemaUtils = createSchemaUtils({ validator }, schema);
schemaUtils.getRootSchema().properties.a;
// Before: { $ref: 'https://example.com/root.json#/$defs/s' }
// After: { $ref: '#/$defs/s' }, since getRootSchema() returns `schema` itself
```

Read a `$ref` as written. To get the schema it names, retrieve it with `schemaUtils.retrieveSchema()` and leave the URI resolution to it.

A `$ref` the rewrite left as written, because a validator would resolve the rewritten one again to somewhere else, resolves against the resource it sits in wherever it is looked up. Under `$id: 'schemas/root.json'`, with `$defs: { x: { type: 'number' }, child: { $id: 'nested/child.json', $defs: { x: { type: 'string' } }, additionalProperties: { $ref: '#/$defs/x' } } }`: before, `schemaUtils.retrieveSchema()` of the `additionalProperties` that `getRootSchema()` holds gave the root's `{ type: 'number' }`. After, it gives the child's `{ type: 'string' }`.

`ui:definitions` keys follow the `$ref` as written too; see [A ui:definitions entry is keyed by the $ref as the schema writes it](./ui-definitions-keyed-by-ref-as-written.md). `makeAllReferencesAbsolute()` is gone; see [makeAllReferencesAbsolute is removed](./make-all-references-absolute-removed.md).

## Verify

- `getRootSchema()` is `===` the schema you passed.
- A nested resource's `$ref` retrieves that resource's definition.
