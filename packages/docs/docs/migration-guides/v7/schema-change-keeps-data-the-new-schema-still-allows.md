---
title: A schema change keeps form data the new schema still allows
description: '`sanitizeDataForNewSchema()` used to drop some values on a schema switch that the new schema still accepts, and keep some it rejects. It now compares by value and by the allowed constants; check forms that switch schema or option.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form, utils-api]
schema: [any-of-one-of, enums, arrays, defaults]
kind: runtime
noticed: review
related: [sanitize-data-for-new-schema-removes-discarded-keys, sanitize-keeps-or-drops-values-by-field-tree]
---

## Detect

- In your form, a switch of schema, of `anyOf`/`oneOf` option, or of a conditional branch.
- In your form data at that point, a value whose type was guessed (see `GUESSED_TYPE_FLAG`), a `readOnly` object or array default, an array item picked from object constants, or a value an option's `enum` allows.
- In your code, a direct call to `sanitizeDataForNewSchema()`.

## Change

`sanitizeDataForNewSchema()` keeps more of the data the new schema allows. Check that each of these is what your form wants:

- A property whose old and new types both carry `GUESSED_TYPE_FLAG` is not treated as changing schema, so switching its type through the fallback UI keeps the value. A new schema that declares a type of its own is still the type the data must satisfy.
- A `default` or `const` is compared with the data by value, so a `readOnly` object or array holding its default keeps it, and an untouched object default is swapped for the new schema's.
- An array item picked from object constants is kept when the new items schema still offers it.
- An `anyOf`/`oneOf` with an option that is neither a `const` nor an `enum` no longer counts as a list of allowed values, so a value only that option accepts is kept.
- An option's `enum` counts every one of its values as allowed, where one with more than one value used to add none. A value it allows is kept, and one no option allows is cleared.
- Array items are no longer filtered against the items `enum` on every pass. With the previous form data passed, as `Form` passes it, the filter is skipped when the old and new items schemas match.

For the keys it removes, see [sanitizeDataForNewSchema removes discarded keys and leaves out objects the data doesn't hold](./sanitize-data-for-new-schema-removes-discarded-keys.md).

## Verify

- After a switch, values the new schema accepts are still in the form data, and values no option allows are gone.
