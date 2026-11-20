---
title: A required checkbox group, multiple select, file input or array widget needs minItems to show as required
description: 'A required array rendered as one widget now shows a `*` and is `required` only with a `minItems` of at least 1 or `ui:required: true`, since `required` alone accepts `[]`. Add `minItems: 1` to keep forcing a choice.'
packages: ['@rjsf/core']
uses: [form, markup, custom-widgets]
schema: [arrays]
affects: [data, experience]
related:
  [
    field-template-reads-the-presentation-plan,
    translate-string-table-needs-new-keys,
    any-of-one-of-field-labelled-once-by-its-template,
  ]
---

## Detect

- A property listed in `required` in your schema whose array renders as one widget, with no `minItems` of at least 1: a group of checkboxes (`ui:widget: 'checkboxes'`), a `<select multiple>` (an array of `enum` values), a file input (items of `format: 'data-url'`) or a custom array widget.
- On the rendered page, that field lost its `*`, its control is no longer `required`, and submitting it empty now calls `onSubmit` with `[]`.
- A test that finds a required group by name, such as `getByRole('group', { name: 'Colors' })`.
- A custom checkboxes widget in your code that calls `getGroupAttributes()`, or `@rjsf/daisyui`'s `getGroupAndOptionProps()`.
- A custom array widget in your code that assumes it is required.

## Change

A required array rendered as one widget is required, by its `*` and the `required` its widget is handed, only where its schema demands an item with a `minItems` of at least 1, or where `ui:required: true` asks for it ([#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744)). `getDefaultFormState()` seeds a required array with `[]`, which `required` alone accepts. The form already submitted `[]` for a group with nothing checked, and a `<select multiple>`'s native `required` had the browser block that submit, so the form called neither `onSubmit` nor `onError`. Add `minItems: 1` to keep the `*` and `required`, which also has the form report an empty selection:

```diff
  colors: {
    type: 'array',
    items: { type: 'string', enum: ['red', 'green'] },
    uniqueItems: true,
+   minItems: 1,
  },
```

- A required group's accessible name then ends in "required" (`TranslatableString.RequiredGroupCue`), so a test finding it by name expects that. A custom `translateString` handles the new key; see [A translateString that maps every key needs the new TranslatableString keys](./translate-string-table-needs-new-keys.md).

  ```diff
  - getByRole('group', { name: 'Colors' });
  + getByRole('group', { name: 'Colors required' });
  ```

- A custom checkboxes widget calling [`getGroupAttributes()`](../../api-reference/utility-functions.md#getgroupattributes) passes the `registry` and renders the `requiredCue` it returns, or its name stays as it was. So does one calling `@rjsf/daisyui`'s `getGroupAndOptionProps()`, which takes the `registry` and returns the `requiredCue` alike, while `getGroupProps()` returns no cue.
- A custom array widget reads its `required` prop instead of assuming one.
- Only `minItems` and `ui:required` are read. A required group with no `minItems` shows no `*` or cue even where a `contains` rejects `[]`, so the form blocks that submit; give such a group `minItems: 1` or `ui:required: true`.
- An array holding no value, as `emptyObjectFields: 'skipEmptyDefaults'` leaves it, stays required and keeps its `*` and cue, since the form rejects that.
- An `anyOf`/`oneOf` field follows the option shown: a required field shows no `*` while that option holds the `[]` of such a group or the `false` of a checkbox whose schema accepts it.
- An array rendered as a list of items keeps its `*`.

## Verify

- With `minItems: 1`, the field shows its `*`, a group's name ends in "required", and submitting it empty calls `onError` with a `minItems` error.
- Without it, the field shows no `*` and submitting it empty calls `onSubmit` with `[]`.
