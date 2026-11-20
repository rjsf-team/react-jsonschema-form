---
title: Mantine's label, description and input wrapper options apply to more widgets
description: "`CheckboxesWidget`, `RangeWidget`, `AltDateWidget` and most descriptions used to ignore Mantine's `labelProps`, `descriptionProps` and `InputWrapper` options. They now apply them as Mantine resolves them, so recheck how those fields look."
packages: ['@rjsf/mantine']
uses: [ui-schema, markup]
schema: []
affects: [appearance]
related: [mantine-group-labels-take-the-title-id, mantine-markup-uses-rjsf-ids]
---

## Detect

- In your `uiSchema`, `labelProps`, `descriptionProps`, `errorProps`, `withAsterisk`, `labelElement`, `size`, `inputWrapperOrder`, `inputContainer` or `wrapperProps` in the `ui:options` of a `@rjsf/mantine` field.
- In your Mantine theme, `defaultProps` for `InputWrapper`, `Input`, `Slider`, `Select`, `CheckboxGroup` or `RadioGroup`.
- CSS or Mantine styling for a `RangeWidget` or `AltDateWidget`.

## Change

Labels of the checkbox and radio groups:

- `CheckboxesWidget` and `RadioWidget` apply `labelProps` to their label, except an `id`, since the label's id has to match the group's `aria-labelledby`. `CheckboxesWidget` used to ignore `labelProps` entirely.
- As in Mantine's groups, `labelProps` comes from `ui:options` or the Mantine theme's `CheckboxGroup`/`RadioGroup` `defaultProps`, then `ui:options.wrapperProps`, then the theme's `InputWrapper` `defaultProps`, so a theme group default wins over `ui:options.wrapperProps`.

`RangeWidget` and `AltDateWidget` now render inside Mantine's `Input.Wrapper`, so the `InputWrapper` options apply to them as to Mantine's inputs:

- An option in `wrapperProps`, from `ui:options` or else the Mantine theme's `Input` and `InputWrapper` `defaultProps`, wins over the same option set top-level, from `ui:options` or else the theme. So a theme's `wrapperProps` value beats a top-level `ui:options` one, and an option set to `undefined` in `wrapperProps` falls back to the theme's `InputWrapper` `defaultProps`.
- `inputWrapperOrder` orders or leaves out the title, description and errors, and `labelProps`, `descriptionProps`, `errorProps`, `withAsterisk`, `labelElement` and `size` style them.
- The slider and the date parts take that `size` too, unless the Mantine theme's `Slider` or `Select` `defaultProps` give them one and the field sets none of its own. A field that sets both `size` and `wrapperProps.size` sizes its inputs by `size` and its wrapper by `wrapperProps.size`, as a Mantine input does.
- The theme's `Input` styling props (`classNames`, `styles`, `className`, `style`, `variant` and the like) reach the wrapper too, as they do an input's.
- The title keeps the field's title id (`root__title`) whatever `labelProps` says, and has no `for`. When it is hidden or left out of `inputWrapperOrder` it is rendered `hidden`, so the inputs keep their name.
- On `AltDateWidget`, the root element props from the theme's `Input` and `InputWrapper` `defaultProps` (`className`, `style`, `mod`, style props such as `mt`, and the `root` entry of `classNames`, `styles` and `attributes`) stay on each date part's own wrapper and aren't applied again around them all. So do the theme's `Input` `wrapperProps` other than the `InputWrapper` options and the Styles API props (`classNames`, `styles`, `attributes`, `variant` and the like, less their `root` entry). Set them in `ui:options.wrapperProps` to style the field's wrapper.
- `AltDateWidget` applies an `inputContainer` around each date part, resolved as for a `Select`, where it used to apply it around them all. Only the `inputContainer` of a `ui:options.wrapperProps` reaches the parts, over the theme's `Select` `wrapperProps`, since the field's own wrapper applies the rest.
- Set these options on `InputWrapper` in the theme, not on `Slider`: Mantine's `Slider` spreads its own `defaultProps` on its root element.
- `RangeWidget` no longer passes Mantine input props that `Slider` doesn't take (`leftSection`, `withErrorStyles`, `loading` and the like) or the `InputWrapper` options from `ui:options` on to the slider's root element, where they became unknown attributes.

Descriptions:

- Every widget that renders a description, except `CheckboxWidget`, applies `descriptionProps` from `ui:options`, `ui:options.wrapperProps` or the Mantine theme's `defaultProps`, resolved as Mantine resolves them. Only `ui:options.wrapperProps.descriptionProps` used to reach it.
- The description is always rendered in a `div`, including under a `wrapperProps.descriptionProps`, which used to turn it back into Mantine's default `<p>`.

Move any option you set on `Slider` for the wrapper to `InputWrapper`, and remove options you had set expecting them to be ignored.

## Verify

- Fields with `labelProps` or `descriptionProps`, in `ui:options` or the theme, look as you intend.
- `RangeWidget` and `AltDateWidget` fields take the theme's `InputWrapper` and `Input` styling.
- The slider's root element carries no unknown attributes in the console or the DOM.
