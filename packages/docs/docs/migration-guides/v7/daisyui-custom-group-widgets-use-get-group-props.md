---
title: A daisyUI group widget of your own names itself through getGroupProps()
description: "`@rjsf/daisyui`'s group widgets now carry a role, the field id and `aria-labelledby` from the field's plan. Give your own group widget the props from `getGroupProps()` or `getGroupAndOptionProps()` instead of hard-coding label ids."
packages: ['@rjsf/daisyui']
uses: [custom-widgets, custom-templates]
schema: []
kind: runtime
noticed: review
related: [daisyui-field-label-and-widget-markup-changed, widget-reads-the-presentation-plan]
---

## Detect

- In your code, a radio, checkbox-group or other group widget registered with `@rjsf/daisyui`.
- A widget or `FieldTemplate` of your own that builds a label id by hand, such as `` `${id}__label` ``, or calls `fieldLabelId()` to point `aria-labelledby` at.

## Change

The theme's built-in group widgets mark their group with `role='radiogroup'` or `role='group'`, give it the field's `id`, and name it from the label through `aria-labelledby`. `@rjsf/daisyui` now exports the helpers they use:

- A custom group widget takes its `role` and `aria-labelledby` from `getGroupProps()`, handed the field's `presentation`.
- A group widget that renders its controls itself should use `getGroupAndOptionProps()`, whose `option` gives each control the `aria-describedby` and `aria-invalid` its field's plan describes it by.
- A group of checkboxes also hands it the `registry`, and renders the `requiredCue` it returns inside the group, so a required one is named as required.

```tsx
import { getGroupAndOptionProps } from '@rjsf/daisyui';

function MyRadioWidget(props: WidgetProps) {
  const { id, label, hideLabel, presentation, registry } = props;
  const { group, option } = getGroupAndOptionProps({ id, label, hideLabel, presentation, role: 'radiogroup', registry });
  return <div {...group}>{/* each <input type='radio' {...option} /> */}</div>;
}
```

Under a plan the label's id is the plan's, which `getLabelId()` from `@rjsf/utils` reads. Beneath a label drawn above with the same id it differs from `fieldLabelId()`'s, so a widget pointing at `fieldLabelId()` itself can be named by the wrong label. `fieldLabelId()`, which `@rjsf/daisyui` re-exports, is the label's id only for a field rendered without a plan.

## Verify

Your group widget is found by `getByRole('radiogroup', { name })` or `getByRole('group', { name })` with the field's label, and each control is described by the field's errors.
