---
title: An anyOf or oneOf field keeps the option the user selected
description: The option an `anyOf`/`oneOf` field shows used to follow the data as the user typed, and now stays on the user's selection, kept by the form per field path. Update tests that expect the selector to jump to the option the data matches.
packages: ['@rjsf/core']
uses: [form]
schema: [any-of-one-of]
affects: [experience, data]
related: [custom-anyof-oneof-field-uses-option-selection, ui-required-and-omit-extra-data-read-option-on-screen, sanitize-keeps-or-drops-values-by-field-tree, get-closest-matching-option-always-returns-an-option]
---

## Detect

- Your schema has `anyOf` or `oneOf`, and your tests select an option, type into it and then assert which option or which inputs show.
- Tests that unmount and remount a field, reorder array items or rename extra keys and then check the option shown.
- On the rendered page: a selector that used to switch back to another option while the user typed now stays put.

## Change

The option a field shows and which collapsed `$ref` cycles are expanded are now kept by the form, by field path, instead of by the `AnyOfField`/`OneOfField` and `CyclicSchemaField` components. They survive the field unmounting and mounting again, and follow array items and extra keys that the form moves, renames or removes.

With no selection, a field shows the option `getClosestMatchingOption()` picks for its data, as before. A selection, the user's or that pick once an edit is made inside the option, holds for the data the form last rendered under it and for whatever the form's own edits inside the option leave at the field. A switch or an edit that `transformChange` refuses keeps it too.

The field goes back to the option `getClosestMatchingOption()` picks, with the selection winning a tie, for other data:

- data from `setFieldValue()`, a reset, or a `transformChange` that rewrites a switch to data the chosen option doesn't fit;
- an edit to a property the object declares beside its options that the options can disagree about: one an option names under `properties` (such as a `const` that tells the options apart) or `required`, or any property where an option carries a keyword that reads the whole object, such as `minProperties`, `not` or `additionalProperties`.

An edit to a property every option is silent about, where each carries only `type`, annotations such as `title`, and `properties` and `required` that leave the property out, keeps the option shown. The pick doesn't replace the selection, and the selection is kept by field path, so it outlives the data it was made for. A field whose data holds a value for its schema's `discriminator.propertyName` always shows the option that value names, as before.

No code has to change. Update tests to the new behaviour; "before" is what 6.11.0 gives:

- With `o: { anyOf: [{ title: 'A', type: 'object', properties: { a: { type: 'string', default: 'd' } } }, { title: 'B', type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } }] }`, select `B`, clear `root_o_a` and type `d`. Before: the selector went back to `A`, whose `default` the data now matched, and `root_o_b` disappeared. After: it stays on `B`, with `root_o_b`.
- With `{ type: 'object', properties: { name: { type: 'string' } }, oneOf: [{ title: 'A', properties: { a: { type: 'string' } } }, { title: 'B', properties: { a: { type: 'string', maxLength: 2 }, b: { type: 'string' } }, required: ['b'] }] }`, select `B`, type `z` into `root_b`, `abc` into `root_a` and then `n` into `root_name`. Before: the selector went to `A` at `abc`, which `B` rejects, and `root_b` disappeared; with `omitExtraData` and `liveOmit`, `b: 'z'` was dropped there. After: it stays on `B` through both edits, with `{ a: 'abc', b: 'z', name: 'n' }`.
- With `{ type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } }, oneOf: [{ title: 'A', required: ['a'] }, { title: 'B', required: ['b'] }] }` and `{}`, type `x` into `root_b`: the selector goes to `B`, before and after, since `B`'s `required` names `b`. So does `anyOf: [{ title: 'Few', maxProperties: 1 }, { title: 'Many', minProperties: 2 }]` with `{ a: 'x' }` when `y` is typed into `root_b`: `Many`, before and after.
- A condition that swaps the option list a field offers starts the choice over. With `kind: { enum: ['a', 'b'], default: 'a' }`, `if: { properties: { kind: { const: 'a' } } }`, `then: { properties: { x: { anyOf: [A1, A2] } } }` and `else: { properties: { x: { anyOf: [B1, B2] } } }`, select `A2`, then `b` for `kind`. Before: `B2`, the index carried over. After: `B1`, the option the data matches; selecting `a` again shows `A2` before and after.
- A field that mounts again shows the option selected before. With the `o` above, select `B`, then render the form with `o: { 'ui:field': Nothing, 'ui:fieldReplacesAnyOrOneOf': true }` and again without it. Before: `A`. After: `B`.
- Data that `setFieldValue()` sets and every option fits shows the selection, where it used to show the option an earlier call matched. With the root `oneOf: [{ title: 'A', type: 'object', properties: { a: { type: 'string' } } }, { title: 'B', type: 'object', properties: { b: { type: 'string' } } }]`, select `B` and type `y` into `root_b`. `setFieldValue('', { a: 'x' })` then shows `A` before and after, and `setFieldValue('', {})` showed `A` and now shows `B`.
- A selection outlives the array item it was made for. With `{ type: 'array', items: ...that oneOf }` and `[{}, {}]`, select `B` on the second item, then call `setFieldValue('', [{}])` and later `setFieldValue('', [{}, {}])`. Before: the new second item shows `A`. After: `B`, the selection made at that index, which the new item's data fits. An item the form removes or moves takes its selection with it.
- A field opens on the pick of `getClosestMatchingOption()`, which now returns an option the data matches whenever one does (see [getClosestMatchingOption returns a valid option index whenever there are options](./get-closest-matching-option-always-returns-an-option.md)). So a field whose first option is `{ type: 'null', title: 'None' }` and whose data several other options match opens on one of those. With five definitions `A` to `E`, each `{ type: 'object', properties: { child: { oneOf: [{ type: 'null', title: 'None' }, ...a $ref to each of the four others] } } }`, the root `oneOf: [{ type: 'null', title: 'None' }, ...a $ref to each definition]` and the `formData` `{ child: { child: { child: null } } }`, the form used to open on `None` and render only the root selector. It now opens on `A` and renders a selector at each of the four levels.

The selection is also what sanitizing, `ui:required` and `omitExtraData` read; see [Form keeps or drops a value by comparing the field trees before and after a change](./sanitize-keeps-or-drops-values-by-field-tree.md) and [ui:required and omitExtraData follow the anyOf or oneOf option on screen](./ui-required-and-omit-extra-data-read-option-on-screen.md). A custom `AnyOfField` or `OneOfField` has to keep it through `useOptionSelection()`; see [A custom AnyOfField or OneOfField reads the selection through useOptionSelection](./custom-anyof-oneof-field-uses-option-selection.md).

## Verify

- Your tests that switch options and type into them pass against the option the user selected.
- A form whose data matches a non-null option opens on that option.
