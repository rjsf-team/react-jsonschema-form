---
title: A theme that moves the description or help declares the order in presentation
description: Screen readers now announce a field's description ids in the order the field's plan lists them. A theme or form whose templates draw the description or help elsewhere declares `fieldTemplateOrder` or `selectedOptionDescription` in `presentation`.
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-templates, custom-theme, custom-widgets]
schema: []
affects: [code, experience]
related: [custom-select-widget-applies-aria-props, field-template-reads-the-presentation-plan]
---

## Detect

- In your code, a `FieldTemplate` that draws the description below the control or the help above it.
- A `SelectWidget` of your own that draws the field's description itself, with its selected option's description before it.

## Change

A control is described by the field's description, help and errors, and for a select by its selected option's description, in the order the plan lists them ([#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720)). The plan assumes the description comes before the control and the help after it.

- A theme or form whose `FieldTemplate` draws the description below the select or the help above it declares the order in `fieldTemplateOrder` in its [`presentation`](../../advanced-customization/custom-themes.md#presentation).
- One whose `SelectWidget` draws the field's description itself, with its selected option's description before it, declares `selectedOptionDescription: 'beforeDescription'`.

```diff
 const presentation = {
+  fieldTemplateOrder: ['children', 'description', 'help'],
 };
```

## Verify

A screen reader, or `toHaveAccessibleDescription()`, announces the description, help and option description in the order they appear on screen.
