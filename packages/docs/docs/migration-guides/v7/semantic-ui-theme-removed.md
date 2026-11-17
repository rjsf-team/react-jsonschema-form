---
title: The Semantic UI theme is removed
description: '`@rjsf/semantic-ui` has no v7 release because Semantic UI React does not support React 19 and is unmaintained. Switch to another theme.'
packages: ['@rjsf/semantic-ui']
uses: [form]
schema: []
kind: install
noticed: build
related: []
---

## Detect

- `@rjsf/semantic-ui` in your `package.json`.
- Imports from `@rjsf/semantic-ui` in your code.

## Change

Pick another theme and replace the dependency and its imports.

## Verify

- `@rjsf/semantic-ui` no longer appears in `package.json` or your imports.
- Install and build succeed with the replacement theme.
