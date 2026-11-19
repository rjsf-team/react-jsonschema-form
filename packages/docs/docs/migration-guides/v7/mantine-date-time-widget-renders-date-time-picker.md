---
title: Mantine's DateTimeWidget renders Mantine's DateTimePicker
description: "`@rjsf/mantine`'s `DateTimeWidget` rendered a typeable `DateInput` with no time control, and now renders a `DateTimePicker` button that opens a calendar and a time picker. Drop `DateInput`'s options and make tests pick the date and time."
packages: ['@rjsf/mantine']
uses: [form, ui-schema, markup]
schema: [dates]
kind: runtime
noticed: test
related: [mantine-date-widgets-can-be-cleared, alt-date-parts-named-by-field-label]
---

## Detect

- In your schema, a string field with `format: 'date-time'`, `'datetime'` or `'iso-date-time'` rendered by `@rjsf/mantine`.
- In your `uiSchema`, `ui:options` of `DateInput`'s own: `dateParser`, `fixOnBlur` or `allowDeselect`.
- In your tests, a query for `input#<field id>`, a `textbox` role, the input's value, or a `user.type` or `user.paste` into the field.
- In code that reads a native form submission, the field's value under its `name`.

## Change

The field used to render a `DateInput`, which picked a date but had no time control, so a time could only be typed ([#5402](https://github.com/rjsf-team/react-jsonschema-form/issues/5402)). It now renders Mantine's [`DateTimePicker`](https://mantine.dev/dates/date-time-picker/), a button that opens a calendar and a time picker, as [the widgets reference](../../usage/widgets.md#string-formats) describes. The value it stores is unchanged. `valueFormat` and `displayFormat` keep their meanings, and the seconds segment shows when `valueFormat` has seconds.

The field can no longer be typed or pasted into. The element with the field's `id` is a `<button>` showing the value, where it was an `<input>` holding it. Its `name` is on a hidden input, which a native form submission reads as `YYYY-MM-DD HH:mm:ss`. `DateInput`'s own `ui:options`, `dateParser`, `fixOnBlur` and `allowDeselect`, are ignored. Remove them.

A test that typed or pasted a date-time opens the picker and picks one instead, with the time segments named by the field's label. The calendar opens on the month of the field's value, else the current month. A test of an empty field sets `ui:options.defaultDate` to open it on the month it picks from:

```diff
-await user.click(container.querySelector('input#root_when')!);
-await user.paste('2024-01-15 10:30:00');
+await user.click(container.querySelector('button#root_when')!);
+await user.click(screen.getByRole('button', { name: '15 January 2024' }));
+await user.click(screen.getByRole('spinbutton', { name: 'When, hour' }));
+await user.keyboard('10');
+await user.click(screen.getByRole('spinbutton', { name: 'When, minute' }));
+await user.keyboard('30');
```

A test that read the shown value reads the button's text instead of the input's value. One that found the field by the `textbox` role finds it by `combobox`.

## Verify

- The field opens a calendar and a time picker, and stores the same value as before.
- The browser's own required check no longer blocks a submit, since a button can't be required. The form's validator still reports an empty required field.
- The field's `onBlur` is called once focus leaves the button, its Clear button, its dropdown and its modal. Moving focus between them doesn't call it, so tabbing from the button to the Clear button no longer reports a blur.
- A widget of your own that renders date or time parts can name them the same way with [`dateElementLabel()`](../../api-reference/utility-functions.md#dateelementlabel) and [`dateElementAriaLabel()`](../../api-reference/utility-functions.md#dateelementarialabel), as this widget names its time segments.
