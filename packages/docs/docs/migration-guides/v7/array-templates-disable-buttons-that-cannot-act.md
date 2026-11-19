---
title: Array item handlers do nothing where the matching button can't act
description: Array item handlers such as `onAddItem` and `onRemoveItem` used to act whatever a template drew, and now do nothing where the button can't act. A template with its own buttons gates them on `hasMoveUp` and the like and disables them on `disabled || readonly`.
packages: ['@rjsf/core']
uses: [custom-templates]
schema: [arrays]
affects: [code, experience]
related: [array-drag-and-drop-keeps-orderable-on, disabled-array-item-disables-its-buttons, tuple-copy-shows-from-last-fixed-item]
---

## Detect

- Your custom `ArrayFieldTemplate` renders its own add button, or your custom `ArrayFieldItemButtonsTemplate` renders its own buttons.
- Your code calls `onAddClick`, `onAddItem`, `onCopyItem`, `onRemoveItem`, `onMoveUpItem` or `onMoveDownItem` directly.
- On the rendered page: a button that stays on screen and does nothing when pressed.

## Change

These handlers now do nothing where the button can't act, whatever the template draws ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677)). That covers:

- the first item up and the last item down;
- moving or removing a fixed tuple item, and adding after or copying one that isn't the last;
- adding to an optional array without data, whose data its `optionalDataControl` starts;
- a disabled or read-only array or item (an item's own lock leaves `onAddItem`, as it leaves the add button);
- an option or limit that takes the button away, such as `ui:orderable: false`, `ui:removable: false`, `ui:copyable` left off or `maxItems`.

`maxItems` and the last item are checked against the items at the call, so a template can call `onRemoveItem()` and then `onAddItem()` in one handler at the limit, or `onAddItem()` and then `onMoveDownItem()` on the last item, and a second `onAddItem()` past the limit does nothing.

`buttonsProps.canAdd` tells whether `onAddItem` acts: it is false on a disabled or read-only array, and after a tuple's fixed item that isn't the last, even where the array's add button shows. The array's own `canAdd` still tells only that the array is addable and has room, since the add button shows, disabled, on a disabled or read-only array.

An `ArrayFieldTemplate` that renders its own add button disables it on `disabled || readonly`, as the built-in ones do:

```diff
-{canAdd && <button type='button' onClick={onAddClick}>Add</button>}
+{canAdd && (
+  <button type='button' onClick={onAddClick} disabled={disabled || readonly}>
+    Add
+  </button>
+)}
```

An `ArrayFieldItemButtonsTemplate` that renders its own buttons shows each only under its `hasMoveUp`, `hasMoveDown`, `hasCopy` or `hasRemove`, and disables it on `disabled || readonly`. Otherwise a button that can't act stays on screen and does nothing, where Remove on a disabled or read-only array used to remove the item.

## Verify

- Your templates show no button that does nothing.
- A refused call still prevents the event's default, so a button that isn't `type='button'` doesn't submit the form.
