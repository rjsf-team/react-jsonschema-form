---
title: 'ArrayField no longer passes an errorSchema when items move'
description: '`ArrayField` used to pass a remapped `errorSchema` to `onChange` when it added, copied, removed or reordered items; the form now moves item errors itself. Pass changes on in the same call, and raise at the array path from a field of your own.'
packages: ['@rjsf/core']
uses: [custom-fields]
schema: [arrays]
affects: [code, data]
related: [onchange-error-schema-is-the-field-own-errors, custom-array-schema-field-raw-errors-are-the-item-errors, custom-field-passes-form-data-to-array-object-field]
---

## Detect

- In a custom field or template wrapping `ArrayField`: its `onChange` passed on later, from a debounce or after an `await`, or the third argument of that `onChange` read.
- In a custom field: `ArrayField` handed a sorted or filtered copy of the array.
- In your code: an array field written from scratch that adds, removes or reorders items.
- On the rendered page: item errors stay at the old index after an item moves.

## Change

The form moves the errors it holds for the items itself when `ArrayField` adds, copies, removes or reorders them.

- A wrapper that passes `ArrayField`'s `onChange` on in the same call is unaffected. One that passes it on later sends a change the form no longer knows the move of, so the errors don't move with the items. One that listened for the remapped `errorSchema` no longer receives it. One that adds an error of its own raises at the array's path, and so replaces the errors the items' fields raised themselves.
- Handing `ArrayField` a sorted or filtered copy isn't supported: it adds, copies, removes and reorders by reading the form's value at its `fieldPath`, so those operations and the errors they move act on the form's indexes. Pass `formData` through unchanged; see [A custom field wrapping ArrayField or ObjectField passes formData through unchanged](./custom-field-passes-form-data-to-array-object-field.md).
- A custom array field written from scratch can't tell the form where an item went, so its items' errors don't move with them. Without live validation, the validator's errors of the items whose values changed are cleared. Validating again, with `liveValidate` or `validateForm()`, puts the validator's errors in place but not the errors the items' fields raised, which stay at the old indexes, and one left at a removed item's index keeps the form from submitting. Raise at the array's path with the change:

```diff
 const removeItem = (index: number) => {
   const newItems = items.filter((_, i) => i !== index);
-  onChange(newItems, fieldPath);
+  onChange(newItems, fieldPath, {});
 };
```

Pass `{}` to clear the items' raised errors, or an `errorSchema` holding them where their items went.

## Verify

- After moving or removing an item, its errors follow it or are gone, and the form submits once the remaining items are valid.
