---
title: Fluent UI groups lose their label's for, and FieldTemplate no longer marks every control required
description: '`@rjsf/fluentui-rc`''s `FieldTemplate` no longer hands `required` to every control in its `Field`, and group label and title ids move. Set `required` on your custom widget''s Fluent control, and point selectors at `#root_color__label` and `#root__title`.'
packages: ['@rjsf/fluentui-rc']
uses: [markup, custom-widgets]
schema: []
affects: [experience, code]
related: [label-and-title-ids-move-to-spans, widget-under-built-in-key-takes-its-declaration]
---

## Detect

- `label[for="root_color"]` for a `RadioWidget` or `CheckboxesWidget` field in your CSS or tests.
- `div#root__title` (any `__title` id) in your CSS or tests.
- A custom widget in your code that renders a Fluent control without passing it `required`; on the rendered page that control of a required field no longer has the `required` attribute.
- A snapshot of an untitled `SelectWidget` that gains an `aria-label`, or of a required select that loses a label holding only `*`.

## Change

- `RadioWidget` and `CheckboxesWidget` draw their label with no `for`, which named the radio group's wrapper or, for `CheckboxesWidget`, an id no element had, and name the group by it through `aria-labelledby` (see [Title and label ids move to a span](./label-and-title-ids-move-to-spans.md)):

  ```diff
  - label[for="root_color"]
  + #root_color__label
  ```

- `FieldTemplate`'s `Field` no longer takes `required`, which Fluent handed every control inside it, so only the controls the plan marks are `required`. A custom widget whose Fluent control took `required` from the `Field` sets it itself:

  ```diff
  - <Input id={id} value={value} onChange={onChange} />
  + <Input id={id} value={value} required={required} onChange={onChange} />
  ```

- `TitleField` puts the title id on a `<span>` inside its `<h5>`:

  ```diff
  - div#root__title
  + #root__title
  ```

- `SelectWidget` draws no label holding only a required field's `*`, and a dropdown no label names carries an `aria-label`: the field's label, its placeholder or the translated prompt. A snapshot of an untitled select gains it.

A widget of your own registered as `RatingWidget`, `AltDateWidget` or `AltDateTimeWidget` takes this theme's declaration for that key; see [A widget registered under a built-in key takes that key's presentation declaration](./widget-under-built-in-key-takes-its-declaration.md).

## Verify

- `getByRole('radiogroup', { name: 'Color' })` finds the group.
- Your widget's control carries `required` for a required field.
- Updated snapshots show the `aria-label` on untitled dropdowns.
