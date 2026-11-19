---
title: removeEmptyOptionalObjects and removeOptionalEmptyObjects() are removed
description: "The no-op `removeEmptyOptionalObjects` Form prop and the `removeOptionalEmptyObjects()` export of `@rjsf/utils` are removed. Use `omitExtraData` instead, which now prunes empty optional objects."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form-props, utils-api]
schema: []
affects: [code, data]
related: []
---

## Detect

- Your `Form` passes the `removeEmptyOptionalObjects` prop.
- Your code imports `removeOptionalEmptyObjects` from `@rjsf/utils`.
- The type checker reports the import as `error TS2305: Module '"@rjsf/utils"' has no exported member 'removeOptionalEmptyObjects'.` and the prop as `error TS2322: Type '{ removeEmptyOptionalObjects: true; … }' is not assignable to type 'IntrinsicAttributes & FormProps<…>'.` with `Property 'removeEmptyOptionalObjects' does not exist on type 'IntrinsicAttributes & FormProps<…>'.`

## Change

These APIs, deprecated in prior releases, have been removed:

- `FormProps.removeEmptyOptionalObjects`. This prop had already stopped doing anything; use `omitExtraData` instead, which now prunes empty optional objects as part of its filtering.
- `removeOptionalEmptyObjects()` exported from `@rjsf/utils`. Use `omitExtraData` instead, which has the equivalent pruning built in.

```diff
-<Form schema={schema} removeEmptyOptionalObjects validator={validator} />
+<Form schema={schema} omitExtraData validator={validator} />
```

## Verify

- Submitted data drops empty optional objects.
