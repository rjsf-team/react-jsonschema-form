---
title: daisyUI's date pickers open from a combobox button into one popup element
description: "`@rjsf/daisyui`'s date triggers were a `div role='button'` and the popups had varying wrappers. Triggers are now `combobox` buttons and the popup is one `.date-picker-popup` dialog, so update queries, snapshots and overflow-hidden ancestors."
packages: ['@rjsf/daisyui']
uses: [markup]
schema: [dates]
affects: [experience, appearance]
related: [daisyui-date-widgets-commit-the-field-format, daisyui-field-label-and-widget-markup-changed, translate-string-table-needs-new-keys]
---

## Detect

- In your tests, a query for a daisyUI `DateWidget` or `DateTimeWidget` trigger by the `button` role, or by `[role="button"]` and `tabindex`.
- A query for the popup by the `presentation` role, or for a `dialog` inside it.
- CSS that styles the trigger `div` or the popup's position, size, margin, padding, overflow or `z-index`.
- A date widget rendered inside an ancestor with `overflow: hidden`, such as a card or a collapse.

## Change

The trigger:

- Both date widgets open their picker from a `<button type='button'>` where they used a `<div role='button' tabindex='0'>`, so the field's label reaches the control it names through its own `htmlFor`, whichever `FieldTemplate` rendered it.
- The button has the `combobox` role, as `SelectWidget`'s trigger does, so it holds the date it displays as its value and is `aria-invalid` while its errors show. A query for either trigger by the `button` role should use `combobox`.
- The triggers show `ui:placeholder` instead of `schema.title`. A field with no value, no `ui:placeholder` and no title shows the translated `AriaDateLabel` string, "Select a date", where the button rendered empty.
- Both triggers set `aria-describedby`, so the description, errors and help around them are announced with the control.

Behaviour:

- Both date widgets honor `ui:disabled` and `ui:readonly`, which neither read before. The picker used to open from a disabled field and commit a new value over it.
- A second press on the trigger, or on the label pointing at it, closes the picker and commits, where it closed and reopened in one gesture.
- Escape discards the date it was closed on, where the calendar kept it and the next close committed it. Escape also restores the month the stored value names.
- The Done button and `DateTimeWidget`'s time input label go through `translateString` as `TranslatableString.DoneLabel` ("Done") and `TranslatableString.TimeLabel` ("Time"), where they were hard-coded English ([#5482](https://github.com/rjsf-team/react-jsonschema-form/pull/5482)). A table that maps every key needs them; see [A translateString that maps every key needs the new TranslatableString keys](./translate-string-table-needs-new-keys.md).

The popup:

- Both widgets' popup is one element with the `date-picker-popup` class, and that element is the `dialog` the trigger controls. `DateWidget`'s was a `role='presentation'` wrapper, and `DateTimeWidget`'s had no class.
- Where the browser has native popovers it is a manual popover in the top layer, fixed below or above its trigger. Elsewhere it is `position: absolute` just below the trigger at `z-index: 100`, as `DateTimeWidget`'s was.
- Its position, size, margin, padding, overflow, overscroll behavior and text color, and that `z-index`, are inline styles, so a stylesheet changing any of them on `.date-picker-popup` needs `!important` ([#5633](https://github.com/rjsf-team/react-jsonschema-form/pull/5633)).

Update queries:

```diff
-screen.getByRole('button', { name: 'When' });
-screen.getByRole('presentation');
+screen.getByRole('combobox', { name: 'When' });
+screen.getByRole('dialog');
```

## Verify

- Both triggers are found by the `combobox` role and the field's label.
- The calendar shows in full inside cards and collapses in the browsers you support.
- A disabled or read-only date field does not open its picker.

## If you can't preserve it

For `DateWidget` in Safari before 17 and Chrome before 114, an ancestor with `overflow: hidden` that doesn't scroll now cuts off the calendar and its Done button. The old `fixed` popup at `z-index: 99999` escaped it. Give that ancestor `overflow: visible`, or override `.date-picker-popup`'s `position` and `z-index` with `!important`.
