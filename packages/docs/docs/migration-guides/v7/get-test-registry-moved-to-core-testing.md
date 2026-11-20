---
title: getTestRegistry moved to @rjsf/core/testing
description: The `getTestRegistry()` helper moved from `@rjsf/core` to the `@rjsf/core/testing` entry point, which needs `@rjsf/validator-ajv8`. Change the import and add `@rjsf/validator-ajv8` to your dev dependencies.
packages: ['@rjsf/core']
uses: [custom-fields, custom-widgets, custom-templates]
schema: []
affects: [setup, code]
related: [form-get-registry-is-build-registry, test-registry-is-frozen]
---

## Detect

- `getTestRegistry` imported from `@rjsf/core` in your tests.
- Type checker: `Module '"@rjsf/core"' has no exported member 'getTestRegistry'. Did you mean to use 'import getTestRegistry from "@rjsf/core"' instead?` (TS2614).

## Change

Update the import:

```diff
-import { getTestRegistry } from '@rjsf/core';
+import { getTestRegistry } from '@rjsf/core/testing';
```

Add `@rjsf/validator-ajv8` to your dev dependencies:

```bash
npm install --save-dev @rjsf/validator-ajv8
```

`@rjsf/validator-ajv8` is now an optional peer dependency of `@rjsf/core` that only this entry point needs, so it no longer ships as a transitive dependency of the main entry. The arguments are unchanged: `getTestRegistry(schema, {}, templates)` still works. An optional `classMap` now follows `presentation`, layered over `@rjsf/core`'s as a `Form`'s is, so a theme can test a core template under its own class map.

The registry it returns is frozen, see [the registry from getTestRegistry is frozen](./test-registry-is-frozen.md).

## Verify

- The type checker no longer reports a missing `getTestRegistry` export.
- Your tests resolve `@rjsf/core/testing` and `@rjsf/validator-ajv8` and pass as before.
