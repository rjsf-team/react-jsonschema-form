---
title: Theme options in ui:globalOptions use the theme's UiSchema type and globalUiOptionsKeys
description: A theme's global option, such as `mui`, `chakra`, `daisy`, `block` or `gridCols`, now compiles only under that theme's `UiSchema` type and is read only where declared. Use the theme's type, and name the key in `globalUiOptionsKeys` for a core Form.
packages: ['@rjsf/antd', '@rjsf/chakra-ui', '@rjsf/daisyui', '@rjsf/mantine', '@rjsf/mui', '@rjsf/shadcn']
uses: [ui-schema, typescript, custom-theme]
schema: []
kind: runtime
noticed: type-error
related: [custom-global-options-declare-global-ui-options-keys, mantine-global-options-no-longer-reach-mantine-props, ui-global-options-hold-only-global-options]
---

## Detect

- Your uiSchema sets a theme option in `ui:globalOptions`: `block` (antd), `chakra` (chakra-ui), `daisy` (daisyui), `gridCols`, `gridSpacing` or `gridVerticalSpacing` (mantine), or `mui` (mui).
- The type checker reports `Object literal may only specify known properties, and 'mui' does not exist in type 'GlobalUISchemaOptions<Record<never, never>>'.` for that key in a uiSchema typed with `@rjsf/utils`'s `UiSchema`.
- A `Form` from `@rjsf/core` gets a theme's `widgets` and `templates` directly, without `withTheme()` or the theme's own `Form`.
- `UserExtensions` keys you declare under a theme's type, or an extension named `props` with `@rjsf/shadcn`.

## Change

The themes that read options of their own globally export a type for them, which takes your `UserExtensions` too: `@rjsf/antd`'s `AntdGlobalUISchemaOptions` (`block`), `@rjsf/chakra-ui`'s `ChakraGlobalUISchemaOptions` (`chakra`), `@rjsf/daisyui`'s `DaisyGlobalUISchemaOptions` (`daisy`), `@rjsf/mantine`'s `MantineGlobalUISchemaOptions` (`gridCols`, `gridSpacing` and `gridVerticalSpacing`) and `@rjsf/mui`'s `MuiGlobalUISchemaOptions` (`mui`). Each also exports a `UiSchema` type whose `ui:globalOptions` carry its own option and your `UserExtensions`, so the option compiles there inline:

```diff
-import { UiSchema } from '@rjsf/utils';
+import { UiSchema } from '@rjsf/mui';

 const uiSchema: UiSchema = { 'ui:globalOptions': { mui: { size: 'small' } } };
```

Each theme declares its keys as its `globalUiOptionsKeys`, a new `ThemeProps` field that `withTheme()` adds the `Form`'s to, so a custom widget reads the theme's option from its `options`, and a custom template with `getUiOptions(uiSchema, registry.globalUiOptions)`, as the theme's own do. Any other theme option is read per field only, unless the `Form` declares it in `globalUiOptionsKeys`.

A `Form` from `@rjsf/core` handed a theme's `widgets` and `templates` directly declares none of the theme's keys, so it reads the theme's option from `ui:globalOptions` only when its `globalUiOptionsKeys` name it:

```tsx
import { Templates, Widgets } from '@rjsf/mui';

<Form widgets={Widgets} templates={Templates} globalUiOptionsKeys={['mui']} {...props} />;
```

A theme's type rejects a `UserExtensions` key its widgets read as an option of their own: `@rjsf/daisyui`'s `color`, `size` and `colorGradient`, and `@rjsf/mantine`'s `wrapperProps`, `thumbProps`, `thumbLabel`, `valueFormat`, `displayFormat`, `colorFormat` and the `InputWrapper` options, such as `size`, `labelProps` and `inputContainer`. Rename such an extension. `@rjsf/shadcn` exports no such type, but its `RangeWidget` reads `props` from its options and folds it into the slider's, so don't name an extension `props` with it.

## Verify

- The uiSchema compiles under the theme's `UiSchema` type.
- The theme's global option takes effect, including in a core `Form` that names it in `globalUiOptionsKeys`.
