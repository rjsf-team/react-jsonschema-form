---
title: Mantine radio and checkbox groups are labelled by the field's title id
description: "`RadioWidget`'s label id was `root-label`, and `CheckboxesWidget`'s label was a `label` element before the group. Both groups are now labelled by a `root__title` element inside them, so query the group by its accessible name."
packages: ['@rjsf/mantine']
uses: [markup, ui-schema]
schema: [enums]
kind: markup
noticed: test
related: [mantine-wrapper-options-reach-every-widget, mantine-markup-uses-rjsf-ids]
---

## Detect

- In your tests or CSS, `#root-label` or a `label` element selector for a `@rjsf/mantine` `RadioWidget` or `CheckboxesWidget`.
- In your `uiSchema`, an `aria-label` in `ui:options` of a Mantine radio or checkbox group.

## Change

The checkbox and radio groups pointed `aria-labelledby` at a Mantine label that was never rendered ([#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332)). Both are now labelled by the field's title id:

- `RadioWidget`'s label has the field's title id (`root__title`) instead of the id Mantine generated for it (`root-label`).
- `CheckboxesWidget`'s label keeps that id, but `Checkbox.Group` now renders it, as a `<div class="mantine-CheckboxGroup-label">` inside the group's wrapper. It used to be a `<label>` before the group, and the group had no accessible name.
- When the label is hidden (`ui:label: false`) or left out of `inputWrapperOrder`, it is still rendered with that id, `hidden`, so the group keeps its name.
- When the field has no label, a `RadioWidget`'s group is named by a hidden title holding its fallback name, and a `CheckboxesWidget`'s has no `aria-labelledby`.
- An `aria-label` in `ui:options` names either group the same way, over a hidden label, and no longer lands on Mantine's wrapper. A label on screen still names the group.

Select the label by `#root__title`, or better, the group by its accessible name:

```diff
-container.querySelector('#root-label');
+screen.getByRole('radiogroup', { name: 'My field' });
```

## Verify

- `getByRole('radiogroup', { name })` finds a radio field, and `getByRole('group', { name })` a checkboxes field.
- A field with `ui:label: false` still has a group with a name.
