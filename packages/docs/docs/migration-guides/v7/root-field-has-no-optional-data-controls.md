---
title: The root field never renders the Optional Data Controls
description: With `enableOptionalDataFieldForType`, a root `anyOf`/`oneOf` used to sit behind an Add button and a nested recursive `$ref` got no controls; the root now has none and the nested field gets them. Update tests and snapshots.
packages: ['@rjsf/core']
uses: [ui-schema, markup]
schema: [any-of-one-of, refs]
affects: [appearance, experience]
related: [additional-property-entry-has-no-optional-data-controls]
---

## Detect

- Your uiSchema sets `enableOptionalDataFieldForType`, and the root schema is an `anyOf`/`oneOf`, or nests an object or array through a recursive `$ref: '#'`.
- Tests or snapshots that click the root field's Add button, or expect a nested recursive field without one.

## Change

The Optional Data Controls are no longer rendered for the root field. A root `anyOf`/`oneOf` used to show its selected option behind an Add button, and now shows it straight away. A nested object or array that a recursive `$ref: '#'` describes was mistaken for the root and got no controls, and now gets them like any other optional field.

No code has to change. Update the tests and snapshots.

## Verify

- The root option renders without an Add click.
- Nested recursive objects and arrays show their Add button.
