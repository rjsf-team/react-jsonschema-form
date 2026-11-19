---
title: Draft-04 boolean exclusiveMinimum and exclusiveMaximum misread beside an option's bounds
description: 'Bounds merged from a field and its `anyOf`/`oneOf` option are read as draft-06, so the draft-04 boolean `exclusiveMaximum: true` can make a bound exclusive that neither schema did. Use the numeric form, `exclusiveMaximum: 5`.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [numbers, any-of-one-of]
affects: [data]
related: [non-object-option-inherits-field-keywords]
---

## Detect

- Your schema, written for draft-04 or OpenAPI 3.0, uses `exclusiveMinimum: true` or `exclusiveMaximum: true` on a field with `anyOf`/`oneOf` options or on one of its options.
- On the rendered page or in validation, a number field's bound is exclusive where you meant it inclusive.

## Change

An option now inherits its field's bounds and keeps the stricter of the two (see [A non-object field's anyOf or oneOf option renders with its parent's keywords](./non-object-option-inherits-field-keywords.md)). The bounds are read as draft-06 and later define them, where `exclusiveMinimum` and `exclusiveMaximum` are numbers of their own. The draft-04 boolean form is not supported. Beside a numeric bound from the other schema it can make a bound exclusive that neither schema did: a field's `maximum: 3` and an option's `{ maximum: 5, exclusiveMaximum: true }` render as less than 3.

Use the numeric form:

```diff
-{ "maximum": 5, "exclusiveMaximum": true }
+{ "exclusiveMaximum": 5 }
```

## Verify

- With a field's `maximum: 3` and an option's `exclusiveMaximum: 5`, the field accepts 3.
- No `exclusiveMinimum` or `exclusiveMaximum` in your schemas holds a boolean.
