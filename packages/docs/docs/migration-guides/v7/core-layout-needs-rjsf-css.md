---
title: Core lays out arrays, extra keys and grids through an optional stylesheet
description: Core no longer lays out array items, additional properties, the add button or `GridTemplate` with inline offsets and Bootstrap grid classes. Import `@rjsf/core/rjsf.css`, and `@rjsf/core/rjsf-theme.css` for a default look.
packages: ['@rjsf/core']
uses: [form, tooling]
schema: []
kind: markup
noticed: review
related: [bootstrap-3-markup-moved-to-bootstrap3, field-template-keeps-core-layout-classes]
---

## Detect

- `import Form from '@rjsf/core'` in your code, without Bootstrap 3 CSS.
- The rendered page: array item buttons, additional-property rows, the add button or layout grid columns are no longer placed beside or level with their fields.

## Change

The inline pixel offsets tuned to Bootstrap 3 are gone. The array item, the additional-property row, the add button and the `GridTemplate` lay themselves out through the optional layout stylesheet, `@rjsf/core/rjsf.css`. `@rjsf/core/rjsf-theme.css` adds an optional default look on top of it. Without them a form renders with the browser's own controls.

Import them once, where your app loads its CSS:

```diff
 import Form from '@rjsf/core';
+import '@rjsf/core/rjsf.css';
+import '@rjsf/core/rjsf-theme.css';
```

Every rule in both files is a zero-specificity `:where(.rjsf …)` in `@layer rjsf`, with `--rjsf-*` custom properties, so your own CSS overrides it.

## Verify

- Array item buttons and an additional property's key input and remove button sit level with the field's control.
- Layout grid columns sit side by side.
- Your own CSS still wins over the stylesheets' rules.
- A custom `FieldTemplate` lines up only when it keeps core's label and description markers, see [custom FieldTemplate layout](./field-template-keeps-core-layout-classes.md).
