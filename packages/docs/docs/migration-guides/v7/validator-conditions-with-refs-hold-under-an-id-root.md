---
title: Conditions and options holding a $ref now match under a root with an $id or a 2019-09 or 2020-12 dialect
description: 'A condition or option holding a local `$ref` never matched under a root with an `$id`, or on the first validation of a 2019-09 or 2020-12 root, and now does. Check which branch and option your forms pick, and drop workarounds that stripped the `$id`.'
packages: ['@rjsf/validator-ajv8', '@rjsf/validator-ata', '@rjsf/validator-cfworker']
uses: [form]
schema: [refs, defaults, any-of-one-of]
kind: runtime
noticed: review
related: [custom-validator-is-valid-receives-refs]
---

## Detect

- In your schema: a root `$id`, such as `'http://example.com/root.json'` or one ending in `#`, with `if: { $ref: '#/definitions/…' }` or `$ref`s inside `anyOf`/`oneOf` options or `dependencies`.
- In your schema: `$schema: 'https://json-schema.org/draft/2020-12/schema'` (or 2019-09) with a `$ref` inside an `if`, an option or a dependency condition, validated with `@rjsf/validator-ajv8`.
- In your code: one validator instance shared by forms or `createSchemaUtils()` calls with different root schemas whose definitions share names.
- In the console, before the upgrade: `schema with key or id "http://example.com/root.json" already exists`.
- In your form data or on the rendered page: another branch's defaults appear, or another option is selected.

## Change

`@rjsf/validator-ajv8` and `@rjsf/validator-ata` named the root by `ROOT_SCHEMA_PREFIX` in every local `$ref`, which a root with an `$id` is not registered under, so a condition holding such a `$ref` never held. With `{ $id: 'http://example.com/root.json', definitions: { I: { properties: { k: { const: 'x' } } } }, properties: { k: { type: 'string', default: 'x' } }, if: { $ref: '#/definitions/I' }, then: { properties: { t: { type: 'string', default: 't' } } }, else: { properties: { e: { type: 'string', default: 'e' } } } }`, `getDefaultFormState()` gives `{ k: 'x', t: 't' }` where it gave `{ k: 'x', e: 'e' }`.

An `$id` ending in an empty fragment, as `http://example.com/root.json#` and the `$id`s of the draft-06 and draft-07 meta-schemas do, names the same root, so `rootSchemaIdOf()` leaves that `#` out of the prefix and never writes `http://example.com/root.json##/if`. `@rjsf/validator-ajv8` registers such a root under its `$id` without the `#` too, which is how Ajv keys it, so a root edited under the same `$id` replaces the one before it. With a `customizeValidator()` instance that has validated against `{ $id: 'http://example.com/root.json#', type: 'object', properties: { k: { type: 'string', default: 'x' } }, if: { properties: { k: { const: 'x' } } }, then: { properties: { t: { type: 'string', default: 't' } } }, else: { properties: { e: { type: 'string', default: 'e' } } } }`, the same root with a `title` added gives the defaults `{ k: 'x', t: 't' }` where it gave `{ k: 'x', e: 'e' }` and logged `schema with key or id "http://example.com/root.json" already exists`.

`@rjsf/validator-cfworker` registered a root carrying an `$id` under `ROOT_SCHEMA_PREFIX` in its place, so the `$ref`s of a 2020-12 root with an `$id`, which resolve against that `$id`, resolved to nothing, and a condition holding one never held. With `{ $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'https://example.com/root.json', $defs: { isB: { properties: { k: { const: 'b' } }, required: ['k'] } }, type: 'object', properties: { k: { type: 'string' } }, if: { $ref: '#/$defs/isB' }, then: { properties: { t: { type: 'string', default: 'THEN' } } }, else: { properties: { e: { type: 'string', default: 'ELSE' } } } }` and the data `{ k: 'b' }`, `getDefaultFormState()` gives `{ k: 'b', t: 'THEN' }` where it gave `{ k: 'b', e: 'ELSE' }`. Options read from that root match the same way: with `$defs: { isA: { type: 'object', properties: { k: { const: 'a' } }, required: ['k'] }, isB: { type: 'object', properties: { k: { const: 'b' } }, required: ['k'] } }` and `oneOf: [{ $ref: '#/$defs/isA' }, { $ref: '#/$defs/isB' }]` in such a root, `getFirstMatchingOption({ k: 'b' }, schemaUtils.getRootSchema().oneOf)` gives `1` where it gave `0`.

With the default `@rjsf/validator-ajv8`, whose Ajv is draft-07, a `$ref` into a 2019-09 or 2020-12 root resolves from the first validation on. Before, the first `isValid()` call with such a root returned `false` and only later calls with the same root validated, so the first `getDefaultFormState()` call could take the wrong branch. With `$schema` 2020-12, `$defs: { I: { properties: { k: { const: 'x' } } } }`, `properties: { k: { type: 'string', default: 'x' } }`, `if: { $ref: '#/$defs/I' }`, `then: { properties: { t: { type: 'string', default: 't' } } }`, `else: { properties: { e: { type: 'string', default: 'e' } } }` and the data `{ k: 'x' }`, on a fresh validator, the defaults were `{ k: 'x', e: 'e' }` and are `{ k: 'x', t: 't' }`. The form rendered `root_k` and `root_t` before and after. To validate such a root under its own dialect, pass `AjvClass: Ajv2020` (or `Ajv2019`) to `customizeValidator()`:

```diff
-import validator from '@rjsf/validator-ajv8';
+import { Ajv2020 } from 'ajv/dist/2020.js';
+import { customizeValidator } from '@rjsf/validator-ajv8';
+const validator = customizeValidator({ AjvClass: Ajv2020 });
```

A validator caches what it compiles for a schema, and `{ $ref: '#/definitions/X' }` means something else under every root. Replacing the root drops what was compiled against it: `isValid({ $ref: '#/definitions/X' }, 's', { definitions: { X: { type: 'number' } } })` after the same call with a root whose `X` is a `string` gives `false` where it gave `true`.

Remove any workaround that stripped the `$id` or rewrote the `$ref`s before handing the schema to the form, and any validator created per root only to avoid stale results.

## Verify

- The branch and option the data matches render and fill their defaults: `t`, `THEN` and option `1` in the examples above.
- No `already exists` error is logged when the root changes under the same `$id`.
- `isValid()` returns the result for the definitions of the `rootSchema` passed in that call.
