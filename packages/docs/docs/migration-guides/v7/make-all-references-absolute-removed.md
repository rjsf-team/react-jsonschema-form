---
title: makeAllReferencesAbsolute is removed
description: '`makeAllReferencesAbsolute()`, which only a deep import of `@rjsf/utils` reached, is removed. Hand your schema to `Form` or `createSchemaUtils()` as it is, since each `$ref` now resolves against the `$id`s around it.'
packages: ['@rjsf/utils']
uses: [utils-api]
schema: [refs]
kind: removal
noticed: type-error
related: [get-root-schema-returns-the-schema-as-passed, deep-imports-removed, ui-definitions-keyed-by-ref-as-written]
---

## Detect

- In your code: `makeAllReferencesAbsolute`, imported through a deep path such as `@rjsf/utils/lib/findSchemaDefinition.js`, since the package root never exported it.
- Type checker: `Cannot find module '@rjsf/utils/lib/findSchemaDefinition.js' or its corresponding type declarations.`

## Change

`makeAllReferencesAbsolute()` is removed, and paths under `lib/` no longer resolve (see [Imports from a package's lib folder no longer resolve](./deep-imports-removed.md)). `createSchemaUtils()` keeps the root as given and resolves each `$ref` against the `$id`s around it where it is looked up (see [createSchemaUtils keeps the root schema as given, without rewriting its $refs against its $id](./get-root-schema-returns-the-schema-as-passed.md)), so a schema it rewrote before it was handed to `Form` or `createSchemaUtils()` can be handed over as it is:

```diff
-import { makeAllReferencesAbsolute } from '@rjsf/utils/lib/findSchemaDefinition.js';
-const schema = makeAllReferencesAbsolute(rawSchema, rawSchema.$id);
-<Form schema={schema} validator={validator} />
+<Form schema={rawSchema} validator={validator} />
```

If you keyed `ui:definitions` entries by the rewritten absolute `$ref`s, rename them to the `$ref`s as written; see [A ui:definitions entry is keyed by the $ref as the schema writes it](./ui-definitions-keyed-by-ref-as-written.md).

## Verify

- The import is gone and the type checker reports no missing module.
- The form renders the same fields from the unmodified schema.
