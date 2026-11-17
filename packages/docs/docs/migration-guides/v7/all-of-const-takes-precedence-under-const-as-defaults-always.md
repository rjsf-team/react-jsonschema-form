---
title: Under constAsDefaults always, a const from allOf takes precedence over the data
description: "Under `constAsDefaults: 'always'`, an object `const` in an `allOf`, or an `anyOf`/`oneOf` constant of a key only an `allOf` declares, used to leave the data alone; it now replaces it as the field's own `const` does. Name every key to keep in the `const`, or add the value to the options."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form-props]
schema: [defaults, enums]
kind: runtime
noticed: review
related: [all-of-one-value-options-keep-the-data]
---

## Detect

- In your code, a `Form` whose `defaultFormStateBehavior` sets `constAsDefaults: 'always'`, or a `getDefaultFormState()` call with that setting.
- In your schema, an object field whose `allOf`, or an `if`/`then` left unmerged under `emptyObjectFields: 'skipEmptyDefaults'`, holds an object `const`.
- In your schema, a key only an object's `allOf` declares, whose `anyOf`/`oneOf` are constants.

## Change

`getDefaultFormState()` now reads these from the field's merged schema, so they apply as the field's own `const` or options do:

- An object `const` from the `allOf` takes precedence over the data, and the data keeps only the keys the `const` names. With `{ type: 'object', properties: { w: { type: 'object', allOf: [{ const: { a: 1 } }] } } }` and `{ w: { a: 2, b: 'x' } }`, the result used to be `{ w: { a: 2, b: 'x' } }` and is now `{ w: { a: 2 } }`. Name every key the data should keep in the `const`.
- A value of a key only the `allOf` declares, which none of its `anyOf`/`oneOf` constants offer, takes the first option's `const`. With `{ type: 'object', properties: { o: { type: 'object', allOf: [{ properties: { k: { anyOf: [{ const: 'a' }, { const: 'b' }] } } }] } } }` and `{ o: { k: 'z' } }`, the result used to be `{ o: { k: 'z' } }` and is now `{ o: { k: 'a' } }`. Add the value to the key's options to keep it ([#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769)).

## Verify

- Form data under such a field holds only the keys and values the `allOf`'s `const` and options allow.
