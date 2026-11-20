---
title: A field named classNames, anyOf or oneOf takes no per-field uiSchema entry
description: "A typed uiSchema now intersects a field's entry with the declared `classNames`, `anyOf` or `oneOf` key, so a field with one of those names can't take an entry. Rename the field or configure it through `ui:options` on the parent."
packages: ['@rjsf/utils']
uses: [typescript]
schema: []
affects: [code]
related: [ui-schema-rejects-field-names-not-in-form-data]
---

## Detect

- Your form data has a field named `classNames`, `anyOf` or `oneOf`, and your typed uiSchema gives it an entry. The type checker rejects that entry, since a string or a list has nothing in common with a uiSchema.

## Change

Rename the field, or configure it through `ui:options` on the parent.

```diff
- const uiSchema: UiSchema<FormData> = { classNames: { 'ui:widget': 'textarea' } };
+ const uiSchema: UiSchema<FormData> = { cssClasses: { 'ui:widget': 'textarea' } };
```

This exposes a runtime limitation that already existed. `SchemaField` consumes and deletes `classNames` from every uiSchema it receives, and `anyOf`/`oneOf` are read as positional lists wherever the schema has that keyword, so such a field's uiSchema was never reliably delivered.

## Verify

- The uiSchema compiles and the renamed field gets its entry at runtime.
- A field named `items`, `additionalItems` or `additionalProperties` is fine: those keys hold a uiSchema, so the intersection accepts the per-field entry. See [A typed UiSchema rejects field names the form data lacks](./ui-schema-rejects-field-names-not-in-form-data.md).
