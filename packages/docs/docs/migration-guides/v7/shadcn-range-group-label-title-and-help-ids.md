---
title: shadcn moves the range id to its thumb and moves group, label, title and help ids
description: '`@rjsf/shadcn`''s `RangeWidget` now puts the field''s id on the slider''s thumb, groups are named through the template''s label, and label, title and help ids move. Update selectors and snapshots to the new ids and elements.'
packages: ['@rjsf/shadcn']
uses: [markup]
schema: []
kind: markup
noticed: test
related: [label-and-title-ids-move-to-spans]
---

## Detect

- A `RangeWidget` reached through `#root_x` expecting the slider's root, or through `label[for="root_x"]`, in your CSS or tests.
- `label[for="root_color"]` for a radio or checkboxes field in your CSS or tests.
- `label#root_name__label` (any `__label` id) in your CSS or tests.
- `div#root__title` (any `__title` id) in your CSS or tests.
- `span#root__help` (any `__help` id), or styles relying on the description's `<span>`, in your CSS or tests.

## Change

- `RangeWidget` puts the field's id on its slider's thumb instead of its root, and the label names the thumb with no `for`. An empty range draws its thumb at its minimum, so a screen reader announces that minimum as its value, though the form holds no value until the thumb is pressed or moved.
- `RadioWidget`'s and `CheckboxesWidget`'s wrapper carries the field's id and the `radiogroup` or `group` role, named by the template's label, which `FieldTemplate` draws with no `for` (see [Title and label ids move to a span](./label-and-title-ids-move-to-spans.md)):

  ```diff
  - label[for="root_color"]
  + label:has(#root_color__label)
  ```

- `FieldTemplate`'s label puts its plan's label id on a `<span>` around the label's text, for every field, as core's does. Aim at `label #root_name__label`, which matches that `<span>`, or at `label:has(#root_name__label)`, which matches the label with its `*`:

  ```diff
  - label#root_name__label
  + label:has(#root_name__label)
  ```

- `TitleField` puts the title id on a `<span>` around the title's text:

  ```diff
  - div#root__title
  + span#root__title
  ```

- `FieldHelpTemplate` and `FieldTemplate`'s description render in a `<div>` instead of a `<span>`:

  ```diff
  - span#root__help
  + div#root__help
  ```

## Verify

Your selectors match again, and `getByRole('slider', { name: 'Volume' })` finds the range's thumb.
