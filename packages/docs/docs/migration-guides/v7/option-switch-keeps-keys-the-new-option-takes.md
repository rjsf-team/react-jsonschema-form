---
title: Switching an anyOf or oneOf option keeps the keys the new option takes
description: Switching an `anyOf`/`oneOf` option now keeps or drops each key by the same field-tree diff as any other change, so saved data can reopen on the old option. Give the options a `const` property or a `discriminator`.
packages: ['@rjsf/core']
uses: [form]
schema: [any-of-one-of, additional-properties]
kind: runtime
noticed: review
related: [sanitize-keeps-or-drops-values-by-field-tree, selected-option-stays-while-you-type]
---

## Detect

- Your schema has object `anyOf`/`oneOf` options told apart only by the properties they declare, or an option that declares no `properties`.
- Tests that switch options and assert the data afterwards.
- On the rendered page: data saved after a switch reopens, through `initialFormData`, `formData` or `reset()`, on the option the user switched away from.

## Change

A switch through the option selector leaves each key the data held to the same diff that sanitizes any other change (see [Form keeps or drops a value by comparing the field trees before and after a change](./sanitize-keeps-or-drops-values-by-field-tree.md)). It judges the key against the old option and the whole form's defaults, so a switch keeps and drops what a branch does.

- A key both options declare is judged the same way, so its clear stays where the defaults fill it alike under both options, a `default` the field or an outer `anyOf`/`oneOf` declares included ([#5824](https://github.com/rjsf-team/react-jsonschema-form/issues/5824)).
- The object's extra keys are described by the new option's `additionalProperties` joined to its own. An option with `additionalProperties: false` drops the property, and one whose extra keys have a schema of their own, as `{ type: 'string' }`, keeps a value that schema's constraints take, as a branch does.
- A switch to an option declaring no `properties` no longer clears the object. It keeps the object's own fields and extra keys, whether or not the object takes extra keys and whether or not such a property stays.

The kept key can make the data match the old option again. Data loaded through `initialFormData`, `formData` or `reset()` opens on the first option it matches, so with options told apart only by the properties they declare it can open on the old one. Give each option a `const` property, or the schema a `discriminator`, for the data to open on the option the user chose:

```diff
 oneOf: [
-  { title: 'Card', properties: { number: { type: 'string' } } },
-  { title: 'Bank', properties: { iban: { type: 'string' } } },
+  { title: 'Card', properties: { kind: { const: 'card' }, number: { type: 'string' } }, required: ['kind'] },
+  { title: 'Bank', properties: { kind: { const: 'bank' }, iban: { type: 'string' } }, required: ['kind'] },
 ]
```

## Verify

- Saved data reopens on the option the user chose.
- Switching options drops only the keys the new option doesn't take.
