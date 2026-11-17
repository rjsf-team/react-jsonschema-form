---
title: A ui:definitions entry is keyed by the $ref as the schema writes it
description: 'A `ui:definitions` entry used to match only the absolute `$ref` built from a 2020-12 root''s `$id`, and now matches the `$ref` as the schema writes it. Rename absolute keys such as `https://example.com/root.json#/$defs/s` to `#/$defs/s`.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [ui-schema]
schema: [refs]
kind: runtime
noticed: review
related: [get-root-schema-returns-the-schema-as-passed]
---

## Detect

- In your `uiSchema`: a `'ui:definitions'` key that starts with your root schema's `$id`, such as `'https://example.com/root.json#/$defs/s'`.
- On the rendered page: the field that entry targets loses its `ui:*` settings, for example a textarea renders as a text input.

## Change

`createSchemaUtils()` no longer rewrites the root's `$ref`s against its `$id` (see [createSchemaUtils keeps the root schema as given, without rewriting its $refs against its $id](./get-root-schema-returns-the-schema-as-passed.md)), so a `ui:definitions` entry is keyed by the `$ref` as the schema writes it. With a root of `$schema` 2020-12, `$id: 'https://example.com/root.json'`, `$defs: { s: { type: 'string' } }` and `properties: { a: { $ref: '#/$defs/s' } }`, `'ui:definitions': { '#/$defs/s': { 'ui:widget': 'textarea' } }` renders `root_a` as a textarea. Before, it rendered a text input, and only an entry keyed `https://example.com/root.json#/$defs/s` applied. Rename such keys to the `$ref` as written:

```diff
 const uiSchema = {
   'ui:definitions': {
-    'https://example.com/root.json#/$defs/s': { 'ui:widget': 'textarea' },
+    '#/$defs/s': { 'ui:widget': 'textarea' },
   },
 };
```

## Verify

The field renders with the entry's settings; in the example `root_a` is a `<textarea>`.
