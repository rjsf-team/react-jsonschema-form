---
title: Mantine's AltDateWidget renders its date parts through SelectWidget
description: "Each date part of `@rjsf/mantine`'s `AltDateWidget` and `AltDateTimeWidget` used to be a Mantine `Select` and now renders through the registry's `SelectWidget`. Make a replacement `SelectWidget` name the parts and drop Mantine's options before spreading them."
packages: ['@rjsf/mantine']
uses: [custom-widgets]
schema: [dates]
kind: runtime
noticed: review
related: [mantine-alt-date-parts-submit-the-option-index, mantine-alt-date-parts-show-two-digits, alt-date-parts-named-by-field-label, custom-select-widget-applies-aria-props]
---

## Detect

- In your code: a `SelectWidget` passed through `widgets=` to a `@rjsf/mantine` form that also renders a `format: date` or `date-time` field with `AltDateWidget` or `AltDateTimeWidget`.
- On the rendered page: the date parts take the look of your `SelectWidget` instead of Mantine's `Select`.
- In the console: React warns about unknown props such as `searchable` or `wrapperProps` on a DOM element.

## Change

Each date part now renders through `DateElement` and the registry's `SelectWidget`, as in the other themes ([#5503](https://github.com/rjsf-team/react-jsonschema-form/issues/5503)). A replacement `SelectWidget` renders the date parts too, so it must name and describe them as [date parts are named by the field's label](./alt-date-parts-named-by-field-label.md) and [a custom SelectWidget applies the aria props](./custom-select-widget-applies-aria-props.md) describe.

Each part is handed the options of Mantine's `Select` (`searchable`, `allowDeselect`, `size`, `success`, `inputContainer` and `wrapperProps`) beside its `enumOptions`. A `SelectWidget` that spreads its options onto an element should leave those out:

```diff
 function MySelectWidget({ options, ...props }: WidgetProps) {
-  const { enumOptions, ...rest } = options;
+  const { enumOptions, searchable, allowDeselect, size, success, inputContainer, wrapperProps, ...rest } = options;
   return <select {...rest}>{/* render enumOptions */}</select>;
 }
```

## Verify

- Each date part has an accessible name and React logs no unknown-prop warning.
- The hidden input of each part now submits an option index, see [Mantine's date parts submit the index of the picked option](./mantine-alt-date-parts-submit-the-option-index.md).
- The parts show two digits and are no longer required, see [Mantine's date parts show two digits](./mantine-alt-date-parts-show-two-digits.md).
