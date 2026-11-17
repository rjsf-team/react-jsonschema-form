---
title: getUsedFormData, getFieldNames, toPathSchema and PathSchema are removed
description: "The deprecated `getUsedFormData`, `getFieldNames`, `toPathSchema` and `PathSchema` are removed from `Form`, `@rjsf/utils` and `SchemaUtils`. There is no direct replacement, so rewrite that code without them."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form-ref, utils-api, typescript]
schema: []
kind: removal
noticed: type-error
related: []
---

## Detect

- Your code calls the `Form.getUsedFormData()` or `Form.getFieldNames()` instance methods through a ref.
- Your code imports `getUsedFormData`, `getFieldNames`, `toPathSchema` or the `PathSchema` type from `@rjsf/utils`, or calls `SchemaUtils.toPathSchema()`.
- The type checker reports an import as `error TS2305: Module '"@rjsf/utils"' has no exported member 'toPathSchema'.` and a method as `error TS2339: Property 'getFieldNames' does not exist on type 'FormRef<…>'.`

## Change

These APIs, deprecated in prior releases, have been removed:

- The `Form.getUsedFormData()` and `Form.getFieldNames()` instance methods, and the underlying `getUsedFormData` and `getFieldNames` exports from `@rjsf/utils`.
- `toPathSchema()` exported from `@rjsf/utils`, and `SchemaUtils.toPathSchema()`.
- The `PathSchema` type exported from `@rjsf/utils`.

There is no direct replacement. Rewrite the code that used them without them.

## Verify

- Your code compiles with no imports or calls of these names.

## If you can't preserve it

No v7 API returns a path schema or the list of field names, so code that depended on them has to derive that from your own schema.
