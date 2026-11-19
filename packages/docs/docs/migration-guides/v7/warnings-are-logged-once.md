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

To find every problem a migration leaves rather than wait on the console, set `throwOn: ['migration']` with [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) in development or in your test setup. Each warning with a `migration` ID then throws an `RJSFWarningError` whose `id` is named in the upgrade guide entry that explains it. Only the warnings these entries name have an ID, so keep an eye on the console for the rest.

Fix the problems one ID at a time, by listing that ID in `throwOn` alone, or list one in `except` to acknowledge it and keep it logging. A throw while rendering tears the form down unless an error boundary catches it. One raised by an edit, such as adding an array item, throws out of that event handler and leaves the edit undone.

```ts
import { setWarningOptions } from '@rjsf/utils';

setWarningOptions({ throwOn: ['migration'], except: ['antd-span-twelfths'] });
```

## Verify

- Each test that expects an RJSF warning sees it logged, whatever order the tests run in.

## If you can't preserve it

A warning no longer repeats on each re-render within one page. Code that counted repeated warnings can only see the first one.
