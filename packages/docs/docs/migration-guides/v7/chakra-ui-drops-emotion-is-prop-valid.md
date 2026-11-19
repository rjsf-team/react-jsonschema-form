---
title: The chakra-ui theme no longer depends on @emotion/is-prop-valid
description: "`@rjsf/chakra-ui` no longer has `@emotion/is-prop-valid` as a dependency, so it may no longer be installed for you. If your own code imports it, declare it as a direct dependency of your app."
packages: ['@rjsf/chakra-ui']
uses: [tooling]
schema: []
affects: [setup]
related: []
---

## Detect

- Your own code imports `@emotion/is-prop-valid`, and your `package.json` doesn't list it.
- Your build or bundler fails to resolve `@emotion/is-prop-valid` after the upgrade.

## Change

`@emotion/is-prop-valid` is no longer a dependency of `@rjsf/chakra-ui`. If your own code imports it, declare it as a direct dependency:

```diff
   "dependencies": {
+    "@emotion/is-prop-valid": "...",
     "@rjsf/chakra-ui": "^7.0.0",
```

## Verify

- Your build resolves `@emotion/is-prop-valid` from your own `dependencies`.
