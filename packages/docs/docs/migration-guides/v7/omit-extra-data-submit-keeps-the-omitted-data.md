---
title: A submit with omitExtraData keeps the trimmed data as the form data
description: With `omitExtraData`, a submit now passes the data with its extra fields removed to `onSubmit` and also keeps that trimmed data as the form's data. Stop expecting the extra fields to remain in the form after a submit.
packages: ['@rjsf/core']
uses: [form-props]
schema: [additional-properties]
kind: runtime
noticed: test
related: []
---

## Detect

- `omitExtraData` passed to `Form` in your code.
- Code or tests that read the form's data after a submit, for example through `getFormData()` or the next `onChange`, and expect fields outside the schema to still be there.

## Change

A submit with `omitExtraData` keeps the trimmed data as the form's data, the same data `onSubmit` receives. If you need the extra fields after a submit, keep your own copy of them before submitting and merge them back where you use them.

## Verify

- After a submit, the form's data equals the `formData` `onSubmit` received.
- Tests that read the data after a submit expect the extra fields to be gone.
