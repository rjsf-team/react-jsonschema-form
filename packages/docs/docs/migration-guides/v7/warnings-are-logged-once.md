---
title: Each RJSF warning is logged only the first time it appears on the page
description: "RJSF's warnings now go through `logOnce()` and log only the first time on the page, until it reloads. If your tests assert on a warning, call `resetLogOnce()` before each test in your setup file."
packages: ['@rjsf/core', '@rjsf/utils', '@rjsf/validator-ajv8', '@rjsf/validator-ata', '@rjsf/validator-cfworker']
uses: [tooling]
schema: []
kind: runtime
noticed: test
related: []
---

## Detect

- Your tests assert that RJSF logs a warning, through a `console.warn` spy or mock.
- You count on a warning repeating on every render.

## Change

The warnings `@rjsf/utils`, `@rjsf/core` and the validators raise while rendering now go through [`logOnce()`](../../api-reference/utility-functions.md#logonce), which logs each one only the first time it is seen on the page, so a warning is no longer repeated on every re-render ([#3051](https://github.com/rjsf-team/react-jsonschema-form/issues/3051)).

What has been logged is remembered until the page reloads. If your tests assert on an RJSF warning, call [`resetLogOnce()`](../../api-reference/utility-functions.md#resetlogonce) before each test in your Vitest or Jest setup file:

```diff
+import { resetLogOnce } from '@rjsf/utils';
+
+beforeEach(resetLogOnce);
```

Under Vitest's default `globals: false`, also import `beforeEach` from `vitest`.

## Verify

- Each test that expects an RJSF warning sees it logged, whatever order the tests run in.

## If you can't preserve it

A warning no longer repeats on each re-render within one page. Code that counted repeated warnings can only see the first one.
