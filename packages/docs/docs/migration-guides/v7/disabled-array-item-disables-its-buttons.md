---
title: A disabled or read-only array item disables its move, copy and remove buttons
description: An array item locked on its own, through its schema's `readOnly` or its uiSchema, used to keep working move, copy and remove buttons, and now has them disabled. To keep rows movable, put `readOnly` or `ui:readonly` on the item's properties instead.
packages: ['@rjsf/core']
uses: [ui-schema, custom-templates]
schema: [arrays]
affects: [experience, code]
related: [array-templates-disable-buttons-that-cannot-act]
---

## Detect

- Your schema has `readOnly` in an array's `items` or `additionalItems` schema.
- Your uiSchema sets `ui:readonly` or `ui:disabled` on `items` or `additionalItems` (static or from the `items` function), or a `ui:definitions` entry for the items' `$ref` sets one, while the array itself stays editable.
- Your custom `ArrayFieldItemTemplate` reads `disabled` or `readonly`.
- On the rendered page: such items' move, copy and remove buttons are disabled.

## Change

An array item that is disabled or read-only on its own, not through the array, now has its move, copy and remove buttons disabled too, the way its inputs are ([#2504](https://github.com/rjsf-team/react-jsonschema-form/issues/2504)). Before, only the inputs were locked, and the item could still be moved, copied and removed.

- A `readOnly` on the item's selected `anyOf`/`oneOf` option locks only the inputs.
- A deprecated item that `deprecatedHandling: 'disable'` disables keeps its buttons, so it can still be removed.
- An item's own `ui:disabled: false` or `ui:readonly: false` under a disabled or read-only array, or form, still enables only its inputs, and the buttons stay disabled.
- `ArrayFieldItemTemplate`'s `disabled` and `readonly` are the same as its buttons', so they are now `true` for such an item too, where they used to be only the array's.

The add button stays enabled, and the row it adds is locked as soon as it appears. That works when the items have a `default`. Without one the row can't be filled or removed and it fails validation, so set `'ui:options': { addable: false }` on the array.

To keep an object item's rows movable and removable while its values stay read-only, put `readOnly` on its properties instead of on the item:

```diff
 items: {
   type: 'object',
-  readOnly: true,
-  properties: { name: { type: 'string' } },
+  properties: { name: { type: 'string', readOnly: true } },
 },
```

Move a `ui:readonly` or `ui:disabled` from `items` onto its properties the same way, as `items: { name: { 'ui:readonly': true } }`. The item's lock reached every property, its `additionalProperties` and any nested array's buttons, so give each of them its own `readOnly` or `ui:readonly` to keep them locked. A property left without one becomes editable, and a nested array's add, move and remove buttons become enabled. The add button of an item with `additionalProperties` becomes enabled too, and no property's `readOnly` locks it, so remove it with `'ui:options': { expandable: false }` on `items`.

## Verify

- Object items' rows move and remove while their values stay locked.
- Every property, extra key and nested array you want locked still is.

## If you can't preserve it

A list of plain values, such as `items: { type: 'string', readOnly: true }` or `items: { 'ui:readonly': true }` on a list of strings, has no properties to move the lock onto, and `ui:readonly: false` on the items unlocks their inputs too. The same goes for `ui:disabled` on such a list. No setting keeps such rows movable and removable while their values stay read-only or disabled.

Render the buttons with a custom `ArrayFieldItemButtonsTemplate` that leaves out `readonly`, or `disabled` for `ui:disabled`. It then also enables them in a read-only or disabled array or form.
