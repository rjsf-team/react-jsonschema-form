---
title: A form inside a hidden Activity drops late changes and ref calls
description: 'A `Form` hidden by `<Activity>` or a `<Suspense>` fallback now acts as unmounted: it keeps its data but drops late changes and ref calls. Make those calls while the form is shown, or keep the pending value outside the form.'
packages: ['@rjsf/core']
uses: [form, form-ref]
schema: []
affects: [data, code]
related: []
---

## Detect

- `Form` rendered inside a React `<Activity>` or a `<Suspense>` that can hide it, in your code.
- A `setFieldValue()`, `reset()` or `submit()` made from a timer, a request callback or a ref handle you kept, in your code.
- In development, the console warns: ``Form: `setFieldValue()` was called on a form that is hidden by `<Activity>` or a `<Suspense>` fallback, or has unmounted, and was dropped.`` (or the same for `reset()` / `submit()`).

## Change

React asks components to [treat content hidden by `<Activity>` as unmounted](https://react.dev/reference/react/Activity): it cleans up the hidden content's Effects and expects nothing in there to keep acting. `Form` does what React asks. While hidden, it keeps its data, but drops anything that reaches it:

- a draft a widget flushes from an Effect cleanup;
- a timer or a file read that finishes late;
- a `setFieldValue()`, `reset()` or `submit()` through its ref.

A `validateForm()` returns its result without calling `onError`. In development, the form warns once about the first `setFieldValue()`, `reset()` or `submit()` it drops this way through a handle you kept. React clears the ref while the form is hidden, so `ref.current` is `null` then, and `ref.current?.setFieldValue()` skips the call without reaching the form.

Everything works again once the form is shown. A form shown again by an `<Activity>` gets its ref back after its fields' layout Effects have run, so an `onChange` a widget reports from one finds `ref.current` still `null`. React also cleans up the Effects of content a `<Suspense>` fallback replaces after it has been shown, so a form inside one drops the same things while the fallback shows. A form that has unmounted drops the same things, as in v6.

Make ref calls while the form is shown. A value that arrives while it is hidden, such as a request result, belongs in your own state; apply it with `setFieldValue()` once the form is visible again.

## Verify

- The development warning about a dropped call no longer appears.
- Values that arrive while the form is hidden show up after it is shown again.
