---
title: The daisyUI radio and checkboxes widgets name their group from presentation
description: "@rjsf/daisyui now uses core's radio and checkboxes widgets, which name their group from the `presentation` prop. A custom field that renders them passes on the `presentation` it was handed."
packages: ['@rjsf/daisyui']
uses: [custom-fields]
schema: [enums]
kind: markup
noticed: review
related: [daisyui-renders-core-components]
---

## Detect

- A custom field under `@rjsf/daisyui` that renders `registry.widgets.CheckboxesWidget` or `registry.widgets.RadioWidget` without passing the `presentation` prop it received.
- On the rendered page, or in an accessibility test, that checkbox group has no accessible name, or a radio group is named by something other than the field's label.

## Change

The radio and checkboxes widgets are core's. `CheckboxesWidget` names its group from the field's `presentation` alone, so without it the group is unnamed. `RadioWidget` without it is named by the `label` you hand it, else its `placeholder`, else a generic prompt. The theme's own widgets pointed the group at the `FieldTemplate`'s label. Pass `presentation` on:

```diff
 const { CheckboxesWidget } = registry.widgets;
 return (
   <CheckboxesWidget
     {...widgetProps}
+    presentation={props.presentation}
   />
 );
```

## Verify

- The checkbox or radio group's accessible name is the field's label.
