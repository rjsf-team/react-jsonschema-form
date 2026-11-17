---
title: A custom FieldTemplate or WrapIfAdditionalTemplate handles propertyNamesEnum
description: The allowed key names of a `propertyNames.enum` now reach `WrapIfAdditionalTemplate` as a new `propertyNamesEnum` prop. Forward it from a custom `FieldTemplate` and render it with `AdditionalPropertyKeySelect` in a custom `WrapIfAdditionalTemplate`.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-templates]
schema: [additional-properties]
kind: runtime
noticed: review
related:
  [
    property-names-enum-key-renders-as-a-dropdown,
    custom-templates-take-error-state-from-has-errors,
    field-template-props-requires-key-name,
  ]
---

## Detect

- In your code, a custom `FieldTemplate` that renders `WrapIfAdditionalTemplate` and lists the props it passes one by one instead of spreading them.
- In your code, a custom `WrapIfAdditionalTemplate` that always renders a text input for the key.
- In your schema, a `propertyNames` with an `enum`. On the rendered page, its keys still show a text input where the dropdown should be.

## Change

`FieldTemplateProps` and `WrapIfAdditionalTemplateProps` have a new optional `propertyNamesEnum` prop.

A custom `FieldTemplate` that lists its props adds `propertyNamesEnum` to the list so the dropdown appears. It also forwards `keyName` so the key it renders is the real one (see [FieldTemplateProps requires keyName](./field-template-props-requires-key-name.md)). The rest of the props such a template forwards, `hasErrors` among them, are covered in [Custom field, array and object templates take their error state from hasErrors](./custom-templates-take-error-state-from-has-errors.md).

```diff
 <WrapIfAdditionalTemplate
   {...otherForwardedProps}
+  keyName={keyName}
+  propertyNamesEnum={propertyNamesEnum}
 >
```

A custom `WrapIfAdditionalTemplate` hands the prop to the new `AdditionalPropertyKeySelect` component from `@rjsf/utils`, which renders the theme's own `SelectWidget`:

```tsx
{propertyNamesEnum ? (
  <AdditionalPropertyKeySelect
    id={additionalKeyId(id)}
    label={keyLabel}
    value={keyName}
    propertyNamesEnum={propertyNamesEnum}
    onKeyRename={onKeyRename}
    disabled={disabled}
    readonly={readonly}
    required={required}
    registry={registry}
  />
) : (
  <input type='text' id={additionalKeyId(id)} onBlur={onKeyRenameBlur} defaultValue={keyName} />
)}
```

## Verify

- A key under a `propertyNames.enum` renders as a dropdown of the allowed names, and other keys keep the text input.
- A custom `ObjectFieldTemplate` that calls `registry.schemaUtils.canExpand()` hides its add button once every allowed name is taken, with no change of its own.
