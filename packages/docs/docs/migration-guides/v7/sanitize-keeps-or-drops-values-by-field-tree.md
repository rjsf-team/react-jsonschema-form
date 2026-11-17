---
title: Form keeps or drops a value by comparing the field trees before and after a change
description: '`Form` now sanitizes its data by comparing the field tree before a change with the one after, field by field, so values that used to linger or vanish now follow one rule. Update tests that assert which values survive a schema or data change.'
packages: ['@rjsf/core']
uses: [form]
schema: [defaults, any-of-one-of, additional-properties, arrays, refs]
kind: runtime
noticed: test
related: [option-switch-keeps-keys-the-new-option-takes, sanitize-data-for-new-schema-removes-discarded-keys, selected-option-stays-while-you-type, ui-required-and-omit-extra-data-read-option-on-screen]
---

## Detect

- Your schema has `if`/`then`/`else`, `dependencies`, `allOf`, `anyOf`/`oneOf` or `$ref` that change which fields render or what they accept as the data changes.
- Your app changes the `schema` prop of a mounted form, or `defaultFormStateBehavior`.
- Tests that assert which values remain after such a change.

## Change

`Form` sanitizes its data by comparing the field tree the data builds before a change with the one it builds after, field by field, as each is rendered: with the option the form selects and the `$ref` cycles the user expanded.

A field that left the tree loses its value, unless the object still holds it as an extra key that constrains nothing, as under `additionalProperties: true`, and that extra key renders it: a scalar, or an object whose keys the extra key takes as its own, stays and renders as an extra key. An array, whose items such an extra key renders none of, is dropped. So is a value equal to what the form fills the old field with from data without it, such as its `default`, its `const`, an empty object or its `ui:initialValue` or `ui:emptyValue`, even one the user chose.

A kept value is judged by the extra key alone, so a limit the new branch puts on the object's keys, such as `propertyNames` or `maxProperties`, can reject it, which validation reports. For the form to drop the value instead, give that branch `additionalProperties: false`, with the keys it keeps declared in its own `properties`.

A field whose constraints changed has its value judged again. The constraints are its `type`, `const`, `enum` or constant options, `maxItems`, and the `default` the defaults fill it with, from its own schema or any ancestor's `default` object as `defaultFormStateBehavior` reads them (see [`getFilledDefault()`](../../api-reference/utility-functions.md#getfilleddefaults-extends-strictrjsfschema--rjsfschema-f-extends-formcontexttype--formcontexttype)).

- A value still holding the old `default` takes the new one, written in place. An array holding it, or any value the old `default` was filled out from, to `minItems` or through a `ui:initialValue` below the field, is filled out from the new one in place, as a fresh mount fills it, since the form applies a `ui:initialValue` only on mount. A value the `default` plays no part in, such as one the field's own `ui:initialValue` filled in or one whose every item an `items` `ui:initialValue` filled, is kept.
- A property declared `readOnly` holding a scalar or a select's value is removed, unless a new `default` replaces an old one. A value of another type, or one the new `const` or `enum` rejects, is replaced or dropped as `sanitizeDataForNewSchema()` does it.
- A field the old schema gave no `default` keeps its value when a `default` first applies to it, a `readOnly` one included, since nothing tells saved data apart from a value its `ui:initialValue` or `ui:emptyValue` filled in.
- An object the defaults fill key by key, one whose own `type` renders as `object` and whose new `default` is an object too, is judged a key at a time, against the object `default` it holds a key of. That excludes a select over whole objects and an object with a `true` property. A key the new `default` no longer names keeps its value.
- An array's items are judged by the schema their position declares: a `prefixItems` or tuple `items` entry, and past them `items`, or `additionalItems` beside a tuple. An item is of another type only where its position's new `type` leaves out one the old schema declared there, a `number` counting as naming `integer`. A position the old schema declared `true`, `false` or nothing at judges the item by the new schema alone.
- Where an item reaches a position the new schema closes with `false`, or the new schema rejects a prefix item, whose removal would move the items after it, the whole array is removed instead, for the defaults to fill, as `sanitizeDataForNewSchema()` clears it. The array keeps its items where the old schema closed that position with `false` too, and where both schemas declare a schema for a rejected prefix item's position and constrain it alike, its `default` aside, so the item already failed the old one. It also keeps them where the item is an unfilled prefix item or is at or past the new `maxItems`, where the user is editing the array or a field in it, and where the array is an item of another array.

A field whose constraints did not change keeps its value, whatever else the change did.

