---
title: A submit in the same handler as an edit skips browser validation
description: '`submit()` now submits an edit made in the same handler, but the browser constraint validation still sees the old inputs, so only schema validation runs. Put the constraints in the schema, or check a value first with `validateFormWithFormData(nextData)`.'
packages: ['@rjsf/core']
uses: [form-ref]
schema: []
kind: runtime
noticed: review
related: []
---

## Detect

- A handler in your code that calls `setFieldValue()` and then `submit()` on a `Form` ref.
- That form relies on the browser's constraint validation (`required`, `pattern` and the rest on the inputs) to block the submit.

## Change

`submit()` submits the form's current value, including an edit made in the same handler, and calls `onSubmit` or `onError` before it returns:

```tsx
formRef.current?.setFieldValue('status', 'final');
formRef.current?.submit(); // submits { status: 'final' }
```

There is one limit. The browser's constraint validation checks the DOM, and React has yet to show such an edit in the inputs. So a submit in the same handler as an edit is checked by schema validation alone. A submit made while the inputs show the current value, such as a submit button's, is checked by both.

Make sure the schema states every rule that must block that submit. To check a value without storing or submitting it, call `validateFormWithFormData(nextData)`:

```diff
+const next = { ...formRef.current.getFormData(), status: 'final' };
+if (formRef.current.validateFormWithFormData(next)) {
   formRef.current.setFieldValue('status', 'final');
   formRef.current.submit();
+}
```

## Verify

- `onSubmit` or `onError` has run by the time `submit()` returns, with the edited value.
- A value that breaks a rule only the browser checked is caught by your schema or by `validateFormWithFormData()`.
