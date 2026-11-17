---
title: Chakra UI puts the field's id on the focused element and moves title and label ids
description: '`@rjsf/chakra-ui` now puts the field''s id on the element a user focuses instead of an id Ark generated, and moves the title id onto the heading''s text. Point selectors at `#root_color`, the option''s `optionId()` and `#root_color__label`.'
packages: ['@rjsf/chakra-ui']
uses: [markup]
schema: []
kind: markup
noticed: test
related: [label-and-title-ids-move-to-spans, widget-under-built-in-key-takes-its-declaration]
---

## Detect

- Ark-generated ids such as `select:root_color:trigger` or `checkbox:root_color-0:input` in your CSS or tests.
- `#root__title` (any `__title` id) in your CSS or tests, expecting the box around the heading.
- `label[for="root_color"]` for a select field in your CSS or tests.
- A `legend` selector reaching a checkboxes group's label.

## Change

- The element a user focuses carries the field's id instead of an id Ark generated: the text input, the textarea, the number input's and the checkbox's `<input>`, the select's trigger and the slider's thumb. In a radio or checkboxes group, which carries the field's id itself, each `<input>` carries its [`optionId()`](../../api-reference/utility-functions.md#optionid).

  ```diff
  - [id="select:root_color:trigger"]
  + #root_color
  - [id="checkbox:root_color-0:input"]
  + #root_color__0
  ```

- `TitleField` puts the title id on a `<span>` around the title's text inside its `<h5>`, where it was on the box around the heading, its optional data control and its separator. A selector or style aimed at `#root__title` now reaches that `<span>`.
- The select's label has no `for`:

  ```diff
  - label[for="root_color"]
  + #root_color__label
  ```

- A checkboxes group's label is drawn as a `<div>` styled as the fieldset's legend instead of as a `<legend>`, so a `legend` selector no longer reaches it.

The same changes in `@rjsf/core`'s markup are in [Title and label ids move to a span](./label-and-title-ids-move-to-spans.md). A widget of your own registered as `RatingWidget`, `AltDateWidget` or `AltDateTimeWidget` takes this theme's declaration for that key; see [A widget registered under a built-in key takes that key's presentation declaration](./widget-under-built-in-key-takes-its-declaration.md).

## Verify

Your selectors reach the focused control by the field's id, and snapshots show the title id on the heading's text.
