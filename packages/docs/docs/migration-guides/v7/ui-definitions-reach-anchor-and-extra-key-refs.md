---
title: ui:definitions entries now reach a $ref to an $anchor and an extra key whose $ref names an allOf
description: 'A `ui:definitions` entry now applies to a field whose `$ref` names an `$anchor`, and to an extra key whose `$ref` names a definition with an `allOf`. Remove any per-field `uiSchema` that made up for the missing entries, or narrow the entry.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [ui-schema]
schema: [refs, additional-properties]
kind: runtime
noticed: review
related: [ui-definitions-keyed-by-ref-as-written]
---

## Detect

- In your `uiSchema`: a `'ui:definitions'` key naming a definition that your schema reaches through a `$ref` to an `$anchor`, such as `{ $ref: '#nd' }`.
- In your `uiSchema`: a `'ui:definitions'` key naming a definition whose schema is an `allOf`, used through `additionalProperties: { $ref: … }` or a `patternProperties` entry.
- In the console, before the upgrade: `could not resolve $ref in resolveUiSchema` with `Could not find a definition for ...`.
- On the rendered page: such a field or extra key now shows that entry's `ui:*` settings.

## Change

`resolveUiSchema()` resolves a field's `$ref` as `retrieveSchema()` does, an `$anchor` included, so a field written `{ $ref: '#nd' }` gets the `ui:definitions` entries of its definition's `oneOf`/`anyOf` options. Before, it logged `could not resolve $ref in resolveUiSchema` with `Could not find a definition for ...` and left them out.

An extra key of the data whose `additionalProperties` or `patternProperties` `$ref` names a definition with an `allOf` keeps `RJSF_REF_KEY`, so it gets that definition's `ui:definitions` entry, as a property does. With `A = { allOf: [{ type: 'object', properties: { a: { type: 'string' } } }] }`, `additionalProperties: { $ref: A }`, the data `{ k: {} }` and `'ui:definitions': { '#/definitions/A': { 'ui:description': 'FROM_A' } }`: before, the `allOf` merge dropped the marker and `k` showed no `FROM_A`. After, it does, as `properties: { k: { $ref: A } }` already did.

Remove any per-field `uiSchema` you wrote to make up for the missing entries. If an entry shouldn't reach those fields, move its settings to the fields that need them. A `ui:definitions` key is the `$ref` as the schema writes it; see [A ui:definitions entry is keyed by the $ref as the schema writes it](./ui-definitions-keyed-by-ref-as-written.md).

## Verify

- The field renders with its definition's `ui:definitions` settings, and no `could not resolve $ref in resolveUiSchema` warning is logged.
- An extra key renders with the definition's settings, as a declared property using the same `$ref` does.
