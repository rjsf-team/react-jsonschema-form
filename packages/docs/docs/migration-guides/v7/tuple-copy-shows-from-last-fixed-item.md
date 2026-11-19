---
title: Copy shows only from a tuple's last fixed item on
description: In an array with fixed `items` and `additionalItems`, Copy used to show on every fixed item, and now shows only from the last fixed item on, which drops some toolbars and renumbers `itemLabel` buttons. Update tests, snapshots and CSS.
packages: ['@rjsf/core']
uses: [markup, ui-schema]
schema: [arrays]
affects: [appearance, experience]
related: [array-templates-disable-buttons-that-cannot-act]
---

## Detect

- Your schema has an array with fixed `items` and `additionalItems`, with copy enabled.
- Tests, snapshots or CSS that rely on a fixed item's Copy button or toolbar, or on numbered button titles such as `Copy x (1)` under [`itemLabel`](../../json-schema/arrays.md#itemlabel-option).

## Change

Core's Copy button no longer shows on a fixed item before the last ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677)). A copy goes below its item, so a copy of an earlier fixed item pushed the fixed items after it into positions of another schema. Copy shows on the last fixed item and on the additional items after it.

A fixed item before the last whose only button was Copy now has none, so its `hasToolbar` is false and templates drop its toolbar, which changes its layout. Core's template leaves out the `rjsf-array-item-toolbox` element, and `@rjsf/bootstrap3`'s widens its content from `col-xs-9 col-md-10 col-xl-11` to `col-xs-12`, so its inputs no longer line up with those of the items that keep buttons.

Under `itemLabel`, items are named only when they have buttons, so the numbers that tell items of one name apart no longer count such an item. In a tuple of two fixed items with an additional one, all three named `x`, the Copy buttons were `Copy x (1)`, `Copy x (2)` and `Copy x (3)`. They are now `Copy x (1)` on the last fixed item and `Copy x (2)` on the additional one, whose Remove button is `Remove x (2)` too.

Find a fixed item's Copy button on the item that still shows it, by its new number:

```diff
-await user.click(screen.getByRole('button', { name: 'Copy x (3)' }));
+await user.click(screen.getByRole('button', { name: 'Copy x (2)' }));
```

## Verify

- Snapshots and styles match the items' new toolbars.
