---
title: 'Custom field, array and object templates take their error state from hasErrors'
description: 'A template `rawErrors` is deprecated in favor of a `hasErrors` prop, and `WrapIfAdditionalTemplate` now requires `hasErrors`. Read `hasErrors` for error state, and add it to a `FieldTemplate` that forwards props one by one.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-templates]
schema: []
affects: [code]
related: [custom-widget-error-state-from-has-widget-errors, field-template-props-requires-key-name, custom-field-rendering-field-template-passes-has-errors, layout-grid-discriminated-cell-renders-a-field-wrapper, field-template-reads-the-presentation-plan]
---

## Detect

- In your custom `FieldTemplate`: props forwarded to `WrapIfAdditionalTemplate` one by one, without `hasErrors`.
- In the type checker: `Property 'hasErrors' is missing in type '{ schema: JSONSchema7; … }' but required in type 'Pick<FieldTemplateProps<unknown, JSONSchema7, object>, …>'.`, under a `TS2769` "No overload matches this call." on the `WrapIfAdditionalTemplate` element.
- In plain JavaScript: an extra key's wrapper has lost its `has-error` class.
- In your custom `FieldTemplate`, `ArrayFieldTemplate` or `ObjectFieldTemplate`: an error state read from `rawErrors`.
- In the console: React warns about an unknown `errorschema` attribute from a template that spreads its leftover props onto a DOM node.

## Change

`WrapIfAdditionalTemplateProps` picks `hasErrors` as a required prop, and core's `WrapIfAdditionalTemplate` takes its `has-error` class from it alone. Add it to the list, beside `keyName` and `propertyNamesEnum`:

```diff
 <WrapIfAdditionalTemplate
   classNames={classNames}
   keyName={keyName}
+  hasErrors={hasErrors}
   ...
 >
```

A template's `rawErrors` is deprecated. Take the error state from its `hasErrors` prop, which holds whether the field has errors to show with `ui:hideError` applied. `SchemaField` withholds `rawErrors` from the `FieldTemplate` while the errors are hidden, as it always has, and now does so for a layout grid's discriminated cell too.

`ArrayFieldTemplate` and `ObjectFieldTemplate` are handed their own errors as `rawErrors` whatever `hideError` says, as a widget is, and that `rawErrors` is deprecated too. They take their error state from their own `hasErrors`, and the messages they draw from [`getErrorsToDraw()`](../../api-reference/utility-functions.md#geterrorstodraw). That gives `presentation.errors.messages` only where `presentation.errors.by` is `'self'`, since the `FieldTemplate` draws them under `'template'`; see [A custom FieldTemplate draws what the plan hands it](./field-template-reads-the-presentation-plan.md).

A `FieldTemplate` gains `errorSchema`, which `ArrayFieldTemplateProps` and `ObjectFieldTemplateProps` already declared. It carries every error whatever `hideError` says, so a template that renders the errors itself can reach the ones the directive withholds. A template that spreads its leftover props onto a DOM node destructures `errorSchema` out with the rest.

A discriminated layout grid cell's template is now handed `classNames` and `style`, so its wrapper carries `rjsf-field-error` while the field has errors to show; see [A discriminated layout grid cell renders inside a full field wrapper](./layout-grid-discriminated-cell-renders-a-field-wrapper.md).

## Verify

- Your templates compile, an extra key's wrapper carries `has-error` while it has errors to show, and nothing reads `rawErrors` for error state.
- React logs no unknown-attribute warning for `errorschema`.
