---
title: A custom FieldTemplate keeps core's label and description markers to line up
description: Core's `rjsf.css` now lines up array item buttons and additional-property rows with the control by finding the label and description markers. A custom `FieldTemplate` keeps `rjsf-field-label` and `rjsf-field-description` on its parts.
packages: ['@rjsf/core', '@rjsf/shadcn']
uses: [custom-templates]
schema: []
kind: markup
noticed: review
related: [core-layout-needs-rjsf-css, label-is-exported-as-fieldlabel]
---

## Detect

- A custom `FieldTemplate` in your code that renders its own label or description without the `rjsf-field-label` class or the `rjsf-field-description` class or `id`.
- The rendered page: inside an array item or an additional property, the item buttons or the key input and remove button sit above or below the field's control.

## Change

An array item's buttons, and an additional property's key input and remove button, sit level with the field's control. `rjsf.css` lays the field's label, description and control out on the row's grid rows. It finds the label by core's `rjsf-field-label` class and the description by its `rjsf-field-description` class or `id`.

Keep those markers on your template's parts:

```diff
-<label htmlFor={id}>{label}</label>
+<label htmlFor={id} className='rjsf-field-label'>{label}</label>
```

Core's label component is now exported as `FieldLabel`, see [FieldLabel](./label-is-exported-as-fieldlabel.md). See [Lining up a custom `FieldTemplate`](../../usage/themes.md#lining-up-a-custom-fieldtemplate) for the full layout.

## Verify

- With `rjsf.css` loaded (see [core layout stylesheet](./core-layout-needs-rjsf-css.md)), array item buttons and additional-property controls sit level with the field's control in your template.
