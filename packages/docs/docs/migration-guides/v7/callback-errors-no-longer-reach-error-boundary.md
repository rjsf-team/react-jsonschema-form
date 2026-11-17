---
title: An error thrown in onChange, onBlur or onFocus no longer reaches an error boundary
description: An error thrown by your `onChange`, `onBlur` or `onFocus` used to unmount the form and reach an error boundary, and now it does neither. Catch the error inside the callback if you need to act on it.
packages: ['@rjsf/core']
uses: [form-props]
schema: []
kind: runtime
noticed: runtime-error
related: []
---

## Detect

- An `onChange`, `onBlur` or `onFocus` passed to `Form` in your code that can throw.
- A React error boundary around `Form` in your code that you rely on to catch those errors.
- The rendered page: the form stays mounted after the callback throws, and the browser console reports an uncaught error.

## Change

The form no longer unmounts when one of these callbacks throws, and the error doesn't reach an error boundary. An error thrown during a `FormRef` call, such as `setFieldValue()`, comes out of that call. An error caused by the user editing a field is reported as an uncaught error. Catch the error inside the callback:

```diff
 const onChange = (event) => {
-  save(event.formData);
+  try {
+    save(event.formData);
+  } catch (error) {
+    setSaveError(error);
+  }
 };
```

## Verify

- An error from the callback is handled by your `catch` and no uncaught error shows in the console.
- A `try`/`catch` around a `FormRef` call catches an error its callback threw.
