---
title: 'ui:emptyValue fills a blank field on first render and after a reset'
description: '`ui:emptyValue` used to apply only when a user cleared a field; it now fills any blank field on first render and after a reset. Expect the key in `formData` from the start, or remove the `ui:emptyValue`.'
packages: ['@rjsf/core']
uses: [ui-schema]
schema: []
affects: [data]
related: [defaults-are-filled-in-without-onchange]
---

## Detect

- In your `uiSchema`: `ui:emptyValue` on a field that has no `formData` and no schema `default`.
- In your `onSubmit` data or tests: that field's key now appears with the `ui:emptyValue` value before the user has touched it.

## Change

`ui:emptyValue` now applies whenever the field is blank: on initial render, after a form reset, and when cleared. `getDefaultFormState()` reads the `uiSchema` while computing defaults to pick it up. A field you set it on is filled with that value instead of staying `undefined` and being left out of `formData` until the user clears it once. The form also fills its defaults in again when a `ui:emptyValue` changes; see [Form no longer calls onChange on mount for defaults](./defaults-are-filled-in-without-onchange.md).

If your code relied on the key being absent, remove the `ui:emptyValue` or handle the value in your submit code. See [`ui:emptyValue`](../../api-reference/uiSchema.md#emptyvalue).

## Verify

- A fresh or reset form reports the `ui:emptyValue` for each blank field that sets one, and your submit handling accepts it.
