---
title: A custom field draws its own label and description, and the plan wins over hideLabel
description: 'A field chosen by `ui:field` or a `$id` now draws its own label and description, and a widget it renders with its plan draws none of them. Declare what the template draws under its key in `presentation`, or `WIDGET_FIELD_PRESENTATION`.'
packages: ['@rjsf/core']
uses: [custom-fields]
schema: []
kind: runtime
noticed: review
related:
  [
    display-label-raw-errors-hide-label-deprecated,
    widget-reads-the-presentation-plan,
    mantine-field-error-template-shows-unshown-errors,
  ]
---

## Detect

- A custom field chosen by a schema `$id` matching a key of your `fields=`: it used to get the template's label.
- A custom field in your code that renders a widget such as `CheckboxWidget` with `{...props}` and relied on that widget to draw the label, description or errors.
- A custom field that renders a widget or template with `{...props}`, so its `presentation` goes along, and also sets `hideLabel`, `displayLabel` or `rawErrors` on it.
- A custom field that spreads its props into a built-in field such as `StringField`, or renders `SchemaField` under its own `id`, as a wrapper adding markup around the field does.
- On the rendered page, a custom field's label or description is missing or shows twice, or a label you hid with `hideLabel` shows again.

## Change

Each field is now handed a `presentation` plan; see [displayLabel, rawErrors, hideLabel and getDisplayLabel are deprecated for the field plan](./display-label-raw-errors-hide-label-deprecated.md). With a plan, the plan wins: `@rjsf/core`'s and every theme's templates and widgets ignore a `hideLabel`, `displayLabel` or `rawErrors` handed alongside one. A custom field that renders a widget with its plan and `hideLabel` to hide the widget's label hands it a plan whose label isn't the widget's instead.

A field given as `ui:field` or a `$id` draws its own label and description, as one given as `ui:field` already did; one chosen by a `$id` used to get the template's label. Declare the parts the template should draw for it under its registry key in the [`presentation`](../../api-reference/form-props.md#presentation) prop:

```tsx
<Form presentation={{ fields: { MyField: { label: 'template', description: 'template' } } }} />
```

Declare it per key. A template `label` declared through `fieldDefault` would also reach objects and arrays, which have no control for the template's label to name, so they would draw no heading.

A widget the field renders with its props, plan included, draws none of the label, description and errors the field draws itself ([#5591](https://github.com/rjsf-team/react-jsonschema-form/issues/5591)). A field that left its label, description or errors to a widget such as `CheckboxWidget` declares `WIDGET_FIELD_PRESENTATION` under its key, or draws them itself:

```tsx
import { WIDGET_FIELD_PRESENTATION } from '@rjsf/utils';

<Form fields={{ MyField }} presentation={{ fields: { MyField: WIDGET_FIELD_PRESENTATION } }} />;
```

A custom field is handed its own plan as `presentation`, so one that spreads its props into a field it renders itself, such as `StringField`, leaves `presentation` out of them. Otherwise that field takes the custom field's label and ids for its own:

```diff
- <StringField {...props} />
+ const { presentation, ...rest } = props;
+ <StringField {...rest} />
```

One that renders `SchemaField` under its own `id` leaves the label and description it was planned to draw to the field it renders, which draws them, while its template draws the help and errors once.

## Verify

- Each custom field shows one label and one description, and its errors once, whichever of the field, its widget or the template draws them.
- An object or array still draws its heading.
- Under `@rjsf/mantine`, a field handing a widget `rawErrors` shows its errors once; see [Mantine shows the errors its widgets leave out through FieldErrorTemplate](./mantine-field-error-template-shows-unshown-errors.md).
