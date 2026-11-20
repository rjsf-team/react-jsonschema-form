---
title: Title and label ids move to a span, and radio, checkbox, rating and date groups lose their label's for
description: '`@rjsf/core` now puts title and label ids on a `<span>` around the text, and names a radio, checkboxes, rating or alt-date group through `aria-labelledby` with no `for` on its label. Point selectors at the `__title` and `__label` ids and update snapshots.'
packages: ['@rjsf/core', '@rjsf/antd', '@rjsf/bootstrap3']
uses: [markup]
schema: []
affects: [experience, appearance]
related:
  [
    field-template-reads-the-presentation-plan,
    widget-under-built-in-key-takes-its-declaration,
    any-of-one-of-field-labelled-once-by-its-template,
  ]
---

## Detect

- `legend#root__title` (any `__title` id on a `<legend>`) in your CSS or tests, or a custom `TitleFieldTemplate` that puts its `id` on the `<legend>` or on an element holding more than the title's text.
- `label[for="root_color"]` (any field id) in your CSS or tests, for a field rendered by `RadioWidget`, `CheckboxesWidget`, `AltDateWidget` or `AltDateTimeWidget`, or for an `anyOf`/`oneOf` field.
- `input#root_rating` (any field id) in your CSS or tests, for a field rendered by `RatingWidget`.
- `#root_color__label` used to reach antd's `<label>` element.
- Assertions on `aria-describedby`, `aria-invalid` or `aria-labelledby` in your tests, or snapshots that hold them.

## Change

`@rjsf/core`'s `TitleFieldTemplate` puts the [`titleId()`](../../api-reference/utility-functions.md#titleid) it is handed on a `<span>` around the title's text instead of on its `<legend>`. An object's option selector is named by that id and would otherwise take the `*` and the optional data control's button into its name. A custom `TitleFieldTemplate` puts its `id` on the title's text alone:

```diff
- legend#root__title { … }
+ legend #root__title { … }
```

```diff
- <legend id={id}>
-   {title}
-   {required && '*'}
- </legend>
+ <legend>
+   <span id={id}>{title}</span>
+   {required && '*'}
+ </legend>
```

`@rjsf/core`'s `FieldTemplate` draws the label of a `RadioWidget` or `CheckboxesWidget` with no `for`, which named the group's wrapper `<div>`, an element a `for` can't label. The group is named by the label's [`fieldLabelId()`](../../api-reference/utility-functions.md#fieldlabelid) through `aria-labelledby`. That id is on a `<span>` around the label's text, as a heading's id is, so a group named by it takes no `*`, and `label:has(#root_color__label)` matches the label itself:

```diff
- label[for="root_color"] { … }
+ #root_color__label { … }
```

- `RatingWidget` renders its stars as a `radiogroup` on the wrapper `<div>`, named the same way, where its label's `for` named its hidden `<input>`. The wrapper carries the field's id in that `<input>`'s place, so a selector aimed at `input#root_rating` aims at `#root_rating`.
- `AltDateWidget`, and so `AltDateTimeWidget`, wraps its list of date parts in a `group` `<div>` carrying the field's id, named the same way, around the `<ul>`, which keeps its list role. Its label's `for` named an id no date part carried, so a selector aimed at `label[for="root_when"]` aims at `#root_when__label`.
- An `anyOf`/`oneOf` field's label has no `for` while the option it shows renders no control at the field's id, such as an object, an array of items or a `null`, renders a group such as `AltDateWidget`'s, or renders options of its own, whose option shown may be an object. The field is then named by the label through `aria-labelledby`, as the option selector is whatever option is shown, so a selector aimed at `label[for="root_pet"]` aims at `#root_pet__label`. While it shows an option rendering a single control, such as a string's input or an array's multi-select or file input, the label keeps the `for`. While it shows no option, as after its selector's empty choice is picked, the label has no `for` whatever its options are, since nothing renders at the field's id.
- Where `AnyOfField` or `OneOfField` is declared `labelledBy: 'aria-labelledby'`, the label has no `for` whatever option shows, and a single control is named by it through `aria-labelledby`. An option given a `ui:field` counts as rendering a single control, so one wrapping an object keeps the `for`; to draw none, register the field under a key and declare `labelledBy: 'aria-labelledby'` for that key.

  ```tsx
  <Form presentation={{ fields: { OneOfField: { labelledBy: 'aria-labelledby' } } }} />
  ```

- Under `@rjsf/antd`, `#root_color__label` is likewise on a `<span>` around the label's text, which also carries the label's `title`, so `label:has(#root_color__label)` matches the label.

A control's `aria-describedby` names only elements that render, an `AltDateWidget`'s parts included. A control is `aria-invalid` while it has errors, except a radio, whose `radiogroup` is instead. The template's label carries `fieldLabelId()` on its text, and a group of radios or checkboxes is labelled by that label through `aria-labelledby`. Update snapshots and assertions to match.

A widget of your own registered under one of these keys takes the same declaration; see [A widget registered under a built-in key takes that key's presentation declaration](./widget-under-built-in-key-takes-its-declaration.md).

## Verify

- `#root__title` matches a `<span>` holding only the title's text, and an object's option selector's accessible name has no `*`.
- `getByRole('radiogroup', { name: 'Color' })` or `getByRole('group', { name: 'Colors' })` finds the group.
- `#root_pet__label` matches an `anyOf`/`oneOf` field's label text in every option.
- Every id in a control's `aria-describedby` exists in the page, and an invalid control has `aria-invalid="true"`.
