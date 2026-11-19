---
title: Switching from a null option back to an object option restores the field's default
description: Switching from a `null` option to an object option used to give only the option's own defaults, and now gives the field's defaults with that option, so a declared `default` comes back. Update tests that expect the old data.
packages: ['@rjsf/core']
uses: [form]
schema: [any-of-one-of, defaults]
affects: [data]
related: [selected-option-stays-while-you-type, sanitize-keeps-or-drops-values-by-field-tree]
---

## Detect

- Your schema has a `oneOf`/`anyOf` with a `type: 'null'` option beside an object option, and the field or an ancestor declares a `default` for it.
- Tests that select the `null` option, then the object option, and assert the data.

## Change

A field that held nothing, as after a `null` option, and switches to an option whose defaults are an object gets the defaults of the field with that option alone, so a `default` the field declares comes back with the option's own ([#5368](https://github.com/rjsf-team/react-jsonschema-form/issues/5368)). Those defaults hold no key set to `undefined`, so a `default` an ancestor declares for the field fills the keys they leave, as the form fills any other.

No code has to change. Update tests; "before" is what 6.11.0 gives:

- With `{ type: 'object', oneOf: [{ title: 'Obj', type: 'object', required: ['kind'], properties: { kind: { const: 'obj' }, note: { type: 'string', default: 'from-option' }, extra: { type: 'string' } } }, { title: 'None', type: 'null' }], default: { kind: 'obj', extra: 'from-root' } }`, select `None`, then `Obj`. Before: `{ note: 'from-option' }`. After: `{ kind: 'obj', note: 'from-option', extra: 'from-root' }`, the data the form mounted with.
- With the same `oneOf` as `properties.w.properties.p` and the `default` declared on the root as `{ w: { p: { kind: 'obj', extra: 'from-root' } } }`, the round trip gave `{ w: { p: { note: 'from-option' } } }` and now gives `{ w: { p: { kind: 'obj', note: 'from-option', extra: 'from-root' } } }`.

## Verify

- The form still mounts with the same data: `{ w: { p: { kind: 'obj', extra: 'from-root' } } }` in the nested example, before and after. On mount the ancestor's `default` object stands in for the option's own leaf defaults, while the switch writes the option's defaults and the ancestor's fill the keys they leave.
- An object property of the option still gets the empty object a switch from another object option gives it: with `meta: { type: 'object', properties: { a: { type: 'string' } } }` in `Obj`, the switch from `None` writes `meta: {}`, as before.
