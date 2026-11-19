---
title: An option selector stays a select under a text, updown or range ui:widget its options inherit
description: A `text`, `updown` or `range` `ui:widget` on a field with `anyOf`/`oneOf` options used to render on the option selector too, and the selector now stays a select. Give every option a `uiSchema` entry to keep the widget on the selector.
packages: ['@rjsf/core']
uses: [ui-schema]
schema: [any-of-one-of]
affects: [appearance, experience]
related: []
---

## Detect

- Your uiSchema sets `ui:widget` to `text`, `updown` or `range` (or `TextWidget`, `UpDownWidget` or `RangeWidget`) on a field with non-constant `anyOf`/`oneOf` options.
- At least one option has no `uiSchema` entry of its own.
- On the rendered page or in tests, the option selector is now a select where it used to be that widget editing the option's index as a number.

## Change

The selector now stays a select, and the widget renders only on an option that inherits it. To keep such a widget on the selector, give every option a `uiSchema` entry so none of them inherits it:

```diff
 const uiSchema = {
   'ui:widget': 'range',
+  anyOf: [{}, {}],
 };
```

See [Multiple types](../../json-schema/single.md#multiple-types) for details.

## Verify

- The selector renders the widget you expect, and each option renders its own control.
- Any other widget, such as `radio`, stays on the selector as before.
