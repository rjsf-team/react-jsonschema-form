---
title: Custom keys in ui:globalOptions need the Form's globalUiOptionsKeys and the GlobalUISchemaOptions type
description: A key of your own in `ui:globalOptions` used to reach every component, and is now dropped from `registry.globalUiOptions` unless declared. Type it through `GlobalUISchemaOptions<UserExtensions>` and name it in the Form's new `globalUiOptionsKeys` prop.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-widgets, custom-templates, typescript]
schema: []
kind: runtime
noticed: type-error
related: [ui-global-options-hold-only-global-options, theme-global-options-use-theme-types]
---

## Detect

- Your own widgets, fields or templates read a key from `registry.globalUiOptions`, their `options`, or a root uiSchema's `ui:globalOptions` that isn't one of RJSF's twelve global options.
- The type checker reports `Object literal may only specify known properties, and 'density' does not exist in type 'GlobalUISchemaOptions<Record<never, never>>'.` for that key in a typed `ui:globalOptions` literal.
- On the rendered page: a component no longer sees the global value.
- In the console: a warning ending in `[global-ui-options-key-not-read]` for a `globalUiOptionsKeys` entry that names an option RJSF reads per field, or `definitions` or `globalOptions`.

## Change

`GlobalUISchemaOptions` is closed to RJSF's twelve keys. Its `UserExtensions` parameter adds the keys your own components read, which may not reuse an option name RJSF reads for a field, or `definitions` or `globalOptions`, which only the root uiSchema's `ui:` keys set, as `ReservedUiOptionName` and `RESERVED_UI_OPTION_NAMES` list them. Declare the options against it, hand them to the uiSchema, which takes them as the plain type, and name their keys in the `Form`'s new [`globalUiOptionsKeys`](../../api-reference/form-props.md#globaluioptionskeys) prop:

```diff
 import { GlobalUISchemaOptions, UiSchema } from '@rjsf/utils';

-const globalOptions: GlobalUISchemaOptions = {
+const globalOptions: GlobalUISchemaOptions<{ density?: 'compact' | 'comfortable' }> = {
   label: false,
   density: 'compact',
 };
 const uiSchema: UiSchema = { 'ui:globalOptions': globalOptions };

-<Form schema={schema} uiSchema={uiSchema} validator={validator} />;
+<Form schema={schema} uiSchema={uiSchema} validator={validator} globalUiOptionsKeys={['density']} />;
```

Every field then hands the declared keys to its widget in its `options`, beneath the field's own, as it does RJSF's, and a template reads them with `getUiOptions(uiSchema, registry.globalUiOptions)`.

A custom component hands [`getUiOptions()`](../../api-reference/utility-functions.md#getuioptions) the registry's `globalUiOptions`, which hold the extension keys the theme and the `Form` declare. One that reads a root uiSchema's `ui:globalOptions` itself passes them through `pickGlobalUiOptions()`, with those keys as its second argument, or it keeps only RJSF's twelve.

## Verify

- The uiSchema compiles, and your components read the declared key from their `options` or `getUiOptions(uiSchema, registry.globalUiOptions)`.
- A key that is an option name RJSF reads per field, such as `widget`, or `definitions` or `globalOptions`, is not read from `ui:globalOptions`, and the console warns `globalUiOptionsKeys names <key>, an option RJSF reads per field, so it is not read from ui:globalOptions.` Rename such a key. [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make the `global-ui-options-key-not-read` warning throw.
