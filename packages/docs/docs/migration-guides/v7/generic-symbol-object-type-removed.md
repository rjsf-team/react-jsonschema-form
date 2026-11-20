---
title: The GenericSymbolObjectType type is removed
description: '`@rjsf/utils` no longer exports `GenericSymbolObjectType`, which was `GenericObjectType & Record<symbol, boolean | string>`. Declare that type yourself where you use it.'
packages: ['@rjsf/utils']
uses: [typescript]
schema: []
affects: [code]
related: [generic-object-type-values-are-unknown]
---

## Detect

- In your code: an import of `GenericSymbolObjectType` from `@rjsf/utils`.
- The type checker reports `'"@rjsf/utils"' has no exported member named 'GenericSymbolObjectType'. Did you mean 'GenericObjectType'?` (TS2724).

## Change

`GenericSymbolObjectType` was `GenericObjectType & Record<symbol, boolean | string>` and is removed. Declare it yourself if you use it:

```diff
-import type { GenericSymbolObjectType } from '@rjsf/utils';
+import type { GenericObjectType } from '@rjsf/utils';
+
+type GenericSymbolObjectType = GenericObjectType & Record<symbol, boolean | string>;
```

`GenericObjectType` now holds `unknown` values, see [GenericObjectType holds unknown values](./generic-object-type-values-are-unknown.md).

## Verify

- The type checker finds no import of `GenericSymbolObjectType` from `@rjsf/utils`.
