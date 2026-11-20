---
title: 'The change event no longer has an edit member'
description: 'The `edit` member of the event `onChange` and `onSubmit` receive is gone; it only restated whether you had passed data. Check your own `Form` props for that instead.'
packages: ['@rjsf/core']
uses: [form-props, typescript]
schema: []
affects: [code]
related: [change-event-members-are-readonly, form-data-type-defaults-to-unknown]
---

## Detect

- In your `onChange` or `onSubmit` handlers: a read of `event.edit`.
- In the type checker: `TS2339: Property 'edit' does not exist on type 'IChangeEvent<...>'.`
- In plain JavaScript: `event.edit` is now `undefined`.

## Change

`edit` only restated whether you had passed data to the `Form`. Read that from your own props or state:

```diff
-onChange={(event) => { if (event.edit) save(event.formData); }}
+onChange={(event) => { if (formData !== undefined) save(event.formData); }}
```

The other members keep their types, except `formData`, which is now `EventFormData<T>`; see [Form data defaults to unknown](./form-data-type-defaults-to-unknown.md).

## Verify

- No code reads `edit` from a change or submit event, and your handlers compile.
