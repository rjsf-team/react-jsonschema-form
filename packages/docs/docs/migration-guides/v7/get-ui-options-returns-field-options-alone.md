---
title: getUiOptions no longer returns a global required or the root's definitions and globalOptions
description: '`getUiOptions()` used to return a global `required` and the root''s `ui:definitions` and `ui:globalOptions` as options, and now leaves all three out. Read them from `registry.uiSchemaDefinitions` and `registry.globalUiOptions`.'
packages: ['@rjsf/utils']
uses: [custom-widgets, custom-templates, utils-api]
schema: []
affects: [code]
related: [ui-options-field-and-reserved-keys-move-out, ui-global-options-hold-only-global-options]
---

## Detect

- In your widgets, fields or templates: reads of `options.required`, `options.definitions` or `options.globalOptions`.
- Calls to `getUiOptions()` whose result you read for those keys.
- Your root uiSchema sets `required` in `ui:globalOptions`.

## Change

`getUiOptions(uiSchema, globalOptions)` leaves a `required` in `globalOptions` out, and no longer returns the root uiSchema's `ui:definitions` and `ui:globalOptions` keys as options ([#5527](https://github.com/rjsf-team/react-jsonschema-form/issues/5527)). A form-wide `required` was never read by the required marker or by validation, which take `ui:required` from the field's own uiSchema, but it reached the `options` of a boolean field's widget, of an array field's select, checkboxes or file widget, and of the `anyOf`/`oneOf` selector.

"Before" is what 6.11.0 gives:

- `schema: { type: 'object', properties: { flag: { type: 'boolean' } } }` with `uiSchema: { 'ui:globalOptions': { required: true } }`: the `CheckboxWidget`'s `options.required`. Before: `true`. After: `undefined`.
- `schema: { type: 'string' }` with `uiSchema: { 'ui:definitions': {} }`: the `TextWidget`'s `options.definitions`. Before: `{}`. After: `undefined`.

A field's own `ui:required` is still an option. Read the form's definitions and global options from the registry:

```diff
-const definitions = options.definitions;
-const globals = options.globalOptions;
+const definitions = registry.uiSchemaDefinitions;
+const globals = registry.globalUiOptions;
```

## Verify

- Your components get definitions and globals from `registry`, and a widget's `options.required` reflects only the field's own `ui:required`.
