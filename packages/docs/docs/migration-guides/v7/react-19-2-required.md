---
title: React 19.2 or later is required
description: "`@rjsf/core` now declares `react` `>=19.2` as its peer dependency, and versions below it are no longer supported. Upgrade `react` (and `react-dom`) to 19.2 or later."
packages: ['*']
uses: [form]
schema: []
kind: install
noticed: build
related: [react-dom-peer-of-core, form-in-hidden-activity-drops-changes]
---

## Detect

- Your `package.json` has a `react` version older than 19.2.
- Your package manager reports an unmet `react` peer dependency of `@rjsf/core`.

## Change

RJSF is no longer actively supporting React versions below 19.2. React 19 is officially supported on all the themes. `@rjsf/core` declares `react` `>=19.2` as its peer dependency, the release that added `<Activity>`, whose hidden content `Form` treats as unmounted (see [A form inside a hidden Activity](./form-in-hidden-activity-drops-changes.md)).

```diff
-    "react": "^18.3.1",
+    "react": "^19.2.0",
```

## Verify

- Your package manager installs without an unmet `react` peer dependency.
