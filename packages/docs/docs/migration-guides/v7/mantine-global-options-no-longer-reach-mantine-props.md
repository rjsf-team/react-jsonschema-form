---
title: Mantine props set in ui:globalOptions no longer reach Mantine components
description: A Mantine prop such as `radius` or `variant` in `ui:globalOptions` used to reach the components of boolean and array widgets, and now reaches none, even when declared. Set it in each field's `ui:options` or in Mantine's theme `defaultProps`.
packages: ['@rjsf/mantine']
uses: [ui-schema]
schema: []
affects: [appearance]
related: [theme-global-options-use-theme-types, ui-global-options-hold-only-global-options]
---

## Detect

- Your `@rjsf/mantine` form's root uiSchema sets a Mantine component prop, such as `radius` or `variant`, in `ui:globalOptions`.
- On the rendered page: checkboxes, switches or array selects no longer take that look.

## Change

`@rjsf/mantine`'s widgets hand the options they don't recognize to their Mantine component as props, but leave out every key the registry's `globalUiOptions` hold that the field doesn't set itself. So a key declared for your own components, such as `density`, never reaches a Mantine input, while a field's own Mantine prop of the same name still does. Move a global Mantine prop to each field's `ui:options`, or to Mantine's own theme:

```diff
-uiSchema = { 'ui:globalOptions': { radius: 'xl' }, agree: {} };
+uiSchema = { agree: { 'ui:options': { radius: 'xl' } } };
```

```tsx
import { Checkbox, createTheme, MantineProvider } from '@mantine/core';

const theme = createTheme({ components: { Checkbox: Checkbox.extend({ defaultProps: { radius: 'xl' } }) } });

<MantineProvider theme={theme}>
  <Form {...props} />
</MantineProvider>;
```

## Verify

- The Mantine components show the prop you set per field or in the Mantine theme.
