---
title: A property under an untyped additionalProperties renders the field its constraints call for
description: A key under an `additionalProperties` or `patternProperties` subschema with no `type` used to render as free text or the unsupported field; it now renders a field honoring the subschema's `enum`, `format`, length or range. Check those keys and their data.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form]
schema: [additional-properties]
kind: runtime
noticed: review
related: [fallback-ui-renders-type-lists-with-a-type-selector, schema-change-keeps-data-the-new-schema-still-allows]
---

## Detect

- In your schema, an `additionalProperties` or `patternProperties` subschema with no `type` that sets an `enum`, a `format`, a length or a range.
- In your schema, an object with `patternProperties` whose data holds keys none of the patterns match.
- In your code, tests that compare `retrieveSchema()` output for such a property.

## Change

`retrieveSchema()` builds a stub for such a property that keeps the rest of the subschema instead of discarding it, so the property renders as a field that honors its constraint. This is not gated behind `useFallbackUiForUnsupportedType`, so it applies in every form. A value of a type the constraint doesn't allow is invisible in that field, as in any field whose schema names a type; check data that holds such values.

The stub leaves out subschema keywords such as `allOf`, a `default` of another type than the data, and the identifiers (`$id`, `$anchor`) and containers (`$defs`, `definitions`) of a stub whose type the subschema only implies or the data supplies. The stub takes the type of the data the property holds, and is marked with the new `GUESSED_TYPE_FLAG` symbol when the subschema asserts nothing about the value.

A key whose matching `patternProperties` subschema names no type is stubbed the same way, where it used to render as the unsupported field. A key that matches none of the patterns is stubbed from its data too. Only a schema that forbids such a key still stubs it as `{ type: 'null' }`: `additionalProperties: false`, `unevaluatedProperties: false` where no `additionalProperties` evaluates the key, or a matching pattern of `false`.

## Verify

- Each such key renders the input its constraint calls for, such as a select for an `enum`.
- Existing values of those keys still display.
