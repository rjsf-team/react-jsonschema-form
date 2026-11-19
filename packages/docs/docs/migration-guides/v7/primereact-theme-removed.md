---
title: The PrimeReact theme is removed
description: '`@rjsf/primereact` has no v7 release because PrimeReact 11 requires a paid subscription. Switch to another theme, or port the v6 theme into your own code.'
packages: ['@rjsf/primereact']
uses: [form]
schema: []
affects: [setup]
related: []
---

## Detect

- `@rjsf/primereact` in your `package.json`.
- Imports from `@rjsf/primereact` in your code.

## Change

The theme was removed because PrimeReact's latest version (11) requires a paid subscription, which conflicts with RJSF's MIT licensing.

Pick another theme and replace the dependency and its imports. If you have a PrimeReact 11 subscription, you can migrate the v6 `@rjsf/primereact` source into your project yourself.

## Verify

- `@rjsf/primereact` no longer appears in `package.json` or your imports.
- Install and build succeed with the replacement theme.
