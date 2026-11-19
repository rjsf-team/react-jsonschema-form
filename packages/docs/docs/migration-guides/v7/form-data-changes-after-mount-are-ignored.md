---
title: A formData that changes after mount no longer replaces the data
description: 'A `formData` or `initialFormData` passed after mount is now ignored, and a changed `formData` logs a one-time warning in development. Remount the form under a `key` for a different record, or call `setFieldValue()` for an outside edit.'
packages: ['@rjsf/core']
uses: [form, form-ref]
schema: []
affects: [data, code]
related: [initial-form-data-replaces-form-data]
---

## Detect

- In your code, a `formData` or `initialFormData` that changes after the form mounts: a record that loads later, the next record in a list, or an edit made outside the form.
- A `useEffect` that copies a prop into the form's data.
- In development, the console shows a warning ending in `[form-data-ignored]` the first time the form ignores a new `formData`.

## Change

The form reads its seed only on mount and on `reset()`, see [The formData prop is deprecated in favor of initialFormData](./initial-form-data-replaces-form-data.md). Which way to show other data depends on whether it is a different record or the same one.

For a different record, remount the form under a `key`. This is how React recommends [resetting all state when a prop changes](https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes). The new form starts clean: its errors and the fields' own state are cleared, and the record gets the values the form fills in on mount only, such as a [`ui:initialValue`](../../api-reference/uiSchema.md#initialvalue) or the defaults of additional properties.

```diff
-<Form schema={schema} validator={validator} formData={record} onChange={save} />
+<Form key={record.id} schema={schema} validator={validator} initialFormData={record} onChange={save} />
```

For a record that loads after mount, render the form once the record is there:

```tsx
if (!record) {
  return <Spinner />;
}
return <Form key={record.id} schema={schema} validator={validator} initialFormData={record} onChange={save} />;
```

For the same record changed from outside, call `setFieldValue()` on the form's ref. `setFieldValue('', data)` replaces the whole value, and `setFieldValue(path, value)` replaces one field. The errors and the fields' state stay, and the change goes through `transformChange` and is reported through `onChange`, like any edit. Make the call where the new value arrives, such as a button's handler or a request's callback. A `useEffect` that watches a prop and copies it into the form adds a render and a step for no gain ([You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)).

## Verify

- Loading or switching records shows the new record's data.
- An outside edit shows in the form and reaches `onChange`.
- The development warning `form-data-ignored` no longer appears. [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make it throw.
