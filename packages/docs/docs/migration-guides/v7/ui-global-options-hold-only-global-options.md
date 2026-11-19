---
title: ui:globalOptions only sets the twelve options RJSF reads globally
description: '`ui:globalOptions` used to pass any option, such as `readonly`, `widget` or `classNames`, to every field, and now keeps only twelve global options and warns about the rest. Move each other option to the Form prop or field uiSchema the table names.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [ui-schema]
schema: []
kind: runtime
noticed: type-error
related: [custom-global-options-declare-global-ui-options-keys, layout-grid-cells-read-globals-from-registry, theme-global-options-use-theme-types, get-ui-options-returns-field-options-alone]
---

## Detect

- Your root uiSchema's `ui:globalOptions` sets a key other than `addable`, `copyable`, `orderable`, `removable`, `label`, `allowClearTextInputs`, `duplicateKeySuffixSeparator`, `enableMarkdownInDescription`, `enableMarkdownInHelp`, `enableOptionalDataFieldForType`, `optionValueFormat` and `deprecatedHandling`.
- The console warns `ui:globalOptions.<key> is not read: RJSF reads <key> per field only. [global-option-not-read]`, once per key.
- The type checker reports `Object literal may only specify known properties, and 'readonly' does not exist in type 'GlobalUISchemaOptions<Record<never, never>>'.` for such a key in a typed `ui:globalOptions` literal.

## Change

RJSF reads twelve options from the root uiSchema's `ui:globalOptions`, as fallbacks for a field that sets none of its own: the ones listed above ([#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607)). They are the `GlobalUISchemaOptionsKeys` type. Every other option is read per field only: the `Form` builds its registry's `globalUiOptions` with [`pickGlobalUiOptions()`](../../api-reference/utility-functions.md#pickglobaluioptions), which keeps those twelve and the extension keys the form declares, and nothing else. `GlobalUISchemaOptions` is closed to those twelve keys, so a literal with any other key no longer compiles.

Move each option RJSF no longer reads globally:

| Set in `ui:globalOptions`                                                                                                           | Set instead                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `widget`, `field`                                                                                                                   | the field's own `ui:widget` or `ui:field`, or a replacement for the registered implementation through the `Form`'s `widgets` or `fields`, such as `widgets={{ TextWidget: MyTextWidget }}` |
| A template override, such as `FieldTemplate`                                                                                        | the `Form`'s `templates`                                                                                                                                                                   |
| `readonly`, `disabled`                                                                                                              | the `Form`'s `readonly` and `disabled` props                                                                                                                                               |
| `hideError`                                                                                                                         | `ui:hideError` at the root of the uiSchema, which reaches every field below it                                                                                                             |
| `help`, `title`, `description`, `placeholder`, `classNames`, `inputType`, an array's `itemLabel` and any other option a field reads | the field's own uiSchema                                                                                                                                                                   |

```diff
-uiSchema = { 'ui:globalOptions': { readonly: true, hideError: true } };
-<Form schema={schema} uiSchema={uiSchema} validator={validator} />;
+uiSchema = { 'ui:hideError': true };
+<Form schema={schema} uiSchema={uiSchema} validator={validator} readonly />;
```

Keys your own components read need declaring; see [Custom keys in ui:globalOptions need the Form's globalUiOptionsKeys and the GlobalUISchemaOptions type](./custom-global-options-declare-global-ui-options-keys.md).

## Verify

- The console no longer warns about `ui:globalOptions` keys. [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make the `global-option-not-read` warning throw.
- `StringField`, and `NumberField` through it, now hand their widget the global options beneath the field's own, as `ArrayField` and `BooleanField` already did. A global `allowClearTextInputs` or `optionValueFormat` now reaches every string and number widget; check that this is what you want.
