---
title: Removed daisyUI and shadcn copies of core components are imported from core
description: "@rjsf/daisyui and @rjsf/shadcn dropped their copies of core's templates and widgets and now use core's. Import a removed one from `@rjsf/core` instead, or read it from `registry.templates` or `registry.widgets`."
packages: ['@rjsf/daisyui', '@rjsf/shadcn']
uses: [custom-templates, custom-widgets]
schema: []
affects: [code, setup]
related: [daisyui-renders-core-components, shadcn-renders-core-templates]
---

## Detect

- A custom template or widget that takes a template or widget from `@rjsf/daisyui` or `@rjsf/shadcn` the theme no longer has its own copy of.
- Under `@rjsf/daisyui`, that is any template other than `FieldTemplate`, `ObjectFieldTemplate`, `WrapIfAdditionalTemplate`, `ArrayFieldTemplate`, `ArrayFieldItemButtonsTemplate`, `TitleField`, `ArrayFieldTitleTemplate` and `GridTemplate`, and any widget other than the checkbox, toggle, select, date, time and rating widgets. See [The daisyUI theme renders core's templates and widgets with its classes](./daisyui-renders-core-components.md).
- Under `@rjsf/shadcn`, that is `FieldTemplate`, `DescriptionField`, `FieldErrorTemplate`, `FieldHelpTemplate`, `MultiSchemaFieldTemplate`, `ArrayFieldTemplate`, `ArrayFieldItemTemplate` and `ObjectFieldTemplate`. See [The shadcn theme renders core's templates with its classes](./shadcn-renders-core-templates.md).
- On the rendered page, the component your template renders is missing or unstyled.

## Change

Import the component from `@rjsf/core` instead, or read it from `registry.templates` or `registry.widgets` so it picks up whatever the form uses:

```diff
-  const { FieldErrorTemplate } = myThemeTemplates;
+  const { FieldErrorTemplate } = registry.templates;
```

The core component takes the theme's classes from the `classMap` in the registry, so it renders styled under either theme.

## Verify

- Your custom template or widget builds and renders the core component with the theme's classes.
