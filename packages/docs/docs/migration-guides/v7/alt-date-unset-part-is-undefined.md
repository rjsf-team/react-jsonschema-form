---
title: An unset AltDateWidget date part is undefined in every theme
description: An unpicked `AltDateWidget` part reached `SelectWidget`, `onFocus` and `onBlur` as `-1`, or `''` in chakra-ui. It is now `undefined` in every theme, so test for `undefined` in your select, date widget and handlers.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-widgets, form-props]
schema: [dates]
affects: [code]
related: [use-alt-date-widget-props-returns-buttons-disabled, custom-select-widget-applies-aria-props]
---

## Detect

- In your code, a replacement `SelectWidget`, a custom `AltDateWidget` that renders its own controls from `useAltDateWidgetProps()`'s `elements`, or an `onFocus`/`onBlur` handler that tells an unset date part by `''` or `-1`.

## Change

`useAltDateWidgetProps()`'s `elements` give a part nobody has picked yet an `undefined` `value`, where the `DateObject` behind them holds `-1`, and `DateElement` hands the `SelectWidget` `undefined` for a `-1` it is given ([#5378](https://github.com/rjsf-team/react-jsonschema-form/issues/5378)).

Every theme's parts now report it to `onFocus` and `onBlur` as `undefined`, as `@rjsf/core`'s, `@rjsf/react-bootstrap`'s and `@rjsf/mantine`'s already did. `@rjsf/chakra-ui`'s reported `''` and the other themes' `-1`.

```diff
-if (value === -1 || value === '') {
+if (value === undefined) {
```

## Verify

Focusing and leaving an unpicked part reports `undefined`, and your widget shows it as unset.
