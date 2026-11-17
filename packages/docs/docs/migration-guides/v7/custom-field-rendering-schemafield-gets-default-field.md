---
title: A custom field that renders SchemaField for its own data gets the default field
description: A `SchemaField` a custom field renders for its own data path now renders the default field for the schema, whatever `ui:field` or `$id` its `uiSchema` names. Render another custom field's component directly instead.
packages: ['@rjsf/core']
uses: [custom-fields]
schema: []
kind: runtime
noticed: review
related: [named-custom-field-applies-once-per-data-path, custom-field-fallbackfield-value-field-draws-label, custom-field-draws-own-label-and-description]
---

## Detect

- In your code: a custom field that renders `registry.fields.SchemaField` with its own `fieldPath`, expecting the `uiSchema` it passes, or the schema's `$id`, to select another custom field.
- A custom field that renders a `Form` inside itself.

## Change

A custom field that renders `registry.fields.SchemaField` for its own data gets the default field for the schema, whatever the `uiSchema` it passes names. That field draws the label, description and help the custom field's plan hands down to it; see [A custom field draws its own label and description, and the plan wins over hideLabel](./custom-field-draws-own-label-and-description.md). The extra key's input and remove button and the `anyOf`/`oneOf` option selector stay with the field's own `SchemaField`, so each renders once.

To render another custom field for the same data, render that field's component directly:

```diff
-<registry.fields.SchemaField {...props} uiSchema={{ ...uiSchema, 'ui:field': 'OtherField' }} />
+<OtherField {...props} />
```

To render a different custom field for an option, name it on the option alone, rather than beside a field named for the union.

Each `Form` starts with no field named, so a `Form` rendered inside a custom field applies its own root `ui:field` or `$id`.

## Verify

- The inner field renders the custom field you meant, or the default field where that's what you want.
- The extra key input, remove button and option selector each render once.
