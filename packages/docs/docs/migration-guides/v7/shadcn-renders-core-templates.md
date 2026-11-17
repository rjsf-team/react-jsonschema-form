---
title: The shadcn theme renders core's templates with its classes
description: "@rjsf/shadcn now renders core's plain-HTML templates through a `classMap`, so fields, objects, arrays and errors use core's markup in place of nested `div`s. Point CSS, tests and snapshots at core's markers and restyle through a `classMap` prop."
packages: ['@rjsf/shadcn']
uses: [markup]
schema: []
kind: markup
noticed: test
related: [themes-from-generators-need-generate-class-map, theme-copies-of-core-templates-removed]
---

## Detect

- CSS, tests or snapshots that reach a field, object, array, description, error or additional property rendered by `@rjsf/shadcn` through its old `div` structure.
- Selectors for a field's errors as a `div` of `span`s, or for a `hidden` class on a hidden field.
- Snapshot tests of a shadcn form, which fail on the new markup.

## Change

`@rjsf/shadcn` declares a `classMap` and renders `@rjsf/core`'s `FieldTemplate`, `DescriptionField` (core's `DescriptionFieldTemplate`), `FieldErrorTemplate`, `FieldHelpTemplate`, `MultiSchemaFieldTemplate`, `ArrayFieldTemplate`, `ArrayFieldItemTemplate` and `ObjectFieldTemplate` with Tailwind classes, in place of its own copies. It styles core's `AltDateWidget`, which it falls back to, through the same class map: its parts sit in one wrapping row, with Now and Clear as outline buttons. Its widgets and the templates built on its `components/ui` primitives (`BaseInputTemplate`, the buttons, `ErrorList`, `CyclicSchemaExpandTemplate`, `OptionalDataControlsTemplate`, `TitleField`) stay, and so do `WrapIfAdditionalTemplate` and `GridTemplate`.

Point CSS and tests that used the old `div` structure at core's markers, such as `rjsf-array-item-list`, `rjsf-array-item-toolbox` and `rjsf-error-detail`. To restyle one of the elements, pass a `classMap` to the `Form`, as the [custom themes](../../advanced-customization/custom-themes.md#class-map) page describes. Then update your snapshots.

## Verify

- An object or an array renders in a `<fieldset>`, and an array's items in core's `rjsf-array-item-list`. Each item is a grid with its buttons in an `rjsf-array-item-toolbox` beside the field. The buttons are top-aligned and sit level with the field's input, past its label and description however far they wrap or however a `classMap` restyles `fieldLabel` or `fieldDescription`, as core's `rjsf.css` lays them out. A custom `FieldTemplate` keeps that by [keeping core's classes](../../usage/themes.md#lining-up-a-custom-fieldtemplate).
- `TitleField` draws an object's or array's title in a `<legend>`, which names its `<fieldset>`, followed by the separator. It used to be a `div` holding both.
- A field's description is drawn above its widget, as core draws it. It used to be below. `CheckboxWidget` rendered without a plan draws no description of its own where `ui:widget` is the `checkbox` alias, since core's `FieldTemplate` draws it there, as `@rjsf/core`'s checkbox does.
- A field's errors are core's `<ul class="rjsf-error-detail">` of `<li>` items.
- A field's label, description and help turn destructive through a `data-invalid:text-destructive` variant beside their class, on the `data-invalid` attribute core sets while the field shows its own errors.
- A hidden field uses the `hidden` attribute instead of a `hidden` class.
- `AddButton` renders its button with no row around it. The `arrayFieldset` and `objectFieldset` class-map entries align it to the end of the array or object, so one placed in a custom template carries no margin of its own.
- `WrapIfAdditionalTemplate` lays an extra key's label and input, the value and the remove button out on shared grid rows instead of pixel offsets. The key input and the remove button sit level with the value's input however far its label or description wraps and whatever errors or help follow it, as under `@rjsf/core` (see [Lining up a custom `FieldTemplate`](../../usage/themes.md#lining-up-a-custom-fieldtemplate)).
