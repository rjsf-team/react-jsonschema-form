---
title: A custom widget reads its label, description and required marker from the plan
description: '`hideLabel` now only says the template or a field above draws the widget''s label, and the `*` a widget draws follows the plan. Use `getWidgetDescription()`, `widgetDrawsLabel()` and `templateMarksRequired()` instead.'
packages: ['@rjsf/core']
uses: [custom-widgets]
schema: []
kind: runtime
noticed: review
related:
  [
    display-label-raw-errors-hide-label-deprecated,
    widget-under-built-in-key-takes-its-declaration,
    any-of-one-of-field-labelled-once-by-its-template,
  ]
---

## Detect

- `hideLabel` read in a custom widget in your code to decide whether to draw its own label or description.
- A custom widget for `@rjsf/mui`, `@rjsf/chakra-ui`, `@rjsf/fluentui-rc` or `@rjsf/mantine` that passes `required={required}` to a component that draws its label, such as a MUI `TextField`, a Chakra `Field.Root`, a Fluent `Field` or a Mantine input.
- A custom `SelectWidget` in your code that reads `aria-describedby` from its props, used by `AltDateWidget`'s date parts.
- On the rendered page, a widget's description or label shows twice or not at all, or a required `anyOf`/`oneOf` field shows a second `*` beneath its option selector.

## Change

Each widget is now handed its field's `presentation` plan; see [displayLabel, rawErrors, hideLabel and getDisplayLabel are deprecated for the field plan](./display-label-raw-errors-hide-label-deprecated.md).

`hideLabel` tells a widget that the template, or a field above rendering the same id, draws its label. It no longer says whether the widget draws a description. A widget that keyed its own description on `hideLabel` takes it from [`getWidgetDescription()`](../../api-reference/utility-functions.md#getwidgetdescription), which returns the `text` and `id` to draw, or `undefined` where the widget draws none. One that draws its own label asks [`widgetDrawsLabel()`](../../api-reference/utility-functions.md#widgetdrawslabel), which falls back to `hideLabel` only for a widget rendered without a plan.

```diff
+ const widgetDescription = getWidgetDescription(props);
- {!hideLabel && <label htmlFor={id}>{label}</label>}
- {!hideLabel && schema.description && <p>{schema.description}</p>}
+ {widgetDrawsLabel(props) && <label htmlFor={id}>{label}</label>}
+ {widgetDescription && <p id={widgetDescription.id}>{widgetDescription.text}</p>}
```

A required `anyOf`/`oneOf` field shows one `*`, on the field's own label ([#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573)). In `@rjsf/mui`, `@rjsf/chakra-ui`, `@rjsf/fluentui-rc` and `@rjsf/mantine`, a custom widget that hands `required` to a component drawing its label marks that label from [`templateMarksRequired()`](../../api-reference/utility-functions.md#templatemarksrequired). Otherwise it shows a second `*` beneath the selector, and none when it is the selector drawing the field's label.

```diff
- <TextField label={label} required={required} />
+ <TextField label={label} required={templateMarksRequired(props)} />
```

A `SelectWidget` of your own describes an `AltDateWidget`'s parts only by reading its props through [`widgetAriaProps()`](../../api-reference/utility-functions.md#widgetariaprops), since `DateElement` hands it a plan of its own instead of an `aria-describedby`.

```diff
- <select aria-describedby={props['aria-describedby']} …>
+ <select {...widgetAriaProps(props)} …>
```

A widget you register under a built-in key such as `RadioWidget` or `AltDateWidget` also takes that key's declaration; see [A widget registered under a built-in key takes that key's presentation declaration](./widget-under-built-in-key-takes-its-declaration.md).

## Verify

- Each field shows one label and one description, whichever of the template or your widget draws them.
- Under a required `anyOf`/`oneOf` field, your widget's label shows a `*` only where it draws the field's label.
- Every id in an `AltDateWidget` part's `aria-describedby` exists in the page.
