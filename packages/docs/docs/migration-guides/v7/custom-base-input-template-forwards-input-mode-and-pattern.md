---
title: 'A BaseInputTemplate of your own must pass inputMode and pattern to the input'
description: '`InputPropsType` gained `inputMode` and `pattern`, which turn a numeric field into a text input with a numeric keyboard. A `BaseInputTemplate` that hands its input props to a component that drops unknown props must pass them explicitly.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-templates, custom-theme]
schema: [numbers]
kind: runtime
noticed: review
related: [number-fields-render-text-input, number-input-title-tooltip-and-name]
---

## Detect

- In your code: a `BaseInputTemplate` of your own that hands the result of `getBaseInputProps()` or `getInputProps()` to a component, such as a design-system input, that doesn't forward unknown props to the native `<input>`.
- On the rendered page: a `number`/`integer` field renders as a plain text input with no `inputmode` or `pattern`, and no numeric keyboard on mobile.

## Change

`InputPropsType` has new optional `inputMode` and `pattern` members. A template that spreads the input props onto an `<input>` passes them on already. One that hands them to a component pulls them out and passes them where that component reaches the native input, as `@rjsf/mui` does through `slotProps.htmlInput`:

```diff
-const { step, min, max } = getBaseInputProps(props);
-<DesignInput step={step} min={min} max={max} />
+const { step, min, max, inputMode, pattern } = getBaseInputProps(props);
+<DesignInput step={step} min={min} max={max} inputProps={{ inputMode, pattern }} />
```

`DesignInput` and its `inputProps` stand in for your component's own way of reaching the native input.

## Verify

- A numeric field in your template renders an `<input>` with `inputmode` and `pattern`, and a non-numeric value is refused on submit.
