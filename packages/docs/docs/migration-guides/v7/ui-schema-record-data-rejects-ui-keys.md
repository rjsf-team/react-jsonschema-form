---
title: "A uiSchema for Record data rejects ui: keys"
description: "A uiSchema for data typed `Record<string, V>`, where `V` can't hold every value, now reads every key as a data entry and rejects `ui:` keys with TS2322. Give the form or that object the wider `Record<string, unknown>` type."
packages: ['@rjsf/utils']
uses: [typescript, ui-schema]
schema: [additional-properties]
affects: [code]
related: [ui-schema-rejects-field-names-not-in-form-data]
---

## Detect

- Your form data, or an object inside it, is typed `Record<string, V>` with a `V` that can't hold every value, such as `Record<string, string>`.
- Its uiSchema sets a `ui:` key such as `ui:order`, and the type checker reports `TS2322: Type '{ 'ui:order': string[]; }' is not assignable to type 'UiSchema<Record<string, string>, JSONSchema7, object>'` there.
- `Form` infers `T` from `initialFormData`, so `<Form initialFormData={data} uiSchema={{ 'ui:order': ['a'] }} />` with `data: Record<string, string>` fails without naming the type.

## Change

Give the form the wider type, or do the same for that object in a larger `T`:

```diff
- <Form initialFormData={data} uiSchema={{ 'ui:order': ['a'] }} />
+ <Form<Record<string, unknown>> initialFormData={data} uiSchema={{ 'ui:order': ['a'] }} />
```

## Verify

- The `ui:` keys compile again. Other `ui:` keys are still accepted at every level of a typed uiSchema; see [A typed UiSchema rejects field names the form data lacks](./ui-schema-rejects-field-names-not-in-form-data.md).
