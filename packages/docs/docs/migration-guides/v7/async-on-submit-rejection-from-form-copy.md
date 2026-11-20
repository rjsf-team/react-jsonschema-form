---
title: A rejected onSubmit promise is reported from the form's copy of it
description: "A rejection from the promise `onSubmit` returns is now reported from the form's copy of it, so a handler that caught its own returned promise gets an unhandled rejection. Catch inside `onSubmit` and return a promise that resolves."
packages: ['@rjsf/core']
uses: [form-props]
schema: []
affects: [code]
related: [async-on-submit-ignores-submits-until-settled]
---

## Detect

- Your `onSubmit` attaches a handler to the promise it returns, such as `const saving = save(data); saving.catch(log); return saving;`.
- The console shows an unhandled rejection after a failed submit.

## Change

An `async` `onSubmit` that throws is still reported as one unhandled rejection, from the form's copy of the promise rather than from the promise itself. Only a handler that handled the promise it returned now gets an unhandled rejection it didn't before. Catch inside `onSubmit` and return a promise that resolves:

```diff
 onSubmit={(data) => {
-  const saving = save(data);
-  saving.catch(log);
-  return saving;
+  return save(data).catch(log);
 }}
```

## Verify

- A failed save logs through your handler with no unhandled rejection.
