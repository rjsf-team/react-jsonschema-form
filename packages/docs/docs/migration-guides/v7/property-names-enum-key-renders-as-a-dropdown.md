---
title: An extra key renders as a dropdown when propertyNames has an enum
description: An `additionalProperties` key used to be a free-text input; when `propertyNames` lists an `enum` it is now a dropdown of those names. Update tests and CSS that select the key input.
packages: ['@rjsf/core']
uses: [markup]
schema: [additional-properties]
kind: markup
noticed: test
related: [custom-field-template-forwards-property-names-enum, object-field-template-calls-schema-utils-can-expand]
---

## Detect

- In your schema, an object with `additionalProperties` or `patternProperties` whose `propertyNames` has an `enum` of key names:

```tsx
const schema: RJSFSchema = {
  type: 'object',
  additionalProperties: { type: 'boolean' },
  propertyNames: { enum: ['darkMode', 'betaBanner', 'offlineCache'] },
};
```

- In your tests or CSS, selectors that find the key's text input. In every theme the rendered page now shows a select there.

## Change

Update tests and styles to work with the select. A name another key already holds is left out of its options, and the add button creates the new property under the first allowed name that is still free instead of `newKey`, so update tests that expect `newKey`.

## Verify

- Each key shows as a dropdown of the allowed names that aren't taken.
- The add button disappears once every allowed name is taken, the way it does at the `maxProperties` limit. A custom `ObjectFieldTemplate` that calls `registry.schemaUtils.canExpand()` gets this on its own (see [A custom ObjectFieldTemplate calls registry.schemaUtils.canExpand](./object-field-template-calls-schema-utils-can-expand.md)).
- A `propertyNames` without an `enum`, such as one with a `pattern`, still renders the free-text input.
- A custom `FieldTemplate` or `WrapIfAdditionalTemplate` may need changes for the dropdown to appear: see [A custom FieldTemplate or WrapIfAdditionalTemplate handles propertyNamesEnum](./custom-field-template-forwards-property-names-enum.md).
