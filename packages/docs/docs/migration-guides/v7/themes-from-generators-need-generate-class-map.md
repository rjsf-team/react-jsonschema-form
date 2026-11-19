---
title: A form built from theme generators passes the theme's class map
description: "@rjsf/daisyui and @rjsf/shadcn now style core's components through a class map that `generateTheme()` includes. A form built from `generateTemplates()` and `generateWidgets()` passes `generateClassMap()` too."
packages: ['@rjsf/daisyui', '@rjsf/shadcn']
uses: [custom-theme]
schema: []
affects: [code, appearance]
related: [daisyui-renders-core-components, shadcn-renders-core-templates]
---

## Detect

- `generateTemplates()` and `generateWidgets()` from `@rjsf/daisyui` or `@rjsf/shadcn` passed to `withTheme` or to `Form` in your code, without `generateTheme()`.
- On the rendered page, fields, errors and array items appear without the theme's classes.

## Change

Both themes now render core's components and style them through a `classMap` (see [The daisyUI theme renders core's templates and widgets with its classes](./daisyui-renders-core-components.md) and [The shadcn theme renders core's templates with its classes](./shadcn-renders-core-templates.md)). `generateTheme()` includes it. A form put together from the generators passes `classMap: generateClassMap()` to `withTheme`, or `classMap={generateClassMap()}` to the `Form`, or core's components render without the theme's classes:

```diff
-import { generateTemplates, generateWidgets } from '@rjsf/daisyui';
+import { generateClassMap, generateTemplates, generateWidgets } from '@rjsf/daisyui';

-const Form = withTheme({ templates: generateTemplates(), widgets: generateWidgets() });
+const Form = withTheme({ templates: generateTemplates(), widgets: generateWidgets(), classMap: generateClassMap() });
```

Under `@rjsf/shadcn`, import `generateClassMap` from `@rjsf/shadcn` the same way.

## Verify

- Fields, descriptions, errors and array items render with the theme's classes, as they do under `generateTheme()`.
