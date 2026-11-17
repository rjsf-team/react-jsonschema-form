---
title: The snapshot-tests package no longer has @testing-library/jest-dom as a peer dependency
description: "`@rjsf/snapshot-tests` no longer lists `@testing-library/jest-dom` as a peer dependency, so npm no longer installs it for you. If your tests use jest-dom matchers, declare it as a direct dev dependency."
packages: ['@rjsf/snapshot-tests']
uses: [tooling]
schema: []
kind: install
noticed: test
related: []
---

## Detect

- Your tests import `@testing-library/jest-dom` or use one of its matchers, such as `toBeInTheDocument()`.
- Your `package.json` doesn't list `@testing-library/jest-dom`, so it got installed only as a peer of `@rjsf/snapshot-tests`.

## Change

`@testing-library/jest-dom` has been removed from `@rjsf/snapshot-tests`'s `peerDependencies`; none of its suites use a jest-dom matcher. No code change is required. If your own tests use jest-dom's matchers, declare it as a direct dev dependency:

```diff
   "devDependencies": {
     "@rjsf/snapshot-tests": "^7.0.0",
+    "@testing-library/jest-dom": "...",
```

## Verify

- Your test setup still resolves `@testing-library/jest-dom`, and its matchers run.
