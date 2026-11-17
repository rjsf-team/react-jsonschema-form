---
title: A Form with noValidate no longer validates on blur
description: "`liveValidate='onBlur'` used to show schema errors even with `noValidate` set, and now honors it. Drop `noValidate` if you rely on blurring a field to show errors."
packages: ['@rjsf/core']
uses: [form-props]
schema: []
kind: runtime
noticed: review
related: []
---

## Detect

- In your code, a `Form` that sets both `noValidate` and `liveValidate='onBlur'`.
- On the rendered page, such a form no longer shows schema errors after a field loses focus.

## Change

`noValidate` already turned validation off on change, on submit and when props change. `liveValidate='onBlur'` ran and displayed schema errors regardless of it, and now it honors `noValidate` too.

If you depended on blurring a field to produce errors, drop `noValidate`:

```diff
-<Form noValidate liveValidate='onBlur' ... />
+<Form liveValidate='onBlur' ... />
```

## Verify

- With `noValidate` removed, blurring an invalid field shows its errors.
- A form that keeps `noValidate` shows no schema errors on blur, change or submit.
