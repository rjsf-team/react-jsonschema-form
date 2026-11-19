---
title: A widget registered under a built-in key such as RadioWidget or RatingWidget takes that key's presentation declaration
description: 'A widget of yours registered as `RadioWidget`, `CheckboxesWidget`, `RatingWidget`, an alt-date key or antd''s `RangeWidget` now takes that key''s label declaration. Spread `getControlAttributes()`, or declare `labelledBy` or `label` under the key.'
packages: ['@rjsf/core', '@rjsf/antd', '@rjsf/chakra-ui', '@rjsf/fluentui-rc', '@rjsf/mantine', '@rjsf/mui']
uses: [custom-widgets]
schema: []
affects: [code, experience, appearance]
related: [label-and-title-ids-move-to-spans, widget-reads-the-presentation-plan]
---

## Detect

- `RadioWidget`, `CheckboxesWidget`, `RatingWidget`, `AltDateWidget` or `AltDateTimeWidget` as a key of the `widgets` you pass to `<Form>` or `withTheme`.
- `RangeWidget` as a key of the `widgets` you pass under `@rjsf/antd`, or a wrapper of antd's `Slider` registered under a key of your own or passed to `ui:widget` as a component.
- On the rendered page, that widget's control has no accessible name, or its field shows two labels or two descriptions.

## Change

`@rjsf/core` declares how the template labels each built-in widget, and a widget of your own registered under the same key takes that declaration with the key. Change the declaration under the key in the [`presentation`](../../api-reference/form-props.md#presentation) prop to match what your widget does.

`RadioWidget`, `CheckboxesWidget`, `RatingWidget`, `AltDateWidget` and `AltDateTimeWidget` are declared so that the template draws their label with no `for` (see [Title and label ids move to a span](./label-and-title-ids-move-to-spans.md)). A widget of your own under one of those keys is named only through the `aria-labelledby` it spreads from [`getControlAttributes()`](../../api-reference/utility-functions.md#getcontrolattributes) or [`getGroupAttributes()`](../../api-reference/utility-functions.md#getgroupattributes).

- One that renders a single control under its `id` and spreads neither is declared `labelledBy: 'for'` under its key, to keep the label's `for`:

  ```tsx
  <Form widgets={{ CheckboxesWidget: MyCheckboxes }} presentation={{ widgets: { CheckboxesWidget: { labelledBy: 'for' } } }} />
  ```

- One that draws its own label, such as a date picker registered as `AltDateWidget`, is declared `label: 'self'` under its key, so the template draws no second label:

  ```tsx
  <Form widgets={{ AltDateWidget: MyDatePicker }} presentation={{ widgets: { AltDateWidget: { label: 'self' } } }} />
  ```

Some themes add declarations of their own:

- `@rjsf/antd` declares its `RangeWidget` `labelledBy: 'aria-labelledby'`, since a `for` reaches only the slider's root and not its handle, so a widget of your own registered as `RangeWidget` under antd takes that declaration too. A wrapper of antd's slider registered under a key of your own, or the slider itself registered under one while `RangeWidget` holds another widget, takes no declaration, so declare that key `labelledBy: 'aria-labelledby'` for its handle to be named. One passed to `ui:widget` as a component has no key to declare, so register it under one.

  ```tsx
  <Form widgets={{ MySlider }} presentation={{ widgets: { MySlider: { labelledBy: 'aria-labelledby' } } }} />
  ```

- `@rjsf/mantine` declares `@rjsf/core`'s `RatingWidget` `label: 'template'` and `description: 'template'`, since it draws neither. A widget of your own registered as `RatingWidget` that draws its own label is declared `label: 'self'` under that key, and one that draws its own description `description: 'self'`.
- `@rjsf/chakra-ui`, `@rjsf/fluentui-rc` and `@rjsf/mui` declare `RatingWidget`, `AltDateWidget` and `AltDateTimeWidget` `label: 'template'`, since none of them draws a label. A widget of your own registered under one of those keys that draws its own label, such as a MUI `Rating` registered as `RatingWidget` or a date picker registered as `AltDateWidget`, is declared `label: 'self'` under its key.

  ```tsx
  <Form widgets={{ RatingWidget: MyRating }} presentation={{ widgets: { RatingWidget: { label: 'self', description: 'self' } } }} />
  ```

Without the declaration such a widget shows its label or description twice. Where it draws its label only while `widgetDrawsLabel()` is true and spreads no `aria-labelledby` from `getControlAttributes()` or `getGroupAttributes()`, its control is left with no name.

## Verify

- Your widget's control has one accessible name, from the field's label, such as `getByRole('slider', { name: 'Volume' })` finding antd's slider handle.
- The field shows one label and one description.
