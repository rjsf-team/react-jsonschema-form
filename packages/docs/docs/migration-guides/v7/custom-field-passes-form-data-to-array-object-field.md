---
title: A custom field wrapping ArrayField or ObjectField passes formData through unchanged
description: '`ArrayField` and `ObjectField` now add, remove, rename and reorder by reading the form value at their `fieldPath`, so a transformed `formData` breaks them. Pass `formData` through unchanged, or render a part at its own `fieldPath` or through `SchemaField`.'
packages: ['@rjsf/core']
uses: [custom-fields]
schema: []
affects: [code]
related: []
---

## Detect

- A custom field in your code that renders `ArrayField` or `ObjectField` with a sorted, filtered or otherwise copied `formData`.
- A custom field that hands one part of its data under its own `fieldPath`, such as `<ArrayField {...props} formData={props.formData.items} />`.
- In development, the console warns: ``ArrayField … was rendered with other `formData` than the form holds at its `fieldPath`.`` (or `ObjectField`), ending in `[form-data-not-passed-through]`.

## Change

`ArrayField` and `ObjectField` add, remove, rename and reorder by reading the form's current value at their `fieldPath`, so that several edits in one event build on each other. A custom field that wraps one of them has to pass `formData` through unchanged. If it passes a transformed copy, such as a sorted list, those operations act on positions the form doesn't hold.

The same goes for a field that hands it part of its own data under its own `fieldPath`: the operations read the whole value at that path, so an add can replace it with an array of one new item and a remove does nothing. Render the part at its own `fieldPath`, or render the container for that part through `SchemaField`.

```diff
-<ArrayField {...props} formData={[...props.formData].sort(byName)} />
+<ArrayField {...props} />
```

## Verify

- The development warning `form-data-not-passed-through` no longer appears. [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make it throw.
- Adding, removing, renaming and reordering through your custom field change the items it shows.
