---
title: 'Number and integer fields render a text input instead of a native number input'
description: 'A `number`/`integer` field used to render `<input type="number">` with `min`, `max` and `step`; it now renders a text input with `inputMode` and `pattern`. Update selectors and snapshots, or set `ui:options.inputType: number` to keep the native input.'
packages: ['@rjsf/core', '@rjsf/bootstrap3', '@rjsf/chakra-ui', '@rjsf/daisyui', '@rjsf/fluentui-rc', '@rjsf/mui', '@rjsf/react-bootstrap', '@rjsf/shadcn']
uses: [form, markup]
schema: [numbers, type-lists]
kind: runtime
noticed: test
related: [number-pattern-blocks-submit-of-non-numeric-data, number-input-title-tooltip-and-name, number-field-form-data-can-hold-a-string, custom-base-input-template-forwards-input-mode-and-pattern]
---

## Detect

- In your CSS or tests: selectors such as `input[type="number"]` or `getByRole('spinbutton')` aimed at an RJSF `number`/`integer` field, or assertions on its `min`, `max`, `step`, `aria-valuemin` or `aria-valuemax`.
- In your DOM snapshots: `type="number"` replaced by `type="text"` with `inputmode` and `pattern`.
- On the rendered page: a numeric field has no spinner arrows, the scroll wheel no longer changes it, and on an iPhone or iPad its keyboard has no minus key.
- In a screen reader: a `{ "type": "integer", "minimum": 1, "maximum": 10 }` field is announced as a text field, where it was "spin button, 1 to 10".

## Change

A `BaseInputTemplate` that renders a plain native `<input>` now renders a `number`/`integer` field as `<input type="text" inputMode="decimal|numeric" pattern="...">` ([#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038)). That avoids the keystroke filtering, scroll-wheel and locale decimal-separator quirks of a native number input, which vary across browsers. The `pattern` blocks a non-numeric submission as `required` blocks an empty one, and accepts the exponent notation JavaScript renders very small and very large numbers with:

- a `number` accepts either sign of exponent (`1e-7`, `1e+21`);
- an `integer` accepts a trailing separator and zeros (`5.`, `5.00`) and the fractional mantissa of the exponent form (`String(2 ** 70)` is `1.1805916207174113e+21`), takes only a `+` exponent, and refuses a fraction such as `1.5`.

A `type` list counts as a numeric field when exactly one entry isn't `"null"`, so `["number", "null"]` and `["number"]` both get the numeric text input, where they used to get a plain text input carrying `min`/`max`/`step`. A list of more than one non-null type, such as `["number", "string"]`, keeps the plain text input. A schema with no `type` but a numeric `const` counts too.

The text input gets no `step`, `min` or `max`, so the browser no longer range- or step-checks before submit. RJSF's validation still enforces `minimum`, `maximum` and `multipleOf` and reports them as form errors. The input is a `textbox`, and `inputMode` is a keyboard hint that assistive technology doesn't see, so the range is no longer announced. RJSF adds no `role="spinbutton"` or `aria-valuemin`/`aria-valuemax`, since the role promises arrow-key stepping a text input lacks and those attributes aren't valid on a `textbox`. On iOS the numeric keyboards have no minus key, and RJSF doesn't switch `inputMode` by `minimum` because most fields have none and would lose the numeric keyboard.

To keep a native number input for a field, for its spinner, its minus key on iOS or its announced range, set `ui:options.inputType: 'number'` or use the `updown` widget. It still gets `step`, `min` and `max`, plus `step="any"` for a `number` with no `multipleOf` so it accepts decimals (the `updown` widget didn't get that `step` before):

```diff
 const uiSchema = {
-  age: {},
+  age: { 'ui:options': { inputType: 'number' } },
 };
```

To state a range without the native input, put it in `ui:description` or `ui:help`, which the input is linked to through `aria-describedby`. Select inputs in CSS and tests by `inputmode` (`input[inputmode="decimal"]`), by role `textbox`, or by your own field or id, and update snapshots.

`@rjsf/antd` and `@rjsf/mantine` render their own `InputNumber`/`NumberInput` and are unaffected, except that the plain input they fall back to when a widget supplies an `onChangeOverride` is still `type="number"`.

## Verify

- Your selectors find the numeric fields, and updated snapshots show `type="text"` with `inputmode` and `pattern`.
- A value outside `minimum`/`maximum` shows RJSF's range error on submit.
- A field set to `inputType: 'number'` or `updown` still renders `type="number"`.
