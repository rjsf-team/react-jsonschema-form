---
title: A custom field named by ui:field or $id renders once per data path
description: A custom field named by `$id` used to be skipped beside `anyOf`/`oneOf` and one named by `ui:field` rendered twice; both now render once per data path, and an option's own `ui:field` under it is ignored with a warning. Update tests and move option fields.
packages: ['@rjsf/core']
uses: [custom-fields]
schema: [any-of-one-of]
kind: runtime
noticed: runtime-error
related: [custom-field-rendering-schemafield-gets-default-field]
---

## Detect

- Your schema names a registered custom field through `$id`, or your uiSchema sets `ui:field` on a field with `anyOf`/`oneOf` options, or on one of those options.
- The console warns that an option's `ui:field` is ignored because a field is already named for that path.
- Tests or snapshots that expect a custom field twice, or not at all, beside an option selector.

## Change

A field's own `ui:field` and the schema's `$id` name a custom field through one slot, read in that order, so a field named by `$id` renders the way one named by `ui:field` does ([#5391](https://github.com/rjsf-team/react-jsonschema-form/issues/5391)). A named field is applied once per data path ([#5377](https://github.com/rjsf-team/react-jsonschema-form/issues/5377)): a `SchemaField` rendered for the same data below it, and the selected `anyOf`/`oneOf` option, render as though no field were named.

"Before" is what 6.11.0 gives. With `fields={{ MyField }}` and `anyOf = { type: 'string', anyOf: [{ minLength: 2 }, { maxLength: 5 }] }`:

- `schema: { $id: 'MyField', ...anyOf }`. Before: `MyField` is not rendered; the option selector and the selected option's input render. After: `MyField` renders beside the option selector, above the selected option's input.
- `schema: { $id: 'MyField', ...anyOf }` with `uiSchema: { 'ui:fieldReplacesAnyOrOneOf': true }`. Before: as above. After: `MyField` renders alone, in place of the options.
- `schema: anyOf` with `uiSchema: { 'ui:field': 'MyField' }`. Before: `MyField` renders twice, beside the option selector and again in place of the selected option's input. After: once beside the option selector, and the selected option renders its own input ([#5358](https://github.com/rjsf-team/react-jsonschema-form/issues/5358)). The field's own label is still left to `MyField`, as a `ui:field` always left it.
- `schema: anyOf` with `uiSchema: { 'ui:field': 'MyField', anyOf: [{ 'ui:field': 'OptionField' }, {}] }` and `OptionField` registered too. Before: `MyField` beside the option selector, and `OptionField` for the selected option. After: `MyField` beside the option selector, and the selected option's own input. The option renders at the data path `MyField` was named for, so its own `ui:field` is not applied, and the console warns once that it is ignored. A `ui:field` from a `ui:definitions` entry for the option's `$ref` is ignored the same way, and the warning names `uiSchema.anyOf[0]`, the entry the definition is copied into. An option naming `OptionField` by `$id` (`anyOf: [{ $id: 'OptionField', minLength: 2 }, { maxLength: 5 }]`) is ignored too, without a warning; 6.11.0 rendered it as `MyField` a second time.

To render a different custom field for an option, name it on the option alone and leave the union without a `ui:field`:

```diff
-uiSchema = { 'ui:field': 'MyField', anyOf: [{ 'ui:field': 'OptionField' }, {}] };
+uiSchema = { anyOf: [{ 'ui:field': 'OptionField' }, {}] };
```

## Verify

- Each named custom field renders once.
- The console no longer warns about an ignored option `ui:field`.
- Without a `ui:field` on the union, the option's own field renders, as before.
