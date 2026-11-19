---
title: react-dom is a peer dependency of @rjsf/core
description: "`@rjsf/core` now declares `react-dom` `>=19.2` as a peer dependency, for the `useFormStatus()` hook its submit button reads. A project without `react-dom`, such as a test setup on another renderer, adds it at the version of `react`."
packages: ['@rjsf/core']
uses: [tooling]
schema: []
affects: [setup]
related: [react-19-2-required]
---

## Detect

- Your project installs `@rjsf/core` without `react-dom`, such as a test setup on another React renderer.
- Your package manager reports a missing `react-dom` peer dependency of `@rjsf/core`.

## Change

`@rjsf/core` declares `react-dom` `>=19.2` as a peer dependency, for the `useFormStatus()` hook its submit button reads (see [Submitting](../../usage/submitting.md)). A project that renders a `Form` in the browser already has `react-dom` at the version of its `react`, so it has nothing to change. Otherwise add `react-dom` at the version of `react`:

```diff
     "react": "^19.2.0",
+    "react-dom": "^19.2.0",
```

## Verify

- Your package manager installs without a missing `react-dom` peer dependency.
