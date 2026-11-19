---
title: getClosestMatchingOption scores the extra keys an option's additionalProperties takes
description: "`getClosestMatchingOption()` scored keys an option takes only through `additionalProperties` or `patternProperties` as nothing, and now scores them as a field does, so defaults can come from another option. Update expected picks, or add a `discriminator`."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, utils-api]
schema: [any-of-one-of, additional-properties]
kind: runtime
noticed: review
related: [get-closest-matching-option-always-returns-an-option]
---

## Detect

- In your schema, `anyOf` or `oneOf` options whose own `additionalProperties` (or `unevaluatedProperties`) is `true` or a schema, or that have a `patternProperties` of their own.
- Data for them holding keys the option's `properties` don't name, when no option matches the data, so the options are scored.
- In your code or tests, a call to `getClosestMatchingOption()` or `getDefaultFormState()` with such options.

## Change

`getClosestMatchingOption()` now scores those keys as it scores the options a field shows. Before, it scored them as nothing, so `getDefaultFormState()`, and a `Form` filling its first render or a field from its `default`, could fill from a different option than the one the field shows. `reset()` or an edit elsewhere then added or dropped its defaults ([#5832](https://github.com/rjsf-team/react-jsonschema-form/issues/5832)).

```ts
const options: RJSFSchema[] = [{ required: ['p'], additionalProperties: {} }, { properties: { p: { type: 'null' } } }];
getClosestMatchingOption(context, rootSchema, { m: 'b' }, options);
// Before: 1. After: 0, the option a field shows for { m: 'b' }

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    v: {
      default: { t: 2 },
      oneOf: [{ additionalProperties: false }, { properties: { q: { default: 'b' } }, additionalProperties: true }],
    },
  },
};
schemaUtils.getDefaultFormState(schema);
// Before: { v: { t: 2 } }. After: { v: { q: 'b', t: 2 } }, the defaults of the option the field shows
```

If your code or tests expect the old pick or the old data, update them to the new values. To make the pick independent of the data's extra keys, give the options a `discriminator` whose `propertyName` each option pins with a `const`. A value of the discriminator decides the option before any option is scored.

## Verify

- The form's first render, `reset()` and the field show the same option and its defaults.
- Whether the data matches an option is unchanged: a key an option takes only through `additionalProperties` is still not a key it declares.
- One case is left. Under `additionalPropertiesWhenAbsent: 'allow'`, an option naming neither `additionalProperties` nor `unevaluatedProperties` takes the extra keys too, and the field shows it with them, but `getClosestMatchingOption()` still scores them as nothing for it. Where another option spells `additionalProperties: true`, a form's first render can fill from that option while `reset()` and the field pick the other one ([#5886](https://github.com/rjsf-team/react-jsonschema-form/issues/5886)).
