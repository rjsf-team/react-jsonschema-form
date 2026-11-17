---
title: A custom field rendering FallbackField without a plan gets its label from the value field
description: A custom field that renders `FallbackField` without its `presentation` used to get no label, two labels or a crash depending on how it was named, and now always has the value field draw the label and description. Draw neither in the custom field.
packages: ['@rjsf/core']
uses: [custom-fields, markup]
schema: [type-lists]
kind: markup
noticed: test
related: [custom-field-rendering-schemafield-gets-default-field, named-custom-field-applies-once-per-data-path]
---

## Detect

- Your form sets [`useFallbackUiForUnsupportedType`](../../api-reference/form-props.md#usefallbackuiforunsupportedtype), and a custom field renders `registry.fields.FallbackField` without passing it a `presentation`.
- Tests or snapshots of that field's label and description, or duplicate labels or a duplicate description `id` on the rendered page.

## Change

Such a custom field has the value field, below the type selector, draw the field's label and description, however the form reached the custom field ([#5389](https://github.com/rjsf-team/react-jsonschema-form/issues/5389)). Without a plan, `FallbackField` can't tell whether the custom field draws a label of its own, so it always has the value field draw one, which a custom field drawing none needs to give its value an accessible name.

"Before" is what 6.11.0 gives. With `schema: { type: 'object', properties: { val: { type: ['string', 'number'], title: 'Val', description: 'Desc' } } }` and a custom field `MyField` that draws no label or description of its own:

- `MyField` named by `ui:field`. Before: the page runs out of stack, since `FallbackField` rendered its value through `SchemaField` with the `uiSchema` that names `MyField`, which [is now applied once per data path](./named-custom-field-applies-once-per-data-path.md). After: one label, `Val`, below the type selector, and one description.
- `MyField` named by the schema's `$id`. Before: two labels, `Val` and `Value`. After: one label, `Val`, below the type selector, and one description.
- `MyField` named by a `ui:field` that it removes from the `uiSchema` it passes on. Before: one label, `Value`, and no description. After: one label, `Val`, below the type selector, and one description.

A custom field that draws its own label and description gets both a second time on every one of those routes, the second description under the same `id` as its own. Leave the label and description to the value field:

```diff
 return (
   <>
-    <label>{schema.title}</label>
-    <p>{schema.description}</p>
     <registry.fields.FallbackField {...props} />
   </>
 );
```

## Verify

- The field shows one label and one description, below the type selector.
- No two elements share the description `id`.
