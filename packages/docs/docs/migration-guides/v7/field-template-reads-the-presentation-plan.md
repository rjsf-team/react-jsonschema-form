---
title: A custom FieldTemplate, ObjectFieldTemplate or ArrayFieldTemplate draws what the plan hands it
description: '`displayLabel` is now true only where the template draws the label, and the description, help, errors and `*` follow the field''s plan. Draw the label from `templateDrawsLabel()`, mark it from `templateMarksRequired()` and render what you are handed.'
packages: ['@rjsf/core']
uses: [custom-templates]
schema: []
kind: runtime
noticed: review
related:
  [
    display-label-raw-errors-hide-label-deprecated,
    array-field-item-display-label-follows-plan,
    required-array-widget-needs-min-items,
    any-of-one-of-field-labelled-once-by-its-template,
    label-and-title-ids-move-to-spans,
  ]
---

## Detect

- A custom `FieldTemplate` in your code that tests `displayLabel` before rendering the label, `description` or `rawDescription`, or reads `ui:description` or `ui:help` from the `uiSchema` to decide what to render.
- A custom `FieldTemplate` that draws the `*` from `required`, or gives its label `htmlFor={id}`.
- A custom `ObjectFieldTemplate` or `ArrayFieldTemplate` that reads `required` for anything other than marking its heading.
- On the rendered page, descriptions your template used to show are missing under `@rjsf/mui`, `@rjsf/fluentui-rc`, `@rjsf/chakra-ui` or `@rjsf/mantine`, or a description, help text or error list shows twice.

## Change

Each field now reaches its template with a `presentation` plan that says who draws its label, description, help and errors; see [displayLabel, rawErrors, hideLabel and getDisplayLabel are deprecated for the field plan](./display-label-raw-errors-hide-label-deprecated.md).

`displayLabel` is now true only where the template draws the label. In a theme whose widgets draw their own label, as `@rjsf/mui`'s, `@rjsf/fluentui-rc`'s, `@rjsf/chakra-ui`'s and `@rjsf/mantine`'s do, it is false for nearly every field, so a custom `FieldTemplate` there should no longer gate the description on it. Decide whether to draw the label through [`templateDrawsLabel()`](../../api-reference/utility-functions.md#templatedrawslabel), which reads the plan and falls back to `displayLabel` only for a template rendered without one.

`description` and `rawDescription`, `help` and `rawHelp`, and `errors` are handed to the template only where it draws them. Render them when they are present instead of deciding again from `displayLabel` or the `uiSchema`. `@rjsf/core`'s template checks [`templateDrawsDescription()`](../../api-reference/utility-functions.md#templatedrawsdescription) before the description, which reads the plan and falls back to `displayLabel` without one.

`required` still says whether the field is required. A template drawing the label marks it from `presentation.label.requiredMarker`, as `@rjsf/core`'s does, or through [`templateMarksRequired()`](../../api-reference/utility-functions.md#templatemarksrequired), which reads it and falls back to `required` without a plan. The plan leaves the `*` off:

- a checkbox, or a widget its theme declares `uncheckedIsFalse`, whose schema doesn't demand `true`, unless `ui:required: true` asks for it while it holds no value ([#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388));
- an array rendered as one widget, such as a group of checkboxes or a multiple select, holding `[]` while its schema has no `minItems` of at least 1 ([#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744)); see [A required checkbox group, multiple select, file input or array widget needs minItems to show as required](./required-array-widget-needs-min-items.md);
- the selected option of a required `anyOf`/`oneOf` field, whose one `*` is on the field's own label; see [An anyOf or oneOf field is labelled once by its own template](./any-of-one-of-field-labelled-once-by-its-template.md).

A template drawing the label gives it the `for` that [`templateLabelFor()`](../../api-reference/utility-functions.md#templatelabelfor) gives, as `@rjsf/core`'s does. That is none where `presentation.control.attributes['aria-labelledby']` is set: that control, such as the wrapper of a group of radios or checkboxes, is one a `for` can't name, so it is named through the label's `presentation.label.id`. Put that id on the label's text; [Title and label ids move to a span](./label-and-title-ids-move-to-spans.md) shows the markup `@rjsf/core` renders.

```diff
- {displayLabel && (
-   <label htmlFor={id}>
-     {label}
-     {required && '*'}
-   </label>
- )}
- {displayLabel && rawDescription ? description : null}
+ {templateDrawsLabel(props) && (
+   <label htmlFor={templateLabelFor(props)}>
+     <span id={presentation?.label.id}>{label}</span>
+     {templateMarksRequired(props) && '*'}
+   </label>
+ )}
+ {templateDrawsDescription(props) && description}
```

`ObjectFieldTemplate`'s and `ArrayFieldTemplate`'s `required` now says whether the heading they draw is marked, so it is `false` for an object or array that is the selected option of a required `anyOf`/`oneOf` field ([#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573)). A template using it for anything else reads whether the field is required from the schema instead.

## Verify

- Each field shows its description, help and errors once, in every theme you use the template with.
- Your template's `*` matches `@rjsf/core`'s: none on a checkbox whose schema doesn't demand `true`, or on an empty group of checkboxes with no `minItems`.
- A radio or checkboxes group's label has no `for`, and `getByRole('radiogroup', { name: 'Color' })` finds the group by the label's text.
- A class or `aria-required` your `ObjectFieldTemplate` or `ArrayFieldTemplate` sets for a required field still applies to an object or array that is a required field's selected option.
