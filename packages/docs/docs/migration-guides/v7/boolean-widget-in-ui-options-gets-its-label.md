---
title: A boolean's label follows a widget named in ui:options or by the CheckboxWidget key
description: "A `boolean` naming its widget through `ui:options.widget` lost its label, and `ui:widget: 'CheckboxWidget'` drew two. The first now gets a label and the second one, so update snapshots and any `getDisplayLabel()` expectations."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [ui-schema, markup, utils-api]
schema: [enums]
kind: runtime
noticed: test
related: [unregistered-widget-component-takes-theme-default-label, schema-functions-take-schema-context]
---

## Detect

- In your `uiSchema`, a `boolean` field with `ui:options: { widget: 'radio' }` (or `'select'`, or another widget), or with `ui:widget: 'CheckboxWidget'`.
- In your code, a call to `getDisplayLabel()` for a `boolean` schema, or a test asserting on `FieldTemplateProps.displayLabel`.
- Snapshot tests of forms with such fields.

## Change

A `boolean` left to its default widget is a checkbox, which draws its own label, so `getDisplayLabel()` reports `false` for it and the theme's `FieldTemplate` renders none. It decided that from the `ui:widget` key alone, so a `boolean` that named its widget through `ui:options.widget` was treated as having no widget at all. The template suppressed the label, leaving a radio group or a select with nothing above it ([#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318)).

`getDisplayLabel()` now reads the widget from the reduced ui options:

- `FieldTemplateProps.displayLabel` is `true` for `ui:options.widget`, in every theme, so that field gains its label.
- `ui:widget: 'CheckboxWidget'`, the key the default checkbox is registered under, now counts as naming no other widget and reports `false`. A checkbox renders the field's label itself after its input, so every theme used to render a second label beside the widget's own. That field now carries one label.
- The `checkbox` alias still reports `true`, since that is the spelling a `FieldTemplate` matches to lay a checkbox field out itself, taking over the field's description along with its label.
- `getDisplayLabel()` still recognizes a widget only by name, so one registered under some other key, or passed to `ui:widget` as a component, reports `true`.

A `FieldTemplate` of your own needs no change. `getDisplayLabel()` also takes a `SchemaContext` first; see [@rjsf/utils schema functions take a SchemaContext](./schema-functions-take-schema-context.md).

## Verify

- A `boolean` field rendered as radios or a select through `ui:options.widget` shows its label above the control.
- A `boolean` field with `ui:widget: 'CheckboxWidget'` shows one label.
- Snapshots gain or lose those labels; review and update them.
