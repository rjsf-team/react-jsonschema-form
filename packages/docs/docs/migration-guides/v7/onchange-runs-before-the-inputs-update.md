---
title: onChange runs before the inputs show the new value
description: '`onChange` now runs before React updates the inputs, so the DOM still shows the old value. Read the value from `event.formData`, or from `getFormData()` outside `onChange`, and move code that needs the updated DOM into an Effect.'
packages: ['@rjsf/core']
uses: [form-props, form-ref]
schema: []
affects: [code]
related: [form-ref-needs-form-data-type]
---

## Detect

- An `onChange` handler in your code that reads input values from the DOM, such as `document.querySelector('#root_title').value`.
- An `onChange` handler that measures or focuses inputs and expects them to show the edit.
- A `FormRef` call, such as `setFieldValue()` or `reset()`, wrapped in `startTransition()`.

## Change

`onChange` now runs before the inputs show the new value. Take the value from the event:

```diff
 const onChange = (event) => {
-  const title = document.querySelector('#root_title').value;
-  saveDraft({ title });
+  saveDraft(event.formData);
 };
```

Outside `onChange`, call `getFormData()` on the form ref (see [the FormRef type](./form-ref-needs-form-data-type.md)). It returns the form's current value, including edits made earlier in the same tick. Code that needs the updated DOM itself belongs in an Effect.

Form stores edits synchronously, so a `FormRef` call wrapped in `startTransition()` still runs at once and doesn't become non-blocking. Remove the wrapper:

```diff
-startTransition(() => formRef.current?.setFieldValue('title', 'Draft'));
+formRef.current?.setFieldValue('title', 'Draft');
```

## Verify

- What your `onChange` saves matches the value the user just entered, not the one before it.
- No `onChange` handler reads input values from the DOM.
- No `FormRef` call is wrapped in `startTransition()`.
