---
title: The MUI theme requires MUI 9
description: '`@rjsf/mui` no longer supports `@mui/material` and `@mui/icons-material` 7. Upgrade both to version 9.'
packages: ['@rjsf/mui']
uses: [form]
schema: []
affects: [setup]
related: []
---

## Detect

- `@mui/material` or `@mui/icons-material` below `9` in your `package.json` next to `@rjsf/mui`.

## Change

Upgrade both packages to version 9:

```diff
-"@mui/icons-material": "^7.0.0",
-"@mui/material": "^7.0.0",
+"@mui/icons-material": "^9.0.0",
+"@mui/material": "^9.0.0",
```

## Verify

- The package manager reports no unmet `@mui/*` peer for `@rjsf/mui`.
