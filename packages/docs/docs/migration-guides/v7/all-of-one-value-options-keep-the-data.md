---
title: A property whose allOf narrows its options to one value keeps the value its data gives
description: "A property whose `allOf` narrows its options to one value now keeps its data under `allOf: 'skipDefaults'`, and takes its default for a value its own options lack under the other settings. Declare a `const` to force the value."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, form-props]
schema: [defaults, enums]
affects: [data]
related: [all-of-defaults-behavior-reaches-more-shapes, all-of-const-takes-precedence-under-const-as-defaults-always]
---

## Detect

- In your schema, a field whose `allOf` holds a single-value `enum`, or `anyOf`/`oneOf` constants narrowed to one, such as `w: { allOf: [{ enum: ['a'] }], default: 'a' }`.
- In your form data, a value for that field other than the one value.

## Change

`getDefaultFormState()` now reads the options from the field's merged schema.

Under the default `allOf: 'skipDefaults'`, such a property keeps the value its data gives it, as a property declaring that one value and `allOf: 'populateDefaults'` already did. With `{ type: 'object', properties: { w: { allOf: [{ enum: ['a'] }], default: 'a' } } }` and `{ w: 'b' }`, the result used to be `{ w: 'a' }` and is now `{ w: 'b' }`. A value the property's own options leave out still takes the default: with `w: { enum: ['a', 'b'], allOf: [{ enum: ['a'] }], default: 'a' }`, `{ w: 'c' }` gives `{ w: 'a' }`.

Under `allOf: 'populateDefaults'`, and for a root schema under either setting, a value the field's own `enum` or options leave out now takes the field's default where its `allOf` narrows them to one value. With the second schema above, `{ w: 'c' }` under `populateDefaults` used to give `{ w: 'c' }` and now gives `{ w: 'a' }`, and the schema of `w` as the root with `'c'` used to give `'c'` and now gives `'a'`. A value the field's own options take, such as `'b'`, is kept.

To have the one value replace the data, declare it as a `const` and set `constAsDefaults: 'always'`:

```diff
-w: { allOf: [{ enum: ['a'] }], default: 'a' }
+w: { const: 'a', default: 'a' }
```

To keep a value the default now replaces, add it to the field's own options ([#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769)).

## Verify

- A form loaded with a value its narrowed `allOf` doesn't allow shows the value you expect: the data's under `skipDefaults`, the default's where the field's own options leave it out.
- With a `const` and `constAsDefaults: 'always'`, the field shows the one value.
