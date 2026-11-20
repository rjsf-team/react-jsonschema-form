---
title: MUI moves the slider id to its input and changes group, title and error ids
description: '`@rjsf/mui`''s `RangeWidget` now puts the field''s id on the slider''s `<input>`, group labels lose their `for`, and title and error ids move. Point selectors at `input#root_x`, `#root_color__label`, `#root__title` and the items of `#root_x__error`.'
packages: ['@rjsf/mui']
uses: [markup]
schema: []
affects: [appearance, experience]
related: [label-and-title-ids-move-to-spans, widget-under-built-in-key-takes-its-declaration]
---

## Detect

- `span#root_x` (any field id) for a `RangeWidget` in your CSS or tests.
- `label[for="root_color"]` for a radio or checkboxes field in your CSS or tests.
- `div#root__title` (any `__title` id) in your CSS or tests.
- `#root_x__error-0` (any `__error-N` id) in your CSS or tests.

## Change

- `RangeWidget` puts the field's id on its slider's `<input>`, where it was on the slider's root, except for a slider of several values, which keeps the id on its root:

  ```diff
  - span#root_x
  + input#root_x
  ```

- A radio or checkboxes field's label has no `for`, which named the group's wrapper, and names the group through `aria-labelledby` (see [Title and label ids move to a span](./label-and-title-ids-move-to-spans.md)):

  ```diff
  - label[for="root_color"]
  + #root_color__label
  ```

- `TitleField` puts the title id on a `<span>` around the title's text inside its heading:

  ```diff
  - div#root__title
  + #root__title
  ```

- `FieldErrorTemplate`'s messages no longer carry ids of their own, so aim at the items of `#root_x__error`:

  ```diff
  - #root_x__error-0
  + #root_x__error li:nth-child(1)
  ```

A widget of your own registered as `RatingWidget`, `AltDateWidget` or `AltDateTimeWidget` takes this theme's declaration for that key; see [A widget registered under a built-in key takes that key's presentation declaration](./widget-under-built-in-key-takes-its-declaration.md).

## Verify

Your selectors match again, and `getByRole('slider', { name: 'Volume' })` finds the slider's `<input>`.
