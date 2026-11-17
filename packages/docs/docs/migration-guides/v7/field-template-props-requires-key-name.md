---
title: 'FieldTemplateProps requires keyName'
description: '`FieldTemplateProps` and `WrapIfAdditionalTemplateProps` have a new required `keyName`, the property name without the label decoration. Supply it wherever you build those props yourself.'
packages: ['@rjsf/core']
uses: [typescript, custom-fields, custom-templates]
schema: []
kind: type
noticed: type-error
related: [custom-wrap-if-additional-template-reads-key-name, custom-templates-take-error-state-from-has-errors, custom-field-template-forwards-property-names-enum]
---

## Detect

- In your code: an object of `FieldTemplateProps` or `WrapIfAdditionalTemplateProps` you build yourself, such as in a custom field that renders a `FieldTemplate`.
- In your code: a custom `FieldTemplate` that lists the props it forwards to `WrapIfAdditionalTemplate` one by one.
- In the type checker: `Property 'keyName' is missing in type '{ schema: JSONSchema7; … }' but required in type '{ fieldPath: FieldPath; id: string; … }'.`, under a `TS2322` assignment error or a `TS2769` "No overload matches this call." on the JSX element.

## Change

`keyName: string` is the name of the field's property in its parent object. It carries none of the decoration `label` may have, such as a `ui:title` or the `(deprecated)` marker the default `deprecatedHandling` appends, so an `additionalProperties` key is read and renamed from the real key. Rendering a `FieldTemplate` is unchanged. Supply it where you build the props:

```diff
 <FieldTemplate
   {...templateProps}
   label={label}
+  keyName={name}
 />
```

A `FieldTemplate` that forwards props one by one also forwards `hasErrors` ([Custom templates take their error state from hasErrors](./custom-templates-take-error-state-from-has-errors.md)) and `propertyNamesEnum` ([A custom FieldTemplate handles propertyNamesEnum](./custom-field-template-forwards-property-names-enum.md)).

## Verify

- Your code compiles, and an additional property's key input shows and renames the real key.
