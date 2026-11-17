---
title: FieldProps and WidgetProps reject props they do not declare
description: '`FieldProps` and `WidgetProps` used to accept any extra prop as `any` and now accept only the props they declare. Declare a prop of your own by intersection, under a name RJSF doesn''t already use.'
packages: ['@rjsf/utils']
uses: [typescript, custom-fields, custom-widgets]
schema: []
kind: type
noticed: type-error
related: [base-input-template-props-reject-extra-attributes]
---

## Detect

- In your code: a custom field or widget that destructures a prop of its own from `FieldProps` or `WidgetProps`.
- In your code: JSX that passes a field or widget a prop its props type doesn't declare.
- The type checker reports `Property 'myProp' does not exist on type 'FieldProps<…>'.` for the read, or TS2322 (`… is not assignable to type …`) for the extra prop you pass.

## Change

`FieldProps` and `WidgetProps` no longer accept props they don't declare. They declare the ones RJSF passes: on `FieldProps` the additional-property callbacks `onKeyRename`, `onKeyRenameBlur` and `onRemoveProperty`, `propertyNamesEnum`, an array item's `index` and a `oneOf`/`anyOf` field's `options`; on `WidgetProps` `errorSchema`, `time` and `autocomplete`. A field or widget that takes props of its own declares them, and passing one an undeclared prop is a type error:

```diff
-function MyField({ myProp }: FieldProps) {
+function MyField({ myProp }: FieldProps & { myProp?: string }) {
```

Give a prop of your own a name these props don't declare. The `&` intersects with a declared prop rather than replacing it, so `FieldProps & { options: MyConfig }` gives `options: S[] & MyConfig`, which can't be passed without a cast.

The registry's `BaseInputTemplate` has the same rule for input attributes, see [BaseInputTemplateProps rejects input attributes it does not declare](./base-input-template-props-reject-extra-attributes.md).

## Verify

- The type checker accepts your fields and widgets and the JSX that renders them.
- None of your own prop names collide with a declared prop.
