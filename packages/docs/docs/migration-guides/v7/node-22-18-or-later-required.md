---
title: Node.js 22.18, 24.11 or 26 and later is required
description: "Version 7 supports only Node `^22.18.0 || ^24.11.0 || >=26.0.0`, dropping Node 20, 23, 25 and 24 before 24.11.0. Move your install, build and test environments to a supported release."
packages: ['*']
uses: [tooling]
schema: []
kind: install
noticed: build
related: []
---

## Detect

- Your CI, Dockerfile, `.nvmrc`, `.node-version` or `engines` field pins Node 20, 23 or 25.
- You run on a Node 22 release before 22.18.0 or a Node 24 release before 24.11.0.

## Change

Version 7 supports only the active Node.js LTS lines: `^22.18.0 || ^24.11.0 || >=26.0.0`. Node 20, Node 23, Node 25, and Node 24 releases before 24.11.0 are no longer supported, as they are not [maintained versions](https://nodejs.org/en/about/releases/). Node 22.18.0 is the floor because it is the first release to enable native TypeScript type stripping by default.

```diff
-20
+22.18.0
```

## Verify

- `node --version` in every environment that installs, builds or tests with RJSF falls in the supported range.
