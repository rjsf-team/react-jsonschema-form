---
title: ui:required and omitExtraData follow the anyOf or oneOf option on screen
description: The `ui:required` check and `omitExtraData` used to read the option the data matched best, and now read the option the field shows and the cycles the user expanded. Update tests that expect the old errors or the old omitted data.
packages: ['@rjsf/core']
uses: [ui-schema, form-props]
schema: [any-of-one-of, refs]
affects: [data, experience]
related: [selected-option-stays-while-you-type, sanitize-keeps-or-drops-values-by-field-tree]
---

## Detect

- Your uiSchema sets `ui:required` on a field inside an `anyOf`/`oneOf` option or below a recursive `$ref`.
- Your form passes `omitExtraData` (with or without `liveOmit`), and its schema has `anyOf`/`oneOf` options.
- Tests that submit or live-validate such a form and assert the errors or the data.

## Change

The `ui:required` check and omitting extra data read the option a field shows and the cycles the user expanded. `Form` passes them through a new optional `fieldState` argument of `getUiRequiredErrorSchema()` and `omitExtraData()`.

No code has to change. Update tests; "before" is what 6.11.0 gives:

- With `thing: { anyOf: [{ properties: { aField } }, { properties: { bField } }] }`, `ui:required` on `bField` and the data `{ thing: { aField: 'a' } }`, a field showing the second option now blocks the submit for the missing `bField`. The check used to read the first option, which the data matches best.
- With a recursive `node` whose `child` is `{ $ref: node }`, `ui:required` on `child.name` blocks the submit once the user expands `child`, and not before.
- Omitting keeps the data of the option shown. With `thing: { anyOf: [{ properties: { a } }, { properties: { b } }] }`, the data `{ thing: { b: 'v' } }` and the first option shown, submitting with `omitExtraData` drops `b`, which the option on screen has no field for. It kept `b` while the option was read from the data.
- An edit reads the option the field shows while it is made, so live omitting and live validation agree with the screen. With the root `oneOf: [{ title: 'A', properties: { a: { type: 'string' } } }, { title: 'B', properties: { a: { type: 'string', maxLength: 2 }, b: { type: 'string' } } }]`, `omitExtraData` and `liveOmit: 'onChange'`, select `B`, type `z` into `root_b` and `abc` into `root_a`. Before: the selector went to `A`, which the data now matches, and `b` was dropped with `root_b`. After: `B` stays on screen with `root_b`, and the data is `{ a: 'abc', b: 'z' }`. With `ui:required` on `b` and `liveValidate: 'onChange'` in place of the omit, the same steps report `.b must have required property 'b'` under `B`, where the form showed `A` and no error.

## Verify

- A `ui:required` field in the option on screen blocks submit; one in a hidden option or a collapsed cycle doesn't.
- With `omitExtraData`, submitted data holds the keys of the option on screen.
- Omitting still prunes an optional object whose filtered content is all empty, and an `anyOf` over empty data still applies every branch, as before.
