---
title: 'An error a field raises is kept apart from the validator errors'
description: 'An error a field raised through `onChange` used to replace the validator error at its path and vanish on the next validation. It is now kept apart, survives re-renders and validation, and blocks submit until the field clears it.'
packages: ['@rjsf/core']
uses: [custom-widgets, custom-fields]
schema: []
kind: runtime
noticed: review
related: [onchange-error-schema-is-the-field-own-errors]
---

## Detect

- In your field, widget or template: errors raised through the third argument of `onChange`, at a path where the validator also reports errors.
- On the rendered page: a raised error stays after the next validation, beside the validator's, and the form won't submit while it stands.
- In the `ErrorListTemplate`: a raised error listed after the validator's errors and `extraErrors`.

## Change

The form keeps what a field raises to itself, whether or not the validator reported anything at that path. The raise still takes the validator's errors at its path off the display, so `onChange(value, fieldPath, { __errors: [] })` clears them as before. It follows that:

- A parent that passes `formData` and stores what `onChange` reports no longer loses the raise when it renders the edit back.
- The raise is still shown after the next validation, beside whatever the validator reports for the new value, where that validation used to replace it. It keeps the form from submitting for as long as it stands.
- In `errors`, and so in the `ErrorListTemplate`, the raise is listed after the validator's errors and `extraErrors`, where it used to take the place of the validator error it replaced.
- Raising an empty `errorSchema` now clears the field's earlier raise at that path too, where it used to clear only the validator's error.

Clear a raise when it no longer applies, by raising again or by calling `onChange` with no `errorSchema`. The latter clears the error at the field's own path only; errors it raised for paths below stay until it raises again, and raising `{}` takes all of them off:

```diff
-onChange(value, fieldPath);
+onChange(value, fieldPath, {});
```

## Verify

- Every error your field raises goes away once its value is valid, and the form submits.
