---
title: MUI widgets ignore disabled, value and event handlers set in ui:options.mui
description: "`disabled`, `onChange`, `onBlur`, `onFocus`, `value` and `checked` in `ui:options.mui` could replace what the form sets on MUI's controls. They are now ignored there; use `ui:disabled`, `ui:readonly`, the `Form`'s handlers and `initialFormData`."
packages: ['@rjsf/mui']
uses: [ui-schema]
schema: []
affects: [code, data]
related: [shadcn-range-ignores-form-controlled-props, mantine-ignores-form-controlled-ui-options]
---

## Detect

- In your `uiSchema`, `disabled`, `onChange`, `onBlur`, `onFocus`, `value` or `checked` anywhere inside `ui:options.mui` or `ui:globalOptions.mui` for `@rjsf/mui`, including inside `slotProps` and `rjsfSlotProps`.
- An `inputProps` inside the `input` slot.
- An `open`, `defaultOpen`, `MenuProps.open` or `tabIndex` given to a `SelectWidget` that can be disabled or read-only.

## Change

These keys replaced what the form sets on MUI's controls. An `onChange` was called in place of the form's, so editing the field never changed the form's data, and a `disabled: false` let a user edit a disabled or read-only field.

`disabled`, `onChange`, `onBlur` and `onFocus` are now ignored where MUI uses them in place of the form's:

- A field drawn by `BaseInputTemplate`, such as a text, number or date input: the top level of `ui:options.mui`, and `slotProps.input`.
- `SelectWidget`: the top level, `rjsfSlotProps.select` and `rjsfSlotProps.input`. Also an `input` element in `rjsfSlotProps.select`, which is ignored whole as it would replace the input the field draws, and the `SelectDisplayProps` inside `rjsfSlotProps.select`, `rjsfSlotProps.htmlInput` and the `inputProps` and `slotProps.input` of `rjsfSlotProps.select` and `rjsfSlotProps.input`, which also keeps the field's id on the combobox.
- `CheckboxWidget`: `rjsfSlotProps.checkbox`.
- `RangeWidget`: the top level and `rjsfSlotProps.slider`, and the `onBlur` and `onFocus` of `rjsfSlotProps.slider.slotProps.root`.

Only `disabled` is ignored where MUI calls an `onChange`, `onBlur` or `onFocus` beside the form's, so those handlers keep working:

- `BaseInputTemplate`: `slotProps.root`, `slotProps.htmlInput`, and the `inputProps` and `slotProps.input` inside `slotProps.input`.
- `SelectWidget`: `rjsfSlotProps.root`, `rjsfSlotProps.htmlInput`, and the `inputProps` and `slotProps.input` inside `rjsfSlotProps.select` and `rjsfSlotProps.input`.
- `CheckboxWidget`: the top level and `rjsfSlotProps.formControlLabel`, which go on the `<label>`, so its `onBlur` and `onFocus` run as focus moves through the box (MUI already ignored an `onChange` there), and `rjsfSlotProps.checkbox.slotProps.input`.
- `CheckboxesWidget`: `rjsfSlotProps.formControlLabel`, as on `CheckboxWidget`, and `rjsfSlotProps.checkbox.slotProps.input`.
- `RadioWidget`: `rjsfSlotProps.radio.slotProps.input`.
- `RangeWidget`: `rjsfSlotProps.slider.slotProps.input`.

A `value` or `checked` that would replace the form's data, which left the field showing a value the form didn't hold, is ignored in these places:

- `BaseInputTemplate`: a `value` at the top level, in `slotProps.input` and `slotProps.htmlInput`, and in the `inputProps` and `slotProps.input` inside `slotProps.input`.
- `SelectWidget`: a `value` at the top level, in `rjsfSlotProps.select`, `rjsfSlotProps.input` and `rjsfSlotProps.htmlInput`, and in the `inputProps` and `slotProps.input` of `rjsfSlotProps.select` and `rjsfSlotProps.input`.
- `CheckboxWidget`: a `checked` in `rjsfSlotProps.checkbox` and `rjsfSlotProps.checkbox.slotProps.input`.
- `CheckboxesWidget`: a `checked` or `value` in `rjsfSlotProps.checkbox.slotProps.input`.
- `RadioWidget`: a `checked` or `value` in `rjsfSlotProps.radio` and `rjsfSlotProps.radio.slotProps.input`, and a `checked` in `rjsfSlotProps.formControlLabel`.
- `RangeWidget`: a `value` in `rjsfSlotProps.slider.slotProps.input`.

A disabled or read-only `SelectWidget` also ignores an `open` or `defaultOpen` in `rjsfSlotProps.select`, `rjsfSlotProps.htmlInput` or the `inputProps` or `slotProps.input` of either slot, and an `open` in their `MenuProps`, since MUI lets a user pick an option from a menu held open. It ignores a `tabIndex` there, or in a `SelectDisplayProps` inside them, too, since MUI lets a user open a focused select's menu from the keyboard even while disabled.

An `inputProps` inside the `input` slot still replaces the whole `htmlInput` slot, as MUI does, so the `<input>` loses the attributes the field gives it there, such as `aria-describedby`, `required`, `min` and `max`. Give the `<input>`'s props through `htmlInput` instead.

- For `disabled`, use `ui:disabled` or `ui:readonly`.
- For `onChange`, `onBlur` and `onFocus`, use the `Form`'s props of the same name.
- For `value` and `checked`, give the field's value through the `Form`'s `initialFormData`.

```diff
 const uiSchema = {
   pet: {
-    'ui:options': { mui: { disabled: true, onChange: logChange } },
+    'ui:disabled': true,
   },
 };
+
+<Form schema={schema} uiSchema={uiSchema} validator={validator} onChange={logChange} />;
```

## Verify

- Editing each field you changed updates the form's data, and your `Form` handlers see the edit.
- Disabled and read-only fields can't be edited or, for a select, opened.
