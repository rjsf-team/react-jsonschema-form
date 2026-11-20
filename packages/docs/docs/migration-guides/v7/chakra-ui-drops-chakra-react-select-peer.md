---
title: The chakra-ui theme no longer has chakra-react-select as a peer dependency
description: "`@rjsf/chakra-ui` no longer lists `chakra-react-select` as a peer dependency, since its `SelectWidget` now uses Chakra's own `Select`. Drop the package if you installed it only for RJSF, or declare it directly if your code imports it."
packages: ['@rjsf/chakra-ui']
uses: [tooling]
schema: []
affects: [setup]
related: []
---

## Detect

- Your `package.json` lists `chakra-react-select` beside `@rjsf/chakra-ui`.
- Your own code imports from `chakra-react-select`.

## Change

`chakra-react-select` has been removed from `@rjsf/chakra-ui`'s `peerDependencies`. Nothing in the package imports it any more, now that `SelectWidget` is built on Chakra's own `Select`.

No code change is required. If you installed `chakra-react-select` only to satisfy this peer dependency, you can remove it:

```diff
   "dependencies": {
     "@rjsf/chakra-ui": "^7.0.0",
-    "chakra-react-select": "...",
```

If your own code uses it, keep it and declare it as a direct dependency of your app.

## Verify

- Your package manager installs without a missing peer warning for `chakra-react-select`.
- Code of yours that imports `chakra-react-select` still resolves it from your own `dependencies`.
