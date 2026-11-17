---
title: An anyOf or oneOf field is labelled once by its own template whichever option is selected
description: 'An `anyOf`/`oneOf` field''s template now draws its label, description, help, errors and its one `*`, so the selected option draws no second label or marker. Update tests and snapshots, and give an option its own `uiSchema` or `title` to label it.'
packages: ['@rjsf/core']
uses: [form, markup]
schema: [any-of-one-of]
kind: runtime
noticed: test
related:
  [
    field-template-reads-the-presentation-plan,
    widget-reads-the-presentation-plan,
    label-and-title-ids-move-to-spans,
    non-object-option-inherits-field-keywords,
  ]
---

## Detect

- `anyOf` or `oneOf` in your schema, and tests or snapshots that read those fields' labels, descriptions, `*` or errors.
- `ui:title` or `ui:description` set in your `uiSchema` on an `anyOf`/`oneOf` field whose options have no `uiSchema` of their own.
- On the rendered page, the selected option's control used to draw a second label beneath the field's ([#5358](https://github.com/rjsf-team/react-jsonschema-form/issues/5358)), or a required field showed a `*` on the option's label or heading.

## Change

The field's template labels the field and draws its description, help and errors, whichever option is selected. The option's control no longer draws a second label, and the errors no longer disappear with a `null` option.

- An option's own title and description render beneath the field's only where they say something else, the description under [`optionDescriptionId()`](../../api-reference/utility-functions.md#optiondescriptionid). For a field that isn't an object, which other keywords an option takes from it is in [A non-object field's anyOf or oneOf option renders with its parent's keywords](./non-object-option-inherits-field-keywords.md).
- An option given no `uiSchema` of its own no longer takes the field's `ui:title` and `ui:description` in place of its own. Give the option its own `uiSchema`, or a `title` in its schema, to label it.
- An option with no title of its own takes the field's label instead of its property name. That is its control's label in a theme whose selector draws the field's label itself, as `@rjsf/mui`'s, `@rjsf/chakra-ui`'s, `@rjsf/fluentui-rc`'s and `@rjsf/mantine`'s do, and its heading while an optional data control keeps the selector off screen, with the field's description beneath that heading.
- An object with no properties of its own beside its options is labelled as the field rendering those options is. One with properties keeps drawing its heading, under the `XxxOf` ids it renders beside the options with.
- A required field shows one `*`, on the field's own label, whichever option is selected and whether its template or its selector draws that label ([#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573)). The selected option's own label or heading stays unmarked, and its control stays `required`.

A form using the built-in templates and widgets needs nothing else. A custom template or widget that marks a label from `required` is covered in [A custom FieldTemplate, ObjectFieldTemplate or ArrayFieldTemplate draws what the plan hands it](./field-template-reads-the-presentation-plan.md) and [A custom widget reads its label, description and required marker from the plan](./widget-reads-the-presentation-plan.md), and whether the label keeps its `for` in [Title and label ids move to a span](./label-and-title-ids-move-to-spans.md).

## Verify

- An `anyOf`/`oneOf` field shows one label and one description, from the field, with the selected option's title beneath only where it differs.
- A required `anyOf`/`oneOf` field shows exactly one `*`, beside the field's label, and the option's input still carries `required`.
- Errors still show after you select a `null` option.
