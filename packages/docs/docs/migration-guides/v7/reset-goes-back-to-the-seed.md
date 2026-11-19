---
title: reset() goes back to the seed it was last given
description: '`reset(saved)` now makes `saved` the seed for that and every later `reset()`, until the form remounts. Check which seed your `reset()` calls go back to, and pass the original record as `initialFormData` if you store every edit in `formData`.'
packages: ['@rjsf/core']
uses: [form-ref]
schema: []
affects: [data]
related: [form-ref-reset-as-event-handler-seeds-event, initial-form-data-replaces-form-data, form-ref-is-a-formref-handle]
---

## Detect

- `.reset(` called on a `Form` ref in your code, with or without an argument.
- `reset` passed as an event handler, such as `onClick={formRef.current.reset}`, in your code.
- A form that passes `formData={data}` and stores every edit in `data` through `onChange`, and also calls `reset()`.

## Change

`reset()` with no argument works as in v6 until you first pass it a seed. It reads the seed from the current props (`formData` if you pass it, otherwise `initialFormData`) and fills it in with the defaults. It clears the submit count and every error except `extraErrors`, and reports the result through `onChange`.

`reset(saved)` makes `saved` the seed instead, for this and every later `reset()`. Those later calls go back to `saved` rather than the props' seed, even after the props pass another one. To read the props' seed again, remount the form under a `key` (see [Making the saved data the baseline](../../usage/submitting.md#making-the-saved-data-the-baseline)). A `reset` passed as an event handler now receives the event as its seed: see [reset passed as an event handler](./form-ref-reset-as-event-handler-seeds-event.md).

Mind which seed you pass. If you pass `formData={data}` and store every edit in `data`, the seed is the latest edit, so `reset()` clears the errors and leaves the data as it is. To reset to the original record, pass the record as `initialFormData` (see [initialFormData](./initial-form-data-replaces-form-data.md)) and keep your copy of the edits in a separate state:

```diff
-<Form formData={data} onChange={(e) => setData(e.formData)} ref={formRef} />
+<Form initialFormData={record} onChange={(e) => setDraft(e.formData)} ref={formRef} />
```

Or remount the form under a `key`.

## Verify

- `reset()` with no argument shows the props' seed filled in with defaults, with the submit count and errors cleared and `extraErrors` kept.
- After `reset(saved)`, a later `reset()` returns to `saved`, and a remount under a new `key` returns to the props' seed.
- A form that stores every edit resets to the original record once the record is passed as `initialFormData`.
