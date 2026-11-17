---
title: displayLabel, rawErrors, hideLabel and getDisplayLabel are deprecated for the field plan
description: 'Each field now gets a `presentation` plan, so `displayLabel`, `rawErrors`, `hideLabel` and `getDisplayLabel()` are deprecated. Read the plan, or a helper such as `templateDrawsLabel()` that falls back to the old prop without one.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [custom-templates, custom-widgets, custom-fields, utils-api]
schema: []
kind: deprecation
noticed: review
related:
  [
    field-template-reads-the-presentation-plan,
    widget-reads-the-presentation-plan,
    custom-field-draws-own-label-and-description,
    custom-widget-error-state-from-has-widget-errors,
    custom-templates-take-error-state-from-has-errors,
    registry-requires-presentation-and-class-map,
  ]
---

## Detect

- `displayLabel`, `rawErrors` or `hideLabel` read from the props of a custom `FieldTemplate`, field or widget in your code.
- `rawErrors` read in a custom `ArrayFieldTemplate` or `ObjectFieldTemplate` in your code.
- `getDisplayLabel()` or `schemaUtils.getDisplayLabel()` imported from `@rjsf/utils` or called in your code.
- Your editor strikes these names through as `@deprecated`, or a `no-deprecated` lint rule reports them.

## Change

`SchemaField` now plans each field before rendering it ([#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490)). From the field and widget it renders, and the [`presentation`](../../api-reference/form-props.md#presentation) the registry merges from `@rjsf/core`, the theme and the `Form`, it decides who draws the field's label, description, help and errors, under which ids, and the attributes its control carries. The plan reaches the `FieldTemplate`, the field and its widget as a `presentation` prop, described in [`resolveFieldPresentation()`](../../api-reference/utility-functions.md#resolvefieldpresentation), and the props templates and widgets already read are now derived from it. A registry built by hand needs that merged `presentation` too; see [A hand-built Registry needs presentation and classMap](./registry-requires-presentation-and-class-map.md).

The deprecated names stay through v7 for a template or widget rendered without a plan, and the props are still handed over in full, for a component that renders the hidden errors its own way. Read the plan instead, or these helpers, which fall back to the old props only when there is no plan:

| You read                                                                                            | Read instead                                                                            |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `displayLabel` or `getDisplayLabel()` in a template                                                 | [`templateDrawsLabel()`](../../api-reference/utility-functions.md#templatedrawslabel)   |
| `hideLabel` in a widget that draws its own label                                                    | [`widgetDrawsLabel()`](../../api-reference/utility-functions.md#widgetdrawslabel)       |
| `rawErrors` for a widget's control error state                                                      | [`hasWidgetErrors()`](../../api-reference/utility-functions.md#haswidgeterrors)         |
| `rawErrors` for the label or description a widget draws for its field                               | [`fieldShowsOwnErrors()`](../../api-reference/utility-functions.md#fieldshowsownerrors) |
| `rawErrors` for the error state in a `FieldTemplate`, `ArrayFieldTemplate` or `ObjectFieldTemplate` | `hasErrors`                                                                             |
| `rawErrors` for the error state in a field                                                          | `presentation.errors.own`                                                               |
| `rawErrors` for the messages a widget or container template draws                                   | [`getErrorsToDraw()`](../../api-reference/utility-functions.md#geterrorstodraw)         |
| `rawErrors` for the messages a field draws itself                                                   | `presentation.errors.messages`                                                          |

The `rawErrors` a field, an `ArrayFieldTemplate` or an `ObjectFieldTemplate` is handed carry the errors whatever `hideError` says ([#5325](https://github.com/rjsf-team/react-jsonschema-form/issues/5325)). The plan's `presentation.errors.messages` already has `ui:hideError` applied. A widget or container template draws those messages only where `presentation.errors.by` is `'self'`, since the template draws them under `'template'`, and `getErrorsToDraw()` gives it exactly those. A field reads `presentation.errors.messages` itself, because `getErrorsToDraw()` gives a field that draws its own errors none, so that a widget it spreads its plan into doesn't draw them again.

```diff
- const errors = hideError ? [] : (rawErrors ?? []);
+ const errors = getErrorsToDraw(props);
```

How a widget or template takes its error state from the plan is in [A custom widget or theme takes its error state from hasWidgetErrors](./custom-widget-error-state-from-has-widget-errors.md) and [Custom field, array and object templates take their error state from hasErrors](./custom-templates-take-error-state-from-has-errors.md). What a template, a widget and a custom field now draw is in [A custom FieldTemplate, ObjectFieldTemplate or ArrayFieldTemplate draws what the plan hands it](./field-template-reads-the-presentation-plan.md), [A custom widget reads its label, description and required marker from the plan](./widget-reads-the-presentation-plan.md) and [A custom field draws its own label and description](./custom-field-draws-own-label-and-description.md).

## Verify

- Your editor shows no `@deprecated` strikethrough on those names.
- Your templates and widgets draw the same label and errors as before, and an error hidden by `ui:hideError` stays hidden.
