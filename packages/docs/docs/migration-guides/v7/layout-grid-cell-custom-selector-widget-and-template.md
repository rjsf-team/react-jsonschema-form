---
title: 'A custom selector widget or template in a discriminated grid cell loses ui:classNames and display-label cues'
description: 'A discriminated grid cell now renders through `SchemaField`, so its selector widget no longer gets `ui:classNames`, `ui:style`, `ui:field` or `ui:fieldReplacesAnyOrOneOf`. Read your own `ui:options` key, and use `templateDrawsLabel()` for the label.'
packages: ['@rjsf/core']
uses: [custom-widgets, custom-templates]
schema: [any-of-one-of]
affects: [code]
related: [layout-grid-discriminated-cell-renders-a-field-wrapper]
---

## Detect

- In a custom selector widget used in a discriminated layout grid cell: reads of `options.classNames`, `options.style` or `getUiOptions(props.uiSchema)`.
- In a custom template for such a cell: a call to the deprecated `getDisplayLabel()`.
- On the rendered page: the selector loses the class or style you set on the cell, or a typeless cell draws no label and a `RadioWidget` selector's `aria-labelledby` names nothing.

## Change

`ui:classNames` and `ui:style` on the cell are applied by the `FieldTemplate` wrapper and kept out of both the options and the `uiSchema` handed to the selector widget, the way `SchemaField` has always kept them from its children (see [#439](https://github.com/rjsf-team/react-jsonschema-form/issues/439)). If the widget should carry them, read them from `ui:options` under a name of your own:

```diff
 const uiSchema = {
-  shape: { 'ui:classNames': 'shape-picker' },
+  shape: { 'ui:options': { pickerClassName: 'shape-picker' } },
 };
-const className = options.classNames;
+const className = options.pickerClassName as string | undefined;
```

The grid sets `ui:field` and `ui:fieldReplacesAnyOrOneOf` on the cell. The field keeps both out of the `uiSchema` it hands the selector widget, so `getUiOptions(props.uiSchema)` there doesn't see them. The cell's `FieldTemplate`, `DescriptionFieldTemplate`, `FieldHelpTemplate` and `FieldErrorTemplate` still do.

A template that decides whether to draw the label with `getDisplayLabel()` draws none for a cell with no `type`, since that turns the label off for any `uiSchema` with a `ui:field`. Read `presentation.label.by`, or call `templateDrawsLabel()`, instead.

## Verify

- The selector carries the class you set under your own key, and the cell's label is drawn and named by a `RadioWidget` selector's `aria-labelledby`.
