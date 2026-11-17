---
title: React Bootstrap names groups through the template label and moves label, title and help ids
description: '`@rjsf/react-bootstrap` now names radio and checkbox groups through the template''s label, puts label and title ids on a `<span>`, and renders help in a `<div>`. Update selectors, and check the title a custom field hands `TitleField`.'
packages: ['@rjsf/react-bootstrap']
uses: [markup, custom-fields]
schema: []
kind: markup
noticed: test
related: [label-and-title-ids-move-to-spans]
---

## Detect

- `label[for="root_color"]` for a radio, checkboxes, rating or alt-date field in your CSS or tests.
- `label#root_color__label` (any `__label` id) in your CSS or tests.
- `div#root__title` (any `__title` id) in your CSS or tests.
- `small#root__help` (any `__help` id), or styles relying on the description's `<small>`, in your CSS or tests.
- A custom field in your code that renders `TitleFieldTemplate` or `ArrayFieldTemplate` with a `title` of its own, for a field whose `uiSchema` sets `ui:title`.

## Change

- `RadioWidget`'s and `CheckboxesWidget`'s `Form.Group` carries the field's id and the `radiogroup` or `group` role, named by the template's label, which `FieldTemplate` draws with no `for`, as it does for a rating or alt-date field (see [Title and label ids move to a span](./label-and-title-ids-move-to-spans.md)):

  ```diff
  - label[for="root_color"]
  + label:has(#root_color__label)
  ```

- `FieldTemplate`'s label puts its plan's label id on a `<span>` around the label's text, as core's does. Aim at `label #root_color__label`, which matches that `<span>`, or at `label:has(#root_color__label)`, which matches the label with its `*`:

  ```diff
  - label#root_color__label
  + label:has(#root_color__label)
  ```

- `TitleField` puts the title id on a `<span>` around the title's text, followed by a `*` for a required object or array:

  ```diff
  - div#root__title
  + span#root__title
  ```

- `FieldHelpTemplate` and `FieldTemplate`'s description render their `Form.Text` as a `<div>`:

  ```diff
  - small#root__help
  + div#root__help
  ```

- `TitleField` draws the `title` it is handed, where `ui:title` used to replace it, and `ArrayFieldTemplate` draws only the heading `ArrayField` hands it as `title`, as core's do. A custom field rendering either with a `title` of its own now sees that title drawn, where the field's `ui:title` replaced it.

## Verify

- Your selectors match again, and `getByRole('radiogroup', { name: 'Color' })` finds a radio group.
- The heading your custom field renders shows the title you pass it.
