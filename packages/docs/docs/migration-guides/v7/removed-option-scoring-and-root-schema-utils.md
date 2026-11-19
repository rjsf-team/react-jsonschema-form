---
title: getOptionMatchingSimpleDiscriminator, isRootSchema, relaxOptionsForScoring and schemaHasNestedConditional are removed
description: Four `@rjsf/utils` functions are removed. Match options with `getFirstMatchingOption()` or `getClosestMatchingOption()` and a `discriminatorField`, compare `fieldPath` with `ROOT_FIELD_PATH`, and drop calls to `schemaHasNestedConditional`.
packages: ['@rjsf/utils']
uses: [utils-api]
schema: []
affects: [code]
related: [should-render-optional-field-takes-a-field-path, utils-exports-only-what-rjsf-packages-use, sanitize-keeps-or-drops-values-by-field-tree]
---

## Detect

- In your code, an import of `getOptionMatchingSimpleDiscriminator`, `isRootSchema`, `relaxOptionsForScoring` or `schemaHasNestedConditional` from `@rjsf/utils`.
- The type checker reports `Module '"@rjsf/utils"' has no exported member 'isRootSchema'.` (or the other names).

## Change

Replace each call.

`getOptionMatchingSimpleDiscriminator()` read the discriminator only from an option's own `properties`, so options that are `$ref`s returned `undefined`. Call `getFirstMatchingOption()` or `getClosestMatchingOption()` with the `discriminatorField`; they read it through the option's `$ref`, its `allOf` entries and the rest of its scope.

`isRootSchema()` compared a schema's content with the root schema's, which mistook a nested field for the root. Compare the field's path instead:

```diff
-import { isRootSchema } from '@rjsf/utils';
+import { ROOT_FIELD_PATH } from '@rjsf/utils';

-const isRoot = isRootSchema(registry, schema);
+const isRoot = fieldPath === ROOT_FIELD_PATH;
```

`relaxOptionsForScoring()` is gone because `omitExtraData()` relaxes an option's whole scope itself. To score options with their `additionalProperties: false` relaxed, hand `getClosestMatchingOption()` or `getFirstMatchingOption()` copies of them with `additionalProperties: true`.

`schemaHasNestedConditional()` has no replacement. `Form` now compares the field trees before and after a change, which reach a `dependencies` or `if` at any depth (see [Sanitize keeps or drops values by field tree](./sanitize-keeps-or-drops-values-by-field-tree.md)). Remove the call.

## Verify

- The type checker reports no missing exports from `@rjsf/utils`.
- For `$ref` options with a `const` discriminator, such as `[{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }]` with data `{ kind: 'b' }`, the matcher returns `1`.
- For other removed exports, see [@rjsf/utils no longer exports utilities no other RJSF package uses](./utils-exports-only-what-rjsf-packages-use.md).
