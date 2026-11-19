---
title: An object or array field that renders as a select shows its label
description: An `object` or `array` field with an `enum` or `anyOf`/`oneOf` of constants used to hide its label; it renders as one select and now shows the label. Update tests and snapshots that cover it.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [markup]
schema: [enums, arrays]
affects: [appearance]
related: [typeless-constant-options-render-a-select]
---

## Detect

- In your schema, an `object` or `array` field whose `enum` or `anyOf`/`oneOf` is a non-empty list of constants.
- In your snapshots or tests, such a field gains a label. In your code, `getDisplayLabel()` now returns `true` for it.

## Change

The field renders as one select for the whole value, so `getDisplayLabel()` treats it as one field with a label. Update the snapshots and tests. To hide the label, set `ui:label: false` in its `uiSchema`.

## Verify

- The select shows the field's title as its label.
