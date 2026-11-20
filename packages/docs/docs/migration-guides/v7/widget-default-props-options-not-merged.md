---
title: A widget component's defaultProps.options no longer reach its options
description: "A widget no longer gets its component's `defaultProps.options` merged into the `options` it renders with. Apply the defaults inside the widget instead, for example with destructuring defaults."
packages: ['@rjsf/core']
uses: [custom-widgets]
schema: []
affects: [code]
related: [widget-type-is-a-slot-component]
---

## Detect

- Your custom widget sets `defaultProps` with an `options` entry, usually on a `forwardRef` or `memo` component.

## Change

A widget no longer gets its component's (deprecated) `defaultProps.options` merged into the `options` it renders with. React 19 removed `defaultProps` support for function components, so this merging was already broken for function widgets there and only ever worked for `forwardRef`/`memo`-wrapped ones.

Apply the defaults inside the widget itself, such as with destructuring defaults:

```diff
 const ColorWidget = forwardRef<HTMLInputElement, WidgetProps>(function ColorWidget({ options, ...props }, ref) {
-  const { color } = options;
+  const { color = 'red' } = options;
   // ...
 });
-ColorWidget.defaultProps = { options: { color: 'red' } };
```

See [Custom widget options](../../advanced-customization/custom-widgets-fields.md#custom-widget-options).

## Verify

- A widget rendered without that option set in the uiSchema still uses your default.
