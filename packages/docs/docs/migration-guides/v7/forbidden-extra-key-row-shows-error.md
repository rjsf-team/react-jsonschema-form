---
title: A row for a forbidden extra key shows an error from the first render
description: An extra key the object's schema forbids used to render a row with no explanation until submit, and now says `The key "%1" is not allowed here` from the first render. Update snapshots, and map the new `TranslatableString.AdditionalPropertyKeyNotAllowed`.
packages: ['@rjsf/core']
uses: [markup, form-props]
schema: [additional-properties]
kind: markup
noticed: test
related: [custom-templates-forward-key-not-allowed, translate-string-table-needs-new-keys]
---

## Detect

- Your schema forbids some extra keys through `additionalProperties`, `unevaluatedProperties` or `patternProperties` on an object that takes others, such as one matching none of the `patternProperties` beside `additionalProperties: false`, and your data can hold such a key.
- Snapshots or tests of such a row.
- A `translateString` that maps every `TranslatableString` key.

## Change

Such a row used to render with no input for its value and no word of why, until a submit reported `must NOT have additional properties` on the object ([#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630)). It now says `The key "%1" is not allowed here` from the first render on and right after a rename, without waiting for validation, so a snapshot of such a row gains the error. The key input of a forbidden key is now `aria-invalid` and described by the row's errors. A key that only `propertyNames` forbids gets no such message.

Update snapshots. The message is the new `TranslatableString.AdditionalPropertyKeyNotAllowed`; a `translateString` that maps every key needs it, along with the other new keys listed in [A translateString that maps every key needs the new TranslatableString keys](./translate-string-table-needs-new-keys.md).

## Verify

- A forbidden key's row shows the message and its key input is `aria-invalid`.
- Your `translateString` returns a translation for `AdditionalPropertyKeyNotAllowed`.
