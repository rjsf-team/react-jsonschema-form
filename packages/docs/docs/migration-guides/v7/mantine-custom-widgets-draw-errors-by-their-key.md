---
title: A Mantine widget or template of your own draws errors as its registry key declares
description: "`@rjsf/mantine` used to render a hidden copy of every field's errors. A custom widget, `BaseInputTemplate` or `ObjectFieldTemplate` now shows errors only if it renders `presentation.errors.messages` where its key declares it draws them."
packages: ['@rjsf/mantine']
uses: [custom-widgets, custom-templates]
schema: []
affects: [code, experience]
related: [mantine-markup-uses-rjsf-ids, unregistered-widget-component-takes-theme-default-label, widget-reads-the-presentation-plan]
---

## Detect

- In your code, `widgets={{ ... }}` on a Mantine `Form` or `withTheme()` call, or a component passed to `ui:widget`.
- `BaseInputTemplate`, `FieldErrorTemplate` or `ObjectFieldTemplate` in the `templates` given to a Mantine `Form`.
- In your `uiSchema`, an `inputWrapperOrder` that leaves out `'error'`.
- On the rendered page, a custom widget's errors are missing or shown twice.

## Change

`FieldErrorTemplate` used to render a hidden copy of every field's errors. It now shows only the errors no widget shows ([#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490)), so who draws an error depends on the [plan](./widget-reads-the-presentation-plan.md):

- A widget of your own takes the declaration of the key it is registered under. Under one of the theme's widget keys, such as `TextWidget`, it is declared to draw its own errors, so it should render `presentation.errors.messages`, or its errors aren't shown. Under any other key, or given directly as `ui:widget`, its errors are shown by `FieldErrorTemplate`.
- One registered as `RangeWidget`, `AltDateWidget` or `AltDateTimeWidget` is also declared `labelledBy: 'aria-labelledby'`, so a label the template draws for it has no `for`. It is named only through the `aria-labelledby` it spreads from [`getControlAttributes()`](../../api-reference/utility-functions.md#getcontrolattributes).
- A `BaseInputTemplate` of your own draws the errors of `@rjsf/core`'s `TextWidget`, `EmailWidget`, `URLWidget` and `UpDownWidget`, which the theme declares `errors: 'self'` because its own `BaseInputTemplate` draws them. It should render `presentation.errors.messages` as well, or they aren't shown.
- A custom `ObjectFieldTemplate` renders the object's own errors only if it reads `presentation.errors.messages` itself.
- A widget whose `inputWrapperOrder` leaves out `'error'` shows its errors through `FieldErrorTemplate` instead. A custom `FieldErrorTemplate` renders only errors Mantine's own element doesn't, and can give its element the field's `errorId(id)`, as `@rjsf/core`'s does.

A component given to `ui:widget` that no key registers follows the theme's default plan; see [A widget component given to ui:widget without a registry key gets the theme's default label plan](./unregistered-widget-component-takes-theme-default-label.md).

## Verify

Trigger a validation error on each field your custom widget or template draws: the error shows once, and the input is described by it.
