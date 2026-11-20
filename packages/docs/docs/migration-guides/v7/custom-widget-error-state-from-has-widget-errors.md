---
title: 'A custom widget or theme takes its error state from hasWidgetErrors'
description: 'Built-in widgets no longer style themselves invalid just because `rawErrors` is non-empty. Derive a custom widget error state from `hasWidgetErrors(props)` and draw messages from `getErrorsToDraw()`.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-widgets, custom-theme]
schema: []
affects: [code, appearance]
related: [ui-hide-error-suppresses-theme-error-styling, custom-templates-take-error-state-from-has-errors, display-label-raw-errors-hide-label-deprecated]
---

## Detect

- In your custom widget or theme: an error state computed from `rawErrors.length`.
- On the rendered page: your widget shows a red outline under `ui:hideError`.

## Change

`rawErrors` still holds every error while they are hidden. Derive the error state from the field's plan instead. [`hasWidgetErrors()`](../../api-reference/utility-functions.md#haswidgeterrors) reads the `aria-invalid` the plan gives the widget's control, with `ui:hideError` applied, and falls back to `rawErrors` with `hideError` only for a widget rendered without a plan:

```diff
-const hasError = rawErrors.length > 0;
+const hasError = hasWidgetErrors(props);
```

A widget that draws its own messages reads them from [`getErrorsToDraw()`](../../api-reference/utility-functions.md#geterrorstodraw). The deprecated members are in [displayLabel, rawErrors, hideLabel and getDisplayLabel are deprecated](./display-label-raw-errors-hide-label-deprecated.md).

Because `hasWidgetErrors()` follows the plan's `aria-invalid`, an `anyOf`/`oneOf` option's control is styled invalid while the field above it draws the errors.

## Verify

- Your widget is styled invalid when its field shows errors, and plain under `ui:hideError`.
