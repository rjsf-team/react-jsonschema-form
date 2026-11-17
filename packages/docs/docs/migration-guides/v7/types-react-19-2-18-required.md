---
title: "@types/react 19.2.18 or later is required"
description: "`@rjsf/core`'s published types import `SubmitEvent`, which `@types/react` added in 19.2.18, so earlier patches fail to compile against them. Upgrade `@types/react` to at least 19.2.18."
packages: ['@rjsf/core']
uses: [typescript]
schema: []
kind: install
noticed: type-error
related: [on-submit-event-is-a-submit-event]
---

## Detect

- Your TypeScript project has `@types/react` older than 19.2.18.
- The type checker reports that `react` has no exported member `SubmitEvent` in `@rjsf/core`'s types.

## Change

`SubmitEvent` was added to `@types/react` in version 19.2.18; earlier 19.2.x patches don't have it and fail to compile against `@rjsf/core`'s published types. Raise your project's `@types/react`:

```diff
-    "@types/react": "^19.2.0",
+    "@types/react": "^19.2.18",
```

## Verify

- The type checker no longer reports a missing `SubmitEvent` export.
