---
title: Under ancestorWins an ancestor's default wins only where the property's type can hold it
description: 'Under `nestedDefaultsPrecedence: ''ancestorWins''`, a falsy ancestor default used to lose and one of the wrong type used to win; now an ancestor wins exactly where the property''s type can hold its value. Check forms that use this setting.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form-props]
schema: [defaults]
kind: runtime
noticed: review
related: [sanitize-keeps-or-drops-values-by-field-tree]
---

## Detect

- In your code, a `Form` whose `defaultFormStateBehavior` sets `nestedDefaultsPrecedence: 'ancestorWins'`, or a `getDefaultFormState()` call with that setting.
- In your schema, a parent `default` that sets a value for a property that has a `default` of its own.

## Change

`getDefaultFormState()` now lets an ancestor's default win only where the property's types can hold it, falsy or not. An ancestor's `0`, `false`, `''`, or a `null` the property's type allows now wins over the property's own `default`, where the property's `default` used to win. An ancestor's value of a type the property can't hold gives way to the property's `default`:

```tsx
const schema: RJSFSchema = {
  type: 'object',
  default: { v: 5 },
  properties: { v: { type: 'string', default: 'x' } },
};
// v6: { v: 5 }
// v7: { v: 'x' }
```

If a form relied on the old result, change the ancestor's default to a value of the property's type, or remove the property's own `default` ([#5624](https://github.com/rjsf-team/react-jsonschema-form/issues/5624)).

## Verify

- A falsy ancestor default shows in the field on first render.
- An ancestor default of the wrong type no longer reaches the field.
