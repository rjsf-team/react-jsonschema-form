---
title: Bootstrap 3 markup moved from core to @rjsf/bootstrap3
description: '`@rjsf/core` no longer renders any Bootstrap 3 class, and its default `classMap` is empty. To keep Bootstrap 3, import `Form` or `Theme` from the deprecated `@rjsf/bootstrap3` package.'
packages: ['@rjsf/core', '@rjsf/bootstrap3']
uses: [form]
schema: []
affects: [setup, appearance]
related: [core-layout-needs-rjsf-css, core-marker-classes-carry-rjsf-prefix, layout-grid-column-width-is-span]
---

## Detect

- `import Form from '@rjsf/core'` in your code, with Bootstrap 3 CSS loaded on the page.
- The rendered page: forms that used to show Bootstrap 3 inputs, buttons with glyphicons and a grid now show the browser's own controls.

## Change

`@rjsf/core`'s widgets and templates now render toolkit-independent HTML5 markup. No Bootstrap 3 class is rendered and core's default `classMap` is empty.

An app that keeps Bootstrap 3 moves to the deprecated `@rjsf/bootstrap3` package. It renders the markup `@rjsf/core` rendered through v6, with the `rjsf-` prefixed marker classes described in [core marker classes](./core-marker-classes-carry-rjsf-prefix.md). It is removed in v8.

Add `@rjsf/bootstrap3` to your `package.json`, then change the import:

```diff
-import Form from '@rjsf/core';
+import Form from '@rjsf/bootstrap3';
```

If you build the form with `withTheme`, pass `@rjsf/bootstrap3`'s `Theme` export:

```diff
+import { Theme } from '@rjsf/bootstrap3';
-const Form = withTheme(MyTheme);
+const Form = withTheme(Theme);
```

A layout grid written for the Bootstrap 3 grid keeps its `className: 'row'` and `className: 'col-xs-4'` properties under `@rjsf/bootstrap3`. Under `@rjsf/core` it uses `span` instead, see [layout grid column width](./layout-grid-column-width-is-span.md).

## Verify

- The form shows Bootstrap 3 inputs, buttons and grid columns again.
- CSS or tests reading core's unprefixed marker classes still need the `rjsf-` prefix, see [core marker classes](./core-marker-classes-carry-rjsf-prefix.md).

## If you can't preserve it

`@rjsf/bootstrap3` is removed in v8. To leave Bootstrap 3 entirely, render `@rjsf/core` with its optional stylesheets, see [core layout stylesheet](./core-layout-needs-rjsf-css.md), or move to another theme.
