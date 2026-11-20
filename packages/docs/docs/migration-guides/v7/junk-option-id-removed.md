---
title: The junk option id constant is no longer exported from @rjsf/utils
description: '`JUNK_OPTION_ID` is no longer exported from `@rjsf/utils`, since nothing in RJSF reads it. Remove the import, or write out its value `''_$junk_option_schema_id$_''` if your code still needs the string.'
packages: ['@rjsf/utils']
uses: [utils-api]
schema: []
affects: [code]
related: []
---

## Detect

- In your code: `JUNK_OPTION_ID` imported from `@rjsf/utils`.
- Type checker: `Module '"@rjsf/utils"' has no exported member 'JUNK_OPTION_ID'.`

## Change

`JUNK_OPTION_ID` is removed: nothing in RJSF reads it any more. Its value was `'_$junk_option_schema_id$_'`. If your code still needs that string, write it out:

```diff
-import { JUNK_OPTION_ID } from '@rjsf/utils';
+const JUNK_OPTION_ID = '_$junk_option_schema_id$_';
```

## Verify

The import is gone and the type checker reports no missing export.
