---
title: The daisyUI theme renders core's templates and widgets with its classes
description: "@rjsf/daisyui now renders most of core's templates and widgets through a `classMap`, so its `form-control` wrappers and own marker classes are gone. Point CSS, tests and snapshots at core's `rjsf-*` markers and restyle through a `classMap` prop."
packages: ['@rjsf/daisyui']
uses: [markup]
schema: []
affects: [appearance, experience]
related: [daisyui-custom-buttons-add-btn-class, daisyui-file-widget-ignores-multiple-option, daisyui-checkboxes-need-presentation, themes-from-generators-need-generate-class-map, theme-copies-of-core-templates-removed]
---

## Detect

- CSS, tests or snapshots that select `form-control` around an input rendered by `@rjsf/daisyui`.
- Selectors for the theme's old marker classes: `rjsf-field-error-template`, `rjsf-field-help-template`, `description-field`, `error-list` or `btn-add`.
- Tests that find a field's errors by an `id` on a wrapper, or that look for Font Awesome icons in the add, remove, copy, move or clear buttons.
- Snapshot tests of a daisyUI form, which fail on the new markup.

## Change

`@rjsf/daisyui` used to copy most of `@rjsf/core`'s templates and widgets with daisyUI classes on them, and the copies had drifted: its `TextareaWidget` dropped `placeholder` and `options.emptyValue`, and its `BaseInputTemplate` disabled a read-only input rather than marking it read-only. The theme now declares a `classMap` and renders core's components wherever its own were such copies. It keeps its own `FieldTemplate`, `ObjectFieldTemplate`, `WrapIfAdditionalTemplate`, `ArrayFieldTemplate`, `ArrayFieldItemButtonsTemplate`, `TitleField`, `ArrayFieldTitleTemplate` and `GridTemplate`, and the checkbox, toggle, select, date, time and rating widgets.

The removed components' `form-control` wrappers are gone. daisyUI 5 has no such class, so nothing is styled differently, but a selector that reached an input through one uses core's markers instead: `rjsf-field-description`, `rjsf-field-help`, `rjsf-error-detail`, `rjsf-errors`, `rjsf-checkbox`, `rjsf-radio`, `rjsf-field-range-wrapper`, `rjsf-alt-date-list`.

Rename the old marker classes in your CSS and tests:

```diff
-.rjsf-field-error-template
+.rjsf-error-detail
-.rjsf-field-help-template
+.rjsf-field-help
-.description-field
+.rjsf-field-description
-.error-list
+.rjsf-errors
-.btn-add
+.rjsf-btn-add
```

A field's errors carry its error `id` on the `<ul>` itself, as in `ul#root_x__error`.

To restyle one of these elements, pass a `classMap` to the `Form`. A class replaces the theme's class for that element, and a function of the theme's class extends it, as the [custom themes](../../advanced-customization/custom-themes.md#class-map) page describes. The theme's classes carry spacing too, such as the `mr-2` that `checkboxInput` and `radioInput` put before the option's text, so extend them with a function to keep it.

Then update your snapshots.

## Verify

- The add, remove, copy, move and clear buttons are core's `IconButton`, with inline SVG icons in place of Font Awesome's. A `className` a custom template passes them lands beside the theme's `btn btn-sm`. A custom button that renders its own `<button>` needs the change in [Custom daisyUI buttons that render their own button add the btn class](./daisyui-custom-buttons-add-btn-class.md).
- The error list has an `Errors` heading, as core's does.
- A textarea has the browser's default number of rows unless `ui:options.rows` sets one. It used to be 5.
- The alt-date widget renders its selects in one row with the Now and Clear buttons, with no label above each select. Each select is still named `<field label>, <part>` for assistive technology.
- `ui:enumDisabled` dims a whole checkbox or radio option, not only its text, through `data-disabled:` variants on the `data-disabled` attribute core sets on it.
- An array item is core's `<div class="rjsf-array-item">` instead of a `<fieldset>`. The first item is rounded at the top and the last at the bottom by `first:` and `last:` variants, so a lone item is rounded at both ends. The items no longer stack by a per-index `z-*` class.
