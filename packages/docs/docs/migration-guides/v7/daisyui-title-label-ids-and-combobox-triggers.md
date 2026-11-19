---
title: daisyUI moves title and label ids to spans, and its select trigger is a combobox
description: '`@rjsf/daisyui` now puts title and label ids on a `<span>` around the text, and `SelectWidget`''s trigger has the `combobox` role. Update selectors to the new ids, and query and drive the trigger as a combobox.'
packages: ['@rjsf/daisyui']
uses: [markup]
schema: []
affects: [experience, appearance]
related: [label-and-title-ids-move-to-spans]
---

## Detect

- `div#root__title` or `h3#root_tags__title` (any `__title` id) in your CSS or tests.
- `label#root_name__label` (any `__label` id) in your CSS or tests.
- `label[for="root_color"]` for a radio, checkboxes, rating or alt-date field in your CSS or tests.
- `getByRole('button', …)` aimed at a `SelectWidget` or date picker trigger in your tests, or tests that Tab through a select's options.

## Change

- `TitleField` puts the title id on a `<span>` around the title's text inside its `<h2>`, and `ArrayFieldTitleTemplate` on one inside its `<h3>`, each followed by a `*` for a required object or array:

  ```diff
  - div#root__title, h3#root_tags__title
  + #root__title, #root_tags__title
  ```

- A radio, checkboxes, rating or alt-date field's label has no `for`, as `@rjsf/core`'s doesn't (see [Title and label ids move to a span](./label-and-title-ids-move-to-spans.md)):

  ```diff
  - label[for="root_color"]
  + label:has(#root_color__label)
  ```

- `FieldTemplate`'s label puts its label id on a `<span>` around the label's text, for every field, as `@rjsf/core`'s does. Aim at `label #root_name__label`, which matches that `<span>`, or at `label:has(#root_name__label)` for the label together with its `*`:

  ```diff
  - label#root_name__label
  + label:has(#root_name__label)
  ```

- `SelectWidget`'s trigger, like the date pickers', has the `combobox` role:

  ```diff
  - getByRole('button', { name: 'Color' });
  + getByRole('combobox', { name: 'Color' });
  ```

Both take the keys that role promises, so update keyboard-driven tests:

- Down Arrow, or Alt+Down Arrow, opens either. A date picker's moves focus onto its selected day, else today.
- In `SelectWidget`, Down and Up Arrow move into the listbox and between its options, and Home and End to its first and last, from the trigger too.
- Enter or Space on an option of a single select, or a click on one, chooses it and closes the listbox, as Escape does, returning focus to the trigger.
- The trigger is `SelectWidget`'s one tab stop, so Tab moves on to the next field instead of through the options, and Shift+Tab from an option closes the listbox as it returns focus to the trigger.
- The listbox opens on daisyUI's `:focus-within`, so it stays open while focus is anywhere inside it, an option included, and closes once focus leaves it.

## Verify

- Your selectors match again, and snapshots show the ids on `<span>`s inside the headings and labels.
- `getByRole('combobox', { name: 'Color' })` finds the trigger, and Down Arrow opens its listbox.
