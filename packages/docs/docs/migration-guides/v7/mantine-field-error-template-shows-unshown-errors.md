---
title: Mantine shows the errors its widgets leave out through FieldErrorTemplate
description: '`@rjsf/mantine` now shows errors its widgets don''t draw through `FieldErrorTemplate`, so a custom field handing a widget `rawErrors` without its plan shows them twice. Pass no `rawErrors`, or declare `WIDGET_FIELD_PRESENTATION` and pass the plan.'
packages: ['@rjsf/mantine']
uses: [custom-widgets, custom-fields, markup]
schema: []
affects: [appearance, code]
related:
  [
    custom-field-draws-own-label-and-description,
    widget-under-built-in-key-takes-its-declaration,
    mantine-markup-uses-rjsf-ids,
    mantine-custom-widgets-draw-errors-by-their-key,
  ]
---

## Detect

- Under `@rjsf/mantine`, errors of a custom widget or `ui:field`, of `@rjsf/core`'s `RatingWidget`, or of a widget whose `inputWrapperOrder` leaves out `'error'`, now show beneath the field on the rendered page and in snapshots.
- A custom `ui:field` in your code that renders one of this theme's widgets with `rawErrors` but without `presentation`, whose errors now show twice.

## Change

Errors the theme's widgets don't show are shown by `FieldErrorTemplate`, where they were announced from a hidden copy and never shown. The markup and ids behind this are in [Mantine inputs reference rjsf's error, description and help ids](./mantine-markup-uses-rjsf-ids.md), and how a Mantine widget or template of your own draws errors in [A Mantine widget or template of your own draws errors as its registry key declares](./mantine-custom-widgets-draw-errors-by-their-key.md).

A custom `ui:field` that hands one of this theme's widgets `rawErrors` but not its plan, as `FieldProps.presentation` advises for a field that doesn't declare `WIDGET_FIELD_PRESENTATION`, shows the field's errors twice: the widget, given no plan, draws them, and so does the template. Pass the widget `hideError` or no `rawErrors`:

```diff
- <TextWidget {...widgetProps} rawErrors={rawErrors} />
+ <TextWidget {...widgetProps} />
```

Or declare `WIDGET_FIELD_PRESENTATION` for the field and hand the widget its `presentation`, as [A custom field draws its own label and description](./custom-field-draws-own-label-and-description.md) describes:

```tsx
<Form fields={{ MyField }} presentation={{ fields: { MyField: WIDGET_FIELD_PRESENTATION } }} />
```

A widget of your own registered as `RatingWidget` takes the theme's declaration for that key; see [A widget registered under a built-in key takes that key's presentation declaration](./widget-under-built-in-key-takes-its-declaration.md).

## Verify

Each field's errors show once, beneath it, a rating field's and a custom widget's included.
