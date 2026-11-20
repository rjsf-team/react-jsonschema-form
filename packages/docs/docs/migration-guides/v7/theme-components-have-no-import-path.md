---
title: A theme's individual widgets and templates have no import path
description: A theme's single components under `lib/`, such as `@rjsf/mui/lib/SelectWidget/SelectWidget.js`, can no longer be imported. Read the component from the theme's `Widgets` or `Templates` export, or from the `registry` prop.
packages: ['@rjsf/antd', '@rjsf/chakra-ui', '@rjsf/daisyui', '@rjsf/fluentui-rc', '@rjsf/mantine', '@rjsf/mui', '@rjsf/react-bootstrap', '@rjsf/shadcn']
uses: [custom-widgets, custom-templates]
schema: []
affects: [setup, code]
related: [deep-imports-removed]
---

## Detect

- An import of one component from a theme's `lib` folder in your code, such as `@rjsf/mui/lib/SelectWidget/SelectWidget.js`.
- Your bundler fails to resolve that path, or Node throws `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Change

Read the component from the theme's `Widgets` or `Templates` export:

```diff
-import SelectWidget from '@rjsf/mui/lib/SelectWidget/SelectWidget.js';
+import { Widgets } from '@rjsf/mui';
+
+const { SelectWidget } = Widgets;
```

Inside a custom field, widget or template, use `registry.widgets` or `registry.templates` from the `registry` prop instead. For the other paths that went away, see [imports from a package's lib folder no longer resolve](./deep-imports-removed.md).

## Verify

- No code imports from a theme's `lib` folder.
- Your custom component renders the theme's widget or template as before.
