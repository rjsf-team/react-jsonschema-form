---
title: A form whose onSubmit returns a promise ignores another submit until it settles
description: "When `onSubmit` returns a promise, the form now ignores every other submit until it settles. To accept a second submit while saving, start the save without returning its promise, and submit a next step only after `onSubmit` returns."
packages: ['@rjsf/core']
uses: [form-props, form-ref]
schema: []
affects: [experience, code]
related: [async-on-submit-rejection-from-form-copy, submit-button-aria-disabled-while-pending]
---

## Detect

- Your `onSubmit` is `async` or returns a promise, and the form should accept another submit while it runs, such as one that queues saves.
- Your `onSubmit` calls `FormRef.submit()` before it returns.

## Change

When `onSubmit` returns a promise, as every `async` function does, the form now ignores another submit until that promise settles, from a submit button, from Enter pressed in a field or from `FormRef.submit()` (see [Submitting](../../usage/submitting.md)).

A form that should take a second submit while the first is saving has to return before the save settles. Start the save without returning its promise, and handle its errors inside `save`:

```diff
-onSubmit={async (data) => { await save(data); }}
+onSubmit={(data) => { void save(data); }}
```

An `onSubmit` that returns nothing, or a value that isn't a promise, behaves as before, except that a `FormRef.submit()` it calls before it returns is ignored, since the form can't tell yet whether it will return a promise. The browser already ignored one that reached `requestSubmit()` while the submit event ran, so only a submit of an edit the inputs have yet to show is newly ignored. Submit the next step once `onSubmit` has returned instead.

## Verify

- A second submit during a save reaches `onSubmit` only where you started the save without returning it.
- Multi-step flows that call `FormRef.submit()` do so after `onSubmit` returns.
- The submit button's look while pending is covered in [A submit button is aria-disabled while onSubmit is pending](./submit-button-aria-disabled-while-pending.md).
