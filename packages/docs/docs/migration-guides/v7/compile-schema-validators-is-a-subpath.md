---
title: compileSchemaValidators is imported from its own subpath
description: The `lib/compileSchemaValidators` paths of the AJV and ata validators no longer resolve. Import `compileSchemaValidators` from `@rjsf/validator-ajv8/compileSchemaValidators` or `@rjsf/validator-ata/compileSchemaValidators`.
packages: ['@rjsf/validator-ajv8', '@rjsf/validator-ata']
uses: [custom-validator]
schema: []
kind: removal
noticed: build
related: [deep-imports-removed]
---

## Detect

- `@rjsf/validator-ajv8/lib/compileSchemaValidators` or `@rjsf/validator-ata/lib/compileSchemaValidators` in your precompile script.
- Node throws `ERR_PACKAGE_PATH_NOT_EXPORTED` when the script runs.

## Change

Each validator exports `compileSchemaValidators` from a subpath of its own:

```diff
-import compileSchemaValidators from '@rjsf/validator-ajv8/lib/compileSchemaValidators';
+import compileSchemaValidators from '@rjsf/validator-ajv8/compileSchemaValidators';
```

For `@rjsf/validator-ata`, use `@rjsf/validator-ata/compileSchemaValidators`. Other `lib/` paths are gone too, see [imports from a package's lib folder no longer resolve](./deep-imports-removed.md).

## Verify

- The precompile script runs and writes the validator file as before.
