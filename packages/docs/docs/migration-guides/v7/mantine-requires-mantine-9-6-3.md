---
title: The Mantine theme requires Mantine 9.6.3 and React 19.2
description: '`@rjsf/mantine` no longer supports Mantine 8. Upgrade Mantine to 9.6.3 or later, which requires React 19.2 or later.'
packages: ['@rjsf/mantine']
uses: [form]
schema: []
kind: install
noticed: build
related: [mantine-grid-gutter-is-gap]
---

## Detect

- `@mantine/*` packages below `9.6.3` in your `package.json` next to `@rjsf/mantine`.
- `react` below `19.2`.

## Change

Upgrade your Mantine packages to 9.6.3 or later, and React to 19.2 or later. Mantine 9 also renamed `Grid`'s `gutter` prop, see [The Mantine layout grid option gutter is now gap](./mantine-grid-gutter-is-gap.md).

## Verify

- The package manager reports no unmet Mantine or React peer for `@rjsf/mantine`.
