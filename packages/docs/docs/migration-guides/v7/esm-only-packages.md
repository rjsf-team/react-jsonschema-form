---
title: Every RJSF package ships only ESM, and the dist builds are gone
description: Every `@rjsf/*` package now ships only per-file ESM in `lib/`, and the `dist/` CommonJS and bundled ESM builds are gone. Remove any alias, mapping or import that points at `dist/` and import the package root instead.
packages: ['*']
uses: [tooling]
schema: []
kind: install
noticed: build
related: [umd-bundles-removed, deep-imports-removed]
---

## Detect

- `@rjsf/<package>/dist`, `dist/index.cjs` or `dist/<name>.esm.js` in your code, bundler config, Jest `moduleNameMapper` or other test config.
- Your build or test run fails to resolve one of those paths after the upgrade.

## Change

Each package now publishes per-file modules and declarations in `lib/` only. The CommonJS build (`dist/index.cjs`), the bundled ESM build (`dist/<name>.esm.js`) and the `./dist` and `./dist/*.cjs` export paths are gone.

Point every alias, mapping and import at the package root:

```diff
-import Form from '@rjsf/core/dist/index.cjs';
+import Form from '@rjsf/core';
```

Delete any config entry that maps an `@rjsf/*` package to a `dist/` file. `import` from a bundler or from Node works as before. `require()` keeps working on every supported Node version, which loads ESM packages natively.

Deep imports through `lib/` don't resolve either, see [imports from a package's lib folder no longer resolve](./deep-imports-removed.md). If you load a UMD bundle from a CDN, see [the UMD bundles are gone](./umd-bundles-removed.md).

## Verify

- No config or code refers to an `@rjsf/*` `dist/` path.
- Your build and test runs resolve every `@rjsf/*` import.
