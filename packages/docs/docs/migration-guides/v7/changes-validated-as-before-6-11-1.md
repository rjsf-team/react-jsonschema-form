---
title: Upgrading from 6.11.1, changes and submits are validated as in 6.11.0
description: 6.11.1 changed how Form applies and validates a change, and v7 reverts part of it. If you upgrade from 6.11.1, recheck throws from validation callbacks, changes made as props change, and widget errors under `noValidate`.
packages: ['@rjsf/core']
uses: [form-props, form-ref]
schema: []
affects: [code, data]
related: []
---

## Detect

These apply only if you upgrade from 6.11.1 ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631)). Look in your code for:

- A `customValidate` or `transformErrors` that can throw while you call `setFieldValue()`.
- A `focusOnFirstError` function that can throw, together with an `onError`.
- A change applied in the same event in which the parent sets new `schema`, `liveValidate` or `extraErrors`.
- A widget that calls `onChange` with an `errorSchema` while `noValidate` is set.

## Change

- A throw from `customValidate` or `transformErrors` during `setFieldValue()` comes out of `setFieldValue()` again, instead of from a timeout. Wrap the call in `try`/`catch` to handle it.
- A throw from `focusOnFirstError` on submit comes out of the submit handler before `onError` is called, so `onError` isn't called for that submit. Catch the error inside `focusOnFirstError` if you need `onError`.
- A change made in the same event as the parent setting `schema`, `liveValidate` or `extraErrors` is applied and validated with the props from before that event. To apply it with the new props, make the change after they have rendered, such as from an effect.
- `noValidate` no longer hides a custom error a widget raised; it shows at once. To keep it hidden while validation is off, pass your `noValidate` flag to the widget, for example through `formContext`, and call `onChange` without an `errorSchema` while it's set.

```diff
-formRef.current.setFieldValue('name', value);
+try {
+  formRef.current.setFieldValue('name', value);
+} catch (error) {
+  report(error);
+}
```

## Verify

- A `try`/`catch` around `setFieldValue()` catches validation throws.
- `onError` runs on a failed submit, with any `focusOnFirstError` error caught inside it.
- A change made after new props render is validated with those props.
- Widget errors stay hidden while your `noValidate` flag is set.
