---
title: Move field, fieldReplacesAnyOrOneOf, definitions and globalOptions out of ui:options
description: '`field`, `fieldReplacesAnyOrOneOf`, `definitions` and `globalOptions` in `ui:options` used to apply, and are now ignored with a console warning. Use `ui:field` and `ui:fieldReplacesAnyOrOneOf`, and set the other two on the root uiSchema.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [ui-schema]
schema: []
kind: removal
noticed: runtime-error
related: [typed-ui-options-rejects-field-keys, get-ui-options-returns-field-options-alone, custom-field-draws-own-label-and-description]
---

## Detect

- Your uiSchemas, and the `children` entries of a `ui:layoutGrid`, set `field`, `fieldReplacesAnyOrOneOf`, `definitions` or `globalOptions` inside `ui:options`.
- A custom widget that reads an option by one of those names.
- The console warns about one of these keys, ending in `[ui-options-key-ignored]`. It names the key but not the field, and logs once per key, so search your uiSchemas rather than waiting on the console.

## Change

These keys in `ui:options` are ignored, as [the exceptions to the equivalence](../../api-reference/uiSchema.md#exceptions-to-the-equivalence) list them. "Before" is what 6.11.0 gives:

- `uiSchema: { 'ui:options': { field: 'MyField' } }`. Before: `MyField` renders. After: the field for the schema's type renders.
- `schema: anyOf` with `uiSchema: { 'ui:field': 'MyField', 'ui:options': { fieldReplacesAnyOrOneOf: true } }`. Before: `MyField` renders alone, in place of the options. After: `MyField` renders beside the option selector.
- `uiSchema: { 'ui:options': { definitions: {} } }`: a widget's `options.definitions`. Before: `{}`. After: `undefined`.

Move the keys out of `ui:options`:

```diff
- 'ui:options': { field: 'MyField', fieldReplacesAnyOrOneOf: true },
+ 'ui:field': 'MyField',
+ 'ui:fieldReplacesAnyOrOneOf': true,
```

A layout grid's `children` entry passes its extra properties as the cell's `ui:options`, so a `field` there moves to `ui:field` in the cell's own `uiSchema` entry.

`ui:definitions` and `ui:globalOptions` belong on the root uiSchema. A custom widget that took an option of one of these names through `ui:options` needs another name for it, since `ui:field` names a field and `getUiOptions()` doesn't return `ui:definitions` or `ui:globalOptions`.

## Verify

- The console no longer warns about these keys. [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make the `ui-options-key-ignored` warning throw.
- A custom field named by `ui:options.field` got the template's label and description, and one named by `ui:field` gets neither. To keep them, declare them under the field's registry key, as [A custom field draws its own label and description, and the plan wins over hideLabel](./custom-field-draws-own-label-and-description.md) describes, and register a field given as a component so that it has one.
- A custom field named by `ui:field` isn't handed the select `SchemaField` now infers for a boolean with labelled `oneOf`/`anyOf` options, so one that renders `BooleanField` shows the checkbox 6.11.0 showed. Set `ui:widget: 'select'` to get the select.
