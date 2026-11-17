---
title: daisyUI field labels, group roles and checkbox markup changed
description: "`@rjsf/daisyui` labelled fields by schema type and rendered empty labels. Labels now follow the widget, groups gain roles and `aria-labelledby`, and checkboxes change their wrapper and `required`, so update snapshots, CSS and label queries."
packages: ['@rjsf/daisyui']
uses: [markup]
schema: []
kind: markup
noticed: test
related: [daisyui-date-picker-trigger-and-popup-markup-changed, daisyui-custom-group-widgets-use-get-group-props, object-and-array-groups-have-role-group]
---

## Detect

- Snapshot tests of `@rjsf/daisyui` forms.
- CSS or tests that find a daisyUI field by its `<label>`, by a group's role, or by an input's `required` attribute.
- A hidden `additionalProperties` entry, or fields hidden by `deprecatedHandling: 'hide'`, in a daisyUI form.

## Change

`@rjsf/daisyui` rendered its field label from the schema type instead of from the widget, and rendered it whether or not the field had a title ([#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318)). The theme's API only gained exports; the markup changed as follows.

Labels:

- A field with no title renders no `<label>` at all, where an empty one used to take up space. That covers every root field and array item, along with the lone required `*` on an untitled array item.
- A `boolean` rendered through anything other than a checkbox or toggle now has a label. Those two widgets render their own after the input, and so does the description.
- Which widget renders the label is decided from the registry, so a widget you register as `CheckboxWidget` or `toggle`, wrapping the theme's own or replacing it, is the one that renders it. A widget registered under any other key gets the template's label as well as its own.
- `ToggleWidget` renders the field's label beside the switch. It rendered `ui:options.label`, a flag, so that label was always empty.
- `BaseInputTemplate` no longer renders a second, `display: none` label for its input.

Groups and hidden fields:

- A widget rendering a group of controls marks it with `role='radiogroup'` or `role='group'`, carries the field's `id`, and names itself from the label through `aria-labelledby`, with a `__label` id suffix, since `TitleFieldTemplate` claims `titleId()`.
- A `hidden` field renders only its children, as in `@rjsf/core`. An `additionalProperties` entry hidden with `ui:widget: 'hidden'` therefore loses its key input and remove button, and a field hidden by `deprecatedHandling: 'hide'` is hidden instead of rendered in full.

Checkboxes:

- `ToggleWidget` shares one input component with `CheckboxWidget`. It wraps the input in a `<span>` where both used a `<div>`, which a `<label>` does not permit, and makes the checkbox honor `ui:autofocus`.
- Both take the input's `required` attribute from `schemaRequiresTrueValue()`, as the `*` beside it already did. A boolean a parent merely lists as `required` could not be submitted at all, since the browser refused the unchecked box before RJSF validated it or called `onSubmit` or `onError`.
- `CheckboxesWidget` no longer puts `required` on every option box, which HTML5 constraint validation read as "check all of them" and which blocked the submit of a required array. `RadioWidget` keeps the attribute, since the browser reads same-named inputs as one group.
- `CheckboxWidget` and `ToggleWidget` set `aria-describedby`, so the description, errors and help around them are announced with the control.
- `CheckboxWidget` and `ToggleWidget` render the `*` for a required field whose schema is not a `boolean`, which `ui:widget: 'toggle'` can be pointed at. The template's label used to carry that marker, and the widget draws one of its own only for a `boolean` that has to be `true`.

Update snapshots and selectors. Find a group widget by its role and the field's label, such as `getByRole('radiogroup', { name: 'Color' })`.

Object and array containers also became named groups; see [Object and array containers are named groups carrying the field's id](./object-and-array-groups-have-role-group.md). The date widgets' triggers changed too; see [daisyUI's date pickers open from a combobox button into one popup element](./daisyui-date-picker-trigger-and-popup-markup-changed.md).

## Verify

- Untitled fields render no empty label, and every titled field has exactly one.
- A form with an optional `boolean` listed in a parent's `required` submits with the box unchecked.
- A required checkboxes field submits once the schema's own rules are met.