Changing `defaultFormStateBehavior` alone changes no schema, but it can change the default a field is filled with, so every field is judged again: with `default: { v: 'x' }` on the root and `v: { type: 'string', default: 'q' }`, a form that filled `v` with `'q'` gives `{ v: 'x' }` once `nestedDefaultsPrecedence` becomes `'ancestorWins'`.

No code has to change. Update tests; "before" is what 6.11.0 gives:

- A condition inside the selected option replaces its old default ([#5465](https://github.com/rjsf-team/react-jsonschema-form/issues/5465)). With `cfgFor = (name) => ({ type: 'object', default: { name }, properties: { name: { type: 'string' } } })`, `thing: { oneOf: [X, Y] }` where `X` is `{ type: 'object', properties: { mode: { enum: ['a', 'b'], default: 'a' } }, dependencies: { mode: { oneOf: [{ properties: { mode: { const: 'a' }, cfg: cfgFor('a') } }, { properties: { mode: { const: 'b' }, cfg: cfgFor('b') } }] } } }`, and the data `{ thing: { mode: 'a', cfg: { name: 'a' } } }`, select `b` for `mode`. Before: `cfg: { name: 'a' }`. After: `cfg: { name: 'b' }`.
- A default declared by a branch that requires the key is replaced too. With `cfg` declared plainly and `allOf: [{ if: { properties: { mode: { const: 'a' } }, required: ['mode', 'cfg'] }, then: { properties: { cfg: cfgFor('a') } } }, ...the same for 'b']`, select `b` for `mode` with the data `{ mode: 'a', cfg: { name: 'a' } }`. Before: `cfg: { name: 'a' }`. After: `cfg: { name: 'b' }`.
- An array or object write is sanitized like any other edit. With `list: { type: 'array', items: { type: 'string' } }`, `color: { enum: ['r', 'g'] }` and `allOf: [{ if: { properties: { list: { minItems: 2 } } }, then: { properties: { color: { enum: ['r'] } } } }]`, add a row to `list` with the data `{ color: 'g', list: ['x'] }`. Before: `color: 'g'` until the next edit replaced it. After: `color: 'r'` as the row is added.
- A schema change of a form that owns its data is sanitized as it arrives, unless the form is `disabled` or `readonly`, whose data no edit sanitizes either. With `color: { $ref: '#/definitions/Color' }`, `Color` narrowed from `enum: ['a', 'b']` to `enum: ['a']`, and `initialFormData` `{ color: 'b' }`. Before: `color: 'b'`, kept until an edit sanitized and, with no conditional in the schema, for good. After: `color: 'a'` at once. Whether 6.11.0 ever replaced the value turned on a conditional elsewhere in the schema; the form now applies the rule an edit follows to the schema change itself.
- A value `setFieldValue('', data)` sets is taken as written, and no edit judges it unless the edit changes that field's constraints. With `mode: { enum: ['basic', 'advanced'] }`, `color: { type: 'string' }`, `note: { type: 'string' }` and `allOf: [{ if: { properties: { mode: { const: 'advanced' } } }, then: { properties: { color: { enum: ['r', 'c'] } } }, else: { properties: { color: { enum: ['r'] } } } }]`, set `{ mode: 'basic', color: 'c' }` and type into `note`: `color: 'c'` stays, which validation reports. An array `setFieldValue()` writes whole at its own path pairs each item that holds what an item of the array held with that item, so a reorder set back keeps the constraints its rows had.
- An extra key holding the old branch's `additionalProperties` default takes the new one, as a declared property does. With `mode: { enum: ['a', 'b'], default: 'a' }` and `dependencies: { mode: { oneOf: [{ properties: { mode: { const: 'a' } }, additionalProperties: tagFor('a') }, { properties: { mode: { const: 'b' } }, additionalProperties: tagFor('b') }] } }`, where `tagFor = (tag) => ({ type: 'object', default: { tag }, properties: { tag: { type: 'string' } } })`, and the data `{ mode: 'a', extra: { tag: 'a' } }`, select `b` for `mode`. Before: the form threw `Cannot use 'in' operator to search for 'tag' in a` as it rendered. After: `extra: { tag: 'b' }`.

Switching an `anyOf`/`oneOf` option follows the same diff; see [Switching an anyOf or oneOf option keeps the keys the new option takes](./option-switch-keeps-keys-the-new-option-takes.md). Code that calls `sanitizeDataForNewSchema()` itself sees a different result shape; see [sanitizeDataForNewSchema removes discarded keys and leaves out objects the data doesn't hold](./sanitize-data-for-new-schema-removes-discarded-keys.md).

## Verify

- Values for fields that left the form are gone from the submitted data, and values for fields whose constraints didn't change remain.
- A value you want dropped when a branch limits the object's keys is dropped once that branch has `additionalProperties: false`.
