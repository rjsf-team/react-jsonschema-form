---
title: Mantine inputs reference rjsf's error, description and help ids
description: "`@rjsf/mantine` inputs used Mantine's own ids, and errors rendered as a hidden copy. Inputs are now described by `root__error`, `root__description` and `root__help`, and errors show once, so update selectors and snapshots."
packages: ['@rjsf/mantine']
uses: [markup]
schema: []
kind: markup
noticed: test
related: [mantine-group-labels-take-the-title-id, mantine-custom-widgets-draw-errors-by-their-key, mantine-wrapper-options-reach-every-widget, alt-date-parts-named-by-field-label]
---

## Detect

- In your tests or CSS, a selector for an id Mantine generated, such as `#root-error`, or one that reads `aria-describedby` on a Mantine input.
- Tests or CSS that rely on where errors, descriptions or the success message render, or on the hidden copy of a field's errors.
- A query for the slider's root element by the field's id, or an `id` given in `thumbProps`.
- Snapshot tests of `@rjsf/mantine` forms, and `toHaveAccessibleDescription()` assertions on their inputs.

## Change

Most `@rjsf/mantine` widgets passed `aria-describedby` to a Mantine component that discarded it ([#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332)). Every widget now references the ids the other themes use: an input is described by the field's error, description and help ids (`root__error root__description root__help`).

Errors:

- Mantine's error element has the field's error id (`root__error`) instead of the id Mantine generated for it (`root-error`), whatever `errorProps.id` says.
- `FieldErrorTemplate` shows, in Mantine's error element with that id, the errors no widget shows. Those are the errors of a custom widget or `ui:field`, of `@rjsf/core`'s `RatingWidget` (which has no Mantine counterpart), of a field of an unsupported type, of an array rendered item by item, and of a `oneOf`/`anyOf` field, below its option. It used to render a hidden copy of every field's errors, so those were announced but never shown ([#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490)).
- `ObjectFieldTemplate` shows the object's own errors with that id, below its fields, where they used to be hidden.
- Inputs are now described by the error they show, including a `oneOf`/`anyOf` selector, which had no error to reference. A checkbox's error is read once instead of twice.
- A `oneOf`/`anyOf` field's errors show once, below its option, and describe both the option selector and the option's control, each marked invalid. The selector and the option's widget each used to show them.
- `CheckboxWidget` renders its error below the checkbox, where Mantine's `Checkbox` rendered it below the label, and ignores `errorProps`, as before.

The success message, rendered for a `success` option, has the id from `successProps.id`, else `root__success`, even when `wrapperProps` has an `id`. Inputs are described by it when it is shown. `RangeWidget` and `AltDateWidget` render it once, on the field's wrapper, and describe the slider thumb or each date part by it; a date part no longer renders one of its own, even from the theme's `Select` `defaultProps`. `CheckboxesWidget` and `RadioWidget` describe each option by it, as they do with the field's other ids.

`RangeWidget` and `AltDateWidget` render their title, description and errors inside Mantine's `Input.Wrapper` (`.mantine-InputWrapper-root`), where they used to render them as siblings of the slider or the date parts. Their errors render in Mantine's single error element instead of one element per message. How the wrapper's options apply is in [Mantine's label, description and input wrapper options apply to more widgets](./mantine-wrapper-options-reach-every-widget.md).

`RangeWidget` renders its description by the same rules as the other widgets: it shows `schema.description`, which it used to leave out, and hides the description under `ui:label: false`, where it used to show `ui:options.description` regardless. Its `aria-describedby` and the field's id (`root_x`) move from the slider's root element to its focusable `role="slider"` thumb, so `focusOnFirstError` reaches the thumb. The field's id replaces an `id` given in `thumbProps`.

Select an error by `#root__error`, or better, the input by its accessible description:

```diff
-container.querySelector('#root-error');
+expect(screen.getByRole('textbox')).toHaveAccessibleDescription(/must be string/);
```

Select the slider's root by `.mantine-Slider-root`.

Group labels and `AltDateWidget` date part names changed too; see [Mantine radio and checkbox groups are labelled by the field's title id](./mantine-group-labels-take-the-title-id.md) and [AltDateWidget date parts are named by the field's label and the part](./alt-date-parts-named-by-field-label.md).

## Verify

- Snapshot tests change as inputs gain the rjsf ids of the parts that render in `aria-describedby` and the hidden copy of the errors is gone; review and update them.
- An assertion on an input's accessible description (`toHaveAccessibleDescription()`) now includes the field's help text and errors along with its description.
- Each error message appears once on the page.
- A `RangeWidget` field with a `schema.description` shows it.
