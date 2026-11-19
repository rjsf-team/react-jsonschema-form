---
title: FormRef.reset passed as an event handler resets the form to the event
description: "`FormRef.reset(seed?)` now makes its argument the form's seed, so passing `reset` straight as an event handler resets the form to the click event. Wrap it so it gets no argument: `onClick={() => formRef.current?.reset()}`."
packages: ['@rjsf/core']
uses: [form-ref]
schema: []
affects: [data, code]
related: [reset-goes-back-to-the-seed]
---

## Detect

- Your code passes `formRef.current?.reset`, or another `FormRef`'s `reset`, directly as an `onClick` or other event handler.
- After a click, the form shows an event object's fields or empty values instead of its data.

## Change

`FormRef.reset(seed?)` now reads its argument, as `reset(values)` does in react-hook-form and TanStack Form: given data, it makes that data the form's seed and baseline (see [reset() goes back to the seed](./reset-goes-back-to-the-seed.md)). So `reset` passed straight as an event handler receives the event as its seed, and a click resets the form to the click event.

Wrap it, so it is called with no argument:

```diff
-<button type='button' onClick={formRef.current?.reset}>
+<button type='button' onClick={() => formRef.current?.reset()}>
   Reset
 </button>
```

## Verify

- Clicking the button returns the form to its seed data.
