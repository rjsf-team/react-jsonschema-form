---
title: The antd theme requires antd 6.7 or later
description: '`@rjsf/antd` no longer supports `antd` 5, and earlier 6.x releases crash or misread `labelAlign`. Upgrade `antd` to 6.7 or later.'
packages: ['@rjsf/antd']
uses: [form]
schema: []
kind: install
noticed: build
related: []
---

## Detect

- `antd` below `6.7` in your `package.json` next to `@rjsf/antd`.

## Change

Upgrade `antd` to 6.7 or later:

```diff
-"antd": "^5.0.0",
+"antd": "^6.7.0",
```

`antd` 6.0.0 to 6.3.5 crash `@rjsf/antd` forms on first render, fixed upstream in [ant-design/ant-design#57636](https://github.com/ant-design/ant-design/pull/57636). Releases before 6.7 don't understand a `labelAlign` of `'start'` or `'end'`.

## Verify

- The package manager reports no unmet `antd` peer for `@rjsf/antd`.
- Forms render without a crash on first render.
